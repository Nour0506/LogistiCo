<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

// State
const products = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const showModal = ref(false);
const editingProduct = ref(false);

const productForm = ref({
  _id: '',
  name: '',
  category: '',
  storage_type: ''
});

const categories = [
  'electronics',
  'clothing',
  'food',
  'furniture',
  'health',
  'beauty',
  'sports',
  'automotive',
  'home',
  'books'
];

const storageTypes = [
  { value: 'ambient', label: 'Ambient Temperature', icon: 'fa-temperature-low' },
  { value: 'refrigerated', label: 'Refrigerated (4°C)', icon: 'fa-snowflake' },
  { value: 'frozen', label: 'Frozen (-18°C)', icon: 'fa-ice-cream' },
  { value: 'controlled', label: 'Controlled Environment', icon: 'fa-sliders-h' }
];

// Category icons mapping
const categoryIcons = {
  electronics: 'fa-microchip',
  clothing: 'fa-tshirt',
  food: 'fa-utensils',
  furniture: 'fa-couch',
  health: 'fa-heartbeat',
  beauty: 'fa-spa',
  sports: 'fa-running',
  automotive: 'fa-car',
  home: 'fa-home',
  books: 'fa-book'
};

// Methods
const fetchProducts = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get('/products/get');
    products.value = response.data.data || response.data;
  } catch (err) {
    error.value = handleApiError(err, 'fetch products');
  } finally {
    loading.value = false;
  }
};

const handleApiError = (error: any, context: string): string => {
  if (error.response) {
    switch (error.response.status) {
      case 401: return 'Authentication required';
      case 403: return 'You are not authorized';
      case 404: return `${context} not found`;
      case 422: return error.response.data.message || 'Validation error';
      default: return `Error ${error.response.status}: ${error.response.data.message || 'Unknown error'}`;
    }
  }
  return `Network error: ${context} failed`;
};

const openCreateModal = () => {
  productForm.value = {
    _id: '',
    name: '',
    category: '',
    storage_type: 'ambient'
  };
  editingProduct.value = false;
  showModal.value = true;
};

const openEditModal = (product: any) => {
  productForm.value = { ...product };
  editingProduct.value = true;
  showModal.value = true;
};

const saveProduct = async () => {
  try {
    // Validate all required fields
    if (!productForm.value.name || !productForm.value.category || !productForm.value.storage_type) {
      error.value = 'All fields are required';
      return;
    }

    const payload = {
      name: productForm.value.name,
      category: productForm.value.category,
      storage_type: productForm.value.storage_type
    };

    if (editingProduct.value) {
      await api.put(`/products/${productForm.value._id}`, payload);
    } else {
      await api.post('/products/add', payload);
    }

    showModal.value = false;
    await fetchProducts();
  } catch (err) {
    error.value = handleApiError(err, 'save product');
    if (err instanceof Error) {
      console.error('API Error:', (err as any).response?.data || err.message);
    } else {
      console.error('API Error:', err);
    }
  }
};

const deleteProduct = async (id: string) => {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
  
  try {
    await api.delete(`/products/${id}`);
    await fetchProducts();
  } catch (err) {
    error.value = handleApiError(err, 'delete product');
  }
};

