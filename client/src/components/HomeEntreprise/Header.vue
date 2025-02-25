<template>
  <div class="header">
    <header id="header1" class="header d-flex align-items-center light-background sticky-top">
      <div class="container">
        <div class="header-content d-flex align-items-center justify-content-between">
          <!-- Logo -->
          <router-link to="/" class="logo">
            <img src="../../assets/Images/Logo.png" alt="Logo" class="logo-img" />
          </router-link>

          <!-- Menu de navigation -->
          <nav id="navmenu" class="navmenu">
            <ul class="d-flex align-items-center w-100">
              <li><router-link to="/">Home</router-link></li>
              <li><router-link to="/about ">About</router-link></li>
              <li><router-link to="/services">Services</router-link></li>
              <li><router-link to="/contact">Contact</router-link></li>
            </ul>
          </nav>
          <button type="button" id="but">Log In</button>
          <button type="button" id="butt">Sign Up</button>

          <!-- Bouton de menu mobile -->
          <div class="mobile-nav-toggle d-xl-none" >
            <i class="bi bi-list"></i>
          </div>

          <!-- Liens sociaux -->
          <div class="header-social-links d-flex align-items-center">
            <a href="#" class="twitter"><i class="bi bi-twitter-x"></i></a>
            <a href="#" class="facebook"><i class="bi bi-facebook"></i></a>
            <a href="#" class="instagram"><i class="bi bi-instagram"></i></a>
            <a href="#" class="linkedin"><i class="bi bi-linkedin"></i></a>
          </div>
        </div>
      </div>
    </header>
  </div>
</template>

<script lang="ts">
export default {
  name: 'HeaderPage',
}
</script>
<style>
/* Styles de base */
.header {
  position: fixed; /* Change de fixed à relative pour éviter qu'elle reste affichée sur toutes les pages */
  width: 100%;
  background-color: rgba(0, 0, 0, 0.303);
  z-index: 997;
  padding: 5px 0;
  transition: background-color 0.3s ease;
  height: 70px;
  display: flex;
  align-items: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%; /* S'assurer que le conteneur prend toute la largeur disponible */
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%; /* Permet aux éléments de s'ajuster à la largeur */
}

.logo-img {
  height: 90px;
  position: absolute;
  width: auto;
  max-height: 80px;
  left: 25px;
  top: 2px; /* Limiter la hauteur au maximum */
}

.navmenu ul {
  margin: 0;
  padding: 0;
  display: flex;
  list-style: none;
  width: 100%; /* Permet au menu de s'étendre sur toute la largeur */
  justify-content: flex-end; /* Aligner les éléments du menu à droite sur large écran */
}

.navmenu li {
  margin: 0 30px;
}

.navmenu a {
  color: #ffffff;
  font-size: 16px;
  text-decoration: none;
  transition: color 0.3s ease;
}

.navmenu a:hover,
.navmenu a:focus,
.navmenu .active {
  color: #ba752c;
}

/* Liens sociaux */
.header-social-links a {
  color: #ffffff;
  margin-left: 15px;
  font-size: 16px;
  transition: color 0.3s ease;
}

.header-social-links a:hover {
  color: #007bff;
}

/* Bouton de menu mobile */
.mobile-nav-toggle {
  display: none;
  font-size: 24px;
  color: #ffffff;
  cursor: pointer;
}

/* Styles pour les écrans de petite taille */
@media (max-width: 768px) {
  .header {
    height: 60px; /* Réduire la hauteur sur mobile */
    padding: 5px 0;
  }

  .logo-img {
    height: 50px; /* Réduire la taille du logo */
  }

  .navmenu ul {
    display: none;
    flex-direction: column;
    align-items: flex-start;
    position: absolute;
    top: 60px;
    left: 0;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 10px 20px;
    box-sizing: border-box;
  }

  .navmenu.active ul {
    display: flex;
  }

  .navmenu li {
    margin: 10px 0;
  }

  .header-social-links {
    display: none; /* Masquer les icônes sociales sur mobile */
  }

  .mobile-nav-toggle {
    display: block; /* Afficher le bouton de menu mobile */
  }

  /* Rendre le bouton visible sur mobile */
  .navmenu .button {
    display: block;
    margin-top: 15px;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .header {
    height: 50px; /* Ajuster la hauteur sur très petits écrans */
  }

  .logo-img {
    height: 40px; /* Réduire encore la taille du logo */
  }

  .navmenu ul {
    top: 50px;
  }

  .navmenu a {
    font-size: 12px;
  }
}

.button.primary {
  background: linear-gradient(45deg, #ff5722, #ff9800);
  color: white;
  border: none;
  padding: 14px;
  font-size: 15px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
  width: 100%;
  font-weight: bold;
  line-height: 0.5rem;
}

/* Effet au survol */
.button.primary:hover {
  background: linear-gradient(45deg, #ff9800, #ff5722);
  box-shadow: 0 4px 15px rgba(255, 87, 34, 0.4);
}
#but {
  background: linear-gradient(45deg, #fcbfadd0, #ed8946bd);
  color: white;
  border: none;
  padding: 14px;
  font-size: 15px;
  border-radius: 80px;
  cursor: pointer;
  transition: 0.3s;
  width: 6rem;
  /* Centre verticalement */
  margin-left: 50px;
  position: absolute;
  right: 4rem;
}

/* Effet au survol */
#but:hover {
  background: linear-gradient(45deg, #ed8946bd, #fcbfadd0);
  box-shadow: 0 4px 15px rgba(104, 30, 7, 0.4);
}
#butt {
  background: linear-gradient(45deg, #fcbfadd0, #ed8946bd);
  color: white;
  border: none;
  padding: 14px;
  font-size: 15px;
  border-radius: 80px;
  cursor: pointer;
  transition: 0.3s;
  width: 6rem;
  /* Centre verticalement */
  margin-left: 50px;
  position: absolute;
  right: 11rem;
}

/* Effet au survol */
#butt:hover {
  background: linear-gradient(45deg, #ed8946bd, #fcbfadd0);
  box-shadow: 0 4px 15px rgba(104, 30, 7, 0.4);
}
</style>
