<template>
  <footer id="footer" class="wrapper">
    <div class="inner">
      <section>
        <div class="box">
          <div class="content">
            <h2 class="align-center"><span class="icon">📦</span> Log In</h2>
            <hr />
            <form @submit.prevent="handleLogin">
              <!-- Email or Phone -->
              <div class="field">
                <label for="identifier">Login </label>
                <input
                  v-model="identifier"
                  id="identifier"
                  type="text"
                  placeholder="Email or Phone number"
                  required
                />
              </div>

              <!-- Password -->
              <div class="field">
                <label for="password">Password</label>
                <div class="password-container">
                  <input
                    v-model="password"
                    id="password"
                    type="password"
                    placeholder="password"
                    required
                  />
                  <span class="password-icon">🔒</span>
                </div>
              </div>

              <!-- Login Button -->
              <div class="field align-center">
                <button type="submit" class="button primary">Se Connecter</button>
              </div>

              <!-- Forgot Password -->
              <div class="field align-center">
                <a href="#" class="forgot-password">forgot password ?</a>
              </div>

              <button type="button" id="butt" @click="goToCreateAccount">
                Create an entreprise account
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  </footer>
</template>

<script lang="ts">
import { useRouter } from 'vue-router' // Assure-toi que cela est importé

export default {
  name: 'FooterPage',

  setup() {
    const router = useRouter() // Utilisation du router dans la fonction setup

    const goToCreateAccount = () => {
      router.push('/create-account') // Redirection vers la page de création de compte
    }

    return { goToCreateAccount }
  },
}
</script>

<style scoped>
/* Arrière-plan plus clair et espacé */
#footer {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.9));
  padding: 80px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

/* Conteneur central avec plus d'espace */
.inner {
  max-width: 500px;
  width: 100%;
  margin: auto;
}

/* Effet de carte plus clair */
.box {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  padding: 40px;
  text-align: center;
  animation: fadeIn 1s ease-in-out;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h2 {
  font-size: 30px;
  color: #333;
  margin-bottom: 15px;
  letter-spacing: 1px;
}

/* Ligne de séparation */
hr {
  border: 0;
  height: 1px;
  background: #ddd;
  opacity: 0.8;
  margin: 15px 0;
}

/* Champs de formulaire avec plus d'espace */
.field {
  margin-bottom: 25px;
  text-align: left;
}

.field label {
  font-size: 14px;
  color: #555;
  display: block;
  margin-bottom: 5px;
}

/* Input Styling */
.field input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: white;
  color: #333;
  outline: none;
  transition: 0.3s;
}

/* Effet au focus */
.field input:focus {
  border-color: #007bff;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.2);
}

/* Style du bouton */
.button.primary {
  background: linear-gradient(45deg, #ff5722, #ff9800);
  color: white;
  border: none;
  padding: 14px;
  font-size: 18px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
  width: 100%;
  font-weight: bold;
}

/* Effet au survol */
.button.primary:hover {
  background: linear-gradient(45deg, #ff9800, #ff5722);
  box-shadow: 0 4px 15px rgba(255, 87, 34, 0.4);
}

/* Liens améliorés */
.forgot-password {
  display: inline-block;
  margin-top: 15px;
  font-size: 14px;
  color: #007bff;
  text-decoration: none;
  transition: 0.3s;
  align-items: center;
  margin-left: 10rem;
  margin-top: 0.5rem;
}

.forgot-password:hover {
  color: #0056b3;
  text-decoration: underline;
}

/* Password container */
.password-container {
  position: relative;
}

.password-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .box {
    padding: 30px;
  }

  h2 {
    font-size: 26px;
  }

  .button.primary {
    font-size: 16px;
  }
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
  width: 20rem;
  /* Centre verticalement */
  margin-left: 50px;
  position: relative;
  right: 2rem;
}

/* Effet au survol */
#but:hover {
  background: linear-gradient(45deg, #ed8946bd, #fcbfadd0);
  box-shadow: 0 4px 15px rgba(104, 30, 7, 0.4);
}
</style>
