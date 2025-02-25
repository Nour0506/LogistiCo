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
  gap: 4rem; /* Espace entre l'image et le texte */
  max-width: 1400px; /* Augmenter la largeur maximale du contenu */
}

/* ✅ Image plus grande à gauche */
.image-container {
  flex: 1.2; /* Donner plus d'espace à l'image */
  display: flex;
  justify-content: center;
  margin-right: 4rem; /* Espace entre l'image et le texte */
}

.image-container img {
  width: 100%;
  max-width: 850px; /* Agrandir davantage l'image */
  height: auto; /* Conserve les proportions */
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* ✅ Texte à droite */
.text-container {
  flex: 1;
  text-align: left;
}

.section-subtitle {
  color: #faa615; /* Jaune */
  font-size: 2rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #17181a;
  margin: 0.5rem 0 1.5rem;
}

.description {
  font-size: 1.2rem;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 1rem;
}

/* ✅ Features en bas */
.features {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column; /* Chaque élément sur une nouvelle ligne */
  gap: 1.5rem; /* Espace entre les éléments */
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  color: #334155;
  white-space: nowrap;
}

.check-icon {
  color: #2d2309; /* Bleu */
  font-size: 1.2rem;
  font-weight: bold;
}

/* ✅ Responsivité */
@media (max-width: 1024px) {
  .about-content {
    flex-direction: column;
    text-align: center;
    gap: 2rem; /* Réduire l'espace entre l'image et le texte en mode responsive */
  }

  .image-container {
    margin-right: 0; /* Supprimer la marge en mode responsive */
    flex: 1; /* Réinitialiser la flexibilité en mode responsive */
  }

  .image-container img {
    max-width: 100%; /* Permettre à l'image de s'adapter à la largeur de l'écran */
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
</style>