<template>
  <div class="vehicles-container">
    <!-- Header Section -->
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <h1>Vehicles Management</h1>
          <p>Track and manage your fleet efficiently</p>
        </div>
        <button class="btn-add" @click="handleAddTruck">
          <i class="fas fa-plus"></i>
          Add Vehicle
        </button>
      </div>
    </header>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchTerm" 
          type="text" 
          placeholder="Search vehicles..." 
        />
      </div>
      <div class="filter-controls">
        <select v-model="selectedType" class="select-filter">
          <option value="">All Types</option>
          <option v-for="type in truckTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
        <select v-model="selectedStatus" class="select-filter">
          <option value="">All Status</option>
          <option v-for="status in statusOptions" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
        <button class="btn-reset" @click="resetFilters">
          <i class="fas fa-redo-alt"></i>
          Reset
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="fas fa-truck"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalTrucks }}</span>
          <span class="stat-label">Total Fleet</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon available">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ availableTrucks }}</span>
          <span class="stat-label">Available</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon maintenance">
          <i class="fas fa-tools"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ maintenanceTrucks }}</span>
          <span class="stat-label">In Maintenance</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon transit">
          <i class="fas fa-shipping-fast"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ inTransitTrucks }}</span>
          <span class="stat-label">In Transit</span>
        </div>
      </div>
    </div>

    <!-- Vehicles Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>VEHICLE</th>
            <th>TYPE</th>
            <th>CAPACITY</th>
            <th>STATUS</th>
            <th class="text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="truck in paginatedTrucks" :key="truck._id">
            <td>
              <div class="vehicle-info">
                <div class="vehicle-icon">
                  <i class="fas fa-truck"></i>
                </div>
                <span class="vehicle-name">{{ truck.vehicle }}</span>
              </div>
            </td>
            <td>
              <span class="type-badge">{{ truck.type }}</span>
            </td>
            <td>
            <span class="capacity-badge">{{ formatCapacity(truck.capacity) }}</span>
          </td>
            <td>
              <span :class="['status-badge', getStatusClass(truck.status)]">
                <i class="fas fa-circle"></i>
                {{ truck.status }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button class="btn-action btn-edit" @click="handleEditTruck(truck)">
                  <i class="fas fa-edit"></i>
                  <span>Edit</span>
                </button>
                <button class="btn-action btn-delete" @click="deleteTruck(truck._id)">
                  <i class="fas fa-trash-alt"></i>
                  <span>Delete</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <span class="pagination-info">
        Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredTrucks.length) }} of {{ filteredTrucks.length }} entries
      </span>
      <div class="pagination-controls">
        <button 
          class="btn-page" 
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <i class="fas fa-chevron-left"></i>
          Previous
        </button>
        <button 
          class="btn-page" 
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          Next
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'

interface Truck {
  _id: string
  company_id: string
  vehicle: string
  type: string
  capacity: number
  status: string
}

const router = useRouter()
const trucks = ref<Truck[]>([])
const filteredTrucks = ref<Truck[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchTerm = ref('')
const selectedStatus = ref('')
const selectedType = ref('')
const minFuel = ref<number | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const isSubmitting = ref(false)

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
})

// Available truck types
const truckTypes = ref([
  'A1',
  'A',
  'B',
   'B+E', 
   'C', 
   'C+E', 
   'D',
    'D1',
     'D+E',
      'H '
])

// Available status options
const statusOptions = ref([
  'available',
  'in transit',
  'maintenance'
])

// Computed properties
const totalTrucks = computed(() => trucks.value.length)
const availableTrucks = computed(() => trucks.value.filter(t => t.status === 'available').length)
const maintenanceTrucks = computed(() => trucks.value.filter(t => t.status === 'maintenance').length)
const inTransitTrucks = computed(() => trucks.value.filter(t => t.status === 'in transit').length)

const paginatedTrucks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTrucks.value.slice(start, end)
})

const totalPages = computed(() => 
  Math.ceil(filteredTrucks.value.length / itemsPerPage.value)
)

// Methods
const getStatusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available': return 'status-available'
    case 'in transit': return 'status-transit'
    case 'maintenance': return 'status-maintenance'
    default: return 'status-default'
  }
}

const formatCapacity = (capacity: number | undefined): string => {
  if (capacity === undefined || capacity === null) {
    return 'N/A'
  }
  return capacity.toLocaleString() + ' kg'
}

const applyFilters = () => {
  filteredTrucks.value = trucks.value.filter(truck => {
    const matchesSearch = searchTerm.value === '' || 
      truck.vehicle.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      truck.type.toLowerCase().includes(searchTerm.value.toLowerCase())
    
    const matchesStatus = selectedStatus.value === '' || 
      truck.status === selectedStatus.value
    
    const matchesType = selectedType.value === '' || 
      truck.type === selectedType.value
    
    return matchesSearch && matchesStatus && matchesType
  })
  
  currentPage.value = 1
}

