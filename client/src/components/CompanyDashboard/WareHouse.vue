<template>
  <div class="warehouse-container">
    <!-- Statistics Header -->
    <div class="stats-header">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-warehouse"></i>
        </div>
        <div class="stat-content">
          <h3>Warehouses</h3>
          <div class="stat-value">{{ filteredWarehouses.length }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-cubes"></i>
        </div>
        <div class="stat-content">
          <h3>Storage Types</h3>
          <div class="stat-value">{{ storageTypesCount }}</div>
        </div>
      </div>
    </div>

    <!-- Search and Actions -->
    <div class="actions-section">
      <div class="search-bar">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          class="search-input"
          placeholder="Search By Name..."
          v-model="searchTerm"
        />
      </div>
      <button class="add-warehouse-btn" @click="openAddModal">
        <i class="fas fa-plus"></i>
        Add a Warehouse
      </button>
      <button class="rent-warehouse-btn" @click="openExternalWarehouse">
        <i class="fas fa-plus"></i>
        Rent a Warehouse
      </button>
    </div>
    
    <!-- Filters -->
    <div class="status-filter">
      <label>Filter by status:</label>
      <select v-model="statusFilter">
        <option value="">All</option>
        <option value="available">Available</option>
        <option value="occupied">Occupied</option>
        <option value="maintenance">Maintenance</option>
      </select>
      
      <label class="type-filter">Filter by type:</label>
      <select v-model="typeFilter">
        <option value="">All</option>
        <option value="internal">Internal</option>
        <option value="external">External</option>
      </select>
    </div>

    <!-- Status Messages -->
    <div v-if="error" class="message error">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>

    <div v-if="loading" class="message loading">
      <i class="fas fa-spinner fa-spin"></i>
      Loading...
    </div>
    <div v-if="showExternalWarehouseModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content large">
        <div class="modal-header">
          <h2>Available External Warehouses</h2>
          <button class="close-btn" @click="closeModals">×</button>
        </div>
        
        <div v-if="externalError" class="message error">
          <i class="fas fa-exclamation-circle"></i>
          {{ externalError }}
        </div>
        
        <div v-if="externalLoading" class="message loading">
          <i class="fas fa-spinner fa-spin"></i>
          Loading external warehouses...
        </div>
        
        <div v-else class="external-warehouse-grid">
          <div 
            v-for="warehouse in externalWarehouses" 
            :key="warehouse._id" 
            class="warehouse-card external"
          >
            <div class="card-header">
              <div class="warehouse-icon">
                <i class="fas fa-warehouse"></i>
              </div>
              <div class="warehouse-info">
                <h3>{{ warehouse.name }}</h3>
                <div class="warehouse-meta">
                  <span class="location">
                    <i class="fas fa-map-marker-alt"></i>
                    {{ warehouse.location }}
                  </span>
                </div>
              </div>
            </div>

            <div class="card-content">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Type</span>
                  <span class="info-value">{{ warehouse.type }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status</span>
                  <span class="info-value status-badge" :class="warehouse.status">
                    {{ warehouse.status }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Storage</span>
                  <span class="info-value">
                    <i :class="getStorageTypeIcon(warehouse.storage_type)"></i>
                    {{ formatStorageType(warehouse.storage_type) }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Available Capacity</span>
                  <span class="info-value">{{ warehouse.capacity }} units</span>
                </div>
              </div>
              
              <div class="rental-section">
                <div v-if="hasRentalRequest(warehouse)" class="rental-status">
                  <div class="request-details">
                    <span class="status-badge" :class="getRentalRequest(warehouse)?.status">
                      {{ getRentalRequest(warehouse)?.status }}
                    </span>
                    <div class="request-info">
                      <div><strong>Capacity:</strong> {{ getRentalRequest(warehouse)?.requested_capacity }} units</div>
                      <div><strong>Period:</strong> {{ formatDate(getRentalRequest(warehouse)?.start_date) }} - {{ formatDate(getRentalRequest(warehouse)?.end_date) }}</div>
                      <div><strong>Requested:</strong> {{ formatDate(getRentalRequest(warehouse)?.requested_at) }}</div>
                    </div>
                  </div>
                  <button 
                    v-if="getRentalRequest(warehouse)?.status === 'pending'"
                    class="cancel-request-btn"
                    @click="cancelRentalRequest(warehouse._id, getRentalRequest(warehouse)?._id ?? '')"
                  >
                    Cancel Request
                  </button>
                </div>
                
                <div v-else class="rental-form">
                  <div class="form-group">
                    <label>Requested Capacity (units)</label>
                    <input 
                      type="number" 
                      v-model.number="rentalRequests[warehouse._id]"
                      min="1"
                      :max="warehouse.capacity"
                      placeholder="Enter capacity"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      v-model="rentalStartDates[warehouse._id]"
                      :min="new Date().toISOString().split('T')[0]"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      v-model="rentalEndDates[warehouse._id]"
                      :min="rentalStartDates[warehouse._id] || new Date().toISOString().split('T')[0]"
                    />
                  </div>
                  
                  <button 
                    class="rent-btn"
                    @click="submitRentalRequest(warehouse._id)"
                    :disabled="!isRentalFormValid(warehouse._id)"
                  >
                    Submit Rental Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  <!-- Add Product Modal -->
  <div v-if="showProductModal" class="modal-overlay" @click.self="closeModals">
    <div class="modal-container">
      <div class="modal-header">
        <h3>Add Product to Warehouse</h3>
        <button class="modal-close" @click="closeModals">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <div v-if="loadingProducts" class="loading-message">
          <i class="fas fa-spinner fa-spin"></i> Loading products...
        </div>
        
        <form @submit.prevent="handleProductSubmit" v-else>
          <div class="form-group">
            <label for="product">Product</label>
            <select 
              id="product" 
              v-model="productForm.productId" 
              required
            >
              <option value="" disabled selected>Select a product</option>
              <option 
                v-for="product in availableProducts" 
                :key="product._id" 
                :value="product._id"
              >
                {{ product.name }} ({{ product.category }})
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="quantity">Quantity</label>
            <input 
              type="number" 
              id="quantity" 
              v-model.number="productForm.quantity" 
              required 
              min="1"
              :max="maxQuantityForWarehouse"
            >
            <div v-if="maxQuantityForWarehouse > 0" class="capacity-info">
              Available capacity: {{ maxQuantityForWarehouse }} units
            </div>
            <div v-else class="capacity-info error">
              No available capacity in this warehouse
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeModals">
              Cancel
            </button>
            <button 
              type="submit" 
              class="submit-btn" 
              :disabled="isSubmitting || maxQuantityForWarehouse <= 0"
            >
              <span v-if="isSubmitting">
                <i class="fas fa-spinner fa-spin"></i> Adding...
              </span>
              <span v-else>Add Product</span>
            </button>
          </div> 
        </form>
      </div>
    </div>
  </div>

    <!-- Warehouses List -->
    <div class="warehouse-grid">
      <div 
        v-for="warehouse in filteredWarehouses" 
        :key="warehouse._id" 
        class="warehouse-card"
        :class="[warehouse.status, warehouse.type, { 'rented': warehouse.is_rented }]"
      >
        <div class="card-header">
          <div class="warehouse-icon">
            <i class="fas fa-warehouse"></i>
          </div>
          <div class="warehouse-info">
            <h3>{{ warehouse.name }}</h3>
            <div class="warehouse-meta">
              <span class="location">
                <i class="fas fa-map-marker-alt"></i>
                {{ warehouse.location }}
              </span>
              <span v-if="warehouse.is_rented" class="rented-tag">
                <i class="fas fa-handshake"></i> Rented
              </span>
            </div>
          </div>
          
          <div class="warehouse-actions" >
            <button class="action-btn edit" @click="editWarehouse(warehouse)">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" @click="openDeleteModal(warehouse._id)">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>

        <div class="card-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Type</span>
              <span class="info-value">{{ warehouse.type === 'internal' ? 'Internal' : 'External' }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Status</span>
              <span class="info-value status-badge" :class="warehouse.status">
                {{ formatStatus(warehouse.status) }}
              </span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Storage</span>
              <span class="info-value">
                <i :class="getStorageTypeIcon(warehouse.storage_type)"></i>
                {{ formatStorageType(warehouse.storage_type) }}
              </span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Capacity</span>
              <span class="info-value">{{ warehouse.capacity }} units</span>
            </div>
          </div>

          <div class="capacity-info" v-if="warehouse.is_rented">
            <div class="capacity-header">
              <span>Rented Capacity</span>
              <span class="capacity-value">
                {{ warehouse.rented_capacity || 0 }} units
                <span class="percentage" v-if="warehouse.capacity">
                  ({{ Math.round(((warehouse.rented_capacity || 0) / warehouse.capacity * 100)) }}%)
                </span>
              </span>
            </div>
            
            <div class="capacity-bar" v-if="warehouse.capacity">
              <div 
                class="capacity-fill"
                :style="{ width: `${Math.round((warehouse.rented_capacity || 0) / warehouse.capacity * 100)}%` }"
              ></div>
            </div>
          </div>

          <div class="products-section">
            <div class="section-header">
              <h4>Products</h4>
              <button 
                
                class="add-product-btn" 
                @click="openAddProductModal(warehouse._id)"
              >
                <i class="fas fa-plus"></i> Add Product
              </button>
            </div>
            
            <div v-if="warehouse.products && warehouse.products.length > 0" class="products-list">
              <div 
                v-for="product in warehouse.products" 
                :key="getProductKey(product)" 
                class="product-item"
              >
                <div class="product-info">
                  <div class="product-name">
                    {{ getProductName(product) }}
                  </div>
                  <div class="product-category">
                    {{ getProductCategory(product) }}
                  </div>
                </div>
                <div class="product-quantity">
                  <div class="quantity-input-container">
                    <input
                      type="number"
                      v-model.number="product.quantity"
                      @change="updateProductQuantity(warehouse._id, getProductId(product), product.quantity)"
                      min="0"
                      class="quantity-input"
                      :disabled="updatingProduct"
                    >
                    <div class="quantity-controls" >
                      <button 
                        class="quantity-btn minus"
                        @click="updateProductQuantity(warehouse._id, getProductId(product), product.quantity - 1)"
                        :disabled="product.quantity <= 0 || updatingProduct"
                      >
                        <i class="fas fa-minus"></i>
                      </button>
                      <button 
                        class="quantity-btn plus"
                        @click="updateProductQuantity(warehouse._id, getProductId(product), product.quantity + 1)"
                        :disabled="updatingProduct"
                      >
                        <i class="fas fa-plus"></i>
                      </button>
                      <button 
                        
                        class="delete-btn" 
                        @click="removeProduct(warehouse._id, getProductId(product))"
                        :disabled="updatingProduct"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-products">
              <p>No products in this warehouse</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!filteredWarehouses.length && !loading" class="empty-state">
        <i class="fas fa-warehouse"></i>
        <p>No warehouses found</p>
        <button class="add-warehouse-btn" @click="openAddModal">
          <i class="fas fa-plus"></i>
          Add a Warehouse
        </button>
      </div>
    </div>

    <!-- Add/Edit Warehouse Modal -->
    <div v-if="showWarehouseModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit' : 'Add' }} Warehouse</h2>
          <button class="close-btn" @click="closeModals">×</button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="name">Name</label>
              <input
                type="text"
                id="name"
                v-model="warehouseForm.name"
                required
                placeholder="Warehouse name"
              />
            </div>

            <div class="form-group">
              <label for="location">Location</label>
              <input
                type="text"
                id="location"
                v-model="warehouseForm.location"
                required
                placeholder="Address"
              />
            </div>

            <div class="form-group">
              <label for="storage_type">Storage Type</label>
              <select
                id="storage_type"
                v-model="warehouseForm.storage_type"
                required
              >
                <option value="freezer">Freezer</option>
                <option value="refrigerated">Refrigerated</option>
                <option value="ambient">Ambient</option>
                <option value="controlled">Controlled</option>
              </select>
            </div>

            <div class="form-group">
              <label for="capacity">Capacity</label>
              <input
                type="number"
                id="capacity"
                v-model.number="warehouseForm.capacity"
                required
                min="1"
                placeholder="In units"
              />
            </div>

            <div class="form-group">
              <label for="status">Status</label>
              <select
                id="status"
                v-model="warehouseForm.status"
                required
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeModals">
              Cancel
            </button>
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              <span v-if="isSubmitting">
                <i class="fas fa-spinner fa-spin"></i> Processing...
              </span>
              <span v-else>{{ isEditing ? 'Update' : 'Add' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay">
      <div class="modal-content small">
        <div class="modal-header">
          <h2>Confirm Deletion</h2>
          <button class="close-btn" @click="showConfirmModal = false">×</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this warehouse?</p>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showConfirmModal = false">No</button>
          <button class="delete-btn" @click="confirmDelete">
            <span v-if="loading">Deleting...</span>
            <span v-else>Yes, delete</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

interface Product {
  _id: string
  name: string
  category: string
  description?: string
}

interface WarehouseProduct {
  product: Product | string
  quantity: number
  _id?: string
}

interface RentalRequest {
  _id: string
  warehouse_id: string
  company_id: string
  status: 'pending' | 'approved' | 'rejected'
  requested_capacity: number
  start_date: string | Date
  end_date: string | Date
  requested_at?: string | Date
}

interface Warehouse {
  _id: string
  name: string
  type: 'internal' | 'external'
  location: string
  storage_type: string
  capacity: number
  status: string
  is_rented?: boolean
  products?: WarehouseProduct[]
  rented_capacity?: number
  rental_requests?: RentalRequest[]
  company_info?: {
    name: string
    address: string
    contact: string
  }
  updatedAt?: string
}

// State
const maxQuantityForWarehouse = ref(0);
const warehouses = ref<Warehouse[]>([])
const availableProducts = ref<Product[]>([])
const externalWarehouses = ref<Warehouse[]>([])
const loading = ref(true)
const loadingProducts = ref(false)
const externalLoading = ref(false)
const isSubmitting = ref(false)
const updatingProduct = ref(false)
const error = ref<string | null>(null)
const externalError = ref<string | null>(null)
const searchTerm = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const showWarehouseModal = ref(false)
const showProductModal = ref(false)
const showConfirmModal = ref(false)
const showExternalWarehouseModal = ref(false)
const isEditing = ref(false)
const currentWarehouseId = ref<string | null>(null)
const currentCompanyId = ref('')
const rentalRequests = ref<Record<string, number>>({})
const rentalStartDates = ref<Record<string, string>>({})
const rentalEndDates = ref<Record<string, string>>({})

const warehouseForm = ref({
  name: '',
  type: 'internal' as 'internal' | 'external',
  location: '',
  storage_type: 'ambient' as 'freezer' | 'refrigerated' | 'ambient' | 'controlled',
  capacity: 1000,
  status: 'available' as 'available' | 'occupied' | 'maintenance'
})

const productForm = ref({
  warehouseId: '',
  productId: '',
  quantity: 1
})

// API Configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Computed Properties
const filteredWarehouses = computed(() => {
  let filtered = warehouses.value
  
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(w => 
      w.name.toLowerCase().includes(term) || 
      w.location.toLowerCase().includes(term)
)}
  
  if (statusFilter.value) {
    filtered = filtered.filter(w => w.status === statusFilter.value)
  }
  
  if (typeFilter.value) {
    filtered = filtered.filter(w => 
      typeFilter.value === 'internal' 
        ? w.type === 'internal' 
        : w.type === 'external' && w.is_rented
    )
  }
  
  return filtered
})

const storageTypesCount = computed(() => {
  const types = new Set(warehouses.value.map(wh => wh.storage_type))
  return types.size
})

// Utility Functions
const formatStorageType = (type: string) => {
  const types: Record<string, string> = {
    freezer: 'Freezer',
    refrigerated: 'Refrigerated',
    ambient: 'Ambient',
    controlled: 'Controlled'
  }
  return types[type] || type
}

const getProductKey = (product: WarehouseProduct) => {
  if (typeof product.product === 'object') {
    return product.product._id
  }
  return product.product
}

const getProductId = (product: WarehouseProduct) => {
  if (typeof product.product === 'object') {
    return product.product._id
  }
  return product.product
}

const getProductName = (product: WarehouseProduct): string => {
  // Cas 1: Le produit est un objet complet
  if (typeof product.product === 'object' && product.product !== null) {
    return product.product.name;
  }
  
  // Cas 2: Le produit est juste un ID - cherchez dans availableProducts
  const foundProduct = availableProducts.value.find(p => p._id === product.product);
  return foundProduct?.name || `Product (ID: ${String(product.product).slice(0, 5)}...)`;
};
const getProductCategory = (product: WarehouseProduct): string => {
  // Cas 1: Le produit est un objet complet
  if (typeof product.product === 'object' && product.product !== null) {
    return product.product.category;
  }
  
  // Cas 2: Le produit est juste un ID - cherchez dans availableProducts
  const foundProduct = availableProducts.value.find(p => p._id === product.product);
  return foundProduct?.category || 'No category';
};

const formatStatus = (status: string) => {
  const statuses: Record<string, string> = {
    available: 'Available',
    occupied: 'Occupied',
    maintenance: 'Maintenance'
  }
  return statuses[status] || status
}
  
const getStorageTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    freezer: 'fas fa-snowflake',
    refrigerated: 'fas fa-temperature-low',
    ambient: 'fas fa-thermometer-half',
    controlled: 'fas fa-sliders-h'
  }
  return icons[type] || 'fas fa-warehouse'
}

const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Rental Request Functions
const hasRentalRequest = (warehouse: Warehouse) => {
  return warehouse.rental_requests?.some(req => req.company_id === currentCompanyId.value)
}

const getRentalRequest = (warehouse: Warehouse) => {
  return warehouse.rental_requests?.find(req => req.company_id === currentCompanyId.value)
}

const isRentalFormValid = (warehouseId: string) => {
  return (
    rentalRequests.value[warehouseId] > 0 &&
    rentalStartDates.value[warehouseId] &&
    rentalEndDates.value[warehouseId] &&
    new Date(rentalEndDates.value[warehouseId]) > new Date(rentalStartDates.value[warehouseId])
  )
}

const submitRentalRequest = async (warehouseId: string) => {
  try {
    externalLoading.value = true
    externalError.value = null

    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    const capacity = Number(rentalRequests.value[warehouseId])
    const startDate = rentalStartDates.value[warehouseId]
    const endDate = rentalEndDates.value[warehouseId]

    if (!capacity || !startDate || !endDate) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'All fields are required'
      })
      return
    }

    const response = await api.post(
      '/request/send',
      {
        warehouse_id: warehouseId,
        requested_capacity: capacity,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString()
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Rental request submitted successfully'
    })

    await loadExternalWarehouses()
    
  } catch (err: any) {
    console.error('Error submitting rental request:', err)
    externalError.value = err.response?.data?.message || err.message || 'Failed to submit request'
    
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: externalError.value
    })
  } finally {
    externalLoading.value = false
  }
}