// Lifecycle
onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <div class="products-management">
    <div class="header">
      <h1>Product Management</h1>
      <button @click="openCreateModal" class="btn btn-primary">
        <i class="fas fa-plus"></i> Add Product
      </button>
    </div>

    <div v-if="error" class="alert error">
      <i class="fas fa-exclamation-circle"></i> {{ error }}
      <button @click="error = null" class="close-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i> Loading products...
    </div>

    <div v-else-if="products.length === 0" class="empty-state">
      <i class="fas fa-box-open"></i>
      <p>No products found</p>
      <button @click="openCreateModal" class="btn btn-primary">
        <i class="fas fa-plus"></i> Create First Product
      </button>
    </div>

    <div v-else class="products-grid">
      <div v-for="product in products" :key="product._id" class="product-card">
        <div class="product-icon" :class="'category-' + product.category">
          <i :class="['fas', categoryIcons[product.category as keyof typeof categoryIcons] || 'fa-box']"></i>
        </div>
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <div class="meta">
            <span class="category">
              <i class="fas fa-tag"></i> {{ product.category }}
            </span>
            <span class="storage-type">
              <i :class="['fas', storageTypes.find(t => t.value === product.storage_type)?.icon || 'fa-warehouse']"></i>
              {{ storageTypes.find(t => t.value === product.storage_type)?.label || product.storage_type }}
            </span>
          </div>
        </div>
        <div class="product-actions">
          <button @click="openEditModal(product)" class="btn btn-sm btn-edit">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button @click="deleteProduct(product._id)" class="btn btn-sm btn-danger">
            <i class="fas fa-trash-alt"></i> Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Product Form Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            <i :class="['fas', editingProduct ? 'fa-edit' : 'fa-plus-circle']"></i>
            {{ editingProduct ? 'Edit Product' : 'Create Product' }}
          </h2>
          <button @click="showModal = false" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveProduct">
            <div class="form-group">
              <label><i class="fas fa-tag"></i> Product Name *</label>
              <input v-model="productForm.name" type="text" required placeholder="Enter product name">
            </div>
            
            <div class="form-group">
              <label><i class="fas fa-list-alt"></i> Category *</label>
              <select v-model="productForm.category" required>
                <option value="">Select a category</option>
                <option v-for="cat in categories" :key="cat" :value="cat">
                  {{ cat.charAt(0).toUpperCase() + cat.slice(1) }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label><i class="fas fa-warehouse"></i> Storage Type *</label>
              <select v-model="productForm.storage_type" required>
                <option v-for="type in storageTypes" 
                        :key="type.value" 
                        :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="showModal = false" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                {{ editingProduct ? 'Update Product' : 'Create Product' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.products-management {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h1 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.alert {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.alert.error {
  background-color: #fee2e2;
  color: #b91c1c;
}

.close-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-state i {
  font-size: 2rem;
  color: #3b82f6;
}

.empty-state i {
  font-size: 3rem;
  color: #cbd5e1;
}

.empty-state p {
  margin: 0;
  font-size: 1.1rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.product-icon {
  padding: 1.5rem;
  text-align: center;
  font-size: 2.5rem;
  color: white;
}

.product-info {
  padding: 1.25rem;
  flex: 1;
}

.product-info h3 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  color: #1e293b;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #64748b;
}

.meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.product-actions {
  padding: 1rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  gap: 0.75rem;
}

/* Category-specific colors */
.product-icon.category-electronics { background-color: #3b82f6; }
.product-icon.category-clothing { background-color: #ec4899; }
.product-icon.category-food { background-color: #f59e0b; }
.product-icon.category-furniture { background-color: #8b5cf6; }
.product-icon.category-health { background-color: #ef4444; }
.product-icon.category-beauty { background-color: #10b981; }
.product-icon.category-sports { background-color: #6366f1; }
.product-icon.category-automotive { background-color: #64748b; }
.product-icon.category-home { background-color: #f97316; }
.product-icon.category-books { background-color: #14b8a6; }

/* Modal Styles */
.modal-overlay {
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
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
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1em;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
}

/* Button Styles */
.btn {
  padding: 0.65rem 1.25rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 0.95rem;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background-color: #f9fafb;
}

.btn-edit {
  background-color: white;
  color: #3b82f6;
  border-color: #dbeafe;
}

.btn-edit:hover {
  background-color: #eff6ff;
}

.btn-danger {
  background-color: white;
  color: #ef4444;
  border-color: #fee2e2;
}

.btn-danger:hover {
  background-color: #fef2f2;
}

.btn-sm {
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .product-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .products-management {
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>