<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

// Types
interface Company {
  _id: string
  companyName: string
  email: string
  legalStatus: string
  taxRegistrationNumber: string
  isApproved: boolean
  userId: string
}
interface NewCompany {
  companyName: string
  email: string
  password: string
  registeredOfficeAddress: string // Nom exact comme dans le backend
  legalStatus: string
  taxRegistrationNumber: string // Nom exact comme dans le backend
  phoneNumber: string // Nom exact comme dans le backend
  logoFile?: File | null
}
// Router setup
const router = useRouter()

// State management
const logoPreview = ref<string | null>(null)
const isUploading = ref(false)

const companies = ref<Company[]>([])
const loading = ref(false)
const activeTab = ref('pending')
const currentPage = ref(1)
const itemsPerPage = 10
const showAddCompanyModal = ref(false)
const newCompany = ref<NewCompany>({
  companyName: '',
  email: '',
  password: '',
  registeredOfficeAddress: '',
  legalStatus: '',
  taxRegistrationNumber: '',
  phoneNumber: ''
})
// API Configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
})

// Computed properties
const stats = computed(() => ({
  totalCompanies: companies.value.length,
  pendingCompanies: companies.value.filter(c => !c.isApproved).length,
  approvedCompanies: companies.value.filter(c => c.isApproved).length
}))
const openAddCompanyModal = () => {
  showAddCompanyModal.value = true
}

const closeAddCompanyModal = () => {
  showAddCompanyModal.value = false
  resetNewCompanyForm()
}

const resetNewCompanyForm = () => {
  newCompany.value = {
    companyName: '',
    email: '',
    password: '',
    registeredOfficeAddress: '',
    legalStatus: '',
    taxRegistrationNumber: '',
    phoneNumber: ''
  }
}
const handleLogoUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    newCompany.value.logoFile = input.files[0]
    
    // Créer une preview du logo
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(input.files[0])
  }
}

const removeLogo = () => {
  newCompany.value.logoFile = null
  logoPreview.value = null
}

const addCompany = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    // Vérification des champs requis
    if (!newCompany.value.companyName || !newCompany.value.email || !newCompany.value.password) {
      throw new Error('Company name, email and password are required')
    }

    const formData = new FormData()
    // Utilisez les mêmes noms que le backend attend
    formData.append('companyName', newCompany.value.companyName)
    formData.append('email', newCompany.value.email)
    formData.append('password', newCompany.value.password)
    formData.append('registeredOfficeAddress', newCompany.value.registeredOfficeAddress)
    formData.append('legalStatus', newCompany.value.legalStatus)
    formData.append('taxRegistrationNumber', newCompany.value.taxRegistrationNumber)
    formData.append('phoneNumber', newCompany.value.phoneNumber)
    
    if (newCompany.value.logoFile) {
      formData.append('logo', newCompany.value.logoFile)
    }

    isUploading.value = true
    
    const response = await api.post('users/companyAdmin', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    await Swal.fire({
      title: 'Success',
      text: response.data.message || 'Company added successfully',
      icon: 'success'
    })

    closeAddCompanyModal()
    await fetchCompanies()
  } catch (error: any) {
    console.error('Error adding company:', error)
    
    let errorMessage = 'Failed to add company'
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error.message) {
      errorMessage = error.message
    }

    await Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error'
    })
  } finally {
    loading.value = false
    isUploading.value = false
  }
}
const filteredCompanies = computed(() => {
  let filtered = companies.value

  switch (activeTab.value) {
    case 'pending':
      filtered = filtered.filter(c => !c.isApproved)
      break
    case 'approved':
      filtered = filtered.filter(c => c.isApproved)
      break
  }

  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  const filtered = activeTab.value === 'all'
    ? companies.value
    : companies.value.filter(c => activeTab.value === 'approved' ? c.isApproved : !c.isApproved)
  return Math.ceil(filtered.length / itemsPerPage)
})

// Methods
const getCompanyLogo = (name: string): string => {
  const initials = name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
  return `https://ui-avatars.com/api/?name=${initials}&background=random&size=50`
}

