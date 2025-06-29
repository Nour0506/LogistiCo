<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { useToast } from 'vue-toastification'

const toast = useToast()

interface UserInfo {
  firstName: string
  lastName: string
  email: string
  role: string
}

// Data
const notifications = ref(3)
const isProfileDropdownOpen = ref(false)
const userInfo = ref<UserInfo>({
  firstName: '',
  lastName: '',
  email: '',
  role: ''
})
const showViewProfileModal = ref(false)
const showEditProfileModal = ref(false)
const editForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Fetch user info from /meAdmin endpoint
const fetchUserInfo = async () => {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const response = await axios.get('http://localhost:3000/api/users/meAdmin', {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (response.data.success) {
      const userData = response.data.user
      userInfo.value = {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        role: userData.role || ''
      }
      // Initialize edit form with current data
      editForm.value = {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }
  } catch (error) {
    console.error('Error fetching user info:', error)
    toast.error('Failed to fetch user information')
  }
}

// Update profile using profileAdmin endpoint
const updateProfile = async () => {
  try {
    // Validate password match
    if (editForm.value.newPassword && editForm.value.newPassword !== editForm.value.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    const payload = {
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      email: editForm.value.email,
      ...(editForm.value.newPassword && {
        currentPassword: editForm.value.currentPassword,
        newPassword: editForm.value.newPassword
      })
    }

    const response = await axios.put('http://localhost:3000/api/users/profileAdmin', payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    })

    // Refresh user info after update
    await fetchUserInfo()
    showEditProfileModal.value = false
    toast.success('Profile updated successfully')
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      toast.error(error.response.data.error)
    } else {
      toast.error('Failed to update profile')
    }
    console.error('Profile update error:', error)
  }
}

// Logout function
const logout = async () => {
  try {
    await axios.post('/api/auth/logout', {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
    
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    toast.success('Logged out successfully')
    window.location.href = '/'
  } catch (error) {
    console.error('Error during logout:', error)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    toast.error('Session expired')
    window.location.href = '/'
  }
}

// Handle click outside dropdown
const handleClickOutside = (event: MouseEvent) => {
  const profileMenu = document.querySelector('.profile-menu')
  if (profileMenu && !profileMenu.contains(event.target as Node)) {
    isProfileDropdownOpen.value = false
  }
}

onMounted(() => {
  fetchUserInfo()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const toggleProfileDropdown = () => {
  isProfileDropdownOpen.value = !isProfileDropdownOpen.value
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-left">
      <div class="search-box">
        <i class="fas fa-search search-icon"></i>
        <input type="text" placeholder="Search..." />
      </div>
    </div>
    
    <div class="navbar-right">
      
      
      <div class="profile-menu" @click.stop="toggleProfileDropdown">
        <span class="profile-avatar">
          {{ userInfo.firstName?.[0] }}{{ userInfo.lastName?.[0] }}
        </span>
        
        <span class="profile-name">
          {{ userInfo.firstName }} {{ userInfo.lastName }}
          <small class="role-badge">{{ userInfo.role }}</small>
        </span>
        <i class="fas fa-chevron-down"></i>
        
        <div v-if="isProfileDropdownOpen" class="profile-dropdown">
          <div class="dropdown-item" @click="showViewProfileModal = true">
            <i class="fas fa-user dropdown-icon"></i>
            <span>View Profile</span>
          </div>
          <div class="dropdown-item" @click="showEditProfileModal = true">
            <i class="fas fa-edit dropdown-icon"></i>
            <span>Edit Profile</span>
          </div>
          <div class="dropdown-item" @click="logout">
            <i class="fas fa-sign-out-alt dropdown-icon"></i>
            <span>Logout</span>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- View Profile Modal -->
  <div v-if="showViewProfileModal" class="modal-overlay" @click.self="showViewProfileModal = false">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Your Profile</h3>
        <button class="modal-close" @click="showViewProfileModal = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="profile-info">
          <div class="info-row">
            <label>First Name:</label>
            <span>{{ userInfo.firstName }}</span>
          </div>
          <div class="info-row">
            <label>Last Name:</label>
            <span>{{ userInfo.lastName }}</span>
          </div>
          <div class="info-row">
            <label>Email:</label>
            <span>{{ userInfo.email }}</span>
          </div>
          <div class="info-row">
            <label>Role:</label>
            <span>{{ userInfo.role }}</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" @click="showEditProfileModal = true; showViewProfileModal = false">
          Edit Profile
        </button>
        <button class="btn btn-secondary" @click="showViewProfileModal = false">
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- Edit Profile Modal -->
  <div v-if="showEditProfileModal" class="modal-overlay" @click.self="showEditProfileModal = false">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Edit Profile</h3>
        <button class="modal-close" @click="showEditProfileModal = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="updateProfile">
          <div class="form-group">
            <label>First Name</label>
            <input v-model="editForm.firstName" type="text" required>
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input v-model="editForm.lastName" type="text" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="editForm.email" type="email" required>
          </div>
          
          <div class="password-section">
            <h4>Change Password</h4>
            <div class="form-group">
              <label>Current Password</label>
              <input v-model="editForm.currentPassword" type="password">
            </div>
            <div class="form-group">
              <label>New Password</label>
              <input v-model="editForm.newPassword" type="password">
            </div>
            <div class="form-group">
              <label>Confirm New Password</label>
              <input v-model="editForm.confirmPassword" type="password">
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" @click="updateProfile">
          Save Changes
        </button>
        <button class="btn btn-secondary" @click="showEditProfileModal = false">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 290px;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  height: 80px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.7);
  z-index: 1000;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}
.navbar-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.search-box {
  position: relative;
  width: 250px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.search-box input {
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  background-color: #f9fafb;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: #f3f4f6;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.icon-button:hover {
  background-color: #e5e7eb;
  color: #1f2937;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #ef4444;
  color: white;
  font-size: 0.7rem;
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.profile-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  background-color: #f9fafb;
}

.profile-menu:hover {
  background-color: #f3f4f6;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.profile-name {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
  font-weight: 500;
  color: #111827;
}

.role-badge {
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: capitalize;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  min-width: 200px;
  overflow: hidden;
  z-index: 1001;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #374151;
  transition: all 0.2s;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.dropdown-icon {
  width: 16px;
  color: #6b7280;
}

.dropdown-item:hover .dropdown-icon {
  color: #3b82f6;
}

.fa-chevron-down {
  font-size: 0.8rem;
  color: #6b7280;
  transition: transform 0.2s;
}

/* Modal styles */
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
  z-index: 2000;
}

.modal-content {
  background-color: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.25rem;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* Profile info styles */
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  align-items: center;
}

.info-row label {
  font-weight: 500;
  color: #4b5563;
  width: 120px;
}

.info-row span {
  color: #1f2937;
}

/* Form styles */
.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4b5563;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.password-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.password-section h4 {
  margin-top: 0;
  margin-bottom: 1.25rem;
  font-size: 1.1rem;
  color: #1f2937;
}

/* Button styles */
.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}
</style>