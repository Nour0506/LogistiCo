<template>
  <div class="tunisia-map-container">
    <div class="header-section">
      <h1>Map of Rentals in Tunisia</h1>
      <p class="subtitle">Visualize your points of sale and warehouses</p>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon sale-points">
          <i class="fas fa-store"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ salePoints.length }}</span>
          <span class="stat-label">Sale Points</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warehouses">
          <i class="fas fa-warehouse"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ warehouses.length }}</span>
          <span class="stat-label">Warehouses</span>
        </div>
      </div>
    </div>

    <div class="control-panel">
      <div class="map-controls">
        <label class="control-toggle">
          <input type="checkbox" v-model="showSalePoints" @change="updateMap" />
          <span class="toggle-label">
            <i class="fas fa-store"></i>
            Sale Points
          </span>
        </label>
        <label class="control-toggle">
          <input type="checkbox" v-model="showWarehouses" @change="updateMap" />
          <span class="toggle-label">
            <i class="fas fa-warehouse"></i>
            Warehouses
          </span>
        </label>
      </div>

      <div v-if="loading" class="status-message loading">
        <i class="fas fa-spinner fa-spin"></i>
        Loading data...
      </div>
      
      <div v-if="geocodingErrors.length > 0" class="status-message error">
        <i class="fas fa-exclamation-triangle"></i>
        Unlocalized addresses: {{ geocodingErrors.join(', ') }}
      </div>
    </div>

    <div id="tunisia-map" class="map-view"></div>

    <div class="map-legend">
      <div class="legend-item">
        <img :src="blueMarkerIcon" class="legend-icon" alt="Sale Point">
        <span>Sale Points</span>
      </div>
      <div class="legend-item">
        <img :src="redMarkerIcon" class="legend-icon" alt="Warehouse">
        <span>Warehouses</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

const map = ref<L.Map | null>(null);
const markers = ref<L.Marker[]>([]);
const showSalePoints = ref(true);
const showWarehouses = ref(true);
const loading = ref(false);
const geocodingErrors = ref<string[]>([]);

const salePoints = ref<any[]>([]);
const warehouses = ref<any[]>([]);

const preciseLocations: Record<string, [number, number]> = {
  'Avenue Habib Bourguiba, Monastir': [35.7780, 10.8262],
  'Rue de l\'Indépendance, Monastir': [35.7765, 10.8289],
  'Port de Monastir': [35.7746, 10.8349],
  'Avenue Habib Bourguiba, Tunis': [36.7985, 10.1765],
  'Rue de Marseille, Tunis': [36.8002, 10.1814],
  'Avenue Taïeb Mhiri, Sousse': [35.8250, 10.6347],
};

const createCustomIcon = (color: string) => L.icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const blueMarkerIcon = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png`;
const redMarkerIcon = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png`;

const salePointIcon = createCustomIcon('blue');
const warehouseIcon = createCustomIcon('red');

const initMap = () => {
  map.value = L.map('tunisia-map', {
    zoomControl: true,
    preferCanvas: true,
  }).setView([34.0, 9.0], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18,
    minZoom: 6,
  }).addTo(map.value!);
};

const loadData = async () => {
  loading.value = true;
  geocodingErrors.value = [];

  try {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Authentication required');
    
    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    const [salePointsRes, warehousesRes] = await Promise.all([
      api.get('/salePoints/getSalePoints'),
      api.get('/warehouses/getInternalDepots'),
    ]);

    salePoints.value = await processLocations(salePointsRes.data.data, 'salePoint');
    warehouses.value = await processLocations(warehousesRes.data.data, 'warehouse');

    updateMap();
  } catch (error) {
    console.error('Loading error:', error);
  } finally {
    loading.value = false;
  }
};

const processLocations = async (locations: any[], type: string) => {
  return Promise.all(locations.map(async loc => {
    if (!loc.position || !loc.position.coordinates || loc.position.coordinates.length !== 2) {
      try {
        const coords = await getExactCoordinates(loc.address || loc.location, loc.name);
        loc.position = { type: 'Point', coordinates: coords };
      } catch (error) {
        console.error(`Geocoding failed for ${loc.name}:`, error);
        geocodingErrors.value.push(loc.name);
        return null; // Exclure les emplacements sans coordonnées valides
      }
    }
    return { ...loc, type };
  })).then(results => results.filter(loc => loc !== null));
};

