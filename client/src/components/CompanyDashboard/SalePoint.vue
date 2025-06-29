<template>
  <div class="vue-app">
    <div class="container">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="page-title">Sales Points</h1>
          <p class="page-subtitle">Manage retail and distribution locations</p>
        </div>
        <button class="button-primary button-add" @click="handleAddSalePoint">
          <span class="plus-icon">+</span>
          Add Sales Point
        </button>
      </div>
      <div class="filter-container">
        <div class="search-wrapper">
          <input
            type="text"
            class="search-input"
            placeholder="Search locations..."
            v-model="searchTerm"
            @input="applyFilters"
          />
        </div>
      </div>
      <div class="table-container">
        <table class="suppliers-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>TYPE</th>
              <th>ADDRESS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="point in filteredSalePoints" :key="point._id">
              <td>
                <div class="flex items-center">
                  <div class="store-icon">🏪</div>
                  <div>
                    <div class="point-name">{{ point.name }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="category-tag" :class="point.type.toLowerCase().replace(' ', '-')">
                  {{ point.type }}
                </span>
              </td>
              <td>
                <div class="location-info">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>{{ point.address }}</span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="action-button view-button" @click="toggleMap(point)" title="View/Hide">
                    <i class="fas" :class="activeMapId === point._id ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                  <button class="action-button edit-button" @click="handleEditSalePoint(point)" title="Edit">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="action-button delete-button" @click="deleteSalePoint(point._id)" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
                <div 
                  v-if="activeMapId === point._id" 
                  :id="'map-container-'+point._id"
                  class="map-view"
                ></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <p class="results-info">Showing 1 to {{ filteredSalePoints.length }} of {{ filteredSalePoints.length }} results</p>
        <div class="pagination-buttons">
          <button class="pagination-button" disabled>Previous</button>
          <button class="pagination-button" disabled>Next</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
interface SalePoint {
  _id: string
  companyId: string
  name: string
  type: string
  address: string
  status: string
}
interface MapInstance {
  map: L.Map
  resizeObserver: ResizeObserver
}
const salePoints = ref<SalePoint[]>([])
const filteredSalePoints = ref<SalePoint[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchTerm = ref('')
const selectedStatus = ref('')
const selectedSalePoints = ref<string[]>([])
const selectAll = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const isSubmitting = ref(false)
const activeMapId = ref<string | null>(null)
const mapInstances = ref<Record<string, MapInstance>>({})
const isLoadingMap = ref(false)
const api = axios.create({
  baseURL: 'http://localhost:3000/api'
})
const getCoordinatesFromAddress = async (address: string): Promise<[number, number]> => {
  try {
    const encoded = encodeURIComponent(address)
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}`)
    
    if (!res.ok) throw new Error('Network error')
    
    const data = await res.json()
    if (!data || data.length === 0) throw new Error('Address not found')
    
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
  } catch (error) {
    console.error("Geocoding error:", error)
    throw new Error('Geocoding service unavailable')
  }
}
const initMap = async (point: SalePoint) => {
  const containerId = `map-container-${point._id}`
  const container = document.getElementById(containerId)
  
  if (!container) throw new Error('Map container not found')

  container.innerHTML = '<div class="map-loading">Loading map...</div>'

  try {
    const coords = await getCoordinatesFromAddress(point.address)

    if (!document.getElementById(containerId)) {
      throw new Error('Map container removed')
    }

    container.innerHTML = ''

    const map = L.map(container, {
      preferCanvas: true,
      zoomControl: true,
      fadeAnimation: true
    }).setView(coords, 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 10
    }).addTo(map)

    const customIcon = L.icon({
      iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    })

    const marker = L.marker(coords, { icon: customIcon })
      .addTo(map)
      .bindPopup(`<b>${point.name}</b><br>${point.address}<br>
        <small>Lat: ${coords[0].toFixed(4)}, Lng: ${coords[1].toFixed(4)}</small>`)
    
    marker.openPopup()

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })
    resizeObserver.observe(container)

    mapInstances.value[point._id] = {
      map,
      resizeObserver
    }

    setTimeout(() => {
      map.invalidateSize()
      map.setView(coords, 15)
    }, 100)

  } catch (error) {
    container.innerHTML = '<div class="map-error">Error loading map</div>'
    throw error
  }
}

const destroyMap = (id: string) => {
  if (mapInstances.value[id]) {
    const { map, resizeObserver } = mapInstances.value[id]
    resizeObserver.disconnect()
    map.remove()
    delete mapInstances.value[id]
  }
}

const toggleMap = async (point: SalePoint) => {
  try {
    if (isLoadingMap.value) return
    isLoadingMap.value = true

    if (activeMapId.value === point._id) {
      destroyMap(point._id)
      activeMapId.value = null
      isLoadingMap.value = false
      return
    }

    if (activeMapId.value) {
      destroyMap(activeMapId.value)
    }

    activeMapId.value = point._id

    await nextTick()

    await Promise.race([
      initMap(point),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ])

  } catch (error) {
    console.error("Map error:", error)
    activeMapId.value = null
  } finally {
    isLoadingMap.value = false
  }
}

const paginatedSalePoints = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredSalePoints.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredSalePoints.value.length / itemsPerPage.value)
})

const applyFilters = () => {
  filteredSalePoints.value = salePoints.value.filter(point => {
    const matchesSearch = searchTerm.value === '' || 
      point.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      point.address.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      point.type.toLowerCase().includes(searchTerm.value.toLowerCase()) 
    
    return matchesSearch
  })
  
  currentPage.value = 1
}

const resetFilters = () => {
  searchTerm.value = ''
  selectedStatus.value = ''
  applyFilters()
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedSalePoints.value = paginatedSalePoints.value.map(p => p._id)
  } else {
    selectedSalePoints.value = []
  }
}

const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
  })
}

const loadData = async () => {
  try {
    loading.value = true
    error.value = null

    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('Authentication required - Please login again')
    }

    api.defaults.headers.common.Authorization = `Bearer ${token}`

    const userData = await Promise.race([
      api.get('/users/meCompany'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
    ]) as { data: { companyId: string } }
    
    const companyId = userData.data.companyId
    if (!companyId) {
      throw new Error('Company not found - Please complete your company profile')
    }

    const params = {
      companyId,
      search: searchTerm.value || undefined,
      ...(selectedStatus.value && { status: selectedStatus.value })
    }

    const { data } = await api.get('/salePoints/getSalePoints', { params })

    if (!data?.success) {
      throw new Error(data?.message || 'Invalid response format')
    }

    if (!Array.isArray(data.data)) {
      throw new Error('Invalid data format - Expected array')
    }

    salePoints.value = data.data.map((point: SalePoint) => ({
      ...point,
    }))

    applyFilters()

  } catch (err: any) {
    console.error('Error loading sale points:', err)
    error.value = err.response?.data?.message || err.message || 'Error loading sale points'
    
    let errorMessage = error.value
    if (err.message.includes('timeout')) {
      errorMessage = 'Request timeout - Please check your connection'
    } else if (err.response?.status === 401) {
      errorMessage = 'Session expired - Please login again'
    }

    if (err.response?.status === 401 || err.message.includes('Authentication')) {
      localStorage.removeItem('accessToken')
    }
  } finally {
    loading.value = false
  }
}
const handleAddSalePoint = async () => {
  try {
    const { value: formValues } = await Swal.fire({
      title: "Add Sales Point",
      html: `
        <input id="swal-name" class="swal2-input" placeholder="Name" required>
        <select id="swal-type" class="swal2-input" required>
          <option value="Store">Store</option>
          <option value="Pickup Point">Pickup Point</option>
          <option value="Distribution Center">Distribution Center</option>
        </select>
        <input id="swal-address" class="swal2-input" placeholder="Address" required>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Add",
      preConfirm: () => {
        const getValue = (id: string) => {
          const el = document.getElementById(id) as HTMLInputElement;
          return el ? el.value : null;
        };

        const name = getValue("swal-name")?.trim();
        const type = getValue("swal-type");
        const address = getValue("swal-address")?.trim();
        
        console.log("Form values:", { name, type, address });

        if (!name || !type || !address) {
          Swal.showValidationMessage("Please fill all required fields with valid values");
          return false;
        }

        return {
          name,
          type,
          address
        };
      }
    });

    if (!formValues) return;

    console.log("Submitting:", formValues);

    const response = await api.post('/salePoints/addSalePoint', formValues);
    if (response.data.success) {
      await Swal.fire('Success!', 'Sales point added successfully', 'success');
      await loadData();
    }
  } catch (error) {
    console.error("Add sale point error:", error);
    let errorMessage = (error as any)?.response?.data?.message || (error as Error)?.message;
    
    if (axios.isAxiosError(error) && error.response?.data?.errors) {
      errorMessage = Object.values(error.response.data.errors as any).join('<br>');
    }

    await Swal.fire({
      title: 'Error',
      html: errorMessage,
      icon: 'error'
    });
  }
};
const handleEditSalePoint = async (salePoint: SalePoint) => {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')
    
    api.defaults.headers.common.Authorization = `Bearer ${token}`

    const { value: formValues } = await Swal.fire({
      title: 'Edit Sales Point',
      html:
        `<input id="name" class="swal2-input" placeholder="Name" value="${salePoint.name}" required>` +
        `<select id="type" class="swal2-input" required>
          <option value="Store" ${salePoint.type === 'Store' ? 'selected' : ''}>Store</option>
          <option value="Pickup Point" ${salePoint.type === 'Pickup Point' ? 'selected' : ''}>Pickup Point</option>
          <option value="Distribution Center" ${salePoint.type === 'Distribution Center' ? 'selected' : ''}>Distribution Center</option>
        </select>` +
        `<input id="address" class="swal2-input" placeholder="Address" value="${salePoint.address}" required>` ,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        return {
          name: (document.getElementById('name') as HTMLInputElement).value,
          type: (document.getElementById('type') as HTMLSelectElement).value,
          address: (document.getElementById('address') as HTMLInputElement).value,
          }
      }
    })

    if (formValues) {
      const response = await api.put(`/salePoints/update/${salePoint._id}`, formValues)

      if (response.data.success) {
        await Swal.fire({
          title: 'Success!',
          text: 'Sales point updated successfully',
          icon: 'success'
        })
        await loadData()
      }
    }
  } catch (err: any) {
    Swal.fire({
      title: 'Error',
      text: err.response?.data?.message || err.message || 'Error while updating',
      icon: 'error'
    })
  }
}

