<template>
  <div class="company-profile">
    <!-- Loading and Error States -->
    <div v-if="loading" class="status-message loading">
      <div class="spinner"></div>
      <p>Loading company profile...</p>
    </div>
    
    <div v-else-if="error" class="status-message error">
      <span class="icon">⚠️</span>
      <p>{{ error }}</p>
    </div>

    <!-- Company Profile Content -->
    <div v-else-if="company.companyName" class="profile-content">
      <!-- Header Section -->
      <header class="profile-header">
        <div class="profile-header-content">
          <div class="company-logo">
            <img 
              v-if="company.Logo" 
              :src="company.Logo" 
              :alt="`${company.Logo} Logo`" 
            />
            <div v-else class="company-logo-placeholder">
              {{ company.companyName?.[0]?.toUpperCase() || 'C' }}
            </div>
          </div>
          <div class="company-title">
            <h1>{{ company.companyName }}</h1>
            <p class="company-status">{{ company.legalStatus }}</p>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="profile-sections">
        <section class="profile-section contact-info">
          <h2>Contact Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="icon">✉️</span>
              <div class="info-content">
                <label>Email Address</label>
                <p>{{ company.email }}</p>
              </div>
            </div>
            <div class="info-item">
              <span class="icon">📞</span>
              <div class="info-content">
                <label>Phone Number</label>
                <p>{{ company.phoneNumber }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="profile-section company-details">
          <h2>Company Details</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="icon">🏢</span>
              <div class="info-content">
                <label>Registered Name</label>
                <p>{{ company.companyName }}</p>
              </div>
            </div>
            <div class="info-item">
              <span class="icon">⚖️</span>
              <div class="info-content">
                <label>Legal Structure</label>
                <p>{{ company.legalStatus }}</p>
              </div>
            </div>
            <div class="info-item">
              <span class="icon">🆔</span>
              <div class="info-content">
                <label>Tax Registration</label>
                <p>{{ company.taxRegistrationNumber }}</p>
              </div>
            </div>
            <div class="info-item">
              <span class="icon">📍</span>
              <div class="info-content">
                <label>Office Address</label>
                <p>{{ company.registeredOfficeAddress }}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <!-- Actions -->
      <footer class="profile-actions">
        <button @click="goToEdit" class="edit-button">
          Edit Profile
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

interface Company {
  Logo?: string
  companyName?: string
  legalStatus?: string
  email?: string
  phoneNumber?: string
  taxRegistrationNumber?: string
  registeredOfficeAddress?: string
}

const company = ref<Company>({})
const loading = ref(true)
const error = ref<string | null>(null)

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true
})

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const { data } = await api.post('/refresh-token')
        localStorage.setItem('accessToken', data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        router.push('/login')
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

const fetchCompanyProfile = async () => {
  try {
    loading.value = true
    error.value = null

    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Authentication required')

    api.defaults.headers.common.Authorization = `Bearer ${token}`

    const userResponse = await api.get('/users/me')
    if (!userResponse.data.company?._id) {
      throw new Error('Company data not found')
    }

    const profileResponse = await api.get(`/users/profile/${userResponse.data.company._id}`)
    company.value = profileResponse.data.company

  } catch (err) {
    handleError(err)
  } finally {
    loading.value = false
  }
}

const handleError = (err: unknown) => {
  if (axios.isAxiosError(err)) {
    error.value = err.response?.data?.error || err.message
    if (err.response?.status === 401) {
      router.push('/login')
    }
  } else if (err instanceof Error) {
    error.value = err.message
  } else {
    error.value = 'An unknown error occurred'
  }
  console.error('Error:', err)
}

const goToEdit = () => {
  router.push('/edit')
}

onMounted(fetchCompanyProfile)
</script>

<style scoped>
.company-profile {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

/* Status Messages */
.status-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  border-radius: 0.5rem;
  background: var(--surface-color, #ffffff);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-message.loading {
  color: var(--primary-color, #2563eb);
}

.status-message.error {
  color: var(--error-color, #dc2626);
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color, #2563eb);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Profile Content */
.profile-content {
  background: var(--surface-color, #ffffff);
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Header Section */
.profile-header {
  background: linear-gradient(135deg, #1f2937, #111827);
  padding: 3rem 2rem;
  color: white;
}

.profile-header-content {
  display: flex;
  align-items: center;
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.company-logo {
  width: 120px;
  height: 120px;
  border-radius: 1rem;
  overflow: hidden;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.company-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.company-logo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 3rem;
  font-weight: bold;
}

.company-title h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
}

.company-status {
  font-size: 1.25rem;
  opacity: 0.9;
  margin: 0.5rem 0 0;
}

/* Main Content */
.profile-sections {
  padding: 2rem;
  display: grid;
  gap: 2rem;
}

.profile-section {
  background: #f8fafc;
  border-radius: 0.75rem;
  padding: 2rem;
}

.profile-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.info-item .icon {
  font-size: 1.5rem;
}

.info-content {
  flex: 1;
}

.info-content label {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.info-content p {
  font-size: 1rem;
  color: #0f172a;
  margin: 0;
  font-weight: 500;
}

/* Actions */
.profile-actions {
  padding: 2rem;
  border-top: 1px solid #9e91f0c6;
  display: flex;
  justify-content: flex-end;
}

.edit-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #142854;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-button:hover {
  background: #1d4ed8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-header-content {
    flex-direction: column;
    text-align: center;
  }

  .company-logo {
    margin: 0 auto;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .profile-actions {
    justify-content: center;
  }
}
</style>