<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>LogistiCo</h2>
    </div>
    <nav class="sidebar-nav">
      <ul>
        <li v-for="item in menuItems" :key="item.name">
          <router-link 
            :to="item.route" 
            class="nav-link" 
            :class="{ active: isActive(item.route) }"
          >
            <i :class="item.icon"></i>
            <span>{{ item.name }}</span>
          </router-link>
        </li>
      </ul>
      <div class="sidebar-footer">
        <button class="logout-btn" @click="logout">
          <i class="fas fa-sign-out-alt"></i>
          <span>Log Out</span>
        </button>
        <div class="app-version">v1.0</div>
      </div>
    </nav>
  </aside>
  <div class="content">
    <!-- Contenu principal ici -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

export default defineComponent({
  name: 'SideBar',
  setup() {
    const route = useRoute();
    
    const isActive = (path: string) => {
      return route.path === path;
    };

    return {
      isActive
    };
  },
  data() {
    return {
      menuItems: [
      { name: 'Dashboard',        route: '/dashCompany', icon: 'fas fa-home' },
      { name: 'Profile', route: '/profile', icon: 'fas fa-user' },
        { name: 'Trucks', route: '/DashCompany/trucks', icon: 'fas fa-truck' },
        { name: 'Warehouses', route: '/DashCompany/WareHouse', icon: 'fas fa-building' },
        { name: 'Transporters', route: '/DashCompany/TransEntrep', icon: 'fas fa-user-tie' },
        { name: 'Sales Points', route: '/DashCompany/SalePoint', icon: 'fas fa-store' },
        { name: 'Suppliers', route: '/DashCompany/Fourniss', icon: 'fas fa-store' },
        { name: 'Products', route: '/DashCompany/products', icon: 'fas fa-tags' },
        { name: 'Distribution Plan', route: '/DashCompany/distributionPlan', icon: 'fas fa-calendar-alt' },
      ]
    };
  },
  methods: {
    async logout() {
      try {
        await axios.post('/api/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
      } catch (error) {
        console.error('Error during logout:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
      }
    }
  }
});
</script>
<style scoped>
/* Sidebar fixe */
.sidebar {
  width: 250px; /* Largeur fixe */
  height: 100vh; /* Hauteur totale moins la hauteur de la NavBar */
  position: fixed; /* Fixe le sidebar sur le côté gauche */
  /* top: 50px; Démarre en dessous de la NavBar */
  left: 0;
  background-color: white; /* Couleur du fond */
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1); /* Ombre légère */
  overflow-y: auto; /* Ajoute un scroll si nécessaire */
  padding: 20px;
  z-index: 99; /* La Sidebar doit être en dessous de la NavBar */

}
.logout-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(237, 143, 154, 0.05);
  color: var(--danger);
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  margin-top: 100px;
}

.logout-btn i {
  margin-right: 0.75rem;
  font-size: 1rem;
}

.logout-btn:hover {
  background: rgba(136, 129, 130, 0.1);
}
/* Header du sidebar */
.sidebar-header {
  text-align: center;
  margin-bottom: 30px;
}

.sidebar-header h2 {
  font-size: 2rem;
  font-weight: bold;
  text-transform: uppercase;
  color: transparent;
  background: linear-gradient(90deg, #e7a534, #ff6b6b);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Navigation */
.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-nav li {
  font-size: 18px;
  margin-bottom: 10px;
}

/* Style des liens */
.nav-link {
  display: flex;
  align-items: center;
  padding: 10px;
  color: #151a1b;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link i {
  margin-right: 10px;
}

/* Hover et active */
.nav-link:hover {
  background: linear-gradient(90deg, #e7a534, #ff6b6b);
  border-radius: 18px;
}

.active {
  background-color: #ebf2f0;
}

/* Ajustement du contenu principal */
.content {
  margin-left: 250px; /* Décale le contenu principal */
  padding: 20px;
  width: calc(100% - 250px); /* Ajuste la largeur */
}
</style>