const deleteSalePoint = async (id: string) => {
  try {
    const confirm = await Swal.fire({
      title: 'Confirm deletion',
      text: "Are you sure you want to delete this sales point?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    })

    if (!confirm.isConfirmed) return

    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')
    
    api.defaults.headers.common.Authorization = `Bearer ${token}`

    const response = await api.delete(`/salePoints/deleteSalePoint/${id}`)
    
    if (response.data.success) {
      await Swal.fire({
        title: 'Deleted!',
        text: 'Sales point has been deleted.',
        icon: 'success'
      })
      
      await loadData()
    }
  } catch (err: any) {
    Swal.fire({
      title: 'Error',
      text: err.response?.data?.message || err.message || 'Error while deleting',
      icon: 'error'
    })
  }
}

watch(itemsPerPage, () => {
  currentPage.value = 1
})

watch(selectedSalePoints, (newVal) => {
  selectAll.value = newVal.length === paginatedSalePoints.value.length && newVal.length > 0
})

onMounted(() => {
  fixLeafletIcons()
  loadData()
})

onBeforeUnmount(() => {
  Object.keys(mapInstances.value).forEach(id => {
    destroyMap(id)
  })
})
</script>

<style scoped>
/* Styles CSS pour la liste déroulante */
.status-select {
  padding: 0.625rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  font-size: 0.875rem;
  cursor: pointer;
  outline: none;
}

.status-select:hover {
  background-color: #f9fafb;
}

.vue-app {
  font-family: "Inter", sans-serif;
  color: #333;
  background-color: white;
  min-height: 100vh;
  padding: 2rem 0;
  display: flex;
  justify-content: center;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.button-primary {
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.625rem 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-primary:hover {
  background-color: #1d4ed8;
}

.button-add {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.plus-icon {
  font-size: 1rem;
  font-weight: bold;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.filter-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0;
}

.search-wrapper {
  position: relative;
  flex: 0 0 auto;
}

.search-input {
  width: 18rem;
  padding: 0.625rem 1rem 0.625rem 2.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
}

.search-input:focus {
  border-color: #2563eb;
}

.search-wrapper::before {
  content: '🔍';
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.button-filter {
  padding: 0.625rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.button-filter:hover {
  background-color: #f9fafb;
}

.delete-button {
  color: #ef4444;
}

.delete-button:hover {
  background-color: #fee2e2;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 0.5rem;
}

.table-container {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.suppliers-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.suppliers-table th {
  background-color: #f8fafc;
  padding: 1rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
}

.suppliers-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
}

.suppliers-table tr:hover {
  background-color: #f9fafb;
}

.store-icon {
  height: 2rem;
  width: 2rem;
  border-radius: 9999px;
  background-color: #ecfdf5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  margin-right: 0.75rem;
}

.point-name {
  font-weight: 500;
}

.category-tag {
  padding: 0.375rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
  text-transform: capitalize;
}

.category-tag.store {
  background-color: #e0e7ff;
  color: #16a34a;
  border: 1px solid #c7d2fe;
}

.category-tag.pickup-point {
  background-color: #dcfce7;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.category-tag.distribution-center {
  background-color: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;
}

.category-tag {
  background-color: #f1f5f9;
  color: #596d88;
  border: 1px solid #e2e8f0;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transition: all 0.2s ease;
}

.view-button {
  background-color: #e3f2fd;
  color: #1976d2;
}

.view-button:hover {
  background-color: #bbdefb;
}

.edit-button {
  background-color: #e8f5e9;
  color: #388e3c;
}

.edit-button:hover {
  background-color: #c8e6c9;
}

.delete-button {
  background-color: #ffebee;
  color: #d32f2f;
}

.delete-button:hover {
  background-color: #ffcdd2;
}

.action-button i {
  font-size: 14px;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
}

.results-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.pagination-buttons {
  display: flex;
  gap: 0.5rem;
}

.pagination-button {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  font-size: 0.875rem;
  cursor: pointer;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f9fafb;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.leaflet-container {
  height: 100%;
  width: 100%;
  border-radius: 8px;
}

.map-view {
  height: 300px;
  width: 100%;
  margin-top: 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  z-index: 1000;
}

.leaflet-marker-icon {
  background-image: none !important;
}

.leaflet-popup-content {
  font-family: 'Inter', sans-serif;
  min-width: 200px;
}

.leaflet-popup-content b {
  color: #2563eb;
}

.swal2-input, .swal2-select {
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  background-color: #fff;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-sizing: border-box;
  font-family: 'Arial', sans-serif;
  height: 48px;
}

.swal2-input:focus, .swal2-select:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.3);
}

.swal2-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 14px;
  cursor: pointer;
}

.swal2-select option {
  padding: 10px;
  font-size: 16px;
  background-color: #fff;
  color: #333;
}

/* Removed unused styles */
.data-table, .point-id, .status-badge, .status-open, .status-closed, .status-limited, .map-button, .map-icon, .supplier-info, .supplier-avatar, .supplier-avatar img, .supplier-details, .supplier-name, .supplier-company, .search-icon {
  display: none;
}
</style>