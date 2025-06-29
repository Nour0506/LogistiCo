<template>
  <section class="about-section">
    <div class="about-content">
      <!-- 📸 Image à gauche -->
      <div class="image-container">
        <img src="../../assets/Images/abt.jpg" alt="Construction Team" />
      </div>

      <!-- 📄 Texte à droite avec features en bas -->
      <div class="text-container">
        <h3 class="section-subtitle">ABOUT US</h3>
        <h2 class="section-title">
          LogistiCo: Your Success is Our Priority
        </h2>
        <p class="description">
          With over two decades of experience in global logistics, we've built a reputation for
          reliability, innovation, and excellence in service delivery.
        </p>
        <p class="description">
          Our mission is to provide reliable, efficient, and sustainable logistics solutions that empower businesses to
          thrive in a competitive world. We are committed to building long-term partnerships with our clients by
          delivering exceptional service and value.
        </p>

        <!-- ✅ Features en bas -->
        <div class="features">
          <div class="feature-item">
            <span class="check-icon">✔</span> Innovation
          </div>
          <div class="feature-item">
            <span class="check-icon">✔</span> Reliability
          </div>
          <div class="feature-item">
            <span class="check-icon">✔</span> Sustainability
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
  background-color: #ffffff;
}

.about-content {
  display: flex;
  align-items: center;
  gap: 3rem; /* Espace réduit entre l'image et le texte */
  max-width: 1000px; /* Largeur maximale réduite (était 1400px) */
  width: 90%; /* Prend 90% de la largeur disponible */
  margin: 0 auto; /* Centrage */
}

.image-container {
  flex: 1; /* Espace égal pour l'image */
  display: flex;
  justify-content: center;
}

.image-container img {
  width: 100%;
  max-width: 450px; /* Taille d'image réduite (était 850px) */
  height: auto;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.text-container {
  flex: 1; /* Espace égal pour le texte */
  text-align: left;
}

.section-subtitle {
  color: #faa615;
  font-size: 1.5rem; /* Taille de police réduite */
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.section-title {
  font-size: 2rem; /* Taille réduite */
  font-weight: bold;
  color: #17181a;
  margin: 0.5rem 0 1.5rem;
}

.description {
  font-size: 1rem; /* Taille réduite */
  color: #475569;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.features {
  background: #f8fafc;
  padding: 1.2rem; /* Padding réduit */
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 1rem; /* Espace réduit */
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem; /* Taille réduite */
  color: #334155;
  white-space: nowrap;
}

.check-icon {
  color: #2d2309;
  font-size: 1rem; /* Taille réduite */
  font-weight: bold;
}

@media (max-width: 1024px) {
  .about-content {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
    max-width: 90%; /* Largeur réduite en responsive */
  }

  .image-container img {
    max-width: 100%;
  }

  .text-container {
    text-align: center;
  }

  .features {
    flex-direction: column;
    align-items: center;
    text-align: left;
  }
}

@media (max-width: 768px) {
  .about-section {
    padding: 2rem 1rem; /* Padding réduit sur mobile */
  }
  
  .section-subtitle {
    font-size: 1.2rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
}
</style>