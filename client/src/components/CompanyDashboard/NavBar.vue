<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

interface CompanyInfo {
  companyName: string
  Logo: string
}

const router = useRouter()
const notifications = ref(3)
const isProfileDropdownOpen = ref(false)
const companyInfo = ref<CompanyInfo>({
  companyName: '',
  Logo: ''
})

const fetchCompanyInfo = async () => {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const response = await axios.get('http://localhost:3000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (response.data.company) {
      companyInfo.value = {
        companyName: response.data.company.companyName,
        Logo: response.data.company.Logo
      }
    }
  } catch (error) {
    console.error('Error fetching company info:', error)
  }
}

const toggleProfileDropdown = () => {
  isProfileDropdownOpen.value = !isProfileDropdownOpen.value
}

const goToProfile = () => {
  router.push('/profile')
  isProfileDropdownOpen.value = false
}

const goToEdit = () => {
  router.push('/edit')
  isProfileDropdownOpen.value = false
}

const logout = async () => {
  try {
    await axios.post('http://localhost:3000/api/auth/logout', {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
    
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    router.push('/')
    isProfileDropdownOpen.value = false
    
  } catch (error) {
    console.error('Error during logout:', error)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    router.push('/')
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const profileMenu = document.querySelector('.profile-menu')
  if (profileMenu && !profileMenu.contains(event.target as Node)) {
    isProfileDropdownOpen.value = false
  }
}

onMounted(() => {
  fetchCompanyInfo()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
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
      <button class="icon-button">
        <i class="fas fa-bell"></i>
        <span class="notification-badge">{{ notifications }}</span>
      </button>
      
      <button class="icon-button">
        <i class="fas fa-cog"></i>
      </button>
      
      <div class="profile-menu" @click="toggleProfileDropdown">
        <img 
          v-if="companyInfo.Logo" 
          :src="companyInfo.Logo" 
          :alt="companyInfo.companyName" 
          class="company-logo" 
        />
        <span v-else class="profile-avatar">
          {{ companyInfo.companyName?.[0] || 'U' }}
        </span>
        
        <span class="profile-name">{{ companyInfo.companyName }}</span>
        <i class="fas fa-chevron-down"></i>
        
        <div v-if="isProfileDropdownOpen" class="profile-dropdown">
          <div class="dropdown-item" @click="goToProfile">
            <i class="fas fa-user dropdown-icon"></i>
            <span>View Profile</span>
          </div>
          <div class="dropdown-item" @click="goToEdit">
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

.search-box {
  position: relative;
  width: 300px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  background-color: rgba(248, 250, 252, 0.8);
  transition: all 0.3s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.icon-button:hover {
  background-color: #f8fafc;
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 10px;
  border: 2px solid white;
}

.profile-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  position: relative;
  background-color: white;
}

.profile-menu:hover {
  background-color: #f8fafc;
  border-color: #e2e8f0;
}

.company-logo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
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
  font-size: 1rem;
}

.profile-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  min-width: 200px;
  padding: 0.5rem 0;
  z-index: 1001;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #1e293b;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8fafc;
  color: #3b82f6;
}

.dropdown-icon {
  width: 16px;
  color: #64748b;
}

.dropdown-item:hover .dropdown-icon {
  color: #3b82f6;
}
</style>