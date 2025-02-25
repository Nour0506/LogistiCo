<template>
  <footer id="footer">
    <div class="container">
      <div class="column">
        <h3>ABOUT US</h3>
        <p>
          Since 2025 , LogistiCo streamlines storage and distribution, simplifying warehouse and
          transport management. 🚛📦
        </p>
      </div>

      <div class="column">
        <h3>NAVIGATION</h3>
        <ul>
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
        <ul>
          <li>Warehousing</li>
          <li>Distribution</li>
        </ul>
      </div>

      <div class="column">
        <h3>CONTACT DETAILS</h3>
        <ul class="contact-info">
          <li>📍 LogistiCo .</li>
          <li>📧 sales@LogistiCo.com / contact@logistiCO.com</li>
          <li>📞 +216 31 550 533</li>
          <li>📞 +216 72 512 800</li>
        </ul>
      </div>
    </div>
  </footer>
</template>
<script lang="ts">
export default {
  name: 'ContactSection',
}
</script>

<style scoped>
/* Footer Styling */
#footer {
  background: #15151dee;
  color: #ffffff;
  padding: 40px 0;
  font-size: 14px;
}

.container {
  display: flex;
  justify-content: space-between;
  max-width: 1100px;
  margin: 0 auto;
}

.column {
  flex: 1;
  padding: 0 15px;
}

h3 {
  color: #1e90ff;
  margin-bottom: 15px;
  font-size: 16px;
}

p {
  line-height: 1.6;
}

ul {
  list-style: none;
  padding: 0;
}

ul li {
  margin-bottom: 8px;
}

ul li a {
  color: #ccc;
  text-decoration: none;
  transition: 0.3s;
}

ul li a:hover {
  color: #1e90ff;
}

.contact-info li {
  display: flex;
  align-items: center;
}

.contact-info li::before {
  margin-right: 8px;
}

/* Responsive */
@media (max-width: 200px) {
  .container {
    flex-direction: column;
    text-align: center;
  }

  .column {
    padding: 10px 0;
  }
}
</style>
