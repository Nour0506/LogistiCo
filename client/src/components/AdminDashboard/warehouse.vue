<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// Types
interface Warehouse {
  _id: string
  name: string
  type: 'external'
  location: string
  storage_type: 'freezer' | 'refrigerated' | 'ambient' | 'controlled'
  capacity: number
  status: 'available' | 'occupied' | 'maintenance'
  company_id?: string | null // Champ optionnel
}

// State
const warehouses = ref<Warehouse[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchTerm = ref('')
const statusFilter = ref('')
const storageTypeFilter = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const selectedWarehouseId = ref<string | null>(null)

// Form state
const warehouseForm = ref<Warehouse>({
  _id: '',
  name: '',
  type: 'external',
  location: '',
  storage_type: 'ambient',
  capacity: 1000,
  status: 'available'
})

// API Configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
})

// Computed Properties
const filteredWarehouses = computed(() => {
  let filtered = warehouses.value
  
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(w => 
      w.name.toLowerCase().includes(term) || 
      w.location.toLowerCase().includes(term)
    )
  }
  
  if (statusFilter.value) {
    filtered = filtered.filter(w => w.status === statusFilter.value)
  }
  
  if (storageTypeFilter.value) {
    filtered = filtered.filter(w => w.storage_type === storageTypeFilter.value)
  }
  
  return filtered
})
const storageTypesCount = computed(() => {
  const types = new Set(warehouses.value.map(w => w.storage_type))
  return types.size
})

// Methods
const formatStorageType = (type: string): string => {
  const types: Record<string, string> = {
    freezer: 'Freezer',
    refrigerated: 'Refrigerated',
    ambient: 'Ambient',
    controlled: 'Controlled'
  }
  return types[type] || type
}

const formatStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    available: 'Available',
    occupied: 'Occupied',
    maintenance: 'Maintenance'
  }
  return statuses[status] || status
}

const getStorageTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    freezer: 'fas fa-snowflake',
    refrigerated: 'fas fa-temperature-low',
    ambient: 'fas fa-thermometer-half',
    controlled: 'fas fa-sliders-h'
  }
  return icons[type] || 'fas fa-warehouse'
}

const formatDate = (date: string | undefined): string => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString()
}

const openAddModal = () => {
  isEditing.value = false
  selectedWarehouseId.value = null
  warehouseForm.value = {
    _id: '',
    name: '',
    type: 'external',
    location: '',
    storage_type: 'ambient',
    capacity: 1000,
    status: 'available'
  }
  showModal.value = true
}

const openEditModal = (warehouse: Warehouse) => {
  isEditing.value = true
  selectedWarehouseId.value = warehouse._id
  warehouseForm.value = { ...warehouse }
  showModal.value = true
}

const openDeleteModal = (id: string) => {
  selectedWarehouseId.value = id
  showDeleteModal.value = true
}

