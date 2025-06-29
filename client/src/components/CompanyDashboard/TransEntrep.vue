```vue
<template>
  <div class="transporter-container">
    <!-- Statistics Header -->
    <div class="stats-header">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-truck"></i>
        </div>
        <div class="stat-content">
          <h3>Transporters</h3>
          <div class="stat-value">{{ filteredTransporters.length }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <h3>Available</h3>
          <div class="stat-value">{{ availableTransportersCount }}</div>
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
          @input="resetFilters"
        />
      </div>
      <button class="add-transporter-btn" @click="openAddModal">
        <i class="fas fa-plus"></i>
        Add Transporter
      </button>
    </div>
    
    <!-- Filters -->
    <div class="status-filter">
      <label>Filter by status:</label>
      <select v-model="statusFilter" class="filter-select" @change="resetSearch">
        <option value="">All</option>
        <option value="Available">Available</option>
        <option value="On mission">On mission</option>
        <option value="On leave">On leave</option>
      </select>
      
      <label class="type-filter">Filter by licence:</label>
      <select v-model="licenceFilter" class="filter-select" @change="resetSearch">
        <option value="">All</option>
        <option value="A1">A1</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="B+E">B+E</option>
        <option value="C">C</option>
        <option value="C+E">C+E</option>
        <option value="D">D</option>
        <option value="D1">D1</option>
        <option value="D+E">D+E</option>
        <option value="H">H</option>
      </select>
    </div>

    <!-- Transporters Grid -->
    <div class="transporter-grid">
      <div 
        v-for="transporter in filteredTransporters" 
        :key="transporter._id" 
        class="transporter-card"
        :class="transporter.status.toLowerCase().replace(' ', '-')"
      >
        <div class="card-header">
          <div class="transporter-icon">
            <img 
              v-if="transporter.profilePicture" 
              :src="transporter.profilePicture" 
              class="profile-pic" 
              :alt="`${transporter.firstName} ${transporter.lastName}`"
            />
            <div v-else class="initials">
              {{ getInitials(transporter) }}
            </div>
          </div>
          <div class="transporter-info">
            <h3>{{ (transporter.firstName + ' ' + transporter.lastName).trim() || 'No Name' }}</h3>
            <div class="transporter-meta">
              <span class="phone">
                <i class="fas fa-phone"></i>
                {{ transporter.phoneNumber || 'No phone' }}
              </span>
              <span class="cin">
                <i class="fas fa-id-card"></i>
                {{ transporter.CIN || 'No CIN' }}
              </span>
            </div>
          </div>
          <div class="transporter-actions">
            <button class="action-btn edit" @click="editTransporter(transporter)">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" @click="openDeleteModal(transporter)">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>

        <div class="card-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Licence Type</span>
              <span class="info-value">
                <i class="fas fa-car"></i>
                {{ transporter.typeDrivingLicence || 'Not specified' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Status</span>
              <span class="status-badge" :class="transporter.status.toLowerCase().replace(' ', '-')">
                {{ transporter.status || 'Unknown' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Added On</span>
              <span class="info-value">
                <i class="fas fa-calendar-alt"></i>
                {{ formatDate(transporter.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!filteredTransporters.length && !loading" class="empty-state">
        <i class="fas fa-truck"></i>
        <p>No transporters found</p>
        <button class="add-transporter-btn" @click="openAddModal">
          <i class="fas fa-plus"></i>
          Add a Transporter
        </button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showTransporterModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit' : 'Add' }} Transporter</h2>
          <button class="close-btn" @click="closeModals">×</button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label for="profilePicture">Profile Picture</label>
            <input
              type="file"
              id="profilePicture"
              accept="image/*"
              @change="handleFileUpload"
              class="form-input"
            />
            <div v-if="previewImage" class="preview-container">
              <img :src="previewImage" alt="Preview" class="image-preview" />
              <button type="button" @click="removeImage" class="remove-image-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              v-model="transporterForm.firstName"
              pattern="[A-Za-z\u00C0-\u017F\s'-]+"
              title="Only letters, spaces, hyphens, and apostrophes are allowed"
              required
              class="form-input"
            />
            <span class="error-message" v-if="formErrors.firstName">{{ formErrors.firstName }}</span>
          </div>

          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              v-model="transporterForm.lastName"
              pattern="[A-Za-z\u00C0-\u017F\s'-]+"
              title="Only letters, spaces, hyphens, and apostrophes are allowed"
              required
              class="form-input"
            />
            <span class="error-message" v-if="formErrors.lastName">{{ formErrors.lastName }}</span>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              v-model="transporterForm.email"
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
              title="Please enter a valid email address"
              required
              class="form-input"
            />
            <span class="error-message" v-if="formErrors.email">{{ formErrors.email }}</span>
          </div>

          <div class="form-group">
            <label for="password">{{ isEditing ? 'New Password (optional)' : 'Password' }}</label>
            <input
              type="password"
              id="password"
              v-model="transporterForm.password"
              :required="!isEditing"
              class="form-input"
            />
            <span class="error-message" v-if="formErrors.password">{{ formErrors.password }}</span>
          </div>

          <div class="form-group">
            <label for="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              v-model="transporterForm.phoneNumber"
              pattern="[0-9]{8}"
              title="Phone number must be 8 digits"
              required
              class="form-input"
            />
            <span class="error-message" v-if="formErrors.phoneNumber">{{ formErrors.phoneNumber }}</span>
          </div>

          <div class="form-group">
            <label for="CIN">CIN</label>
            <input
              type="text"
              id="CIN"
              v-model="transporterForm.CIN"
              pattern="[0-9]{8}"
              title="CIN must be 8 digits"
              required
              class="form-input"
            />
            <span class="error-message" v-if="formErrors.CIN">{{ formErrors.CIN }}</span>
          </div>
          
          <div class="form-group">
            <label for="typeDrivingLicence">Licence Type</label>
            <select
              id="typeDrivingLicence"
              v-model="transporterForm.typeDrivingLicence"
              required
              class="form-select"
            >
              <option value="">Sélectionnez un type de permis</option>
              <option value="A1">A1</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="B+E">B+E</option>
              <option value="C">C</option>
              <option value="C+E">C+E</option>
              <option value="D">D</option>
              <option value="D1">D1</option>
              <option value="D+E">D+E</option>
              <option value="H">H</option>
            </select>
            <span class="error-message" v-if="formErrors.typeDrivingLicence">{{ formErrors.typeDrivingLicence }}</span>
          </div>
          
          <div class="form-group">
            <label for="status">Status</label>
            <select
              id="status"
              v-model="transporterForm.status"
              required
              class="form-select"
            >
              <option value="Available">Available</option>
              <option value="On mission">On mission</option>
              <option value="On leave">On leave</option>
            </select>
            <span class="error-message" v-if="formErrors.status">{{ formErrors.status }}</span>
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeModals">
              Cancel
            </button>
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              <span v-if="isSubmitting">
                <i class="fas fa-spinner fa-spin"></i> Processing...
              </span>
              <span v-else>
                {{ isEditing ? 'Update' : 'Add' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';

export default {
  name: 'TransporterManagement',
  setup() {
    // State
    const transporters = ref([]);
    const loading = ref(true);
    const searchTerm = ref('');
    const statusFilter = ref('');
    const licenceFilter = ref('');
    const showTransporterModal = ref(false);
    const isSubmitting = ref(false);
    const isEditing = ref(false);
    const currentTransporterId = ref(null);
    const previewImage = ref(null);
    const selectedFile = ref(null);
    const formErrors = ref({});

    const transporterForm = ref({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      CIN: '',
      phoneNumber: '',
      typeDrivingLicence: '',
      profilePicture: null,
      status: 'Available'
    });

    // API Configuration
    const api = axios.create({
      baseURL: 'http://localhost:3000/api/users',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    api.interceptors.request.use(config => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Computed
    const filteredTransporters = computed(() => {
      let filtered = transporters.value;
      const term = searchTerm.value.toLowerCase();
      
      if (term) {
        filtered = filtered.filter(t => {
          const fullName = `${t.firstName || ''} ${t.lastName || ''}`.toLowerCase();
          return (
            fullName.includes(term) ||
            t.phoneNumber?.toLowerCase().includes(term) ||
            t.CIN?.toLowerCase().includes(term)
          );
        });
      }
      
      if (statusFilter.value) {
        filtered = filtered.filter(t => t.status === statusFilter.value);
      }
      
      if (licenceFilter.value) {
        filtered = filtered.filter(t => t.typeDrivingLicence === licenceFilter.value);
      }
      
      return filtered;
    });

    const availableTransportersCount = computed(() => {
      return transporters.value.filter(t => t.status === 'Available').length;
    });

    // Methods
    const formatDate = (dateString) => {
      return dayjs(dateString).format('DD/MM/YYYY');
    };

    const getInitials = (transporter) => {
      const firstName = transporter.firstName || '';
      const lastName = transporter.lastName || '';
      let initials = firstName.charAt(0).toUpperCase();
      if (lastName) {
        initials += lastName.charAt(0).toUpperCase();
      }
      return initials || '';
    };

    const resetSearch = () => {
      searchTerm.value = '';
    };

    const resetFilters = () => {
      statusFilter.value = '';
      licenceFilter.value = '';
    };

    const fetchTransporters = async () => {
      try {
        loading.value = true;
        const response = await api.get('/transporters');
        
        if (response.data.success && response.data.data) {
          transporters.value = response.data.data.map(t => ({
            ...t,
            createdAt: formatDate(t.createdAt),
            status: t.status || 'Unknown'
          }));
        } else {
          throw new Error(response.data.message || 'Failed to load transporters');
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.error || err.message || 'Failed to load transporters',
          confirmButtonColor: '#dc2626'
        });
      } finally {
        loading.value = false;
      }
    };

    const handleSubmit = async () => {
      try {
        isSubmitting.value = true;
        formErrors.value = {};

        // Validation des champs
        const requiredFields = ['firstName', 'lastName', 'email', 'CIN', 'phoneNumber', 'typeDrivingLicence'];
        for (const field of requiredFields) {
          if (!transporterForm.value[field]) {
            formErrors.value[field] = `Le champ ${field} est obligatoire`;
            throw new Error(`Le champ ${field} est obligatoire`);
          }
        }

        // Validation explicite pour firstName et lastName
        const nameRegex = /^[A-Za-z\u00C0-\u017F\s'-]+$/;
        if (!nameRegex.test(transporterForm.value.firstName)) {
          formErrors.value.firstName = 'Le prénom ne doit contenir que des lettres, espaces, tirets ou apostrophes';
          throw new Error('Le prénom ne doit contenir que des lettres, espaces, tirets ou apostrophes');
        }
        if (!nameRegex.test(transporterForm.value.lastName)) {
          formErrors.value.lastName = 'Le nom ne doit contenir que des lettres, espaces, tirets ou apostrophes';
          throw new Error('Le nom ne doit contenir que des lettres, espaces, tirets ou apostrophes');
        }

        // Préparation FormData
        const formData = new FormData();
        formData.append('firstName', transporterForm.value.firstName);
        formData.append('lastName', transporterForm.value.lastName);
        formData.append('email', transporterForm.value.email);
        formData.append('CIN', transporterForm.value.CIN);
        formData.append('phoneNumber', transporterForm.value.phoneNumber);
        formData.append('typeDrivingLicence', transporterForm.value.typeDrivingLicence);
        formData.append('status', transporterForm.value.status || 'Available');

        if (transporterForm.value.password) {
          formData.append('password', transporterForm.value.password);
        }
        if (selectedFile.value) {
          formData.append('profilePicture', selectedFile.value);
        }

        let response;
        if (isEditing.value) {
          response = await api.put(
            `/updateTransporter/${currentTransporterId.value}`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );
        } else {
          response = await api.post('/add', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        }

        if (!response.data.success) {
          throw new Error(response.data.error || 'Erreur lors de l\'opération');
        }

        await fetchTransporters();
        closeModals();
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: isEditing.value ? 'Transporteur mis à jour avec succès' : 'Transporteur ajouté avec succès',
          confirmButtonColor: '#16a34a',
          timer: 3000,
          timerProgressBar: true
        });
      } catch (error) {
        console.error('Erreur:', {
          message: error.message,
          response: error.response?.data,
          stack: error.stack
        });
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.response?.data?.error || error.message || 'Erreur lors de l\'opération',
          confirmButtonColor: '#dc2626'
        });
      } finally {
        isSubmitting.value = false;
      }
    };

    const openDeleteModal = async (transporter) => {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Confirm Deletion',
        html: `Are you sure you want to delete <strong>${(transporter.firstName + ' ' + transporter.lastName).trim() || 'this transporter'}</strong>?`,
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b'
      });

      if (result.isConfirmed) {
        await confirmDelete(transporter._id);
      }
    };

    const confirmDelete = async (id) => {
      try {
        const response = await api.delete(`/delete/${id}`);

        if (response.data.success) {
          transporters.value = transporters.value.filter(t => t._id !== id);
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: 'Transporteur supprimé avec succès',
            confirmButtonColor: '#16a34a',
            timer: 3000,
            timerProgressBar: true
          });
        } else {
          throw new Error(response.data.error || 'Échec de la suppression');
        }
      } catch (err) {
        console.error(' управління помилкою:', {
          message: err.message,
          response: err.response?.data,
          stack: err.stack
        });
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.error || err.response?.data?.message || 'Échec de la suppression du transporteur',
          confirmButtonColor: '#dc2626'
        });
      }
    };

    const openAddModal = () => {
      isEditing.value = false;
      currentTransporterId.value = null;
      transporterForm.value = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        CIN: '',
        phoneNumber: '',
        typeDrivingLicence: '',
        profilePicture: null,
        status: 'Available'
      };
      previewImage.value = null;
      selectedFile.value = null;
      formErrors.value = {};
      showTransporterModal.value = true;
    };

    const editTransporter = (transporter) => {
      isEditing.value = true;
      currentTransporterId.value = transporter._id;
      
      transporterForm.value = {
        firstName: transporter.firstName || '',
        lastName: transporter.lastName || '',
        email: transporter.email || '',
        password: '',
        CIN: transporter.CIN || '',
        phoneNumber: transporter.phoneNumber || '',
        typeDrivingLicence: transporter.typeDrivingLicence || '',
        profilePicture: transporter.profilePicture || null,
        status: transporter.status || 'Available'
      };
      
      previewImage.value = transporter.profilePicture || null;
      selectedFile.value = null;
      formErrors.value = {};
      showTransporterModal.value = true;
    };

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid File',
            text: 'Please select an image file',
            confirmButtonColor: '#dc2626'
          });
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          Swal.fire({
            icon: 'error',
            title: 'File Too Large',
            text: 'Image size must be less than 5MB',
            confirmButtonColor: '#dc2626'
          });
          return;
        }
        selectedFile.value = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImage.value = e.target.result;
        };
        reader.onerror = () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to read image file',
            confirmButtonColor: '#dc2626'
          });
        };
        reader.readAsDataURL(file);
      }
    };

    const removeImage = () => {
      previewImage.value = null;
      selectedFile.value = null;
      transporterForm.value.profilePicture = null;
    };

    const closeModals = () => {
      showTransporterModal.value = false;
      formErrors.value = {};
    };

    onMounted(() => {
      fetchTransporters();
    });

    return {
      // State
      transporters,
      loading,
      searchTerm,
      statusFilter,
      licenceFilter,
      showTransporterModal,
      isSubmitting,
      isEditing,
      currentTransporterId,
      transporterForm,
      previewImage,
      formErrors,

      // Computed
      filteredTransporters,
      availableTransportersCount,

      // Methods
      formatDate,
      getInitials,
      resetSearch,
      resetFilters,
      fetchTransporters,
      openAddModal,
      editTransporter,
      handleFileUpload,
      removeImage,
      openDeleteModal,
      closeModals,
      handleSubmit
    };
  }
};
</script>

<style scoped>
.transporter-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f8fafc;
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

.add-transporter-btn {
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

.add-transporter-btn:hover {
  background-color: #075985;
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

/* Transporter Grid */
.transporter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.transporter-card {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.transporter-card:hover {
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

.transporter-icon {
  width: 3rem;
  height: 3rem;
  background-color: #e0f2fe;
  color: #0369a1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.profile-pic {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.transporter-info {
  flex: 1;
}

.transporter-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}

.transporter-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #64748b;
}

.phone, .cin {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.transporter-actions {
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

.status-badge.on-mission {
  background-color: #fee2e2;
  color: #dc2626;
}

.status-badge.on-leave {
  background-color: #fef3c7;
  color: #92400e;
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

/* Messages */
.message {
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.message.error {
  background-color: #fee2e2;
  color: #dc2626;
}

.message.success {
  background-color: #dcfce7;
  color: #16a34a;
}

.message.loading {
  background-color: #e0f2fe;
  color: #0369a1;
}

.close-message {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
}

/* Modals */
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
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-content.delete-modal {
  max-width: 500px;
}

.modal-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #0f172a;
}

.modal-form {
  padding: 2rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
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
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
  background-color: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #0369a1;
  box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.1);
}

.form-group input:invalid:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-group[for="profilePicture"] {
  grid-column: span 2;
}

.form-input[type="file"] {
  padding: 0.5rem;
}

.form-input[type="file"]::file-selector-button {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
  cursor: pointer;
}

.form-input[type="file"]::file-selector-button:hover {
  background: #e0e0e0;
}

.error-message {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: block;
}

.preview-container {
  margin-top: 1rem;
  position: relative;
  width: 120px;
  height: 120px;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 1rem;
  border: 2px solid #e2e8f0;
}

.remove-image-btn {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
}

.remove-image-btn:hover {
  background: #b91c1c;
}

.modal-actions {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  grid-column: span 2;
}

.cancel-btn,
.submit-btn,
.delete-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
}

.cancel-btn:hover {
  background-color: #f8fafc;
}

.submit-btn {
  background-color: #0369a1;
  color: white;
  border: none;
  min-width: 120px;
}

.submit-btn:hover {
  background-color: #075985;
}

.submit-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #dc2626;
  color: white;
  border: none;
  min-width: 120px;
}

.delete-btn:hover {
  background-color: #b91c1c;
}

.delete-content {
  padding: 2.5rem;
  text-align: center;
}

.warning-icon {
  font-size: 3.5rem;
  color: #dc2626;
  margin-bottom: 1.5rem;
}

.delete-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin: 1rem 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .transporter-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .modal-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }

  .modal-form {
    grid-template-columns: 1fr;
    padding: 1.5rem;
  }

  .form-group[for="profilePicture"] {
    grid-column: span 1;
  }

  .modal-actions {
    padding: 1.25rem;
  }

  .actions-section {
    flex-direction: column;
  }
  
  .search-bar {
    width: 100%;
  }
  
  .add-transporter-btn {
    width: 100%;
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
/* Messages */
.message {
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.message.error {
  background-color: #fee2e2;
  color: #dc2626;
}

.message.success {
  background-color: #dcfce7;
  color: #16a34a;
}

.message.loading {
  background-color: #e0f2fe;
  color: #0369a1;
}

.close-message {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
}

/* Delete Confirmation Modal */
.modal-content.delete-modal {
  max-width: 500px;
}

.delete-content {
  padding: 2.5rem;
  text-align: center;
}

.warning-icon {
  font-size: 3.5rem;
  color: #dc2626;
  margin-bottom: 1.5rem;
}

.delete-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin: 1rem 0;
}
</style>