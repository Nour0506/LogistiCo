<template>
  <section class="services">
    <div class="services-container">
      <h2 class="section-title">Nos Services</h2>
      
      <div class="scroll-indicator left" @click="scrollLeft">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </div>
      
      <div class="service-grid" ref="serviceGrid">
        <div class="service-card">
          <div class="card-image">
            <img src="../../assets/Images/res4.jpg" alt="Traitement des contrats PDF" />
          </div>
          <div class="card-content">
            <h3>Traitement des contrats PDF</h3>
            <p>Analyse et extraction des informations des contrats PDF avec une précision maximale et une efficacité optimale.</p>
            <a href="#" class="learn-more">
              En savoir plus
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>

        <div class="service-card">
          <div class="card-image">
            <img src="../../assets/Images/res3.jpg" alt="Gestion des ressources" />
          </div>
          <div class="card-content">
            <h3>Gestion des ressources</h3>
            <p>Optimisation intelligente des transporteurs, dépôts et autres ressources pour une efficacité maximale.</p>
            <a href="#" class="learn-more">
              En savoir plus
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>

        <div class="service-card">
          <div class="card-image">
            <img src="../../assets/Images/dept.jpg" alt="Plan de distribution" />
          </div>
          <div class="card-content">
            <h3>Plan de distribution optimisé</h3>
            <p>Génération de plans détaillés et intelligents pour une distribution efficace et rentable.</p>
            <a href="#" class="learn-more">
              En savoir plus
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>

        <div class="service-card">
          <div class="card-image">
            <img src="../../assets/Images/res1.jpg" alt="Suivi des livraisons" />
          </div>
          <div class="card-content">
            <h3>Suivi et reporting des livraisons</h3>
            <p>Monitoring en temps réel et rapports détaillés pour un contrôle total de vos opérations.</p>
            <a href="#" class="learn-more">
              En savoir plus
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      <div class="scroll-indicator right" @click="scrollRight">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
      
      <div class="scroll-dots">
        <span v-for="(card, index) in 4" :key="index" 
              :class="{ active: currentCard === index }"
              @click="scrollToCard(index)"></span>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      currentCard: 0
    }
  },
  methods: {
    scrollLeft() {
      const grid = this.$refs.serviceGrid;
      grid.scrollBy({ left: -300, behavior: 'smooth' });
      this.updateActiveCard();
    },
    scrollRight() {
      const grid = this.$refs.serviceGrid;
      grid.scrollBy({ left: 300, behavior: 'smooth' });
      this.updateActiveCard();
    },
    scrollToCard(index) {
      const grid = this.$refs.serviceGrid;
      const cardWidth = grid.querySelector('.service-card').offsetWidth;
      grid.scrollTo({ left: index * (cardWidth + 32), behavior: 'smooth' });
      this.currentCard = index;
    },
    updateActiveCard() {
      const grid = this.$refs.serviceGrid;
      const cardWidth = grid.querySelector('.service-card').offsetWidth;
      this.currentCard = Math.round(grid.scrollLeft / (cardWidth + 32));
    }
  },
  mounted() {
    const grid = this.$refs.serviceGrid;
    grid.addEventListener('scroll', this.updateActiveCard);
  },
  beforeDestroy() {
    const grid = this.$refs.serviceGrid;
    grid.removeEventListener('scroll', this.updateActiveCard);
  }
}
</script>

<style scoped>
.services {
  padding: 6rem 1.5rem;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
  position: relative;
}

.services-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 2rem;
  position: relative;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  color: #1a1a1a;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -0.8rem;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #ed8946, #ff9a6c);
  border-radius: 2px;
}

.scroll-indicator {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  z-index: 2;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.scroll-indicator:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
}

.scroll-indicator.left {
  left: -20px;
}

.scroll-indicator.right {
  right: -20px;
}

.scroll-indicator svg {
  width: 20px;
  height: 20px;
}

.service-grid::-webkit-scrollbar {
  display: none;
}
.service-grid {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
}

.service-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  width: 300px; /* Largeur fixe au lieu de min-width */
  flex: 0 0 300px; /* flex-grow, flex-shrink, flex-basis */
}


.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 35px rgba(0, 0, 0, 0.08);
}

.card-image {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.service-card:hover .card-image img {
  transform: scale(1.1);
}

.card-content {
  padding: 1.5rem;
  background: white;
}

.card-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.75rem;
}

.card-content p {
  font-size: 0.95rem;
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.learn-more {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #ed8946;
  text-decoration: none;
  transition: all 0.3s ease;
}

.learn-more svg {
  transition: transform 0.3s ease;
}

.learn-more:hover {
  color: #ff9a6c;
}

.learn-more:hover svg {
  transform: translateX(4px);
}

.scroll-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 1.5rem;
}

.scroll-dots span {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.scroll-dots span.active {
  background: #ed8946;
  transform: scale(1.2);
}

.scroll-dots span:hover {
  background: #cbd5e0;
}

@media (max-width: 768px) {
  .services {
    padding: 4rem 1rem;
  }

  .section-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .service-grid {
    gap: 1.5rem;
  }

  .card-image {
    height: 200px;
  }

  .scroll-indicator {
    width: 35px;
    height: 35px;
  }

  .scroll-indicator.left {
    left: -15px;
  }

  .scroll-indicator.right {
    right: -15px;
  }
}
@media (max-width: 480px) {
  .service-card {
    width: 280px;
    flex: 0 0 280px;
  }
  .section-title {
    font-size: 1.75rem;
  }

  .card-content {
    padding: 1.25rem;
  }

  .card-content h3 {
    font-size: 1.1rem;
  }

  .card-content p {
    font-size: 0.9rem;
  }

  .service-card {
    min-width: 260px;
  }

  .scroll-indicator {
    width: 30px;
    height: 30px;
  }

  .scroll-indicator svg {
    width: 16px;
    height: 16px;
  }
}
</style>