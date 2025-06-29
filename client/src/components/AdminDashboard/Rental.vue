<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// Types
interface Company {
  _id: string
  companyName: string
}

interface Warehouse {
  _id: string
  name: string
  location: string
  capacity: number
  available_capacity: number
}

interface User {
  _id: string
  name: string
}

interface RentalRequest {
  _id: string
  warehouse_id: Warehouse
  company_id: Company
  requested_capacity: number
  start_date: string | Date
  end_date: string | Date
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string | Date
  
}

// State Management
const router = useRouter()
const requests = ref<RentalRequest[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const statusFilter = ref('pending,approved') // Par défaut, n'inclut pas les rejetées
const startDateFilter = ref('')
const endDateFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const showDetailsModal = ref(false)
const selectedRequest = ref<RentalRequest | null>(null)
const stats = ref({
  pending: 0,
  approved: 0,
  rejected: 0
})

// API Configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api/Request',
  headers: { 'Content-Type': 'application/json' }
})

// Computed Properties
const filteredRequests = computed(() => {
  let filtered = requests.value
  
  if (statusFilter.value) {
    const statuses = statusFilter.value.split(',')
    filtered = filtered.filter(req => statuses.includes(req.status))
  }
  
  if (startDateFilter.value) {
    const startDate = new Date(startDateFilter.value)
    filtered = filtered.filter(req => new Date(req.requested_at) >= startDate)
  }
  
  if (endDateFilter.value) {
    const endDate = new Date(endDateFilter.value)
    filtered = filtered.filter(req => new Date(req.requested_at) <= endDate)
  }
  
  return filtered
})

const totalPages = computed(() => Math.ceil(filteredRequests.value.length / itemsPerPage))

const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredRequests.value.slice(start, end)
})

// Methods
const fetchRentalRequests = async () => {
  try {
    loading.value = true
    error.value = null
    
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')
    
    const response = await api.get('/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    requests.value = response.data.data.map((request: any) => ({
      ...request,
      warehouse_id: request.warehouse_id || { 
        _id: '',
        name: 'Unknown Warehouse',
        location: 'Location not available',
        capacity: 0,
        available_capacity: 0
      },
      company_id: request.company_id || {
        _id: '',
        companyName: 'Unknown Company'
      }
    }))

    calculateStats()
  } catch (err: any) {
    error.value = err.response?.data?.error || err.message || 'Failed to load rental requests'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}

const calculateStats = () => {
  stats.value = {
    pending: requests.value.filter(req => req.status === 'pending').length,
    approved: requests.value.filter(req => req.status === 'approved').length,
    rejected: requests.value.filter(req => req.status === 'rejected').length
  }
}

const updateRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
  try {
    loading.value = true
    error.value = null
    
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')
    
    // Sauvegardez les données actuelles avant la mise à jour
    const currentRequest = requests.value.find(req => req._id === requestId)
    
    const response = await api.put(`/${requestId}/status`, 
      { status },
      { headers: { 'Authorization': `Bearer ${token}` }}
    )
    
    const index = requests.value.findIndex(req => req._id === requestId)
    if (index !== -1) {
      requests.value[index] = {
        ...currentRequest, // Conserve toutes les anciennes données
        ...response.data.data, // Applique les nouvelles données
        status: response.data.data.status // S'assure que le statut est bien mis à jour
      }
      calculateStats()
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || err.message || 'Failed to update request status'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}
const viewRequestDetails = (request: RentalRequest) => {
  selectedRequest.value = request
  showDetailsModal.value = true
}

const viewWarehouse = (warehouse: Warehouse) => {
  router.push(`/warehouses/${warehouse._id}`)
}

const closeModal = () => {
  showDetailsModal.value = false
  selectedRequest.value = null
}

const resetFilters = () => {
  statusFilter.value = 'pending,approved'
  startDateFilter.value = ''
  endDateFilter.value = ''
  currentPage.value = 1
}

const formatDate = (date: string | Date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date: string | Date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

const calculateDaysLeft = (endDate: string | Date) => {
  const today = new Date()
  const end = new Date(endDate)
  const diffTime = end.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const calculateRentalDays = (request: RentalRequest) => {
  const start = new Date(request.start_date)
  const end = new Date(request.end_date)
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Lifecycle
onMounted(() => {
  fetchRentalRequests()
})
</script>

<template>
  <div class="rental-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <h1>Warehouse Rental Dashboard</h1>
      <div class="filter-controls">
        <div class="filter-group">
          <label for="status">Status</label>
          <select id="status" v-model="statusFilter" class="filter-select">
            <option value="pending,approved">Active Requests</option>
            <option value="pending">Pending Only</option>
            <option value="approved">Approved Only</option>
            <option value="rejected">Rejected Only</option>
            <option value="pending,approved,rejected">All Requests</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="dateRange">Date Range</label>
          <div class="date-inputs">
            <input type="date" v-model="startDateFilter" class="date-input">
            <span>to</span>
            <input type="date" v-model="endDateFilter" class="date-input">
          </div>
        </div>
      </div>
    </header>

    <!-- Active Filters -->
    <div class="active-filters" v-if="statusFilter !== 'pending,approved' || startDateFilter || endDateFilter">
      <span class="filter-tag" v-if="statusFilter !== 'pending,approved'">
        Status: {{ 
          statusFilter === 'pending' ? 'Pending' :
          statusFilter === 'approved' ? 'Approved' :
          statusFilter === 'rejected' ? 'Rejected' :
          'Multiple'
        }}
      </span>
      <span class="filter-tag" v-if="startDateFilter">
        From: {{ formatDate(startDateFilter) }}
      </span>
      <span class="filter-tag" v-if="endDateFilter">
        To: {{ formatDate(endDateFilter) }}
      </span>
      <button @click="resetFilters" class="btn-clear-filters">
        Clear all
      </button>
    </div>

    <!-- Statistics -->
    <div class="stats-grid">
      <div class="stat-card" 
           v-for="(value, key) in stats" 
           :key="key" 
           :class="key"
           @click="statusFilter = key">
        <div class="stat-icon">
          <i :class="['fas', 
            key === 'pending' ? 'fa-clock' : 
            key === 'approved' ? 'fa-check-circle' : 
            'fa-times-circle'
          ]"></i>
        </div>
        <div class="stat-info">
          <h3>{{ key.charAt(0).toUpperCase() + key.slice(1) }}</h3>
          <p class="stat-value">{{ value }}</p>
        </div>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="error" class="alert alert-error">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>

    <div v-if="loading" class="alert alert-info">
      <i class="fas fa-spinner fa-spin"></i>
      Loading rental requests...
    </div>

    <!-- Data Table -->
    <div class="data-table-container" v-if="!loading && filteredRequests.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>Warehouse</th>
            <th>Company</th>
            <th>Capacity</th>
            <th>Period</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in paginatedRequests" :key="request._id">
           
            <td>
              <div class="warehouse-info">
                <span class="warehouse-name">
                  {{ request.warehouse_id?.name || 'No warehouse name' }}
                </span>
                <span class="warehouse-location">
                  <i class="fas fa-map-marker-alt"></i>
                  {{ request.warehouse_id?.location || 'N/A' }}
                </span>
              </div>
            </td>
            <td>{{ request.company_id?.companyName || 'N/A' }}</td>
            <td>{{ request.requested_capacity }} units</td>
            <td>
              <div class="period-info">
                <span>{{ formatDate(request.start_date) }} - {{ formatDate(request.end_date) }}</span>
                <span v-if="request.status === 'approved'" class="days-remaining">
                  {{ calculateDaysLeft(request.end_date) }} days remaining
                </span>
              </div>
            </td>
            <td>
              <span class="status-badge" :class="request.status">
                {{ request.status }}
               
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button 
                  v-if="request.status === 'pending'"
                  @click="updateRequestStatus(request._id, 'approved')"
                  class="btn btn-success"
                  title="Approve"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button 
                  v-if="request.status === 'pending'"
                  @click="updateRequestStatus(request._id, 'rejected')"
                  class="btn btn-danger"
                  title="Reject"
                >
                  <i class="fas fa-times"></i>
                </button>
                <button 
                  @click="viewRequestDetails(request)"
                  class="btn btn-info"
                  title="View Details"
                >
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredRequests.length === 0" class="empty-state">
      <i class="fas fa-box-open"></i>
      <p>No rental requests found</p>
      <button @click="resetFilters" class="btn-reset-filters">
        Reset filters
      </button>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="filteredRequests.length > 0">
      <button 
        @click="currentPage--" 
        :disabled="currentPage === 1"
        class="btn btn-outline"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button 
        @click="currentPage++" 
        :disabled="currentPage === totalPages"
        class="btn btn-outline"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Request Details</h2>
          <button @click="closeModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedRequest">
          <div class="detail-grid">
            
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="status-badge" :class="selectedRequest.status">
                {{ selectedRequest.status }}
              >
              </span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Company</span>
              <span class="detail-value">{{ selectedRequest.company_id?.companyName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Warehouse</span>
              <span class="detail-value">{{ selectedRequest.warehouse_id?.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Capacity</span>
              <span class="detail-value">
                {{ selectedRequest.requested_capacity }} / {{ selectedRequest.warehouse_id?.capacity || 'N/A' }} units
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Period</span>
              <span class="detail-value">
                {{ formatDate(selectedRequest.start_date) }} - {{ formatDate(selectedRequest.end_date) }}
                ({{ calculateRentalDays(selectedRequest) }} days)
              </span>
            </div>
           
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
/* Base Styles */
.rental-dashboard {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  color: #111827; /* Dark gray for text */
}

/* Header Styles */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-header h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: #1f2937; /* Darker gray for headings */
  margin: 0;
}

/* Filter Controls */
.filter-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280; /* Lighter gray for secondary text */
}

.filter-select,
.date-input {
  padding: 0.5rem;
  border: 1px solid #e5e7eb; /* Light gray for borders */
  border-radius: 0.375rem;
  background-color: #ffffff; /* White background */
  color: #111827; /* Dark gray for text */
  min-width: 150px;
}

.date-inputs {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: #f9fafb; /* Soft gray background */
  border-radius: 0.5rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #ffffff; /* White for icons */
}

.pending .stat-icon { background-color: #d97706; } /* Amber for pending */
.approved .stat-icon { background-color: #16a34a; } /* Green for approved */
.rejected .stat-icon { background-color: #dc2626; } /* Red for rejected */

.stat-info h3 {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280; /* Lighter gray for secondary text */
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937; /* Darker gray for headings */
  margin: 0;
}

/* Alerts */
.alert {
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-error {
  background-color: #fee2e2; /* Light red for error */
  color: #991b1b; /* Dark red for error text */
}

.alert-info {
  background-color: #e0f2fe; /* Light blue for info */
  color: #075985; /* Dark blue for info text */
}

/* Data Table */
.data-table-container {
  background-color: #f9fafb; /* Soft gray background */
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background-color: #f3f4f6; /* Muted gray for headers */
  padding: 1rem;
  text-align: left;
  font-weight: 500;
  color: #6b7280; /* Lighter gray for secondary text */
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb; /* Light gray for borders */
}

.warehouse-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.warehouse-location {
  font-size: 0.875rem;
  color: #6b7280; /* Lighter gray for secondary text */
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.period-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.days-remaining {
  font-size: 0.875rem;
  color: #6b7280; /* Lighter gray for secondary text */
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.pending {
  background-color: #fef3c7; /* Light amber for pending */
  color: #92400e; /* Dark amber for pending text */
}

.status-badge.approved {
  background-color: #d1fae5; /* Light green for approved */
  color: #065f46; /* Dark green for approved text */
}

.status-badge.rejected {
  background-color: #fee2e2; /* Light red for rejected */
  color: #991b1b; /* Dark red for rejected text */
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-success { background-color: #16a34a; color: #ffffff; } /* Green for success */
.btn-danger { background-color: #dc2626; color: #ffffff; } /* Red for danger */
.btn-info { background-color: #2563eb; color: #ffffff; } /* Blue for info */
.btn-outline {
  background-color: transparent;
  border: 1px solid #e5e7eb; /* Light gray for borders */
  color: #111827; /* Dark gray for text */
}

.btn:hover { opacity: 0.9; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: #f9fafb; /* Soft gray background */
  border-radius: 0.5rem;
}

.empty-state i {
  font-size: 3rem;
  color: #6b7280; /* Lighter gray for secondary text */
  margin-bottom: 1rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #ffffff; /* White background */
  border-radius: 0.5rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb; /* Light gray for borders */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  color: #6b7280; /* Lighter gray for secondary text */
  cursor: pointer;
  padding: 0.5rem;
}

.modal-body {
  padding: 1.5rem;
}

.detail-grid {
  display: grid;
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb; /* Light gray for borders */
}

.detail-label {
  font-weight: 500;
  color: #6b7280; /* Lighter gray for secondary text */
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-controls {
    flex-direction: column;
  }

  .data-table {
    display: block;
    overflow-x: auto;
  }

  .action-buttons {
    flex-direction: column;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>