const closeModals = () => {
  showModal.value = false
  showDeleteModal.value = false
  selectedWarehouseId.value = null
}

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = null
    
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')
    
    // Récupération des données utilisateur de manière sécurisée
    let userData = {}
    try {
      const userDataString = localStorage.getItem('userData')
      userData = userDataString ? JSON.parse(userDataString) : {}
    } catch (e) {
      console.error('Error parsing user data:', e)
    }

    // Vérification du rôle admin
    const isAdmin = userData.role === 'admin'
    
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    // Pour les admins, on peut soit:
    // 1. Passer une companyId null/défaut
    // 2. Demander à sélectionner une company
    if (isAdmin && !warehouseForm.value.companyId) {
      // Option 1: Assigner une company par défaut ou null
      warehouseForm.value.companyId = null
      
      // Option 2: Demander à l'admin de choisir une company
      // throw new Error('Veuillez sélectionner une entreprise')
    }
    
    if (isEditing.value && selectedWarehouseId.value) {
      const response = await api.put(
        `/warehouses/updateExternalDepot/${selectedWarehouseId.value}`,
        warehouseForm.value,
        { headers }
      )
      
      const index = warehouses.value.findIndex(w => w._id === selectedWarehouseId.value)
      if (index !== -1) {
        warehouses.value[index] = response.data
      }
    } else {
      const response = await api.post(
        '/warehouses/addExternalDepot',
        warehouseForm.value,
        { headers }
      )
      warehouses.value.unshift(response.data)
    }
    
    closeModals()
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Une erreur est survenue'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}
const handleDelete = async () => {
  try {
    if (!selectedWarehouseId.value) return
    
    loading.value = true
    error.value = null
    
    // Vérifier les locations actives
    
   
    
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')
    
    await api.delete(`/warehouses/deleteExternalDepot/${selectedWarehouseId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    warehouses.value = warehouses.value.filter(w => w._id !== selectedWarehouseId.value)
    closeModals()
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'An error occurred'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}

const fetchWarehouses = async () => {
  try {
    loading.value = true
    error.value = null
    
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')
    
    const response = await api.get('/warehouses/getExternalDepots', {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    warehouses.value = response.data.data || []
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load warehouses'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchWarehouses()
})
</script>

<template>
  <div class="warehouse-management">
    <!-- Header Section -->
    <header class="header">
      <h1>Warehouse Management</h1>
      <div class="header-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            v-model="searchTerm"
            placeholder="Search warehouses..."
          >
        </div>
        <button class="btn-primary" @click="openAddModal">
          <i class="fas fa-plus"></i>
          Add Warehouse
        </button>
      </div>
    </header>

    <!-- Statistics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-warehouse"></i>
        </div>
        <div class="stat-content">
          <h3>Total Warehouses</h3>
          <p>{{ filteredWarehouses.length }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-box"></i>
        </div>
        <div class="stat-content">
          <h3>Storage Types</h3>
          <p>{{ storageTypesCount }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Status:</label>
        <select v-model="statusFilter">
          <option value="">All</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Storage Type:</label>
        <select v-model="storageTypeFilter">
          <option value="">All</option>
          <option value="freezer">Freezer</option>
          <option value="refrigerated">Refrigerated</option>
          <option value="ambient">Ambient</option>
          <option value="controlled">Controlled</option>
        </select>
      </div>
    </div>

    <!-- Error/Loading States -->
    <div v-if="error" class="alert alert-error">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>

    <div v-if="loading" class="alert alert-info">
      <i class="fas fa-spinner fa-spin"></i>
      Loading warehouses...
    </div>

    <!-- Warehouse Grid -->
    <div class="warehouse-grid" v-if="!loading && filteredWarehouses.length > 0">
      <div 
        v-for="warehouse in filteredWarehouses" 
        :key="warehouse._id"
        class="warehouse-card"
      >
        <div class="card-header">
          <div class="warehouse-info">
            <h3>{{ warehouse.name }}</h3>
            <p class="location">
              <i class="fas fa-map-marker-alt"></i>
              {{ warehouse.location }}
            </p>
          </div>
          <div class="card-actions">
            <button 
              class="btn-icon btn-edit"
              @click="openEditModal(warehouse)"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button 
              class="btn-icon btn-delete"
              @click="openDeleteModal(warehouse._id)"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="card-body">
          <div class="detail-row">
            <span class="detail-label">Storage Type</span>
            <span class="detail-value">
              <i :class="getStorageTypeIcon(warehouse.storage_type)"></i>
              {{ formatStorageType(warehouse.storage_type) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="status-badge" :class="warehouse.status">
              {{ formatStatus(warehouse.status) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Capacity</span>
            <span class="detail-value">{{ warehouse.capacity }} kg</span>
          </div>
          
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredWarehouses.length === 0" class="empty-state">
      <i class="fas fa-warehouse"></i>
      <p>No warehouses found</p>
      <button class="btn-primary" @click="openAddModal">
        <i class="fas fa-plus"></i>
        Add Warehouse
      </button>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit' : 'Add' }} Warehouse</h2>
          <button class="btn-close" @click="closeModals">×</button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <div class="form-group">
              <label>Name</label>
              <input 
                type="text"
                v-model="warehouseForm.name"
                required
              >
            </div>
            <div class="form-group">
              <label>Location</label>
              <input 
                type="text"
                v-model="warehouseForm.location"
                required
              >
            </div>
            <div class="form-group">
              <label>Storage Type</label>
              <select v-model="warehouseForm.storage_type">
                <option value="freezer">Freezer</option>
                <option value="refrigerated">Refrigerated</option>
                <option value="ambient">Ambient</option>
                <option value="controlled">Controlled</option>
              </select>
            </div>
            <div class="form-group">
              <label>Capacity (kg)</label>
              <input 
                type="number"
                v-model.number="warehouseForm.capacity"
                required
                min="1"
              >
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="warehouseForm.status">
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeModals">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              {{ isEditing ? 'Update' : 'Add' }} Warehouse
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <!-- Delete Confirmation Modal -->
<div v-if="showDeleteModal" class="modal">
  <div class="modal-content modal-sm">
    <div class="modal-header">
      <h2>Confirm Delete</h2>
      <button class="btn-close" @click="closeModals">×</button>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to delete this warehouse?</p>
      <p v-if="error" class="text-error">{{ error }}</p>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" @click="closeModals">
        Cancel
      </button>
      <button class="btn-danger" @click="handleDelete" :disabled="loading">
        <span v-if="loading">Checking...</span>
        <span v-else>Delete</span>
      </button>
    </div>
  </div>
</div>
  </div>
</template>
```vue
<style scoped>
.warehouse-management {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Styles */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #111827; /* Dark gray for headings */
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* Search Bar */
.search-bar {
  position: relative;
}

.search-bar i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280; /* Lighter gray for secondary icons */
}

.search-bar input {
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e5e7eb; /* Light gray for borders */
  border-radius: 0.5rem;
  width: 300px;
  background: #ffffff; /* White background */
  color: #111827; /* Dark gray for text */
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #ffffff; /* White background */
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background: #dbeafe; /* Light blue for stat icons */
  color: #2563eb; /* Blue for icon color */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.stat-content h3 {
  font-size: 0.875rem;
  color: #6b7280; /* Lighter gray for secondary text */
  margin: 0;
}

.text-error {
  color: #dc2626; /* Red for error text */
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.stat-content p {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827; /* Dark gray for headings */
  margin: 0.25rem 0 0 0;
}

/* Filters */
.filters {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  color: #6b7280; /* Lighter gray for secondary text */
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #e5e7eb; /* Light gray for borders */
  border-radius: 0.375rem;
  background: #ffffff; /* White background */
  color: #111827; /* Dark gray for text */
}

/* Warehouse Grid */
.warehouse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.warehouse-card {
  background: #ffffff; /* White background */
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb; /* Light gray for borders */
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.warehouse-info h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827; /* Dark gray for headings */
}

.location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280; /* Lighter gray for secondary text */
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #dbeafe; /* Light blue for edit button */
  color: #2563eb; /* Blue for edit icon */
}

.btn-delete {
  background: #fee2e2; /* Light red for delete button */
  color: #dc2626; /* Red for delete icon */
}

.card-body {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.detail-label {
  color: #6b7280; /* Lighter gray for secondary text */
  font-size: 0.875rem;
}

.detail-value {
  font-weight: 500;
  color: #111827; /* Dark gray for text */
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.available {
  background: #d1fae5; /* Light green for available */
  color: #16a34a; /* Green for available text */
}

.status-badge.occupied {
  background: #fee2e2; /* Light red for occupied */
  color: #dc2626; /* Red for occupied text */
}

.status-badge.maintenance {
  background: #fef3c7; /* Light amber for maintenance */
  color: #d97706; /* Amber for maintenance text */
}

/* Buttons */
.btn-primary {
  background: #2563eb; /* Blue for primary buttons */
  color: #ffffff; /* White for button text */
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #1d4ed8; /* Darker blue on hover */
}

.btn-secondary {
  background: #ffffff; /* White background */
  color: #6b7280; /* Lighter gray for secondary text */
  border: 1px solid #e5e7eb; /* Light gray for borders */
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-danger {
  background: #dc2626; /* Red for danger buttons */
  color: #ffffff; /* White for button text */
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
   z-index: 1000;
}

.modal-content {
  background: #ffffff; /* White background */
  border-radius: 0.5rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.modal-sm {
  max-width: 400px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb; /* Light gray for borders */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827; /* Dark gray for headings */
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280; /* Lighter gray for secondary text */
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #111827; /* Dark gray for text */
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb; /* Light gray for borders */
  border-radius: 0.375rem;
  background: #ffffff; /* White background */
  color: #111827; /* Dark gray for text */
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb; /* Light gray for borders */
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #ffffff; /* White background */
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-state i {
  font-size: 3rem;
  color: #6b7280; /* Lighter gray for secondary text */
  margin-bottom: 1rem;
}

.empty-state p {
  color: #6b7280; /* Lighter gray for secondary text */
  margin-bottom: 1.5rem;
}

/* Alerts */
.alert {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.alert-error {
  background: #fee2e2; /* Light red for error */
  color: #dc2626; /* Red for error text */
}

.alert-info {
  background: #dbeafe; /* Light blue for info */
  color: #2563eb; /* Blue for info text */
}

/* Responsive Design */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .header-actions {
    flex-direction: column;
  }

  .search-bar,
  .search-bar input {
    width: 100%;
  }

  .filters {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .filter-group select {
    flex: 1;
  }

  .warehouse-grid {
    grid-template-columns: 1fr;
  }
}
</style>