const resetFilters = () => {
  searchTerm.value = ''
  selectedStatus.value = ''
  selectedType.value = ''
  applyFilters()
}

const loadData = async () => {
  try {
    loading.value = true
    error.value = null

    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    api.defaults.headers.common.Authorization = `Bearer ${token}`

    const { data: userData } = await api.get('/users/meCompany')
    const companyId = userData.companyId
    if (!companyId) throw new Error('Company not found')

    const { data } = await api.get('/trucks/getTrucks', {
      params: { 
        company_id: companyId,
        status: selectedStatus.value,
        type: selectedType.value,
        search: searchTerm.value
      }
    })

    if (data.success) {
      trucks.value = data.data
      filteredTrucks.value = [...trucks.value]
    } else {
      throw new Error(data.message || 'Failed to load trucks')
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Error loading trucks'
    
    await Swal.fire({
      title: 'Error',
      text: error.value || undefined,
      icon: 'error',
      confirmButtonText: 'OK'
    })

    if (error.value && error.value.includes('Company not found')) {
      router.push('/company-setup')
    }
  } finally {
    loading.value = false
  }
}

const handleAddTruck = async () => {
  try {
    isSubmitting.value = true;
    
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Authentication required');

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    const { data: userData } = await api.get('/users/meCompany');
    const companyId = userData.companyId;
    if (!companyId) throw new Error('Company not found');

    const { value: formValues } = await Swal.fire({
      title: 'Add New Vehicle',
      html: `
        <div class="custom-form">
          <div class="form-group">
            <label for="swal-vehicle">Vehicle Name *</label>
            <input id="swal-vehicle" class="swal2-input" placeholder="Enter vehicle name" required>
          </div>
          <div class="form-group">
            <label for="swal-type">Vehicle Type *</label>
            <select id="swal-type" class="swal2-select" required>
              <option value="">Select a type</option>
              ${truckTypes.value.map(type => 
                `<option value="${type}">${type}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="swal-capacity">Capacity (kg) *</label>
            <input id="swal-capacity" type="number" class="swal2-input" 
                   placeholder="Enter capacity (500-20000)" 
                   min="500" max="20000" required>
          </div>
          <div class="form-group">
            <label for="swal-status">Initial Status *</label>
            <select id="swal-status" class="swal2-select" required>
              ${statusOptions.value.map(status => 
                `<option value="${status}">${status}</option>`
              ).join('')}
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Add Vehicle',
      cancelButtonText: 'Cancel',
      focusConfirm: false,
      preConfirm: () => {
        const vehicle = (document.getElementById('swal-vehicle') as HTMLInputElement)?.value.trim();
        const type = (document.getElementById('swal-type') as HTMLSelectElement)?.value;
        const capacity = Number((document.getElementById('swal-capacity') as HTMLInputElement)?.value);
        const status = (document.getElementById('swal-status') as HTMLSelectElement)?.value;

        if (!vehicle) {
          Swal.showValidationMessage('Vehicle name is required');
          return false;
        }
        if (!type) {
          Swal.showValidationMessage('Vehicle type is required');
          return false;
        }
        if (!capacity || isNaN(capacity) || capacity < 500 || capacity > 20000) {
          Swal.showValidationMessage('Please enter a valid capacity between 500 and 20000 kg');
          return false;
        }
        if (!status) {
          Swal.showValidationMessage('Status is required');
          return false;
        }

        return { vehicle, type, capacity, status };
      }
    });

    if (!formValues) return;

    const response = await api.post('/trucks/addTruck', {
      vehicle: formValues.vehicle,
      type: formValues.type,
      capacity: formValues.capacity,
      status: formValues.status,
      company_id: companyId
    });

    if (response.data.success) {
      await Swal.fire({
        title: 'Success!',
        text: 'Vehicle added successfully',
        icon: 'success'
      });
      await loadData();
    } else {
      throw new Error(response.data.message || 'Failed to add vehicle');
    }
  } catch (err: any) {
    console.error('Add vehicle error:', err);
    await Swal.fire({
      title: 'Error',
      text: err.response?.data?.message || 
           err.message || 
           'An error occurred while adding the vehicle',
      icon: 'error'
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleEditTruck = async (truck: Truck) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Authentication required');
    
    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    const { value: formValues } = await Swal.fire({
      title: 'Edit Vehicle',
      html: `
        <div class="custom-form">
          <div class="form-group">
            <label>Vehicle Name *</label>
            <input id="swal-vehicle" class="swal2-input" 
                   value="${truck.vehicle}" required>
          </div>
          <div class="form-group">
            <label>Type *</label>
            <select id="swal-type" class="swal2-select" required>
              ${truckTypes.value.map(type => 
                `<option value="${type}" ${truck.type.trim() === type.trim() ? 'selected' : ''}>
                  ${type}
                </option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Capacity (kg) *</label>
            <input id="swal-capacity" type="number" class="swal2-input" 
                   value="${truck.capacity}" min="500" max="20000" required>
          </div>
          <div class="form-group">
            <label>Status *</label>
            <select id="swal-status" class="swal2-select" required>
              ${statusOptions.value.map(status => 
                `<option value="${status}" ${truck.status === status ? 'selected' : ''}>
                  ${status}
                </option>`
              ).join('')}
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      preConfirm: () => {
        const vehicle = (document.getElementById('swal-vehicle') as HTMLInputElement)?.value.trim();
        const type = (document.getElementById('swal-type') as HTMLSelectElement)?.value;
        const capacity = Number((document.getElementById('swal-capacity') as HTMLInputElement)?.value);
        const status = (document.getElementById('swal-status') as HTMLSelectElement)?.value;

        if (!vehicle || !type || !status) {
          Swal.showValidationMessage('All fields are required');
          return false;
        }
        if (isNaN(capacity)) {
          Swal.showValidationMessage('Capacity must be a number');
          return false;
        }

        return { vehicle, type, capacity, status };
      }
    });

    if (formValues) {
      const response = await api.put(`/trucks/updateTruck/${truck._id}`, formValues);
      
      if (response.data.success) {
        await Swal.fire('Success!', 'Vehicle updated successfully', 'success');
        await loadData();
      }
    }
  } catch (err: any) {
    await Swal.fire({
      title: 'Error',
      text: err.response?.data?.message || err.message,
      icon: 'error'
    });
  }
};

const deleteTruck = async (id: string) => {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        confirmButton: 'custom-confirm-button-delete',
        cancelButton: 'custom-cancel-button'
      }
    })

    if (result.isConfirmed) {
      const token = localStorage.getItem('accessToken')
      if (!token) throw new Error('Authentication required')
      
      api.defaults.headers.common.Authorization = `Bearer ${token}`
      const response = await api.delete(`/trucks/deleteTruck/${id}`)
      
      if (response.data.success) {
        await Swal.fire({
          title: 'Deleted!',
          text: 'Vehicle has been deleted.',
          icon: 'success'
        })
        await loadData()
      }
    }
  } catch (err: any) {
    Swal.fire({
      title: 'Error',
      text: err.response?.data?.message || err.message || 'Error while deleting vehicle',
      icon: 'error'
    })
  }
}

