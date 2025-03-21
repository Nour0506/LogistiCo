<template>
  <footer id="footer" class="wrapper">
    <div class="inner">
      <section>
        <div class="box">
          <div class="content">
            <h2 class="align-center">Log in to LogistiCo<span class="icon">📦</span></h2>
            <hr />
            <form @submit.prevent="handleLogin">
              <!-- Email or Phone -->
              <div class="field">
                <label for="identifier">Login</label>
                <input
                  v-model="loginData.identifier"
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
                    v-model="loginData.password"
                    id="password"
                    type="password"
                    placeholder="Password"
                    required
                  />
                  <span class="password-icon">🔒</span>
                </div>
              </div>

              <!-- Login Button -->
              <div class="field align-center">
                <button type="submit" class="button primary" :disabled="isLoading">
                  {{ isLoading ? 'Loading...' : 'Log in' }}
                </button>
              </div>

              <!-- Forgot Password -->
              <div class="field align-center">
                <a href="#" class="forgot-password" @click.prevent="showForgotPasswordAlert">Forgot password?</a>
              </div>

              <!-- Link to create an account -->
              <div class="field align-center">
                <p class="create-account-text">
                  Don't have an account? 
                  <a href="#" @click.prevent="goToCreateAccount" class="create-account-link">Create now!</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  </footer>
</template>

<script lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2'; // Importez SweetAlert2

interface LoginData {
  identifier: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    role: string;
  };
  error?: string;
}

