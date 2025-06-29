<template>
  <div class="header">
    <header class="header-container">
      <div class="nav-wrapper">
        <!-- Logo -->
        <router-link to="/" class="logo">
          <img src="../../assets/Images/Logo.png" alt="Logo" class="logo-img" />
        </router-link>

        <!-- Navigation Menu -->
        <nav class="nav-menu" :class="{ 'nav-active': isMenuOpen }">
          <ul>
            <li><router-link to="/" @click="closeMenu">Home</router-link></li>
            <li><router-link to="/about" @click="closeMenu">About</router-link></li>
            <li><router-link to="/services" @click="closeMenu">Services</router-link></li>
            <li><router-link to="/contact" @click="closeMenu">Contact</router-link></li>
          </ul>
        </nav>

        <!-- Auth Buttons -->
        <div class="auth-buttons">
          <button class="btn btn-login" @click="goToLogin">Log In</button>
          <button class="btn btn-signup" @click="goToSignup">Sign Up</button>
        </div>

        <!-- Mobile Menu Toggle -->
        <button class="mobile-toggle" @click="toggleMenu" aria-label="Toggle navigation menu">
          <span :class="{ 'active': isMenuOpen }"></span>
          <span :class="{ 'active': isMenuOpen }"></span>
          <span :class="{ 'active': isMenuOpen }"></span>
        </button>

        <!-- Social Links -->
        <div class="social-links">
          <a href="#" class="social-link" aria-label="Twitter"><i class="bi bi-twitter-x"></i></a>
          <a href="#" class="social-link" aria-label="Facebook"><i class="bi bi-facebook"></i></a>
          <a href="#" class="social-link" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
          <a href="#" class="social-link" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>
        </div>
      </div>
    </header>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const goToLogin = () => {
  closeMenu()
  router.push('/login')
}

const goToSignup = () => {
  closeMenu()
  router.push('/create-account')
}
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: 60px;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 100%;
}

.nav-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height:100%;
  gap: 2rem;
}

.logo-img {
  height: 60px;
  width: auto;
  transition: transform 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.logo-img:hover {
  transform: scale(1.05) rotate(-2deg);
}

.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-menu ul {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
  align-items: center;
}

.nav-menu a {
  color: #000000;
  font: bold 500 1rem 'Poppins', sans-serif;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  position: relative;
  letter-spacing: 0.3px;
}

.nav-menu a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #ed8946, #ff9a6c);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(-50%);
}

.nav-menu a:hover {
  color: #ed8946;
  transform: translateY(-1px);
}

.nav-menu a:hover::after {
  width: 70%;
}

.auth-buttons {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  position: relative;
  left: 120px;
}

.btn {
  padding: 0.5rem 1.2rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  letter-spacing: 0.3px;
  height: 36px;
  display: flex;
  align-items: center;
}

.btn-login {
  background: rgba(237, 137, 70, 0.1);
  color: #ed8946;
  border: 1.5px solid transparent;
}

.btn-login:hover {
  border-color: #ed8946;
  transform: translateY(-1px);
}

.btn-signup {
  background: linear-gradient(45deg, #ed8946, #ff9a6c);
  color: white;
}

.btn-signup:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(237, 137, 70, 0.3);
}

.social-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.social-link {
  color: #2d3436;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  padding: 0.3rem;
}

.social-link:hover {
  color: #ed8946;
  transform: translateY(-1px);
}

.mobile-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
}

.mobile-toggle span {
  display: block;
  width: 22px;
  height: 2px;
  background-color: #2d3436;
  transition: all 0.3s ease;
}

@media (max-width: 1024px) {
  .social-links {
    display: none;
  }
  
  .nav-wrapper {
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .header {
    height: 56px;
  }

  .nav-menu {
    position: fixed;
    top: 56px;
    left: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    padding: 1.5rem;
    transform: translateY(-100%);
    transition: transform 0.3s ease;
    visibility: hidden;
    backdrop-filter: blur(8px);
  }

  .nav-menu.nav-active {
    transform: translateY(0);
    visibility: visible;
  }

  .nav-menu ul {
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
  }

  .mobile-toggle {
    display: flex;
  }

  .auth-buttons {
    display: none;
  }

  .nav-active ~ .mobile-toggle span:nth-child(1) {
    transform: rotate(45deg) translate(6px, 6px);
    background-color: #ed8946;
  }

  .nav-active ~ .mobile-toggle span:nth-child(2) {
    opacity: 0;
  }

  .nav-active ~ .mobile-toggle span:nth-child(3) {
    transform: rotate(-45deg) translate(6px, -6px);
    background-color: #ed8946;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0 1rem;
  }

  .logo-img {
    height: 32px;
  }

  .nav-menu a {
    font-size: 0.9rem;
  }
}
</style>