```vue
<template>
  <div class="suppliers-container">
    <!-- Header with category statistics -->
    <div class="stats-header">
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
          <h3>Total Suppliers</h3>
          <div class="stat-value">{{ suppliers.length }}</div>
          <div class="stat-trend">All categories</div>
        </div>
      </div>
    </div>

    <!-- Search and filters bar -->
    <div class="actions-bar">
      <div class="search-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="Search by name, category, contact..."
          class="search-input"
          @input="applyFilters"
        >
        <span v-if="searchTerm" class="clear-search" @click="resetFilters">
          <i class="fas fa-times"></i>
        </span>
      </div>
      <div class="filters">
        <div class="filter-dropdown">
          <select v-model="selectedCategory" class="filter-select" @change="applyFilters">
            <option value="">All categories</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        <button class="action-btn" @click="resetFilters">
          <i class="fas fa-sync-alt"></i>
          Reset
        </button>
        <button class="action-btn primary" @click="showAddModal = true">
          <i class="fas fa-plus"></i>
          New Supplier
        </button>
      </div>
    </div>

    <!-- Table view -->
    <div class="table-container">
      <table class="suppliers-table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>CONTACT</th>
            <th>Category</th>
            <th>Last Order</th>
            <th>Location</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="supplier in paginatedSuppliers" :key="supplier._id">
            <tr>
              <td>
                <button class="expand-btn" @click="toggleProducts(supplier._id)">
                  <i :class="expandedSuppliers.includes(supplier._id) ? 'fas fa-minus' : 'fas fa-plus'"></i>
                </button>
              </td>
              <td>
                <div class="supplier-info">
                  <div class="supplier-avatar">
                    <img 
                      :src="getAvatar(supplier.name)" 
                      :alt="supplier.name"
                    >
                  </div>
                  <div class="supplier-details">
                    <span class="supplier-name">{{ supplier.name }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="contact-info">
                  <span class="contact-primary">{{ supplier.contact }}</span>
                </div>
              </td>
              <td>
                <span class="category-tag" :class="supplier.category.toLowerCase()">
                  {{ supplier.category }}
                </span>
              </td>
              <td>
                <div class="last-order">
                  <i class="fas fa-calendar-alt"></i>
                  {{ formatDate(supplier.lastOrder) }}
                </div>
              </td>
              <td>
                <div class="location-info">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>{{ supplier.location }}</span>
                </div>
              </td>
              <td>
                <div class="actions">
                  <button class="action-icon edit" @click="handleEditSupplier(supplier)" title="Edit">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="action-icon delete" @click="deleteSupplier(supplier._id)" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
            <!-- Products row -->
            <tr v-if="expandedSuppliers.includes(supplier._id)" class="products-row">
              <td colspan="7">
                <div class="products-container">
                  <div class="products-header">
                    <h4>Products</h4>
                    <button class="add-product-btn" @click="showAddProductModal(supplier)">
                      <i class="fas fa-plus"></i> Add Product
                    </button>
                  </div>
                  <div v-if="supplier.products && supplier.products.length > 0" class="products-list">
                    <div v-for="(product, index) in supplier.products" :key="index" class="product-item">
                      <div class="product-info">
                        <div class="product-name">Product: {{ product.name }}</div>
                        <div class="product-quantity">Quantity: {{ product.quantity }}</div>
                      </div>
                      <div class="product-actions">
                        <button class="action-icon edit" @click="showEditProductModal(supplier, index)" title="Edit">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon delete" @click="deleteProduct(supplier._id, product.name)" title="Delete">
                          <i class="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div v-else class="no-products">
                    No products available for this supplier
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination-container">
      <div class="pagination-info">
        <span class="selected-count">{{ selectedSuppliers.length }}</span> selected of 
        <span class="total-count">{{ filteredSuppliers.length }}</span> suppliers
      </div>
      <div class="pagination-controls">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <i class="fas fa-chevron-left"></i>
          Previous
        </button>
        <span class="page-info">
          Page <strong>{{ currentPage }}</strong> of <strong>{{ totalPages }}</strong>
        </span>
        <button 
          class="pagination-btn" 
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          Next
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="items-per-page">
        <select v-model="itemsPerPage" class="items-select">
          <option :value="5">5 per page</option>
          <option :value="10">10 per page</option>
          <option :value="20">20 per page</option>
          <option :value="50">50 per page</option>
        </select>
      </div>
    </div>

    <!-- Add Supplier Modal -->
    <transition name="modal">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">
              <i class="fas fa-plus-circle"></i>
              <h2>Add New Supplier</h2>
            </div>
            <button @click="showAddModal = false" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleAddSupplier" class="add-supplier-form">
              <div class="form-group">
                <label>
                  <i class="fas fa-building"></i>
                  Supplier Name*
                </label>
                <input 
                  v-model="newSupplier.name" 
                  
                  placeholder="Enter supplier name"
                  class="form-input"
                  pattern="[A-Za-zÀ-ÿ\s]+"
                  title="Name must contain only letters and spaces"
                  @input="validateField('name')"
                >
                <span v-if="formErrors.name" class="error-message">{{ formErrors.name }}</span>
              </div>
              <div class="form-group">
                <label>
                  <i class="fas fa-phone-alt"></i>
                  Contact*
                </label>
                <input 
                  v-model="newSupplier.contact" 
                  required
                  placeholder="8-digit phone number"
                  class="form-input"
                  pattern="[0-9]{8}"
                  title="Contact must be exactly 8 digits"
                  @input="validateField('contact')"
                >
                <span v-if="formErrors.contact" class="error-message">{{ formErrors.contact }}</span>
              </div>
              <div class="form-group">
                <label>
                  <i class="fas fa-tags"></i>
                  Category*
                </label>
                <select 
                  v-model="newSupplier.category" 
                  required
                  class="form-select"
                  @change="validateField('category')"
                >
                  <option value="electronics">electronics</option>
                  <option value="clothing">clothing</option>
                  <option value="food">food</option>
                  <option value="furniture">furniture</option>
                  <option value="health">health</option>
                  <option value="beauty">beauty</option>
                  <option value="sports">sports</option>
                  <option value="automotive">automotive</option>
                  <option value="home">home</option>
                  <option value="books">books</option>
                </select>
                <span v-if="formErrors.category" class="error-message">{{ formErrors.category }}</span>
              </div>
              <div class="form-group">
                <label>
                  <i class="fas fa-map-marker-alt"></i>
                  Location*
                </label>
                <input 
                  v-model="newSupplier.location" 
                  required
                  placeholder="Full address"
                  class="form-input"
                  @input="validateField('location')"
                >
                <span v-if="formErrors.location" class="error-message">{{ formErrors.location }}</span>
              </div>
              
              <div class="form-actions">
                <button type="button" @click="showAddModal = false" class="btn-cancel">
                  <i class="fas fa-times"></i>
                  Cancel
                </button>
                <button type="submit" :disabled="isSubmitting || hasFormErrors" class="btn-submit">
                  <i class="fas fa-save"></i>
                  {{ isSubmitting ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>

    <!-- Add/Edit Product Modal -->
    <transition name="modal">
      <div v-if="showProductModal" class="modal-overlay" @click.self="showProductModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">
              <i class="fas fa-box-open"></i>
              <h2>{{ isEditingProduct ? 'Edit Product' : 'Add Product' }}</h2>
            </div>
            <button @click="showProductModal = false" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleProductSubmit" class="add-product-form">
              <div class="form-group">
                <label>
                  <i class="fas fa-tag"></i>
                  Product*
                </label>
                <select 
                  v-model="selectedProductId" 
                  required
                  class="form-select"
                  :disabled="isEditingProduct"
                  @change="onProductSelect"
                >
                  <option value="" disabled selected>Select a product</option>
                  <option 
                    v-for="product in availableProducts" 
                    :key="product._id" 
                    :value="product._id"
                  >
                    {{ product.name }} 
                  </option>
                </select>
                <span v-if="formErrors.productName" class="error-message">{{ formErrors.productName }}</span>
              </div>
              <div class="form-group">
                <label>
                  <i class="fas fa-cubes"></i>
                  Quantity*
                </label>
                <input 
                  type="number" 
                  v-model.number="currentProduct.quantity" 
                  required
                  min="1"
                  placeholder="Enter quantity"
                  class="form-input"
                  @input="validateProductField('quantity')"
                >
                <span v-if="formErrors.quantity" class="error-message">{{ formErrors.quantity }}</span>
              </div>
              <div class="form-actions">
                <button type="button" @click="showProductModal = false" class="btn-cancel">
                  <i class="fas fa-times"></i>
                  Cancel
                </button>
                <button type="submit" :disabled="isSubmitting || hasFormErrors" class="btn-submit">
                  <i class="fas fa-save"></i>
                  {{ isSubmitting ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'

interface Product {
  _id: string
  name: string
  quantity: number
}

interface Supplier {
  _id: string
  companyId: string
  name: string
  contact: string
  category: string
  lastOrder: string | Date | null
  location: string
  products: Product[]
}

interface NewSupplier {
  name: string
  contact: string
  category: string
  location: string
  lastOrder?: string
}

const router = useRouter()
const suppliers = ref<Supplier[]>([])
const filteredSuppliers = ref<Supplier[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchTerm = ref('')
const selectedCategory = ref('')
const selectedSuppliers = ref<string[]>([])
const selectAll = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showAddModal = ref(false)
const isSubmitting = ref(false)
const newSupplier = ref<NewSupplier>({
  name: '',
  contact: '',
  category: 'electronics',
  location: '',
  lastOrder: ''
})

// Product management
const expandedSuppliers = ref<string[]>([])
const showProductModal = ref(false)
const isEditingProduct = ref(false)
const selectedProductId = ref('')
const currentSupplierId = ref<string>('')
const currentProductIndex = ref<number>(-1)
const availableProducts = ref<Product[]>([])
const currentProduct = ref({
  _id: '',
  name: '',
  quantity: 1
})

// Form validation
const formErrors = ref<Record<string, string>>({})
const hasFormErrors = computed(() => Object.values(formErrors.value).some(err => !!err))

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
})

// Validation functions
const validateSupplier = (supplier: NewSupplier) => {
  const errors: string[] = []

  if (!supplier.name.trim()) {
    errors.push('Supplier name is required')
  } else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(supplier.name.trim())) {
    errors.push('Name must contain only letters and spaces')
  }

  if (!supplier.contact.trim()) {
    errors.push('Contact is required')
  } else if (!/^[0-9]{8}$/.test(supplier.contact.trim())) {
    errors.push('Contact must be exactly 8 digits')
  }

  if (!supplier.location.trim()) {
    errors.push('Location is required')
  }

  if (!supplier.category) {
    errors.push('Category is required')
  }

  if (supplier.lastOrder) {
    const lastOrderDate = new Date(supplier.lastOrder)
    const today = new Date()
    if (lastOrderDate > today) {
      errors.push('Last order date cannot be in the future')
    }
  }

  return errors
}

const validateProduct = (product: { name: string; quantity: number }) => {
  const errors: string[] = []

  if (!product.name.trim()) {
    errors.push('Product name is required')
  }

  if (!product.quantity || product.quantity < 1) {
    errors.push('Quantity must be at least 1')
  }

  return errors
}

const validateField = (field: keyof NewSupplier) => {
  const errors = validateSupplier({
    ...newSupplier.value,
    [field]: newSupplier.value[field]
  })
  formErrors.value[field] = errors.find(err => err.toLowerCase().includes(field)) || ''
}

const validateProductField = (field: 'name' | 'quantity') => {
  const errors = validateProduct({
    name: currentProduct.value.name,
    quantity: currentProduct.value.quantity
  })
  formErrors.value[field === 'name' ? 'productName' : field] = errors.find(err => err.toLowerCase().includes(field)) || ''
}

// Get icon for category
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    electronics: 'fas fa-microchip',
    clothing: 'fas fa-tshirt',
    food: 'fas fa-utensils',
    furniture: 'fas fa-couch',
    health: 'fas fa-heartbeat',
    beauty: 'fas fa-spa',
    sports: 'fas fa-futbol',
    automotive: 'fas fa-car',
    home: 'fas fa-home',
    books: 'fas fa-book'
  }
  return icons[category.toLowerCase()] || 'fas fa-box'
}

// Get unique categories
const categories = computed(() => {
  return [...new Set(suppliers.value.map(s => s.category))]
})

// Paginated suppliers
const paginatedSuppliers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredSuppliers.value.slice(start, end)
})

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredSuppliers.value.length / itemsPerPage.value)
})

// Apply filters
const applyFilters = () => {
  filteredSuppliers.value = suppliers.value.filter(supplier => {
    const matchesSearch = searchTerm.value === '' || 
      supplier.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      supplier.category.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      supplier.location.toLowerCase().includes(searchTerm.value.toLowerCase())
    
    const matchesCategory = selectedCategory.value === '' || 
      supplier.category.toLowerCase() === selectedCategory.value.toLowerCase()
    
    return matchesSearch && matchesCategory
  })
  
  currentPage.value = 1
}

// Reset filters
const resetFilters = () => {
  searchTerm.value = ''
  selectedCategory.value = ''
  applyFilters()
}

// Toggle select all
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedSuppliers.value = paginatedSuppliers.value.map(s => s._id)
  } else {
    selectedSuppliers.value = []
  }
}

// Format date
const formatDate = (dateString: string | Date | null) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US')
}

// Generate avatar from initials
const getAvatar = (name: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33F3']
  const color = colors[initials.charCodeAt(0) % colors.length]
  
  return `https://ui-avatars.com/api/?name=${initials}&background=${color.substring(1)}&color=fff&size=128`
}

