<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>LogistiCo</h2>
    </div>
    <nav class="sidebar-nav">
      <ul>
        <li v-for="item in menuItems" :key="item.name">
          <router-link :to="item.route" class="nav-link" active-class="active">
            <i :class="item.icon"></i>
            <span>{{ item.name }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
  <div class="content">
    <!-- <router-view></router-view>  -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();

export default defineComponent({
  name: 'SideBar',
  data() {
    return {
      menuItems: [
        { name: 'Dashboard', route: '/dash_page/SideBar2', icon: 'fas fa-home' },
        { name: 'Vehicles', route: '/dash_page/SidBare', icon: 'fas fa-truck' },
        { name: 'Warehouses', route: '/dash_page/WareHouse', icon: 'fas fa-building' },
        { name: 'Transporteurs', route: '/dash_page/TransEntrep', icon: 'fas fa-user-tie' },
        { name: 'Sales Points', route: '/dash_page/SalePoint', icon: 'fas fa-store' },
        { name: ' Fournisseur', route: '/dash_page/Fourniss', icon: 'fas fa-store' },

        { name: 'Settings', route: '/settings', icon: 'fas fa-cog' }
      ]
    };
  }
});
const isActive =(path:string)=>route.path===path;
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
  background-color: #1abc9c;
}

/* Ajustement du contenu principal */
.content {
  margin-left: 250px; /* Décale le contenu principal */
  padding: 20px;
  width: calc(100% - 250px); /* Ajuste la largeur */
}
</style>
