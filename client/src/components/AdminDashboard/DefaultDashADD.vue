```vue
<template>
  <div class="tunisia-map-container">
    <div class="header-section">
      <h1>External Warehouses in Tunisia</h1>
      <p class="subtitle">Visualize your external storage locations</p>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon warehouses">
          <i class="fas fa-warehouse"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ externalWarehouses.length }}</span>
          <span class="stat-label">External Warehouses</span>
        </div>
      </div>
    </div>

    <div class="control-panel">
      <div v-if="geocodingErrors.length > 0" class="status-message error">
        <i class="fas fa-exclamation-triangle"></i>
        Unlocalized addresses: {{ geocodingErrors.join(', ') }}
      </div>
    </div>

    <div id="tunisia-map" class="map-view"></div>
    <div class="map-legend">
      <div class="legend-item">
        <img :src="warehouseIconUrl" class="legend-icon" alt="Warehouse">
        <span>External Warehouses</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
})

// Map configuration
const map = ref<L.Map | null>(null)
const markers = ref<L.Marker[]>([])
const loading = ref(false)
const geocodingErrors = ref<string[]>([])

// Data
const externalWarehouses = ref<any[]>([])
const warehouseIconUrl = ref('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png')

// Cache for geocoding results
const geocodeCache = new Map<string, [number, number]>()
let lastGeocodeTime = 0

// Initialize map with better default view
const initMap = () => {
  map.value = L.map('tunisia-map', {
    zoomControl: true,
    preferCanvas: true
  }).setView([34.0, 9.0], 6)
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
    minZoom: 6
  }).addTo(map.value as L.Map)
}

// Custom warehouse icon
const warehouseIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41]
})

// Validate coordinates
const isValidCoordinate = (coord: any): boolean => {
  if (Array.isArray(coord) && coord.length === 2 && 
      typeof coord[0] === 'number' && typeof coord[1] === 'number' && 
      isFinite(coord[0]) && isFinite(coord[1]) && 
      coord[0] !== null && coord[1] !== null) {
    return true
  }
  // Handle GeoJSON Point
  if (coord && typeof coord === 'object' && coord.type === 'Point' && Array.isArray(coord.coordinates) &&
      coord.coordinates.length === 2 && 
      typeof coord.coordinates[0] === 'number' && typeof coord.coordinates[1] === 'number' &&
      isFinite(coord.coordinates[0]) && isFinite(coord.coordinates[1])) {
    return true
  }
  return false
}

// Convert position to [lat, lng]
const normalizePosition = (position: any): [number, number] | null => {
  if (Array.isArray(position) && isValidCoordinate(position)) {
    return [position[0], position[1]] // Already [lat, lng]
  }
  if (position && typeof position === 'object' && position.type === 'Point' && isValidCoordinate(position)) {
    return [position.coordinates[1], position.coordinates[0]] // Swap [lng, lat] to [lat, lng]
  }
  return null
}

// Geocoding function with rate limiting and caching
const getExactCoordinates = async (address: string, name: string): Promise<[number, number]> => {
  const cleanAddress = address.trim().toLowerCase()
  
  // Check cache first
  if (geocodeCache.has(cleanAddress)) {
    return geocodeCache.get(cleanAddress)!
  }

  // Rate limiting (1 request per second)
  const now = Date.now()
  const delay = Math.max(0, 1000 - (now - lastGeocodeTime))
  await new Promise(resolve => setTimeout(resolve, delay))
  lastGeocodeTime = Date.now()

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Tunisia')}&limit=1`
    )
    
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data || data.length === 0) {
      throw new Error(`Address not found: ${address}`)
    }
    
    const lat = parseFloat(data[0].lat)
    const lon = parseFloat(data[0].lon)
    if (!isFinite(lat) || !isFinite(lon)) {
      throw new Error(`Invalid coordinates returned: [${data[0].lat}, ${data[0].lon}] for ${address}`)
    }
    
    const coords: [number, number] = [lat, lon]
    if (!isValidCoordinate(coords)) {
      throw new Error(`Invalid coordinate format: [${lat}, ${lon}] for ${address}`)
    }
    
    geocodeCache.set(cleanAddress, coords)
    return coords
  } catch (error) {
    console.error(`Geocoding error for ${name} (${address}):`, error)
    throw error
  }
}

// Process locations with error handling
const processLocations = async (locations: any[]) => {
  return Promise.all(locations.map(async loc => {
    try {
      // Sanitize input
      if (!loc.name) {
        console.warn(`Missing name for location:`, loc)
        geocodingErrors.value.push(`Unnamed warehouse (ID: ${loc._id || 'unknown'})`)
        return { ...loc, position: null }
      }

      if (!loc.position && !(loc.address || loc.location)) {
        throw new Error(`No address or location provided for ${loc.name}`)
      }

      // Normalize existing position
      if (loc.position) {
        const normalizedPosition = normalizePosition(loc.position)
        if (!normalizedPosition) {
          console.warn(`Invalid position in API data for ${loc.name}:`, loc.position)
          throw new Error(`Invalid position coordinates in API data: ${JSON.stringify(loc.position)}`)
        }
        loc.position = normalizedPosition
      } else {
        // Geocode if no valid position
        loc.position = await getExactCoordinates(loc.address || loc.location, loc.name)
      }

      return loc
    } catch (error: any) {
      console.error(`Processing failed for ${loc.name}:`, error.message, loc)
      geocodingErrors.value.push(`${loc.name} (${error.message})`)
      return { ...loc, position: null }
    }
  }))
}

