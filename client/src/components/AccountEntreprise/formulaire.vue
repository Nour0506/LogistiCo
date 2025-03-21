<template>
  <div class="account-settings">
    <div class="overlay"></div> <!-- Transparent overlay on top of the background -->
    <div class="form-container">
      <div class="logo-container">
        <img src="../../assets/Images/Logo.png" alt="Logo" class="logo" />
      </div>
      

      <form @submit.prevent="saveSettings" class="settings-form">
        <div class="form-section">
          <h2 class="section-title">Company Information</h2>

          <div class="form-group">
            <label class="input-label">
              <i class="fas fa-building icon-dark"></i> Company Name
            </label>
            <input type="text" v-model="company.companyName" class="custom-input" required />
          </div>

          <div class="form-group">
            <label class="input-label">
              <i class="fas fa-phone icon-dark"></i> Phone Number
            </label>
            <input type="text" v-model="company.phoneNumber" class="custom-input" required />
          </div>

          <div class="form-group">
            <label class="input-label">
              <i class="fas fa-file-invoice icon-dark"></i> Fiscal Identification Number
            </label>
            <input type="text" v-model="company.taxRegistrationNumber" class="custom-input" required />
          </div>

          <div class="form-group">
            <label class="input-label">
              <i class="fas fa-gavel icon-dark"></i> Legal Status
            </label>
            <select v-model="company.legalStatus" class="custom-input" required>
              <option value="SA">SA</option>
              <option value="SARL">SARL</option>
              <option value="SAS">SAS</option>
              <option value="Sole Proprietorship">SNC</option>
            </select>
          </div>

          <div class="form-group">
            <label class="input-label">
              <i class="fas fa-map-marker-alt icon-dark"></i> Registered Office Address
            </label>
            <input type="text" v-model="company.registeredOfficeAddress" class="custom-input" required />
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">Account Settings</h2>

          <div class="form-group">
            <label class="input-label">
              <i class="fas fa-envelope icon-dark"></i> Email
            </label>
            <input type="email" v-model="company.email" class="custom-input" required />
          </div>

          <div class="form-group">
  <label class="input-label">
    <i class="fas fa-lock icon-dark"></i> Password
  </label>
  <input
    type="password"
    v-model="company.password"
    class="custom-input"
    required
    :class="{ 'input-error': !isPasswordStrong(company.password) && company.password.length > 0 }"
  />
  <span v-if="!isPasswordStrong(company.password) && company.password.length > 0" class="error-text">
    The password must contain at least 8 characters, an uppercase letter, a number and a special character.
  </span>
</div>


          <div class="form-group">
            <label class="input-label">
              <i class="fas fa-lock icon-dark"></i> Confirm Password
            </label>
            <input
              type="password"
              v-model="company.confirmPassword"
              class="custom-input"
              required
              :class="{ 'input-error': passwordMismatch }"
            />
            <span v-if="passwordMismatch" class="error-text">Passwords do not match</span>
          </div>
        </div>

        <div class="action-buttons">
          <button type="submit" class="save-btn">Send Authorization</button>
          <button type="button" @click="cancel" class="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template><script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';