const fetchCompanies = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    const response = await api.get('/users/companies', {
      headers: { Authorization: `Bearer ${token}` }
    })
    companies.value = response.data
  } catch (error) {
    console.error('Error fetching companies:', error)
    Swal.fire({
      title: 'Error',
      text: 'Failed to load companies',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const approveCompany = async (id: string) => {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    await api.put(`/users/approve-company/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })

    await Swal.fire({
      title: 'Success',
      text: 'Company approved successfully',
      icon: 'success'
    })

    await fetchCompanies()
  } catch (error) {
    console.error('Error approving company:', error)
    Swal.fire({
      title: 'Error',
      text: 'Failed to approve company',
      icon: 'error'
    })
  }
}

const confirmDelete = (id: string) => {
  Swal.fire({
    title: 'Are you sure?',
    text: "This will permanently delete the company and all its data!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    showLoaderOnConfirm: true,
    preConfirm: () => {
      return deleteCompany(id).catch(error => {
        Swal.showValidationMessage(`Request failed: ${error}`)
      })
    },
    allowOutsideClick: () => !Swal.isLoading()
  })
}
const deleteCompany = async (id: string) => {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    const response = await api.delete(`/users/delete-company/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    // Si la suppression est bloquée par le serveur
    if (response.data.error && response.data.error.includes('locations actives')) {
      await Swal.fire({
        title: 'Cannot delete company',
        html: `
          <div>
            <p>${response.data.error}</p>
            <ul class="text-left mt-2">
              ${(response.data.activeRentals as { warehouse: string; period: string }[]).map((rental: { warehouse: string; period: string }) => `
                <li>• Warehouse: ${rental.warehouse} (${rental.period})</li>
              `).join('')}
            </ul>
          </div>
        `,
        icon: 'error'
      })
      return
    }

    // Si la suppression réussit
    await Swal.fire({
      title: 'Deleted!',
      text: 'Company has been deleted successfully.',
      icon: 'success'
    })

    await fetchCompanies()
  } catch (error: any) {
    console.error('Error deleting company:', error)
    
    let errorMessage = 'Failed to delete company'
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    }

    await Swal.fire({
      title: 'Error',
      html: errorMessage.includes('locations actives') 
        ? `
          <div>
            <p>${errorMessage}</p>
            ${error.response?.data?.activeRentals 
              ? `<ul class="text-left mt-2">
                   ${error.response.data.activeRentals.map((rental: any) => `
                     <li>• Warehouse: ${rental.warehouse} (${rental.period})</li>
                   `).join('')}
                 </ul>`
              : ''}
          </div>
        `
        : errorMessage,
      icon: 'error'
    })
  }
}

const setActiveTab = (tab: string) => {
  activeTab.value = tab
  currentPage.value = 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const logout = () => {
  localStorage.removeItem('accessToken')
  router.push('/login')
}

// Lifecycle hooks
onMounted(() => {
  fetchCompanies()
})
</script>

<template>
  <div class="company-management">

    <!-- Statistics Section -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="fas fa-building"></i>
        </div>
        <div class="stat-content">
          <p class="stat-label">Total Companies</p>
          <h3 class="stat-value">{{ stats.totalCompanies }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon pending">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <p class="stat-label">Pending Approval</p>
          <h3 class="stat-value">{{ stats.pendingCompanies }}</h3>
        </div>
      </div>
     
      <div class="stat-card">
        <div class="stat-icon approved">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <p class="stat-label">Approved Companies</p>
          <h3 class="stat-value">{{ stats.approvedCompanies }}</h3>
        </div>
      </div>
    </section>
    <div class="add-company-btn-container">
  <button class="btn-add-company" @click="openAddCompanyModal">
    <i class="fas fa-plus"></i>
    Add Company
  </button>
</div>
    <!-- Filter Section -->
    <section class="filter-section">
      <div class="tabs">
        <button 
          v-for="tab in ['pending', 'approved', 'all']" 
          :key="tab"
          :class="['tab-btn', { active: activeTab === tab }]"
          @click="setActiveTab(tab)"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>
    </section>

    <!-- Companies Table -->
    <section class="table-section">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Email</th>
              <th>Legal Status</th>
              <th>Tax Number</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="company in filteredCompanies" :key="company._id">
              <td>
                <div class="company-info">
                  <img 
                    :src="getCompanyLogo(company.companyName)" 
                    :alt="company.companyName"
                    class="company-logo"
                  >
                  <span class="company-name">{{ company.companyName }}</span>
                </div>
              </td>
              <td>{{ company.email }}</td>
              <td>
                <span class="legal-status" :class="company.legalStatus.toLowerCase()">
                  {{ company.legalStatus }}
                </span>
              </td>
              <td>{{ company.taxRegistrationNumber }}</td>
              <td>
                <span class="status-badge" :class="company.isApproved ? 'approved' : 'pending'">
                  {{ company.isApproved ? 'Approved' : 'Pending' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    v-if="!company.isApproved"
                    class="btn-approve"
                    @click="approveCompany(company._id)"
                  >
                    <i class="fas fa-check"></i>
                    Approve
                  </button>
                  <button 
                    class="btn-delete"
                    @click="confirmDelete(company._id)"
                  >
                    <i class="fas fa-trash"></i>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="showAddCompanyModal" class="modal-overlay">
  <div class="modal-container">
    <div class="modal-header">
      <h3>Add New Company</h3>
      <button class="modal-close-btn" @click="closeAddCompanyModal">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="modal-body">
      <div class="form-group">
      <label for="logo">Company Logo</label>
      <div class="logo-upload-container">
        <div v-if="logoPreview" class="logo-preview">
          <img :src="logoPreview" alt="Logo preview" class="logo-preview-image">
          <button type="button" class="btn-remove-logo" @click="removeLogo">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-else class="upload-area">
          <label for="logo-upload" class="upload-label">
            <i class="fas fa-cloud-upload-alt"></i>
            <span>Click to upload logo</span>
            <input 
              type="file" 
              id="logo-upload" 
              accept="image/*"
              @change="handleLogoUpload"
              style="display: none;"
            >
          </label>
        </div>
      </div>
    </div>
      <form @submit.prevent="addCompany">
        <div class="form-group">
          <label for="companyName">Company Name</label>
          <input 
            type="text" 
            id="companyName" 
            v-model="newCompany.companyName" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="newCompany.email" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="newCompany.password" 
            required
          >
        </div>
        <div class="form-group">
  <label for="registeredOfficeAddress">Registered Office Address</label>
  <input 
    type="text" 
    id="registeredOfficeAddress" 
    v-model="newCompany.registeredOfficeAddress" 
    required
  >
</div>
<div class="form-group">
          <label for="legalStatus">Legal Status</label>
          <select 
            id="legalStatus" 
            v-model="newCompany.legalStatus" 
            required
          >
            <option value="">Select legal status</option>
            <option value="LLC">LLC</option>
            <option value="Corporation">Corporation</option>
            <option value="Partnership">Partnership</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
          </select>
        </div>
<div class="form-group">
  <label for="taxRegistrationNumber">Tax Registration Number</label>
  <input 
    type="text" 
    id="taxRegistrationNumber" 
    v-model="newCompany.taxRegistrationNumber" 
    required
  >
</div>

<div class="form-group">
  <label for="phoneNumber">Phone Number</label>
  <input 
    type="tel" 
    id="phoneNumber" 
    v-model="newCompany.phoneNumber" 
    required
  >
</div>
        
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="closeAddCompanyModal">
            Cancel
          </button>
          <button type="submit" class="btn-submit">
            Add Company
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button 
          class="page-btn"
          @click="prevPage" 
          :disabled="currentPage === 1"
        >
          <i class="fas fa-chevron-left"></i>
          Previous
        </button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button 
          class="page-btn"
          @click="nextPage" 
          :disabled="currentPage === totalPages"
        >
          Next
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </section>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<style scoped>
.company-management {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 2rem;
}

/* Header Styles */
.header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}
/* Ajoutez dans votre section <style scoped> */
.swal2-html-container ul {
  padding-left: 1.5em;
  margin-top: 0.5em;
  margin-bottom: 0;
}

.swal2-html-container li {
  margin-bottom: 0.3em;
}

.text-left {
  text-align: left;
}

.mt-2 {
  margin-top: 0.5rem;
}
.btn-logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  color: #4b5563;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-logout:hover {
  background-color: #e5e7eb;
  color: #1f2937;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
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
.stat-icon.pending { background-color: #fef3c7; color: #d97706; }
.stat-icon.approved { background-color: #dcfce7; color: #16a34a; }

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0.25rem 0 0 0;
}

/* Filter Section */
.filter-section {
  margin-bottom: 2rem;
}
/* Add Company Button */
.add-company-btn-container {
  margin-bottom: 2rem;
  display: flex;
  justify-content: flex-end;
}

.btn-add-company {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-add-company:hover {
  background-color: #2563eb;
}

/* Modal Styles */
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
}

.modal-container {
  background-color: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
}

.modal-close-btn:hover {
  color: #111827;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background-color: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background-color: #e5e7eb;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-submit:hover {
  background-color: #059669;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .modal-container {
    width: 95%;
    margin: 0 auto;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-cancel,
  .btn-submit {
    width: 100%;
  }
}
.tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  width: fit-content;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background-color: white;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Table Styles */
.table-section {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}
/* Styles pour l'upload de logo */
.logo-upload-container {
  margin-top: 0.5rem;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  cursor: pointer;
}

.upload-label i {
  font-size: 1.5rem;
  color: #9ca3af;
}

.logo-preview {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
}

.logo-preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.btn-remove-logo {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 28px;
  height: 28px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-remove-logo:hover {
  background-color: #dc2626;
}

/* Style pour l'indicateur de chargement */
.uploading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #3b82f6;
  margin-top: 0.5rem;
}

.uploading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
th {
  background-color: #f9fafb;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.company-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.company-logo {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
}

.company-name {
  font-weight: 500;
  color: #111827;
}

.legal-status {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.legal-status.llc {
  background-color: #e0f2fe;
  color: #0284c7;
}

.legal-status.corporation {
  background-color: #dcfce7;
  color: #16a34a;
}

.legal-status.partnership {
  background-color: #fef3c7;
  color: #d97706;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.approved {
  background-color: #dcfce7;
  color: #16a34a;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-approve, .btn-delete {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-approve {
  background-color: #dcfce7;
  color: #16a34a;
  border: 1px solid #86efac;
}

.btn-approve:hover {
  background-color: #bbf7d0;
}

.btn-delete {
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.btn-delete:hover {
  background-color: #fecaca;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: white;
  color: #4b5563;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  color: #111827;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .company-management {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .tabs {
    width: 100%;
    justify-content: space-between;
  }

  .tab-btn {
    flex: 1;
    text-align: center;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-approve, .btn-delete {
    width: 100%;
    justify-content: center;
  }
}
</style>