export default {
  name: 'FooterPage',

  setup() {
    const router = useRouter();

    const loginData = ref<LoginData>({
      identifier: '',
      password: '',
    });

    const isLoading = ref(false); // Indicateur de chargement

    // Rediriger vers la page de création de compte
    const goToCreateAccount = () => {
      router.push('/create-account');
    };

    // Fonction pour gérer la redirection en fonction du rôle
    const redirectBasedOnRole = (role: string) => {
      const normalizedRole = role.toLowerCase();

      switch (normalizedRole) {
        case 'admin':
          router.push('/admin-dashboard');
          break;
        case 'entreprise':
          router.push('/company-dashboard');
          break;
        case 'transporteur':
          router.push('/transporteur-dashboard');
          break;
        default:
          router.push('/dashboard'); // Redirection par défaut
      }
    };

    // Gérer la logique de connexion
    const handleLogin = async () => {
      if (!loginData.value.identifier || !loginData.value.password) {
        alert('Veuillez remplir tous les champs.');
        return;
      }

      isLoading.value = true; // Activer l'indicateur de chargement

      try {
        // Envoyer la requête de connexion
        const response = await fetch('http://localhost:3000/api/authCompany/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: loginData.value.identifier,
            password: loginData.value.password,
          }),
        });

        // Vérifier si la réponse est OK
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur inconnue lors de la connexion.');
        }

        // Traiter la réponse JSON
        const data: LoginResponse = await response.json();
        console.log('Réponse du serveur:', data); // Inspectez la réponse du serveur

        // Vérifier que data.user existe
        if (!data.user || !data.user.role) {
          throw new Error('Données utilisateur manquantes dans la réponse du serveur.');
        }

        // Stocker les tokens dans le localStorage
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        // Stocker le rôle dans le localStorage
        localStorage.setItem('role', data.user.role);

        // Rediriger en fonction du rôle
        redirectBasedOnRole(data.user.role);
      } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        const errorMessage = (error as Error).message || 'Erreur interne du serveur.';
        alert(errorMessage);
      } finally {
        isLoading.value = false; // Désactiver l'indicateur de chargement
      }
    };

    const showForgotPasswordAlert = () => {
  Swal.fire({
    title: 'Forgot Password?',
    text: 'Please enter your email address to reset your password.',
    input: 'email',
    inputPlaceholder: 'Enter your email',
    showCancelButton: true,
    confirmButtonText: 'Send OTP',
    cancelButtonText: 'Cancel',
    showLoaderOnConfirm: true,
    preConfirm: async (email) => {
      try {
        // Envoyer une requête pour générer et envoyer l'OTP
        const response = await fetch('http://localhost:3000/api/otp/request-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        return await response.json();
      } catch (error) {
        Swal.showValidationMessage(`Request failed: ${(error as Error).message}`);
      }
    },
    allowOutsideClick: () => !Swal.isLoading(),
  }).then((result) => {
    if (result.isConfirmed) {
      const email = result.value.email; // Récupérer l'e-mail de l'utilisateur

      // Afficher une nouvelle SweetAlert pour entrer l'OTP
      Swal.fire({
        title: 'Enter OTP',
        text: 'A 6-digit OTP has been sent to your email. It will expire in 10 minutes.',
        input: 'text',
        inputPlaceholder: 'Enter OTP',
        showCancelButton: true,
        confirmButtonText: 'Verify OTP',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: true,
        preConfirm: async (otp) => {
          try {
            // Vérifier l'OTP
            const response = await fetch('http://localhost:3000/api/otp/verify-otp', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, otp }),
            });

            if (!response.ok) {
              throw new Error(response.statusText);
            }

            const data = await response.json();
            return { email, otp, resetToken: data.resetToken }; // Return the resetToken
          } catch (error) {
            Swal.showValidationMessage(`OTP verification failed: ${(error as Error).message}`);
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      }).then((otpResult) => {
        if (otpResult.isConfirmed) {
          const { resetToken } = otpResult.value;

          // Afficher une nouvelle SweetAlert pour entrer un nouveau mot de passe
          Swal.fire({
            title: 'Reset Password',
            html: `
              <input type="password" id="newPassword" class="swal2-input" placeholder="New Password">
              <input type="password" id="confirmPassword" class="swal2-input" placeholder="Confirm Password">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Reset Password',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
              const newPasswordElement = Swal.getPopup()?.querySelector('#newPassword');
              if (!newPasswordElement) {
                Swal.showValidationMessage('New password element not found.');
                return;
              }
              const newPassword = newPasswordElement ? (newPasswordElement as HTMLInputElement).value : '';
              const confirmPasswordElement = Swal.getPopup()?.querySelector('#confirmPassword');
              const confirmPassword = confirmPasswordElement ? (confirmPasswordElement as HTMLInputElement).value : '';

              if (!newPassword || !confirmPassword) {
                Swal.showValidationMessage('Please fill in both fields.');
              } else if (newPassword !== confirmPassword) {
                Swal.showValidationMessage('Passwords do not match.');
              }

              return { newPassword, confirmPassword };
            },
          }).then((passwordResult) => {
            if (passwordResult.isConfirmed) {
              const { newPassword, confirmPassword } = passwordResult.value;

              // Envoyer une requête pour réinitialiser le mot de passe
              fetch('http://localhost:3000/api/otp/reset-password', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  resetToken, // Include the resetToken
                  newPassword,
                  passwordConfirmation: confirmPassword,
                }),
              })
                .then((response) => {
                  if (!response.ok) {
                    throw new Error(response.statusText);
                  }
                  return response.json();
                })
                .then(() => {
                  Swal.fire({
                    title: 'Success!',
                    text: 'Your password has been reset successfully.',
                    icon: 'success',
                  });
                })
                .catch((error) => {
                  Swal.fire({
                    title: 'Error!',
                    text: `Failed to reset password: ${error.message}`,
                    icon: 'error',
                  });
                });
            }
          });
        }
      });
    }
  });
};
    return { loginData, goToCreateAccount, handleLogin, isLoading, showForgotPasswordAlert };
  },
};
</script>
<style scoped>
.create-account-text {
  font-size: 14px;
  color: #555;
  margin-top: 15px;
}

.create-account-link {
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
  transition: 0.3s;
}

.create-account-link:hover {
  color: #0056b3;
  text-decoration: underline;
}
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