export default defineComponent({
  name: 'FormPage',
  data() {
    return {
      company: {
        companyName: '',
        phoneNumber: '', // Changé de "PhoneNumber" à "phoneNumber" pour correspondre au backend
        taxRegistrationNumber: '',
        legalStatus: 'SA',
        registeredOfficeAddress: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
      passwordMismatch: false, // Pour gérer l'erreur de non-correspondance des mots de passe
      apiUrl: 'http://localhost:3000/api/users/company', // URL de l'API d'inscription
    };
  },
  methods: {
    // Méthode pour enregistrer l'entreprise
    async saveSettings() {
      // Validation des champs
      if (!/^\d+$/.test(this.company.phoneNumber)) {
        alert("Le numéro de téléphone doit être un nombre.");
        return;
      }
      if (!/^\d+$/.test(this.company.taxRegistrationNumber)) {
        alert("Le numéro d'identification fiscale doit être un nombre.");
        return;
      }

      // Vérifier que les mots de passe correspondent
      if (this.company.password !== this.company.confirmPassword) {
        this.passwordMismatch = true;
        alert("Les mots de passe ne correspondent pas.");
        return;
      }

      // Vérifier la force du mot de passe
      if (!this.isPasswordStrong(this.company.password)) {
        alert('Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.');
        return;
      }

      // Vérifier que tous les champs sont valides
      if (this.isFormValid()) {
        try {
          // Envoyer la requête d'inscription
          const response = await axios.post(this.apiUrl, {
            companyName: this.company.companyName,
            phoneNumber: this.company.phoneNumber, // Assurez-vous que le nom du champ correspond au schéma backend
            taxRegistrationNumber: this.company.taxRegistrationNumber,
            legalStatus: this.company.legalStatus,
            registeredOfficeAddress: this.company.registeredOfficeAddress,
            email: this.company.email,
            password: this.company.password,
          });

          // Message de succès
          alert('Entreprise enregistrée avec succès!');
          console.log('Réponse du serveur:', response.data);

          // Réinitialiser le formulaire après l'envoi
          this.resetForm();
        } catch (error) {
          // Gestion des erreurs
          if (axios.isAxiosError(error)) {
            console.error('Erreur Axios:', error.response ? error.response.data : error.message);
            alert(error.response?.data?.message || 'Une erreur s\'est produite lors de l\'enregistrement.');
          } else {
            console.error('Erreur inattendue:', error);
            alert('Une erreur s\'est produite lors de l\'enregistrement.');
          }
        }
      }
    },

    // Méthode pour annuler et réinitialiser le formulaire
    cancel() {
      alert('Modifications annulées!');
      this.resetForm();
    },

    // Valider la soumission du formulaire
    isFormValid(): boolean {
      return (
        this.company.companyName.trim() !== '' &&
        this.company.phoneNumber.trim() !== '' &&
        this.company.taxRegistrationNumber.trim() !== '' &&
        this.company.legalStatus.trim() !== '' &&
        this.company.registeredOfficeAddress.trim() !== '' &&
        this.company.email.trim() !== '' &&
        this.company.password.trim() !== '' &&
        this.company.confirmPassword.trim() !== '' &&
        this.company.password === this.company.confirmPassword
      );
    },

    // Vérification de la force du mot de passe
    isPasswordStrong(password: string): boolean {
      const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*.])[A-Za-z\d!@#$%^&*.]{8,}$/;
      return strongPasswordRegex.test(password);
    },

    // Réinitialiser les données du formulaire
    resetForm() {
      this.company = {
        companyName: '',
        phoneNumber: '',
        taxRegistrationNumber: '',
        legalStatus: 'SA',
        registeredOfficeAddress: '',
        email: '',
        password: '',
        confirmPassword: '',
      };
      this.passwordMismatch = false;
    },
  },
});
</script>

<style scoped>


.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: -1; /* Cela le place derrière les autres éléments */
}

.welcome-text {
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #ff5722, #ff9800);
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
.account-settings {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: url('../../assets/Images/warehouses.jpg') no-repeat center center fixed;
  background-size: cover;
  position: relative;
  height: 100%;
  padding: 0 20px; /* Ajoutez un padding horizontal pour créer un espace sur les côtés */
}

.form-section{
  z-index: 1;
  background: rgba(255, 255, 255, 0.9); /* White background with transparency */
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  padding: 2rem;
  max-width: 600px;
  width: 750px; /* Pour occuper l'espace disponible */
  margin: 0 auto; /* Centrer horizontalement */
}


.logo-container {
  position: absolute;
  width: 5px;
  top: 10px;
  left: 20px;
}

.logo {
  width: 100px;
  height: auto;
}

.settings-form {
  background: transparent; /* Ensure background is transparent within the form */
  padding: 2rem;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 1rem;
  border-bottom: 2px solid #f1f1f1;
  padding-bottom: 8px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.input-label {
  display: block;
  color: #495057;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.icon-dark {
  color: #495057;
  margin-right: 0.5rem;
}

.custom-input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #ced4da;
  border-radius: 8px;
  transition: all 0.3s;
}

.custom-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.2);
  outline: none;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

.save-btn,
.cancel-btn {
  padding: 14px;
  font-size: 15px;
  border-radius: 50px;
  cursor: pointer;
  transition: 0.3s;
}

.save-btn {
  background: linear-gradient(45deg, #ff5722, #ff9800);
  color: white;
  border: none;
  font-weight: bold;
  width: 48%;
}

.save-btn:hover {
  background: linear-gradient(45deg, #ff9800, #ff5722);
  box-shadow: 0 4px 15px rgba(255, 87, 34, 0.4);
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  font-weight: bold;
  width: 48%;
}

.cancel-btn:hover {
  background: #5a6268;
}

.delete-section {
  margin-top: 3rem;
  padding: 1.5rem;
  background: #f8d7da;
  border-radius: 10px;
  text-align: center;
}

.warning-text {
  color: #6c757d;
  font-size: 0.9rem;
}

button:hover {
  transform: translateY(-2px);
}
/* Style pour le champ de saisie contenant une erreur */
.input-error {
  border: 2px solid #f44336; /* Bordure rouge */
  background-color: #ffe6e6; /* Fond rouge pâle */
}

/* Message d'erreur */
.error-text {
  color: #f44336; /* Couleur rouge */
  font-size: 12px;
  margin-top: 5px;
}

/* Ajout d'un effet visuel pour les erreurs */
.form-group input:invalid {
  border: 2px solid #f44336;
}

.form-group input:focus:invalid {
  outline: none;
  box-shadow: 0 0 5px rgba(244, 67, 54, 0.5);
}

</style>
