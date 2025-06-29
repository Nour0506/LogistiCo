<template>
  <div class="app-container">
    <!-- Sidebar à gauche -->
    <Sidebar />

    <!-- Contenu principal -->
    <div class="main-content">
      <!-- NavBar en haut -->
      <NavBar />

      <!-- Contenu dynamique -->
      <div class="content-wrapper">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import Sidebar from '../components/CompanyDashboard/SideBar.vue';
import NavBar from '../components/CompanyDashboard/NavBar.vue';

export default {
  name: 'DefaultDashboard',
  components: {
    Sidebar,
    NavBar,
  },
};
</script>

<style>
/* Styles globaux */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}


Copy
.app-container {
  border-bottom: 1px solid #e2e8f0;

  display: flex !important;
  min-height: 100vh !important;
  /* background-color:  !important; */
  margin: 0 !important;
  padding: 0 !important;
  border: 2px solid blue; /* Bordures temporaires pour déboguer */
}

/* .main-content {
  flex-grow: 1 !important;
  width: 100% !important;
  min-height: 100vh !important;
  position: relative !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 0 !important;
   /* Bordures temporaires pour déboguer */


.content-wrapper {
  flex: 1; /* Prend tout l'espace disponible */
  width: calc(100% - 230px); /* Largeur totale moins la largeur de la Sidebar */
  margin-left: 250px; /* Décale le contenu pour laisser la place à la Sidebar */
  padding: 50px 45px  10px; /* Ajustez le padding si nécessaire */
  box-sizing: border-box; /* Inclut le padding dans la largeur totale */
}
</style>