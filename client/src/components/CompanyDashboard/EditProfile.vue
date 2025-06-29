<template>
  <div class="profile-container">
    <!-- Loading and Error States -->
    <div v-if="loading" class="status-message loading">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>

    <div v-else-if="error" class="status-message error">
      <span class="icon">⚠️</span>
      <p>{{ error }}</p>
    </div>

    <div v-else class="profile-content">
      <!-- Header Section -->
      <header class="profile-header">
        <div class="logo-container">
          <img :src="company.Logo" alt="Company Logo" class="logo" v-if="company.Logo" />
          <div v-else class="logo-placeholder">
            {{ company.companyName?.[0]?.toUpperCase() || 'C' }}
          </div>
        </div>
        <h1 class="company-name">{{ company.companyName }}</h1>
        <p class="legal-status">{{ company.legalStatus }}</p>
      </header>

      <!-- Main Form Content -->
      <div class="form-sections">
        <!-- Company Information -->
        <section class="form-section">
          <h2>Company Information</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>
                <span class="icon">🏢</span>
                Company Name
              </label>
              <input 
                v-model="company.companyName"
                type="text"
                placeholder="Enter company name"
              />
            </div>

            <div class="form-group">
              <label>
                <span class="icon">⚖️</span>
                Legal Status
              </label>
              <select v-model="company.legalStatus">
                <option value="" disabled>Select legal status</option>
                <option value="SARL">SARL</option>
                <option value="SNC">SNC</option>
                <option value="SUARL">SUARL</option>
                <option value="SA">SA</option>
              </select>
            </div>

            <div class="form-group">
              <label>
                <span class="icon">🆔</span>
                Tax Registration Number
              </label>
              <input 
                v-model="company.taxRegistrationNumber"
                type="text"
                placeholder="Enter tax registration number"
              />
            </div>

            <div class="form-group full-width">
              <label>
                <span class="icon">📍</span>
                Registered Office Address
              </label>
              <input 
                v-model="company.registeredOfficeAddress"
                type="text"
                placeholder="Enter registered office address"
              />
            </div>
          </div>
        </section>

        <!-- Contact Information -->
        <section class="form-section">
          <h2>Contact Information</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>
                <span class="icon">✉️</span>
                Email Address
              </label>
              <input 
                v-model="company.email"
                type="email"
                placeholder="Enter email address"
                readonly
              />
            </div>

            <div class="form-group">
              <label>
                <span class="icon">📞</span>
                Phone Number
              </label>
              <input 
                v-model="company.phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                readonly
              />
            </div>
          </div>
        </section>

        <!-- Password Change -->
        <section class="form-section">
          <h2>Change Password</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>
                <span class="icon">🔑</span>
                Current Password
              </label>
              <div class="password-input">
                <input 
                  v-model="oldPassword"
                  :type="showOldPassword ? 'text' : 'password'"
                  placeholder="Enter current password"
                />
                <button 
                  type="button"
                  class="password-toggle"
                  @click="showOldPassword = !showOldPassword"
                >
                  {{ showOldPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>
                <span class="icon">🔒</span>
                New Password
              </label>
              <div class="password-input">
                <input 
                  v-model="newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  placeholder="Enter new password"
                />
                <button 
                  type="button"
                  class="password-toggle"
                  @click="showNewPassword = !showNewPassword"
                >
                  {{ showNewPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>
                <span class="icon">✅</span>
                Confirm Password
              </label>
              <div class="password-input">
                <input 
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Confirm new password"
                />
                <button 
                  type="button"
                  class="password-toggle"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Action Buttons -->
        <div class="form-actions">
          <button class="btn btn-save" @click="saveChanges">
            <span class="icon">💾</span>
            Save Changes
          </button>
          <button class="btn btn-cancel" @click="resetForm">
            <span class="icon">❌</span>
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Company data
const company = ref({
  Logo: '',
  companyName: '',
  email: '',
  phoneNumber: '',
  registeredOfficeAddress: '',
  legalStatus: '',
  taxRegistrationNumber: '',
});

// Password change data
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

// UI states
const error = ref('');
const loading = ref(false);
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// API configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fetch company profile
const fetchCompanyProfile = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const response = await api.get('/users/me');
    if (!response.data.company) {
      throw new Error('Company data not found');
    }
    
    company.value = response.data.company;
  } catch (err) {
    handleError(err);
  } finally {
    loading.value = false;
  }
};

// Save changes
const saveChanges = async () => {
  try {
    loading.value = true;
    error.value = '';

    const data: any = {
      companyName: company.value.companyName,
      registeredOfficeAddress: company.value.registeredOfficeAddress,
      legalStatus: company.value.legalStatus,
      taxRegistrationNumber: company.value.taxRegistrationNumber
    };

    if (oldPassword.value || newPassword.value || confirmPassword.value) {
      if (!validatePasswordChange()) return;
      
      data.oldPassword = oldPassword.value;
      data.newPassword = newPassword.value;
    }

    const response = await api.put('/Profile/modify/me', data);
    alert('Profile updated successfully!');
    resetForm();
    
  } catch (err) {
    handleError(err);
  } finally {
    loading.value = false;
  }
};

// Validate password change
const validatePasswordChange = () => {
  if (!oldPassword.value) {
    error.value = 'Please enter your current password';
    return false;
  }
  if (newPassword.value.length < 8) {
    error.value = 'New password must be at least 8 characters long';
    return false;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'New password and confirmation do not match';
    return false;
  }
  return true;
};

// Reset form
const resetForm = () => {
  oldPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  fetchCompanyProfile();
};

// Error handling
const handleError = (err: unknown) => {
  if (axios.isAxiosError(err)) {
    error.value = err.response?.data?.error || err.message;
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
  } else if (err instanceof Error) {
    error.value = err.message;
  } else {
    error.value = 'An unknown error occurred';
  }
  console.error('Error:', err);
};

// Initialize
onMounted(fetchCompanyProfile);
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
}

/* Status Messages */
.status-message {
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  margin-bottom: 1rem;
}

.status-message.loading {
  background: rgba(82, 82, 91, 0.1);
  color: #52525b;
}

.status-message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #52525b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Profile Content */
.profile-content {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

/* Header */
.profile-header {
  background: linear-gradient(135deg, #1f2937, #111827);
  padding: 2rem;
  text-align: center;
  color: white;
}

.logo-container {
  margin-bottom: 1rem;
}

.logo, .logo-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: #1f2937;
  font-size: 2.5rem;
  font-weight: bold;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.company-name {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.legal-status {
  font-size: 1.125rem;
  opacity: 0.9;
  margin: 0.5rem 0 0;
  color: #e5e7eb;
}

/* Form Sections */
.form-sections {
  padding: 2rem;
}

.form-section {
  background: #f8fafc;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.form-section:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.form-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.75rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1f2937;
  background: white;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #6b7280;
  box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
}

.form-group input:read-only {
  background: #f9fafb;
  cursor: not-allowed;
  border-style: dashed;
}

/* Password Input */
.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  color: #6b7280;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: #4b5563;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  background: #1f2937;
  color: white;
  border: none;
}

.btn-save:hover {
  background: #111827;
}

.btn-cancel {
  background: white;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.btn-cancel:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-container {
    padding: 1rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
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