const viewTruck = async (id: string) => {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')
    
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    const response = await api.get(`/trucks/getTruck/${id}`)
    
    if (response.data.success) {
      const truck = response.data.data
      await Swal.fire({
        title: truck.vehicle,
        html: `
          <div class="vehicle-details">
            <p><strong>Type:</strong> ${truck.type}</p>
            <p><strong>Status:</strong> ${truck.status}</p>
            <p><strong>Created:</strong> ${new Date(truck.createdAt).toLocaleDateString()}</p>
            <p><strong>Last Updated:</strong> ${new Date(truck.updatedAt).toLocaleDateString()}</p>
          </div>
        `,
        customClass: {
          container: 'custom-modal',
          popup: 'custom-modal-popup',
          title: 'custom-modal-title'
        }
      })
    }
  } catch (err: any) {
    Swal.fire({
      title: 'Error',
      text: err.response?.data?.message || err.message || 'Error while viewing vehicle details',
      icon: 'error'
    })
  }
}

// Watchers
watch([searchTerm, selectedStatus, selectedType], () => {
  applyFilters()
})

watch(itemsPerPage, () => {
  currentPage.value = 1
})

// Initialize
onMounted(loadData)
</script>

<style scoped>
.vehicles-container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 2rem;
}

/* Header Styles */
/* Header Styles */
.header {
  background: #ffffff;
  margin: -2rem -2rem 2rem -2rem;
  padding: 1.5rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid #f1f5f9;
}

