<template>
  <footer id="footer">
    <div class="container">
      <div class="column">
        <h3>ABOUT US</h3>
        <p>
          Since 2025, LogistiCo has been revolutionizing logistics through innovative solutions. We streamline storage and distribution, making warehouse and transport management effortless. Our commitment to excellence drives every operation. 🚛📦
        </p>
        <div class="social-links">
          <a href="#" class="social-link" aria-label="LinkedIn">
            <i class="fab fa-linkedin"></i>
          </a>
          <a href="#" class="social-link" aria-label="Twitter">
            <i class="fab fa-twitter"></i>
          </a>
          <a href="#" class="social-link" aria-label="Facebook">
            <i class="fab fa-facebook"></i>
          </a>
        </div>
      </div>

      <div class="column">
        <h3>NAVIGATION</h3>
        <ul class="nav-links">
          <li><a href="#">Accueil</a></li>
          <li><a href="#">À propos</a></li>
          <li><a href="#">Nos services</a></li>
          <li><a href="#">Logistique</a></li>
          <li><a href="#">Devis</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>

      <div class="column">
        <h3>SERVICES</h3>
        <ul class="services-list">
          <li>
            <span class="service-icon">📦</span>
            Warehousing Solutions
          </li>
          <li>
            <span class="service-icon">🚚</span>
            Distribution Network
          </li>
          <li>
            <span class="service-icon">📊</span>
            Inventory Management
          </li>
          <li>
            <span class="service-icon">🌐</span>
            Global Logistics
          </li>
        </ul>
      </div>

      <div class="column">
        <h3>CONTACT DETAILS</h3>
        <ul class="contact-info">
          <li>
            <span class="contact-icon">📍</span>
            <span>LogistiCo Headquarters</span>
          </li>
          <li>
            <span class="contact-icon">📧</span>
            <div class="email-group">
              <a href="mailto:sales@LogistiCo.com">sales@LogistiCo.com</a>
              <a href="mailto:contact@logistiCO.com">contact@logistiCO.com</a>
            </div>
          </li>
          <li>
            <span class="contact-icon">📞</span>
            <div class="phone-group">
              <a href="tel:+21631550533">+216 31 550 533</a>
              <a href="tel:+21672512800">+216 72 512 800</a>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2025 LogistiCo. All rights reserved.</p>
    </div>
  </footer>
</template>

<script lang="ts">
export default {
  name: 'FooterSection',
}
</script>

<style scoped>
/* Footer Styling */
#footer {
  background: linear-gradient(to bottom, #1a1f36, #111827);
  color: #e5e7eb;
  padding: 60px 0 0;
  font-size: 0.95rem;
  position: relative;
  overflow: hidden;
}

#footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(59, 130, 246, 0.5), transparent);
}

.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.column {
  display: flex;
  flex-direction: column;
}

h3 {
  color: #3b82f6;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  position: relative;
  padding-bottom: 0.75rem;
}

h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 2px;
  background: linear-gradient(to right, #3b82f6, transparent);
}

p {
  line-height: 1.8;
  color: #9ca3af;
  margin-bottom: 1.5rem;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-links li {
  margin-bottom: 0.75rem;
  transition: transform 0.2s;
}

.nav-links li:hover {
  transform: translateX(5px);
}

ul li a {
  color: #9ca3af;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
}

ul li a:hover {
  color: #3b82f6;
}

.services-list li {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  color: #9ca3af;
}

.service-icon {
  margin-right: 0.75rem;
  font-size: 1.25rem;
}

.contact-info li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.contact-icon {
  margin-right: 0.75rem;
  font-size: 1.25rem;
}

.email-group, .phone-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.email-group a, .phone-group a {
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.3s ease;
}

.email-group a:hover, .phone-group a:hover {
  color: #3b82f6;
}

.social-links {
  display: flex;
  gap: 1rem;
  margin-top: auto;
}

.social-link {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: #3b82f6;
  color: white;
  transform: translateY(-2px);
}

.footer-bottom {
  margin-top: 3rem;
  padding: 1.5rem 0;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
}

.footer-bottom p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
  }

  h3 {
    margin-bottom: 1rem;
  }

  .column {
    text-align: center;
  }

  h3::after {
    left: 50%;
    transform: translateX(-50%);
  }

  .contact-info li, .services-list li {
    justify-content: center;
  }

  .social-links {
    justify-content: center;
  }

  .nav-links li:hover {
    transform: none;
  }
}

@media (max-width: 480px) {
  #footer {
    padding: 40px 0 0;
  }

  .container {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .column {
    padding: 0 1rem;
  }
}
</style>