// Load data from API
const loadData = async () => {
  loading.value = true
  geocodingErrors.value = []
  
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    const response = await api.get('/warehouses/getExternalDepots')
    if (!response.data?.success) throw new Error(`Failed to fetch data: ${response.data?.message || 'Unknown error'}`)
    
    // Validate API response
    if (!Array.isArray(response.data.data)) {
      throw new Error('Invalid API response: data is not an array')
    }

    externalWarehouses.value = await processLocations(response.data.data)
    await nextTick()
    updateMap()
  } catch (error: any) {
    console.error("Loading error:", error.message)
    geocodingErrors.value.push(`Failed to load warehouse data: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// Update map with markers
const updateMap = () => {
  if (!map.value) return

  // Clear existing markers
  markers.value.forEach((marker) => map.value?.removeLayer(marker))
  markers.value = []

  // Add new markers
  const validWarehouses = externalWarehouses.value.filter(wh => wh.position && isValidCoordinate(wh.position))
  
  validWarehouses.forEach(wh => {
    const marker = L.marker(wh.position, { icon: warehouseIcon })
      .addTo(map.value as L.Map)
      .bindPopup(`
        <div class="map-popup">
          <h4>${wh.name}</h4>
          <p>${wh.address || wh.location || 'No address'}</p>
          ${wh.storage_type ? `<p>Type: ${wh.storage_type}</p>` : ''}
          <small>Coordinates: ${wh.position[0].toFixed(6)}, ${wh.position[1].toFixed(6)}</small>
        </div>
      `)
    
    markers.value.push(marker)
  })

  // Adjust view
  if (markers.value.length > 0) {
    const group = new L.FeatureGroup(markers.value as unknown as L.Layer[])
    map.value.fitBounds(group.getBounds().pad(0.5), {
      maxZoom: 10,
      animate: true
    })
  } else {
    map.value.flyTo([34.0, 9.0], 6, {
      duration: 1
    })
  }
}

onMounted(async () => {
  initMap()
  await loadData()
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
  }
})
</script>

<style scoped>
.tunisia-map-container {
  padding: 2rem;
  min-height: 100vh;
  background-color: #f9fafb; /* Light gray background */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-section {
  text-align: center;
  margin-bottom: 1rem;
}

h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #111827; /* Dark gray for headings */
  margin: 0;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280; /* Lighter gray for secondary text */
  font-size: 1.1rem;
  margin: 0;
}

.stats-cards {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: #ffffff; /* White background */
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.stat-icon.warehouses {
  background-color: #fef3c7; /* Light amber for warehouse icon */
  color: #d97706; /* Amber for icon color */
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827; /* Dark gray for headings */
  line-height: 1;
}

.stat-label {
  color: #6b7280; /* Lighter gray for secondary text */
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.control-panel {
  background: #ffffff; /* White background */
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.status-message.error {
  background-color: #fee2e2; /* Light red for error */
  color: #dc2626; /* Red for error text */
}

.status-message i {
  font-size: 1rem;
}

.map-view {
  flex-grow: 1;
  min-height: 600px;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: none;
}

.map-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  background: #ffffff; /* White background */
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-icon {
  width: 20px;
  height: 32px;
}

@media (max-width: 768px) {
  .tunisia-map-container {
    padding: 1rem;
  }

  .map-view {
    min-height: 400px;
  }
}
</style>

<style>
.map-popup {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  min-width: 250px;
  padding: 0.5rem;
}

.map-popup h4 {
  margin: 0 0 0.5rem 0;
  color: #111827; /* Dark gray for headings */
  font-size: 1.1rem;
  font-weight: 600;
}

.map-popup p {
  margin: 0 0 0.5rem 0;
  color: #4b5563; /* Medium gray for text */
  font-size: 0.95rem;
  line-height: 1.4;
}

.map-popup small {
  display: block;
  color: #6b7280; /* Lighter gray for secondary text */
  font-size: 0.8rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb; /* Light gray for borders */
}

.leaflet-popup-content-wrapper {
  border-radius: 0.75rem !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  padding: 0.5rem !important;
}

.leaflet-popup-content {
  margin: 0 !important;
}

.leaflet-container {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
}

.leaflet-popup-tip-container {
  margin-top: -1px !important;
}

.leaflet-popup-tip {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}

.leaflet-marker-icon {
  background-image: none !important;
}

.leaflet-marker-shadow {
  background-image: none !important;
}
</style>
```