.header-content {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.header-left h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.header-left p {
  margin: 0.5rem 0 0 0;
  color: #64748b;
  font-size: 0.9375rem;
  font-weight: 400;
}

/* Bouton amélioré */
.btn-add {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 0.9375rem;
}

.btn-add:hover {
  background-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-add i {
  font-size: 0.9em;
}

/* Search Bar */
.search-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
}

.search-input-wrapper i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.search-input-wrapper input {
  width: 80%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.filter-controls {
  display: flex;
  gap: 0.75rem;
}

.select-filter {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: white;
  min-width: 150px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
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

.stat-icon.total { background-color: #e0f2fe; color: #0284c7; }
.stat-icon.available { background-color: #dcfce7; color: #16a34a; }
.stat-icon.maintenance { background-color: #fef3c7; color: #d97706; }
.stat-icon.transit { background-color: #f3e8ff; color: #7e22ce; }

/* Table Styles */
.table-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

/* Table Styles - Version corrigée */
.table-container {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}
.capacity-badge {
  background-color: #f0fdf4;
  color: #166534;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
  min-width: 80px;
  text-align: center;
}

/* Ajustez les largeurs de colonne */
th:nth-child(4), td:nth-child(4) { /* CAPACITY */
  width: 15%;
  text-align: center;
}
table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* Ajouté pour une largeur de colonne cohérente */
}

th, td {
  padding: 1rem 1.25rem;
  text-align: left;
  vertical-align: middle; /* Alignement vertical au centre */
}

th {
  background-color: #f8fafc;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
}

td {
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
  color: #334155;
}

/* Colonne ACTIONS spécifique */
th.text-right {
  text-align: center;
  padding-right: 8.5rem; 
}

/* Conteneur des boutons d'action */
.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-right: 0.5rem; /* Ajustement supplémentaire */
}

/* Boutons d'action */
.btn-action {
  padding: 0.5rem 0.75rem; /* Ajustement du padding */
  border: none;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap; /* Empêche le texte de se casser */
}

/* Largeurs de colonnes spécifiques */
th:nth-child(1), td:nth-child(1) { /* ID */
  width: 8%;
}

th:nth-child(2), td:nth-child(2) { /* VEHICLE */
  width: 22%;
}

th:nth-child(3), td:nth-child(3) { /* TYPE */
  width: 15%;
}

th:nth-child(4), td:nth-child(4) { /* STATUS */
  width: 15%;
  text-align: center;

}

th:nth-child(5), td:nth-child(5) { /* ACTIONS */
  width: 15%;
  
}
th:nth-child(6), td:nth-child(6) { /* ACTIONS */
  width: 25%;
  text-align: right;
}

.id-badge {
  background-color: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-family: monospace;
  color: #64748b;
}

.vehicle-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.vehicle-icon {
  width: 2.5rem;
  height: 2.5rem;
  background-color: #eff6ff;
  color: #2563eb;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-badge {
  background-color: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge i {
  font-size: 0.625rem;
}
.capacity-badge {
  background-color: #f0fdf4;
  color: #166534;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
}

.status-available {
  background-color: #dcfce7;
  color: #16a34a;
}

.status-maintenance {
  background-color: #fef3c7;
  color: #d97706;
}

.status-transit {
  background-color: #e0f2fe;
  color: #0284c7;
}

/* Action Buttons */
.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-action {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view {
  background-color: #eff6ff;
  color: #2563eb;
}

.btn-edit {
  background-color: #f0fdf4;
  color: #16a34a;
}

.btn-delete {
  background-color: #fef2f2;
  color: #dc2626;
}

.btn-action:hover {
  filter: brightness(0.95);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-page {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: white;
  color: #475569;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  background-color: #f8fafc;
  color: #1e293b;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .search-bar {
    flex-direction: column;
  }
  
  .filter-controls {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .vehicles-container {
    padding: 1rem;
  }

  .header {
    margin: -1rem -1rem 1rem -1rem;
    padding: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .table-container {
    overflow-x: auto;
  }

  .actions {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
    justify-content: center;
  }
}
</style>

<style>
/* SweetAlert Custom Styles */
.custom-modal {
  font-family: 'Inter', sans-serif;
}

.custom-modal-popup {
  border-radius: 1rem;
  padding: 2rem;
}

.custom-modal-header {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.custom-modal-title {
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 600;
}

.custom-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #475569;
  font-weight: 500;
  font-size: 0.875rem;
}

.custom-input,
.swal2-input,
.swal2-select {
  width: 100% !important;
  padding: 0.75rem !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 0.5rem !important;
  font-size: 0.875rem !important;
  margin: 0.5rem 0 !important;
  box-shadow: none !important;
}

.custom-input:focus,
.swal2-input:focus,
.swal2-select:focus {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
}

.custom-modal-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.custom-confirm-button,
.custom-cancel-button {
  padding: 0.75rem 1.5rem !important;
  border-radius: 0.5rem !important;
  font-weight: 500 !important;
  font-size: 0.875rem !important;
}

.custom-confirm-button {
  background-color: #2563eb !important;
  color: white !important;
}

.custom-confirm-button-delete {
  background-color: #dc2626 !important;
  color: white !important;
}

.custom-cancel-button {
  background-color: white !important;
  color: #64748b !important;
  border: 1px solid #e2e8f0 !important;
}

.vehicle-details {
  text-align: left;
  padding: 1rem;
}

.vehicle-details p {
  margin: 0.5rem 0;
  color: #475569;
}

.vehicle-details strong {
  color: #1e293b;
  font-weight: 500;
}
</style>