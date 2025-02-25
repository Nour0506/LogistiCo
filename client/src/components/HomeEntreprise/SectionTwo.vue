

<template>
  <section class="services">
    <h2>Nos Services</h2>
    <div class="service-container">
      <div class="service-card">
        <img src="../../assets/Images/res4.jpg" alt="Traitement des contrats PDF" class="background-image" />
        <div class="service-info">
          <h3>Traitement des contrats PDF</h3>
          <p>Analyse et extraction des informations des contrats PDF.</p>
          <a href="#" class="view-more">Voir plus →</a>
        </div>
      </div>

      <div class="service-card">
        <img src="../../assets/Images/res3.jpg" alt="Gestion des ressources" class="background-image" />
        <div class="service-info">
          <h3>Gestion des ressources</h3>
          <p>Optimisation des transporteurs, dépôts et autres ressources.</p>
          <a href="#" class="view-more">Voir plus →</a>
        </div>
      </div>

      <div class="service-card">
        <img src="../../assets/Images/dept.jpg" alt="Gestion des ressources" class="background-image" />
        <div class="service-info">
          <h3>Plan de distribution optimisé</h3>
          <p>Génération de plans détaillés pour une distribution efficace.</p>
          <a href="#" class="view-more">Voir plus →</a>
        </div>
      </div>

      <div class="service-card">
        <img src="../../assets/Images/res1.jpg" alt="Gestion des ressources" class="background-image" />
        <div class="service-info">
          <h3>Suivi et reporting des livraisons</h3>
          <p>Monitoring en temps réel et rapports de suivi.</p>
          <a href="#" class="view-more">Voir plus →</a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Conteneur principal */
.services {
  text-align: center;
  padding: 50px 20px;
  background: #f9f9f9;
}

/* Organisation des cartes */
.service-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

/* Carte individuelle */
.service-card {
  position: relative;
  width: 360px;
  height: 330px; /* Hauteur fixe pour toutes les cartes */
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
}

.service-card:hover {
  transform: scale(1.02);
}
.service-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2; /* Place l'overlay au-dessus de l'image mais en dessous du contenu */
}
/* Image de fond simulée */
.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* Couvre toute la carte */
  z-index: 1; /* Place l'image en arrière-plan */
}

/* Bloc info superposé */
.service-info {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 10px;
  background: rgba(255, 253, 253, 0.9); /* Fond semi-transparent */
  z-index: 3; /* Place le contenu au-dessus de l'image et de l'overlay */
  border-radius: 5px 5 5px 5px; /* Coins arrondis uniquement en bas */
  box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.1); /* Ombre portée pour le contenu */
  max-height: 40%; /* Limiter la hauteur du bloc */
  overflow: hidden;
}

/* Titres et texte */
h3 {
  font-size: 16px;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 8px;
}

p {
  font-size: 14px;
  color: #090707;
  margin-bottom: 8px;
}

/* Lien Voir Plus */
.view-more {
  display: inline-block;
  font-size: 14px;
  color: #2563eb;
  font-weight: 500;
  text-decoration: none;
}

.view-more:hover {
  text-decoration: underline;
}
</style>