const cancelRentalRequest = async (warehouseId: string, requestId: string) => {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to cancel this rental request?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, cancel it!'
    })

    if (!result.isConfirmed) return

    externalLoading.value = true
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    await api.delete(`/rental-requests/${requestId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })

    await Swal.fire(
      'Cancelled!',
      'Your rental request has been cancelled.',
      'success'
    )

    await loadExternalWarehouses()
    
  } catch (err: any) {
    console.error('Error cancelling rental request:', err)
    externalError.value = err.response?.data?.message || err.message || 'Failed to cancel rental request'
    
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: externalError.value
    })
  } finally {
    externalLoading.value = false
  }
  try {
    loadingProducts.value = true;
    error.value = null;
    currentWarehouseId.value = warehouseId;

    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Authentication required');

    // Load available products
    const response = await axios.get('http://localhost:3000/api/products/get', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    availableProducts.value = response.data.data || response.data;

    // Calculate available capacity
    const warehouse = warehouses.value.find(w => w._id === warehouseId);
    if (warehouse) {
      if (warehouse.type === 'internal') {
        // For internal warehouses, use total capacity
        const usedCapacity = warehouse.products?.reduce((sum, p) => sum + p.quantity, 0) || 0;
        maxQuantityForWarehouse.value = warehouse.capacity - usedCapacity;
      } else if (warehouse.type === 'external' && warehouse.is_rented) {
        // For external rented warehouses, use rented capacity
        const usedCapacity = warehouse.products?.reduce((sum, p) => sum + p.quantity, 0) || 0;
        maxQuantityForWarehouse.value = (warehouse.rented_capacity || 0) - usedCapacity;
      }
    }

    // Initialize form
    productForm.value = {
      warehouseId,
      productId: '',
      quantity: 1
    };

    showProductModal.value = true;
  } catch (err: any) {
    console.error('Error loading products:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to load products';
    
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.value
    });
  } finally {
    loadingProducts.value = false;
  }
};
const openAddProductModal = async (warehouseId: string) => {
  try {
    loadingProducts.value = true;
    error.value = null;
    currentWarehouseId.value = warehouseId;

    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Authentication required');

    // Load available products
    const response = await axios.get('http://localhost:3000/api/products/get', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    availableProducts.value = response.data.data || response.data;

    // Calculate available capacity
    const warehouse = warehouses.value.find(w => w._id === warehouseId);
    if (warehouse) {
      if (warehouse.type === 'internal') {
        // For internal warehouses, use total capacity
        const usedCapacity = warehouse.products?.reduce((sum, p) => sum + p.quantity, 0) || 0;
        maxQuantityForWarehouse.value = warehouse.capacity - usedCapacity;
      } else if (warehouse.type === 'external' && warehouse.is_rented) {
        // For external rented warehouses, use rented capacity
        const usedCapacity = warehouse.products?.reduce((sum, p) => sum + p.quantity, 0) || 0;
        maxQuantityForWarehouse.value = (warehouse.rented_capacity || 0) - usedCapacity;
      }
    }

    // Initialize form
    productForm.value = {
      warehouseId,
      productId: '',
      quantity: 1
    };

    showProductModal.value = true;
  } catch (err: any) {
    console.error('Error loading products:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to load products';
    
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.value
    });
  } finally {
    loadingProducts.value = false;
  }
};
// Warehouse CRUD Operations
const openAddModal = () => {
  isEditing.value = false
  currentWarehouseId.value = null
  resetForm()
  showWarehouseModal.value = true
}

const editWarehouse = (warehouse: Warehouse) => {
  isEditing.value = true
  currentWarehouseId.value = warehouse._id
  warehouseForm.value = { 
    name: warehouse.name,
    type: warehouse.type,
    location: warehouse.location,
    storage_type: warehouse.storage_type as 'freezer' | 'refrigerated' | 'ambient' | 'controlled',
    capacity: warehouse.capacity,
    status: warehouse.status as 'available' | 'occupied' | 'maintenance'
  }
  showWarehouseModal.value = true
}

const openDeleteModal = (id: string) => {
  currentWarehouseId.value = id
  showConfirmModal.value = true
}

const closeModals = () => {
  showWarehouseModal.value = false
  showConfirmModal.value = false
  showProductModal.value = false
  showExternalWarehouseModal.value = false
}

const resetForm = () => {
  warehouseForm.value = {
    name: '',
    type: 'internal',
    location: '',
    storage_type: 'ambient',
    capacity: 1000,
    status: 'available'
  }
  productForm.value = {
    warehouseId: '',
    productId: '',
    quantity: 1
  }
}

const handleSubmit = async () => {
  if (isEditing.value) {
    await updateWarehouse()
  } else {
    await addWarehouse()
  }
}


const addWarehouse = async () => {
  try {
    isSubmitting.value = true
    error.value = null

    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')
    
    const response = await axios.post('http://localhost:3000/api/warehouses/addInternalDepot', {
      ...warehouseForm.value,
      companyId: currentCompanyId.value
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    warehouses.value.unshift(response.data)
    
    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Warehouse added successfully'
    })
    
    closeModals()
  } catch (err: any) {
    console.error('Error adding warehouse:', err)
    error.value = err.response?.data?.message || err.message || 'An error occurred'
    
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.value
    })
  } finally {
    isSubmitting.value = false
  }
}

const updateWarehouse = async () => {
  try {
    isSubmitting.value = true
    error.value = null

    if (!currentWarehouseId.value) throw new Error('No warehouse selected')

    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')
    
    const response = await axios.put(
      `http://localhost:3000/api/warehouses/updateInternalDepot/${currentWarehouseId.value}`,
      warehouseForm.value,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const index = warehouses.value.findIndex(w => w._id === currentWarehouseId.value)
    if (index !== -1) {
      warehouses.value[index] = response.data
    }
    
    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Warehouse updated successfully'
    })
    
    closeModals()
  } catch (err: any) {
    console.error('Error updating warehouse:', err)
    error.value = err.response?.data?.message || err.message || 'An error occurred'
    
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.value
    })
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = async () => {
  try {
    loading.value = true;
    error.value = null;

    if (!currentWarehouseId.value) throw new Error('No warehouse selected');

    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Authentication required');

    await axios.delete(`http://localhost:3000/api/warehouses/deleteInternalDepot/${currentWarehouseId.value}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    warehouses.value = warehouses.value.filter(w => w._id !== currentWarehouseId.value);

    await Swal.fire(
      'Deleted!',
      'The warehouse has been deleted.',
      'success'
    );

    showConfirmModal.value = false;
  } catch (err: any) {
    console.error('Error deleting warehouse:', err);
    let errorMessage = err.response?.data?.message || err.message || 'An error occurred';

    // Gestion spécifique pour les contrats actifs
    if (err.response?.status === 400 && err.response?.data?.message.includes('contrats actifs')) {
      errorMessage = `Cannot delete warehouse because it is referenced in ${err.response.data.activeContractsCount} active contract(s).`;
    }

    error.value = errorMessage;

    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: errorMessage
    });
  } finally {
    loading.value = false;
  }
};


const handleProductSubmit = async () => {
  try {
    isSubmitting.value = true
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    // Validation
    if (!productForm.value.productId) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select a product'
      })
      return
    }

    if (!productForm.value.quantity || productForm.value.quantity <= 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Quantity must be a positive number'
      })
      return
    }

    const response = await api.post(
      `/warehouses/${productForm.value.warehouseId}/products`,
      {
        productId: productForm.value.productId,
        quantity: productForm.value.quantity
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )

    // Optimistic update
    const warehouse = warehouses.value.find(w => w._id === productForm.value.warehouseId)
    if (warehouse) {
      const product = availableProducts.value.find(p => p._id === productForm.value.productId)
      if (product) {
        if (!warehouse.products) {
          warehouse.products = []
        }
        
        // Check if product already exists in warehouse
        const existingProductIndex = warehouse.products.findIndex(
          p => getProductId(p) === productForm.value.productId
        )
        
        if (existingProductIndex !== -1) {
          // Update quantity if product exists
          warehouse.products[existingProductIndex].quantity += productForm.value.quantity
        } else {
          // Add new product
          warehouse.products.push({
            product: {
              _id: product._id,
              name: product.name,
              category: product.category
            },
            quantity: productForm.value.quantity
          })
        }
      }
    }

    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Product added successfully'
    })

    closeModals()
  } catch (err: any) {
    console.error('Error adding product:', err)
    
    let errorMsg = 'An unknown error occurred'
    if (err.response?.data?.error === 'Not enough capacity') {
      errorMsg = `Not enough space. Only ${err.response.data.available} units available`
    } else if (err.response?.data?.error) {
      errorMsg = err.response.data.error
    } else if (err.message) {
      errorMsg = err.message
    }

    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: errorMsg
    })
    
    // Refresh data to sync with server
    await fetchWarehouses()
  } finally {
    isSubmitting.value = false
  }
}
const checkAvailableCapacity = (warehouseId: string, quantityToAdd: number) => {
  const warehouse = warehouses.value.find(w => w._id === warehouseId);
  if (!warehouse) return false;

  // Pour les entrepôts internes, utiliser la capacité totale
  if (warehouse.type === 'internal') {
    const usedCapacity = warehouse.products?.reduce((sum, p) => sum + p.quantity, 0) || 0;
    return usedCapacity + quantityToAdd <= warehouse.capacity;
  }
  
  // Pour les entrepôts externes, utiliser la capacité louée
  if (warehouse.type === 'external' && warehouse.is_rented) {
    const usedCapacity = warehouse.products?.reduce((sum, p) => sum + p.quantity, 0) || 0;
    return usedCapacity + quantityToAdd <= (warehouse.rented_capacity || 0);
  }

  return false;
};
const updateProductQuantity = async (warehouseId: string, productId: string, newQuantity: number) => {
  try {
    if (newQuantity < 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Quantity cannot be negative'
      })
      return
    }
    
    updatingProduct.value = true
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    await axios.put(
      `http://localhost:3000/api/warehouses/${warehouseId}/products/${productId}`,
      { quantity: newQuantity },
      { headers: { 'Authorization': `Bearer ${token}` } }
    )

    // Optimistic update
    const warehouse = warehouses.value.find(w => w._id === warehouseId)
    if (warehouse?.products) {
      const productIndex = warehouse.products.findIndex(p => getProductId(p) === productId)
      if (productIndex !== -1) {
        warehouse.products[productIndex].quantity = newQuantity
      }
    }

  } catch (err: any) {
    console.error('Error updating quantity:', err)
    
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.response?.data?.message || err.message || 'Failed to update quantity'
    })
    
    // Refresh data to sync with server
    await fetchWarehouses()
  } finally {
    updatingProduct.value = false
  }
}