const getExactCoordinates = async (address: string, name: string): Promise<[number, number]> => {
  const cleanAddress = address.trim().toLowerCase();
  for (const [key, coords] of Object.entries(preciseLocations)) {
    if (cleanAddress.includes(key.toLowerCase())) {
      return coords; // [latitude, longitude]
    }
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=tn&limit=1&addressdetails=1&namedetails=1`
  );

  if (!response.ok) throw new Error('Network error');

  const data = await response.json();

  if (!data || data.length === 0) throw new Error('Address not found');

  const result = data[0];
  const foundAddress = result.display_name.toLowerCase();
  if (!foundAddress.includes(address.toLowerCase().split(',')[0])) {
    throw new Error('Incorrect street in results');
  }

  return [parseFloat(result.lat), parseFloat(result.lon)]; // [latitude, longitude]
};

const isValidCoordinates = (coords: any): boolean => {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [val1, val2] = coords;
  return (
    typeof val1 === 'number' && !isNaN(val1) && val1 >= -180 && val1 <= 180 &&
    typeof val2 === 'number' && !isNaN(val2) && val2 >= -90 && val2 <= 90
  );
};

const updateMap = () => {
  if (!map.value) return;

  markers.value.forEach(marker => map.value?.removeLayer(marker));
  markers.value = [];

  const locationsToShow = [
    ...(showSalePoints.value ? salePoints.value : []),
    ...(showWarehouses.value ? warehouses.value : []),
  ].filter(loc => loc.position && loc.position.coordinates && isValidCoordinates(loc.position.coordinates));

  locationsToShow.forEach(loc => {
    const icon = loc.type === 'salePoint' ? salePointIcon : warehouseIcon;
    const [lng, lat] = loc.position.coordinates; // [longitude, latitude] (GeoJSON)
    console.log(`Ajout marqueur pour ${loc.name}: [lat: ${lat}, lng: ${lng}]`);
    
    try {
      const marker = L.marker([lat, lng], { icon }) // [latitude, longitude]
        .addTo(map.value!)
        .bindPopup(`
          <div class="map-popup">
            <h4>${loc.name}</h4>
            <p>${loc.address || loc.location}</p>
            <small>Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
          </div>
        `);
      markers.value.push(marker);
    } catch (error) {
      console.error(`Erreur lors de l'ajout du marqueur pour ${loc.name}:`, error);
      geocodingErrors.value.push(loc.name);
    }
  });

  if (locationsToShow.length > 0) {
    const group = new L.FeatureGroup(markers.value);
    map.value.fitBounds(group.getBounds().pad(0.5), { maxZoom: 10 });
  } else {
    map.value.setView([34.0, 9.0], 6);
  }
};

onMounted(async () => {
  initMap();
  await loadData();
});

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
  }
});
</script>

<style scoped>
/* Votre CSS reste inchangé */
.tunisia-map-container {
  padding: 2rem;
  min-height: 100vh;
  background-color: #f8fafc;
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
  color: #1e293b;
  margin: 0;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 1.1rem;
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: white;
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

.stat-icon.sale-points {
  background-color: #e0f2fe;
  color: #0284c7;
}

.stat-icon.warehouses {
  background-color: #fef3c7;
  color: #d97706;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.control-panel {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.map-controls {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.control-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.control-toggle:hover {
  background-color: #f8fafc;
}

.control-toggle input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border: 2px solid #cbd5e1;
  cursor: pointer;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.975rem;
  color: #1e293b;
}

.toggle-label i {
  color: #64748b;
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

.status-message.loading {
  background-color: #f0f9ff;
  color: #0284c7;
}

.status-message.error {
  background-color: #fef2f2;
  color: #dc2626;
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

@media (max-width: 768px) {
  .tunisia-map-container {
    padding: 1rem;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .map-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .control-toggle {
    width: 100%;
    justify-content: center;
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
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
}

.map-popup p {
  margin: 0 0 0.5rem 0;
  color: #4b5563;
  font-size: 0.95rem;
  line-height: 1.4;
}

.map-popup small {
  display: block;
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
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

.map-legend {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  padding: 1rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #1e293b;
}

.legend-icon {
  width: 20px;
  height: 20px;
}
</style>