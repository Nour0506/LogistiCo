<template>
    <div class="dashboard-container">
        <h1 class="dashboard-title">Dashboard Entreprise</h1>
        <p class="dashboard-subtitle">Bienvenue dans votre espace de gestion.</p>
        <div class="cards-container">
          <div class="card">
            <h3>Entrepôts actifs</h3>
            <p>5</p>
          </div>
          <div class="card">
            <h3>Produits en transit</h3>
            <p>12</p>
          </div>
          <div class="card">
            <h3>Commandes en attente</h3>
            <p>7</p>
          </div>
        </div>
      </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name:"BoardPage",
})
</script>
<style scoped>
  /* Layout global du dashboard */
  .dashboard-wrapper {
    display: flex;
    min-height: 100vh;
  }
  
  /* Contenu principal à droite */
  .dashboard-container {
    flex: 1;
    padding: 20px;
    background-color: #f4f4f4;
    text-align: center;
  }
  
  /* Titre principal */
  .dashboard-title {
    font-size: 28px;
    font-weight: bold;
    color: #333;
  }
  
  /* Sous-titre */
  .dashboard-subtitle {
    font-size: 16px;
    color: #666;
    margin-bottom: 20px;
  }
  
  /* Conteneur des cartes */
  .cards-container {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
    margin-top: 20px;
  }
  
  /* Style des cartes */
  .card {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
    width: 250px;
    transition: transform 0.3s ease-in-out;
  }
  
  .card h3 {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }
  
  .card p {
    font-size: 24px;
    font-weight: bold;
    color: #007bff;
    margin-top: 10px;
  }
  
  /* Effet au survol sur les cartes */
  .card:hover {
    transform: scale(1.05);
  }
  </style>
  