const removeProduct = async (warehouseId: string, productId: string) => {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    })

    if (!result.isConfirmed) return

    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    await axios.delete(
      `http://localhost:3000/api/warehouses/${warehouseId}/products/${productId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )

    // Optimistic update
    const warehouse = warehouses.value.find(w => w._id === warehouseId)
    if (warehouse?.products) {
      warehouse.products = warehouse.products.filter(p => getProductId(p) !== productId)
    }

    await Swal.fire(
      'Deleted!',
      'The product has been removed.',
      'success'
    )
  } catch (err: any) {
    console.error('Error removing product:', err)
    
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.response?.data?.message || err.message || 'Failed to remove product'
    })
  }
}

// API Functions
const fetchWarehouses = async () => {
  try {
    loading.value = true
    error.value = null
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    const { data } = await axios.get(
      'http://localhost:3000/api/warehouses/getCompanyWarehouses?populate=products.product', 
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )

    // Normalize data structure
    warehouses.value = [
      ...(data?.data?.internal || []).map((w: any) => ({
        ...w,
        type: 'internal',
        products: w.products?.map((p: any) => ({
          ...p,
          product: p.product?._id ? {
            _id: p.product._id,
            name: p.product.name,
            category: p.product.category
          } : p.product
        })) || []
      })),
      ...(data?.data?.external || []).map((w: any) => ({ 
        ...w, 
        type: 'external',
        is_rented: true,
        products: w.products?.map((p: any) => ({
          ...p,
          product: p.product?._id ? {
            _id: p.product._id,
            name: p.product.name,
            category: p.product.category
          } : p.product
        })) || []
      }))
    ]

  } catch (err: any) {
    console.error('Error loading warehouses:', err)
    error.value = err.response?.data?.message || err.message || 'Loading error'
    
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.value
    })
  } finally {
    loading.value = false
  }
}

const loadExternalWarehouses = async () => {
  try {
    externalLoading.value = true
    externalError.value = null

    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    // Chargement des entrepôts externes disponibles
    const { data } = await axios.get(
      'http://localhost:3000/api/warehouses/external',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    externalWarehouses.value = data.data.map((wh: any) => ({
      ...wh,
      type: 'external',
      // S'assurer que rental_requests existe
      rental_requests: wh.rental_requests || []
    }))

  } catch (err: any) {
    console.error('Error loading external warehouses:', err)
    externalError.value = err.response?.data?.message || err.message || 'Failed to load external warehouses'
  } finally {
    externalLoading.value = false
  }
}
const openExternalWarehouse = async () => {
  try {
    externalLoading.value = true
    externalError.value = null
    
    const token = localStorage.getItem('accessToken')
    if (!token) {
      externalError.value = 'Authentication required. Please login again.'
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: externalError.value
      })
      return
    }

    if (!currentCompanyId.value) {
      const { data: userData } = await axios.get(
        'http://localhost:3000/api/users/meCompany', 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      currentCompanyId.value = userData.companyId
    }

    const { data } = await axios.get(
      'http://localhost:3000/api/warehouses/getExternalDepots?populate=products.product',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest',
          'X-Company-ID': currentCompanyId.value
        },
        params: {
          companyId: currentCompanyId.value
        }
      }
    )
    
    externalWarehouses.value = (data.data || []).map((warehouse: any) => ({
      ...warehouse,
      products: warehouse.products?.map((p: any) => ({
        ...p,
        product: p.product?._id ? {
          _id: p.product._id,
          name: p.product.name,
          category: p.product.category
        } : p.product
      })) || []
    }))
    
    showExternalWarehouseModal.value = true
  } catch (err: any) {
    console.error('Error loading external warehouses:', {
      status: err.response?.status,
      data: err.response?.data,
      headers: err.response?.headers
    })
    
    if (err.response?.status === 403) {
      externalError.value = 'Permission denied. Your role (entreprise) may not have access to external warehouses.'
    } else {
      externalError.value = err.response?.data?.message || 'Failed to load external warehouses'
    }
    
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: externalError.value
    })
  } finally {
    externalLoading.value = false
  }
}
onMounted(async () => {
  await fetchWarehouses();
  
  // Chargez aussi les produits disponibles
  const token = localStorage.getItem('accessToken');
  if (token) {
    try {
      const { data } = await axios.get(
        'http://localhost:3000/api/products/get', 
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      availableProducts.value = data.data || data;
      
      // Chargez l'ID de l'entreprise
      const { data: userData } = await axios.get(
        'http://localhost:3000/api/users/meCompany', 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      currentCompanyId.value = userData.companyId;
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  }
});
</script>
<style scoped>
/* Base Styles */
.warehouse-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f8fafc;
  min-height: 100vh;
}

/* Message Styles */
.message-container {
  margin-bottom: 1.5rem;
}

.message {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  gap: 0.75rem;
}

.message i {
  font-size: 1.25rem;
  margin-top: 0.15rem;
}

.message-content {
  flex: 1;
}

.message-content h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.message-content p {
  margin: 0;
  font-size: 0.875rem;
}

.message.error {
  background-color: #fee2e2;
  color: #dc2626;
  border-left: 4px solid #dc2626;
}

.message.success {
  background-color: #dcfce7;
  color: #16a34a;
  border-left: 4px solid #16a34a;
}

.close-message {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
}

/* Validation Errors */
.validation-errors {
  background-color: #fef2f2;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-left: 4px solid #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message:last-child {
  margin-bottom: 0;
}

.error-input {
  border-color: #dc2626 !important;
  background-color: #fef2f2 !important;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Stats Header */
.stats-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background-color: #e0f2fe;
  color: #0369a1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.stat-content h3 {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
}

/* Search and Actions */
.actions-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}

.search-bar {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.search-input {
  width: 50%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: white;
}

.search-input:focus {
  outline: none;
  border-color: #0369a1;
  box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.1);
}

.add-warehouse-btn {
  background-color: #0369a1;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  border: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-warehouse-btn:hover {
  background-color: #075985;
}

.rent-warehouse-btn {
  background-color: #39711c;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  border: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.rent-warehouse-btn:hover {
  background-color: #1c5a0b;
}

/* Status Filter */
.status-filter {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-filter label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.status-filter select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #0f172a;
  background-color: white;
}

.type-filter {
  margin-left: 1.5rem;
}

/* Warehouse Grid */
.warehouse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.warehouse-card {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.warehouse-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background-color: #f8fafc;
}

.warehouse-icon {
  width: 3rem;
  height: 3rem;
  background-color: #e0f2fe;
  color: #0369a1;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.warehouse-info {
  flex: 1;
}

.warehouse-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}

.warehouse-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #64748b;
}

.location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rented-tag {
  background: #fff3e0;
  color: #ff9800;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.warehouse-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background-color: white;
}

.action-btn.edit {
  color: #0369a1;
  border: 1px solid #e0f2fe;
}

.action-btn.edit:hover {
  background-color: #e0f2fe;
}

.action-btn.delete {
  color: #dc2626;
  border: 1px solid #fee2e2;
}

.action-btn.delete:hover {
  background-color: #fee2e2;
}

.card-content {
  padding: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.875rem;
  color: #0f172a;
  font-weight: 500;
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
  background-color: #dcfce7;
  color: #16a34a;
}

.status-badge.occupied {
  background-color: #fee2e2;
  color: #dc2626;
}

.status-badge.maintenance {
  background-color: #fef3c7;
  color: #d97706;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.status-badge.approved {
  background-color: #dcfce7;
  color: #16a34a;
}

.status-badge.rejected {
  background-color: #fee2e2;
  color: #dc2626;
}

.capacity-info {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
}

.capacity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #64748b;
}

.capacity-value {
  font-weight: 500;
  color: #0f172a;
}

.capacity-bar {
  height: 0.5rem;
  background-color: #e2e8f0;
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.capacity-fill {
  height: 100%;
  background-color: #0369a1;
  transition: width 0.3s ease;
}

.rental-info-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.rental-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.rental-value {
  font-weight: 500;
}

.percentage {
  font-size: 0.75rem;
  color: #64748b;
}

/* External Warehouse Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.modal-content.large {
  max-width: 900px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content.small {
  max-width: 400px;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #0f172a;
}

.modal-form {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 80%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #0369a1;
  box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.1);
}

.modal-body {
  padding: 1.5rem;
  text-align: center;
}

.modal-body p {
  margin: 0;
  color: #64748b;
}

.warning-text {
  color: #dc2626;
  font-weight: 500;
  margin-top: 0.5rem;
}

.modal-actions {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: #f8fafc;
}

.submit-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background-color: #0369a1;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background-color: #075985;
}

.submit-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background-color: #dc2626;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background-color: #b91c1c;
}

.delete-btn:disabled {
  background-color: #fca5a5;
  cursor: not-allowed;
}

/* External Warehouse Grid */
.external-warehouse-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 1rem;
}

.rental-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.rental-form {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  align-items: end;
}

.rental-form .form-group {
  margin-bottom: 0;
}

.rental-form .form-group label {
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.rent-btn {
  grid-column: 1 / -1;
  padding: 0.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.rent-btn:hover {
  background-color: #3e8e41;
}

.rent-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.request-details {
  flex: 1;
}

.request-info {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.5rem;
}

.request-info div {
  margin-bottom: 0.25rem;
}

.cancel-request-btn {
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-request-btn:hover {
  background-color: #d32f2f;
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: #64748b;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-state i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .warehouse-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-section {
    flex-direction: column;
  }
  
  .search-bar {
    width: 100%;
  }
  
  .search-input {
    width: 100%;
  }

  .add-warehouse-btn,
  .rent-warehouse-btn {
    width: 100%;
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr 1fr;
  }

  .rental-form {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .warehouse-container {
    padding: 1rem;
  }

  .warehouse-grid {
    grid-template-columns: 1fr;
  }

  .stats-header {
    grid-template-columns: 1fr;
  }

  .status-filter {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .type-filter {
    margin-left: 0;
  }
}

/* Products Section Styles */
.products-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.add-product-btn {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-product-btn:hover {
  background-color: #2563eb;
}

.add-product-btn i {
  font-size: 0.75rem;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.product-item:hover {
  background-color: #f1f5f9;
  transform: translateY(-1px);
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-category {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.product-quantity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

.quantity-value {
  font-weight: 500;
  color: #334155;
  min-width: 5rem;
  text-align: right;
}

.quantity-controls {
  display: flex;
  gap: 0.25rem;
}

.quantity-btn, .delete-btn {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.quantity-btn {
  background-color: #e2e8f0;
  color: #334155;
}

.quantity-btn:hover {
  background-color: #cbd5e1;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #fee2e2;
  color: #dc2626;
}

.delete-btn:hover {
  background-color: #fecaca;
}

.no-products {
  text-align: center;
  padding: 1rem;
  color: #64748b;
  font-size: 0.875rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .product-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .product-quantity {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }
  
  .quantity-value {
    text-align: left;
  }
}
/* Product Modal Styles */
.modal-container {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #0f172a;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: white;
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: #f8fafc;
}
.quantity-input-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-input {
  width: 60px;
  padding: 0.375rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  text-align: center;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.quantity-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);
}

.quantity-btn {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background-color: #e2e8f0;
  color: #334155;
}

.quantity-btn:hover {
  background-color: #cbd5e1;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-btn.plus {
  background-color: #dcfce7;
  color: #16a34a;
}

.quantity-btn.plus:hover {
  background-color: #bbf7d0;
}

.quantity-btn.minus {
  background-color: #fee2e2;
  color: #dc2626;
}

.quantity-btn.minus:hover {
  background-color: #fecaca;
}

.delete-btn {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background-color: #fee2e2;
  color: #dc2626;
}

.delete-btn:hover {
  background-color: #fecaca;
}
.submit-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background-color: #3b82f6;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background-color: #2563eb;
}

.submit-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.loading-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
  gap: 0.75rem;
}
</style>