// Load data
const loadData = async () => {
  try {
    loading.value = true
    error.value = null

    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    // Charger les données en parallèle
    const [companyResponse, suppliersResponse, productsResponse] = await Promise.all([
      api.get('/users/meCompany'),
      api.get('/fournisseur/getFourniseurs'),
      api.get('/products/get')
    ])

    const companyId = companyResponse.data.companyId
    if (!companyId) throw new Error('Company not found')

    suppliers.value = suppliersResponse.data.data.filter((s: Supplier) => s.companyId === companyId) || []
    filteredSuppliers.value = [...suppliers.value]
    availableProducts.value = productsResponse.data || []

  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load data'
    console.error('Load data error:', err)
  } finally {
    loading.value = false
  }
}

// When product is selected from dropdown
const onProductSelect = () => {
  const selectedProduct = availableProducts.value.find(p => p._id === selectedProductId.value)
  if (selectedProduct) {
    currentProduct.value = {
      ...currentProduct.value,
      _id: selectedProduct._id,
      name: selectedProduct.name
    }
    validateProductField('name')
  }
}

// Geocode location
// Dans <script setup>, remplacer getCoordinatesFromLocation
const getCoordinatesFromLocation = async (location: string): Promise<[number, number] | null> => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&accept-language=en`,
      {
        timeout: 5000
      }
    )

    if (response.data?.length > 0) {
      const { lon, lat } = response.data[0]
      return [parseFloat(lon), parseFloat(lat)]
    }
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}
// Add supplier
// Dans <script setup>, remplacer la fonction handleAddSupplier
// Dans <script setup>, remplacer handleAddSupplier
const handleAddSupplier = async () => {
  try {
    isSubmitting.value = true

    // Validation côté client
    const errors = validateSupplier(newSupplier.value)
    if (errors.length > 0) {
      throw new Error(errors.join(', '))
    }

    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    // Récupérer l'ID de l'entreprise
    const companyResponse = await api.get('/users/meCompany')
    const companyId = companyResponse.data.companyId
    if (!companyId) throw new Error('Company not found')

    // Geocoding avec fallback
    let coordinates: [number, number] = [0, 0]
    try {
      const result = await getCoordinatesFromLocation(newSupplier.value.location)
      coordinates = result || [0, 0]
    } catch (geocodeError) {
      console.warn('Geocoding failed, using default coordinates:', geocodeError)
    }

    const payload = {
      name: newSupplier.value.name.trim(),
      contact: newSupplier.value.contact.trim(),
      category: newSupplier.value.category,
      location: newSupplier.value.location.trim(),
      companyId: companyId.toString(), // Assurer que companyId est une chaîne
      position: {
        type: 'Point',
        coordinates
      },
       }

    // Journaliser le payload
    console.log('Payload envoyé à /fournisseur/addFournisseur:', JSON.stringify(payload, null, 2))

    const response = await api.post('/fournisseur/addFournisseur', payload)

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add supplier')
    }

    // Réinitialisation et feedback
    showAddModal.value = false
    newSupplier.value = {
      name: '',
      contact: '',
      category: 'electronics',
      location: '',
      lastOrder: ''
    }
    formErrors.value = {}
    await Swal.fire({
      title: 'Success',
      text: 'Supplier added successfully',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })
    await loadData()

  } catch (err: any) {
    console.error('Add supplier error:', err)
    const errorMessage =
      err.response?.data?.message ||
      err.message ||
      'Failed to add supplier'

    // Journaliser les détails complets de l'erreur serveur
    if (err.response) {
      console.error('Détails de l\'erreur serveur:', {
        status: err.response.status,
        message: err.response.data.message,
        errors: err.response.data.errors, // Si l'API renvoie des erreurs spécifiques
        data: err.response.data
      })
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken')
      router.push('/login')
      return
    }

    await Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error',
      confirmButtonText: 'OK'
    })
  } finally {
    isSubmitting.value = false
  }
}
// Edit supplier
const handleEditSupplier = async (supplier: Supplier) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Authentication required');

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Format date for date input
    const formattedDate = supplier.lastOrder
      ? new Date(supplier.lastOrder).toISOString().split('T')[0]
      : '';

    const { value: formValues } = await Swal.fire({
      title: 'Edit Supplier',
      html:
        `<input id="name" class="swal2-input" placeholder="Name" value="${supplier.name}" pattern="[A-Za-zÀ-ÿ\s]+" title="Name must contain only letters and spaces">` +
        `<input id="contact" class="swal2-input" placeholder="8-digit phone number" value="${supplier.contact}" pattern="[0-9]{8}" title="Contact must be exactly 8 digits">` +
        `<select id="category" class="swal2-input">
          <option value="electronics" ${supplier.category.toLowerCase() === 'electronics' ? 'selected' : ''}>electronics</option>
          <option value="clothing" ${supplier.category.toLowerCase() === 'clothing' ? 'selected' : ''}>clothing</option>
          <option value="food" ${supplier.category.toLowerCase() === 'food' ? 'selected' : ''}>food</option>
          <option value="furniture" ${supplier.category.toLowerCase() === 'furniture' ? 'selected' : ''}>furniture</option>
          <option value="health" ${supplier.category.toLowerCase() === 'health' ? 'selected' : ''}>health</option>
          <option value="beauty" ${supplier.category.toLowerCase() === 'beauty' ? 'selected' : ''}>beauty</option>
          <option value="sports" ${supplier.category.toLowerCase() === 'sports' ? 'selected' : ''}>sports</option>
          <option value="automotive" ${supplier.category.toLowerCase() === 'automotive' ? 'selected' : ''}>automotive</option>
          <option value="home" ${supplier.category.toLowerCase() === 'home' ? 'selected' : ''}>home</option>
          <option value="books" ${supplier.category.toLowerCase() === 'books' ? 'selected' : ''}>books</option>
        </select>` +
        `<input id="location" class="swal2-input" placeholder="Location" value="${supplier.location}">` +
        `<input type="date" id="lastOrder" class="swal2-input" placeholder="Last order date" value="${formattedDate}" max="${new Date().toISOString().split('T')[0]}" title="Last order date cannot be after today">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        return {
          name: (document.getElementById('name') as HTMLInputElement).value,
          contact: (document.getElementById('contact') as HTMLInputElement).value,
          category: (document.getElementById('category') as HTMLSelectElement).value,
          location: (document.getElementById('location') as HTMLInputElement).value,
          lastOrder: (document.getElementById('lastOrder') as HTMLInputElement).value,
        };
      },
    });

    if (formValues) {
      // Validation
      const errors = validateSupplier(formValues);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // Geocoding
      let coordinates: [number, number] = [0, 0];
      try {
        const result = await getCoordinatesFromLocation(formValues.location);
        coordinates = result || [0, 0];
      } catch (geocodeError) {
        console.warn('Geocoding failed, using default coordinates:', geocodeError);
      }

      const updateData = {
        name: formValues.name.trim(),
        contact: formValues.contact.trim(),
        category: formValues.category,
        location: formValues.location.trim(),
        lastOrder: formValues.lastOrder ? new Date(formValues.lastOrder).toISOString() : null,
      };

      // Log the payload for debugging
      console.log('Payload sent to /fournisseur/updateFournisseur/{supplierId}:', JSON.stringify(updateData, null, 2));

      const response = await api.put(`/fournisseur/updateFournisseur/${supplier._id}`, updateData);

      if (response.data.success) {
        await Swal.fire({
          title: 'Success',
          text: 'Supplier updated successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        await loadData();
      }
    }
  } catch (err: any) {
    console.error('Update error:', err);
    const errorMessage = err.response?.data?.message || err.message || 'Failed to update supplier';

    // Log detailed server error
    if (err.response) {
      console.error('Server error details:', {
        status: err.response.status,
        message: err.response.data.message,
        errors: err.response.data.errors,
        data: err.response.data,
      });
    }

    await Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error',
    });
  }
};
// Delete supplier
const deleteSupplier = async (id: string) => {
  try {
    const confirm1 = await Swal.fire({
      title: 'Confirm deletion',
      text: "This action will permanently delete the supplier.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'I understand',
      cancelButtonText: 'Cancel'
    })

    if (!confirm1.isConfirmed) return

    const confirm2 = await Swal.fire({
      title: 'Last chance',
      text: "All associated data will be lost. Confirm deletion?",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete permanently',
      cancelButtonText: 'No, cancel'
    })

    if (!confirm2.isConfirmed) return

    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    const response = await api.delete(`/fournisseur/deletFournisseur/${id}`)
    
    if (response.data.success) {
      await Swal.fire({
        title: 'Deleted',
        text: 'Supplier has been deleted successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
      await loadData()
    }
  } catch (err: any) {
    console.error('Delete error:', err)
    await Swal.fire({
      title: 'Error',
      text: err.response?.data?.message || err.message || 'Failed to delete supplier',
      icon: 'error'
    })
  }
}

// Product management functions
const toggleProducts = (supplierId: string) => {
  const index = expandedSuppliers.value.indexOf(supplierId)
  if (index === -1) {
    expandedSuppliers.value.push(supplierId)
  } else {
    expandedSuppliers.value.splice(index, 1)
  }
}

const showAddProductModal = (supplier: Supplier) => {
  currentSupplierId.value = supplier._id
  currentProduct.value = {
    _id: '',
    name: '',
    quantity: 1
  }
  selectedProductId.value = ''
  isEditingProduct.value = false
  formErrors.value = {}
  showProductModal.value = true
}

const showEditProductModal = (supplier: Supplier, productIndex: number) => {
  currentSupplierId.value = supplier._id
  currentProductIndex.value = productIndex
  currentProduct.value = { ...supplier.products[productIndex] }
  selectedProductId.value = supplier.products[productIndex]._id
  isEditingProduct.value = true
  formErrors.value = {}
  showProductModal.value = true
}

const handleAddProduct = async () => {
  try {
    isSubmitting.value = true;

    // Validation
    const product = {
      name: currentProduct.value.name,
      quantity: currentProduct.value.quantity,
    };
    const errors = validateProduct(product);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // Check if product already exists for this supplier
    const supplier = suppliers.value.find((s) => s._id === currentSupplierId.value);
    if (supplier?.products.some((p) => p.name === product.name)) {
      throw new Error('Product already exists for this supplier');
    }

    // Find the selected product to get the name
    const selectedProduct = availableProducts.value.find((p) => p._id === selectedProductId.value);
    if (!selectedProduct) {
      throw new Error('Selected product not found');
    }

    const payload = {
      name: selectedProduct.name, // Product name
      quantity: product.quantity, // Quantity
    };

    // Log the payload for debugging
    console.log('Payload sent to /fournisseur/{supplierId}/products:', JSON.stringify(payload, null, 2));

    const response = await api.post(`/fournisseur/${currentSupplierId.value}/products`, payload);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add product');
    }

    await Swal.fire({
      title: 'Success',
      text: 'Product added successfully',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });
    showProductModal.value = false;
    formErrors.value = {};
    await loadData();
  } catch (err: any) {
    console.error('Add product error:', err);
    const errorMessage = err.response?.data?.message || err.message || 'Failed to add product';

    // Log detailed server error
    if (err.response) {
      console.error('Server error details:', {
        status: err.response.status,
        message: err.response.data.message,
        errors: err.response.data.errors,
        data: err.response.data,
      });
    }

    await Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error',
    });
  } finally {
    isSubmitting.value = false;
  }
};
const handleUpdateProduct = async () => {
  try {
    isSubmitting.value = true;

    // Validation
    const product = {
      name: currentProduct.value.name,
      quantity: currentProduct.value.quantity,
    };
    const errors = validateProduct(product);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const payload = {
      name: product.name,
      quantity: product.quantity,
    };

    // Log the payload for debugging
    console.log('Payload sent to /fournisseur/{supplierId}/products/{productName}:', JSON.stringify(payload, null, 2));

    const response = await api.put(
      `/fournisseur/${currentSupplierId.value}/products/${encodeURIComponent(currentProduct.value.name)}`,
      payload
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update product');
    }

    await Swal.fire({
      title: 'Success',
      text: 'Product updated successfully',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });
    showProductModal.value = false;
    formErrors.value = {};
    await loadData();
  } catch (err: any) {
    console.error('Update product error:', err);
    const errorMessage = err.response?.data?.message || err.message || 'Failed to update product';

    // Log detailed server error
    if (err.response) {
      console.error('Server error details:', {
        status: err.response.status,
        message: err.response.data.message,
        errors: err.response.data.errors,
        data: err.response.data,
      });
    }

    await Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error',
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleProductSubmit = () => {
  return isEditingProduct.value ? handleUpdateProduct() : handleAddProduct()
}

const deleteProduct = async (supplierId: string, productName: string) => {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (!result.isConfirmed) return

    const response = await api.delete(
      `/fournisseur/${supplierId}/products/${encodeURIComponent(productName)}`
    )

    if (response.data.success) {
      await Swal.fire({
        title: 'Deleted',
        text: 'Product has been removed from supplier.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
      await loadData()
    }
  } catch (err: any) {
    console.error('Delete product error:', err)
    await Swal.fire({
      title: 'Error',
      text: err.response?.data?.message || err.message || 'Failed to delete product',
      icon: 'error'
    })
  }
}

// Watchers
watch(itemsPerPage, () => {
  currentPage.value = 1
})

watch(selectedSuppliers, (newVal) => {
  selectAll.value = newVal.length === paginatedSuppliers.value.length && newVal.length > 0
})

// Initialization
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.suppliers-container {
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
}

.stats-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon.total { background-color: #e0f2fe; color: #0284c7; }
.stat-icon.electronics { background-color: #e0e7ff; color: #4f46e5; }
.stat-icon.clothing { background-color: #fef3c7; color: #d97706; }
.stat-icon.food { background-color: #dcfce7; color: #16a34a; }
.stat-icon.furniture { background-color: #fee2e2; color: #dc2626; }
.stat-icon.health { background-color: #e0f2fe; color: #0284c7; }
.stat-icon.beauty { background-color: #f3e8ff; color: #9333ea; }
.stat-icon.sports { background-color: #ffedd5; color: #f97316; }
.stat-icon.automotive { background-color: #d1d5db; color: #374151; }
.stat-icon.home { background-color: #e0e7ff; color: #4f46e5; }
.stat-icon.books { background-color: #dcfce7; color: #16a34a; }

.stat-content {
  flex: 1;
}

.stat-content h3 {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0 0 0.5rem 0;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.875rem;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.clear-search {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select, .form-select {
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: #1e293b;
  background-color: white;
  cursor: pointer;
  min-width: 180px;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
  background-color: white;
}

.action-btn.primary {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.action-btn.primary:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.action-btn:hover {
  background-color: #f1f5f9;
}

.table-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 2rem;
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

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: 0.5rem;
  transition: all 0.2s;
}

.expand-btn:hover {
  color: #3b82f6;
}

.products-row {
  background-color: #f8fafc;
}

.products-container {
  padding: 1rem;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.products-header h4 {
  margin: 0;
  color: #334155;
}

.add-product-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
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

.products-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.5rem;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.product-quantity {
  font-size: 0.875rem;
  color: #64748b;
}

.product-actions {
  display: flex;
  gap: 0.5rem;
}

.no-products {
  color: #64748b;
  text-align: center;
  padding: 1rem;
}

.supplier-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.supplier-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  overflow: hidden;
}

.supplier-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.supplier-details {
  display: flex;
  flex-direction: column;
}

.supplier-name {
  font-weight: 500;
  color: #0f172a;
}

.category-tag {
  padding: 0.375rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.category-tag.electronics { background-color: #e0e7ff; color: #4f46e5; }
.category-tag.clothing { background-color: #fef3c7; color: #d97706; }
.category-tag.food { background-color: #dcfce7; color: #16a34a; }
.category-tag.furniture { background-color: #fee2e2; color: #dc2626; }
.category-tag.health { background-color: #e0f2fe; color: #0284c7; }
.category-tag.beauty { background-color: #f3e8ff; color: #9333ea; }
.category-tag.sports { background-color: #ffedd5; color: #f97316; }
.category-tag.automotive { background-color: #d1d5db; color: #374151; }
.category-tag.home { background-color: #e0e7ff; color: #4f46e5; }
.category-tag.books { background-color: #dcfce7; color: #16a34a; }

.last-order {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.action-icon.edit { background-color: #e0f2fe; color: #0284c7; }
.action-icon.delete { background-color: #fee2e2; color: #dc2626; }

.action-icon:hover {
  transform: scale(1.1);
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  color: #64748b;
  font-size: 0.875rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: white;
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
}

.pagination-btn:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.page-info {
  color: #64748b;
  font-size: 0.875rem;
}

.items-per-page {
  display: flex;
  align-items: center;
}

.items-select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1e293b;
  background-color: white;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #0f172a;
}

.modal-title h2 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
}

.modal-body {
  padding: 1.5rem;
}

.add-supplier-form, .add-product-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 500;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1e293b;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #3b82f6;
  outline: none;
}

.form-input:invalid {
  border-color: #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background-color: #f1f5f9;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-submit:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
```