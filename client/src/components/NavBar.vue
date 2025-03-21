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
      <div class="profile-menu">
        <img :src="userProfile.avatar" :alt="userProfile.name" class="profile-avatar" />
        <span class="profile-name">{{ userProfile.name }}</span>
        <i class="fas fa-chevron-down"></i>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: "NavBar",
  setup() {
    interface UserProfile {
      name: string;
      avatar: string;
    }

    const userProfile = ref<UserProfile>({
      name: 'John Doe',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
    });

    const notifications = ref<number>(3);

    return {
      userProfile,
      notifications
    };
  }
});
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 250px; /* Ajustez cette valeur pour correspondre à la largeur de la Sidebar */
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  height: 80px;
  z-index: 1000;
  border-radius: 10px;
  background-color: transparent !important; /* Fond transparent */
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.search-box {
  position: relative;
  width: 300px;
  background-color: transparent; /* Fond transparent */
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  background-color: #f8fafc;
  transition: all 0.3s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #e7a534;
  background-color: white;
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
  background: transparent; /* Fond transparent */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.icon-button:hover {
  background: #f8fafc;
  border-color: #e7a534;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff6b6b;
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
  transition: all 0.2s;
  border: 1px solid transparent;
}

.profile-menu:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
}

.profile-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #2d3748;
}

.fa-chevron-down {
  font-size: 0.75rem;
  color: #a0aec0;
}
</style>