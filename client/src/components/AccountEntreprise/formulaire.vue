<template>
  <div class="account-settings">
    <div class="logo-container">
      <img src="../../assets/Images/Logo.png" alt="Logo" class="logo" />
    </div>

    <form @submit.prevent="saveSettings" class="settings-form">
      <div class="form-group">
        <label class="input-label"> <i class="fas fa-building icon-dark"></i> Company Name </label>
        <input type="text" v-model="company.name" class="custom-input" required />
      </div>

      <div class="form-group">
        <label class="input-label">
          <i class="fas fa-id-card icon-dark"></i> Unique Identification Number
        </label>
        <input type="text" v-model="company.idNumber" class="custom-input" required />
      </div>

      <div class="form-group">
        <label class="input-label">
          <i class="fas fa-file-invoice icon-dark"></i> Tax Registration Number
        </label>
        <input type="text" v-model="company.taxNumber" class="custom-input" required />
      </div>

      <div class="form-group">
        <label class="input-label"> <i class="fas fa-gavel icon-dark"></i> Legal Status </label>
        <select v-model="company.legalStatus" class="custom-input" required>
          <option value="SA">SA</option>
          <option value="SARL">SARL</option>
          <option value="SAS">SAS</option>
          <option value="Sole Proprietorship">Sole Proprietorship</option>
        </select>
      </div>

      <div class="form-group">
        <label class="input-label">
          <i class="fas fa-map-marker-alt icon-dark"></i> Registered Office Address
        </label>
        <input type="text" v-model="company.officeAddress" class="custom-input" required />
      </div>

      <div class="form-group">
        <label class="input-label"> <i class="fas fa-lock icon-dark"></i> Password </label>
        <input type="password" v-model="user.password" class="custom-input" required />
      </div>

      <div class="form-group">
        <label class="input-label"> <i class="fas fa-lock icon-dark"></i> Confirm Password </label>
        <input
          type="password"
          v-model="user.confirmPassword"
          class="custom-input"
          required
          :class="{ 'input-error': passwordMismatch }"
        />
        <span v-if="passwordMismatch" class="error-text">Passwords do not match</span>
      </div>

      <div class="action-buttons">
        <button type="submit" class="save-btn">Save Settings</button>
        <button type="button" @click="cancel" class="cancel-btn">Cancel</button>
      </div>
    </form>

    <!-- Section de suppression de compte -->
    <div class="delete-section">
      <h3 class="warning-title">
        <i class="fas fa-exclamation-triangle icon-danger"></i> Dangerous Zone
      </h3>
      <p class="warning-text">Permanent deletion of all data and content</p>
      <button type="button" @click="deleteAccount" class="delete-btn">
        Delete Account Permanently
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FormPage',
  data() {
    return {
      company: {
        name: '',
        idNumber: '',
        taxNumber: '',
        legalStatus: 'SA',
        officeAddress: '',
      },
      user: {
        password: '',
        confirmPassword: '',
      },
      passwordMismatch: false,
    }
  },
  methods: {
    saveSettings() {
      if (this.user.password !== this.user.confirmPassword) {
        this.passwordMismatch = true
        return
      }
      if (this.isFormValid()) {
        alert('Settings saved!')
      }
    },
    cancel() {
      alert('Changes discarded!')
      this.resetForm()
    },
    deleteAccount() {
      alert('Account deletion initiated!')
    },
    isFormValid() {
      return (
        Object.values(this.company).every((val) => typeof val === 'string' && val.trim() !== '') &&
        this.user.password &&
        this.user.confirmPassword
      )
    },
    resetForm() {
      this.company = {
        name: '',
        idNumber: '',
        taxNumber: '',
        legalStatus: 'SA',
        officeAddress: '',
      }
      this.user = {
        password: '',
        confirmPassword: '',
      }
      this.passwordMismatch = false
    },
  },
  watch: {
    'user.confirmPassword': function () {
      this.passwordMismatch = this.user.password !== this.user.confirmPassword
    },
  },
})
</script>

<style scoped>
.account-settings {
  max-width: 600px;
  margin: 2rem auto;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  position: relative;
}

.logo-container {
  position: absolute;
  top: 1px;
  left: 10px;
}

.logo {
  width: 40px;
  height: auto;
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

.input-error {
  border-color: red;
}

.error-text {
  color: red;
  font-size: 0.9rem;
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

.delete-btn {
  background: #dc3545;
  color: white;
  padding: 1rem 2rem;
  border-radius: 30px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}

.delete-btn:hover {
  background: #c82333;
}

.warning-title {
  color: #c82333;
}

.warning-text {
  color: #6c757d;
  font-size: 0.9rem;
}

button:hover {
  transform: translateY(-2px);
}
</style>
