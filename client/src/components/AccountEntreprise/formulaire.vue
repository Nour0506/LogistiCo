<template>
  <div class="registration-page">
    <div class="content-wrapper">
      <!-- Left Panel - Company Info -->
      <div class="info-panel">
        <div class="info-content">
          <h1>Welcome to LogistiCO</h1>
          <p>Your Premier Logistics Partner</p>
          
          <div class="features">
            <div class="feature">
              <Truck class="feature-icon" />
              <span>Global Transport Solutions</span>
            </div>
            <div class="feature">
              <Warehouse class="feature-icon" />
              <span>Secure Storage Facilities</span>
            </div>
            <div class="feature">
              <Route class="feature-icon" />
              <span>Distribution Planning</span>
            </div>
            <div class="feature">
              <Clock class="feature-icon" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Registration Form -->
      <div class="form-panel">
        <form @submit.prevent="handleSubmit" class="registration-form">
          <!-- Logo Upload -->
          <div class="logo-section">
            <input
              type="file"
              ref="logoInput"
              @change="handleFileUpload"
              accept="image/*"
              class="hidden"
              id="logo-upload"
            />
            <label for="logo-upload" class="logo-upload">
              <template v-if="logoPreview">
                <img :src="logoPreview" alt="Preview" class="logo-preview" />
              </template>
              <template v-else>
                <div class="upload-placeholder">
                  <Upload class="upload-icon" />
                  <span>Upload Logo</span>
                </div>
              </template>
            </label>
            <button
              v-if="logoPreview"
              type="button"
              @click="removeImage"
              class="remove-logo"
            >
              <X class="remove-icon" />
            </button>
          </div>

          <!-- Form Fields -->
          <div class="fields-grid">
            <!-- Company Name -->
            <div class="field-group">
              <Building2 class="field-icon" />
              <input
                type="text"
                v-model="formData.companyName"
                placeholder="Company Name"
                required
                :class="{ 'error': formData.companyName.length === 0 && isSubmitting }"
              />
              <div v-if="formData.companyName.length === 0 && isSubmitting" class="field-error">
                Company name is required
              </div>
            </div>

            <!-- Phone Number -->
            <div class="field-group">
              <Phone class="field-icon" />
              <input
                type="tel"
                v-model="formData.phoneNumber"
                placeholder="Phone Number"
                required
                :class="{ 'error': showPhoneError }"
              />
              <div v-if="showPhoneError" class="field-error">
                Please enter a valid phone number
              </div>
            </div>

            <!-- Tax Registration Number -->
            <div class="field-group">
              <FileText class="field-icon" />
              <input
                type="text"
                v-model="formData.taxRegistrationNumber"
                placeholder="Tax Registration Number"
                required
                :class="{ 'error': showTaxNumberError }"
              />
              <div v-if="showTaxNumberError" class="field-error">
                Only alphanumeric characters allowed
              </div>
            </div>

            <!-- Legal Status -->
            <div class="field-group">
              <Gavel class="field-icon" />
              <select
                v-model="formData.legalStatus"
                required
                :class="{ 'error': formData.legalStatus.length === 0 && isSubmitting }"
              >
                <option value="" disabled>Select Legal Status</option>
                <option value="SA">SA</option>
                <option value="SARL">SARL</option>
                <option value="SAS">SAS</option>
                <option value="SNC">SNC</option>
              </select>
              <div v-if="formData.legalStatus.length === 0 && isSubmitting" class="field-error">
                Please select a legal status
              </div>
            </div>

            <!-- Registered Office Address -->
            <div class="field-group full-width">
              <MapPin class="field-icon" />
              <input
                type="text"
                v-model="formData.registeredOfficeAddress"
                placeholder="Registered Office Address"
                required
                :class="{ 'error': formData.registeredOfficeAddress.length === 0 && isSubmitting }"
              />
              <div v-if="formData.registeredOfficeAddress.length === 0 && isSubmitting" class="field-error">
                Address is required
              </div>
            </div>

            <!-- Email -->
            <div class="field-group">
              <Mail class="field-icon" />
              <input
                type="email"
                v-model="formData.email"
                placeholder="Email Address"
                required
                :class="{ 'error': showEmailError }"
              />
              <div v-if="showEmailError" class="field-error">
                Please enter a valid email address
              </div>
            </div>

            <!-- Password -->
            <div class="field-group">
              <Lock class="field-icon" />
              <input
                type="password"
                v-model="formData.password"
                placeholder="Password"
                required
                :class="{ 'error': showPasswordError }"
              />
              <div v-if="showPasswordError" class="field-error">
                Password must be at least 8 characters
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="field-group">
              <Lock class="field-icon" />
              <input
                type="password"
                v-model="formData.confirmPassword"
                placeholder="Confirm Password"
                required
                :class="{ 'error': passwordMismatch }"
              />
              <div v-if="passwordMismatch" class="field-error">
                Passwords don't match
              </div>
            </div>
          </div>

          <!-- Terms and Conditions -->
          <div class="terms-group">
            <input
              type="checkbox"
              id="terms"
              v-model="formData.acceptedTerms"
              required
              class="terms-checkbox"
            />
            <label for="terms" class="terms-label">
              I agree to the <a href="#" class="terms-link">Terms and Conditions</a>
            </label>
            <div v-if="!formData.acceptedTerms && isSubmitting" class="field-error terms-error">
              You must accept the terms and conditions
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="submit-button"
            >
              <CheckCircle class="button-icon" />
              {{ isSubmitting ? 'Processing...' : 'Complete Registration' }}
            </button>
            <button
              type="button"
              @click="resetForm"
              class="reset-button"
            >
              <RotateCcw class="button-icon" />
              Reset
            </button>
          </div>
        </form>

        <!-- Messages -->
        <div v-if="errorMessage" class="message error">
          {{ errorMessage }}
          <button @click="errorMessage = ''" class="message-close">
            <X />
          </button>
        </div>

        <div v-if="successMessage" class="message success">
          {{ successMessage }}
          <button @click="successMessage = ''" class="message-close">
            <X />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';
import { 
  CheckCircle, 
  RotateCcw, 
  X, 
  Upload, 
  Building2, 
  Phone, 
  FileText, 
  Gavel, 
  MapPin, 
  Mail, 
  Lock,
  Truck,
  Warehouse,
  Route,
  Clock
} from 'lucide-vue-next';
// Configuration de l'API
const api = axios.create({
  baseURL: 'http://localhost:3000/api' // Remplacez par votre URL d'API
});

interface FormData {
  companyName: string;
  phoneNumber: string;
  taxRegistrationNumber: string;
  legalStatus: string;
  registeredOfficeAddress: string;
  email: string;
  password: string;
  confirmPassword: string;
  logo?: File;
}

const formData = ref<FormData>({
  companyName: '',
  phoneNumber: '',
  taxRegistrationNumber: '',
  legalStatus: '',
  registeredOfficeAddress: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const logoPreview = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const logoInput = ref<HTMLInputElement | null>(null);

const passwordMismatch = computed(() => {
  return formData.value.password !== formData.value.confirmPassword && 
         formData.value.confirmPassword.length > 0;
});

// Dans la partie script, ajoutez ces computed properties et méthodes
const emailValid = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email);
});

const phoneValid = computed(() => {
  return /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(formData.value.phoneNumber);
});

const taxNumberValid = computed(() => {
  return /^[a-zA-Z0-9]+$/.test(formData.value.taxRegistrationNumber);
});

const passwordValid = computed(() => {
  return formData.value.password.length >= 8;
});

const showEmailError = computed(() => {
  return formData.value.email.length > 0 && !emailValid.value;
});

const showPhoneError = computed(() => {
  return formData.value.phoneNumber.length > 0 && !phoneValid.value;
});

const showTaxNumberError = computed(() => {
  return formData.value.taxRegistrationNumber.length > 0 && !taxNumberValid.value;
});

const showPasswordError = computed(() => {
  return formData.value.password.length > 0 && !passwordValid.value;
});

// Mettez à jour la computed property isFormValid
const isFormValid = computed(() => {
  return (
    formData.value.companyName.trim() !== '' &&
    phoneValid.value &&
    taxNumberValid.value &&
    formData.value.legalStatus !== '' &&
    formData.value.registeredOfficeAddress.trim() !== '' &&
    emailValid.value &&
    passwordValid.value &&
    !passwordMismatch.value
  );
});

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    formData.value.logo = file;
    logoPreview.value = URL.createObjectURL(file);
  }
};

const removeImage = () => {
  formData.value.logo = undefined;
  logoPreview.value = '';
  if (logoInput.value) logoInput.value.value = '';
};

const handleSubmit = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill all required fields correctly';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const formPayload = new FormData();
   formPayload.append('companyName', formData.value.companyName);
    formPayload.append('phoneNumber', formData.value.phoneNumber);
    formPayload.append('taxRegistrationNumber', formData.value.taxRegistrationNumber);
    formPayload.append('legalStatus', formData.value.legalStatus);
    formPayload.append('registeredOfficeAddress', formData.value.registeredOfficeAddress);
    formPayload.append('email', formData.value.email);
    formPayload.append('password', formData.value.password);
    
    if (formData.value.logo) {
      formPayload.append('Logo', formData.value.logo); // Modifié 'logo' en 'Logo'
    }
    
    const response = await api.post('/users/company', formPayload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    successMessage.value = response.data.message || 'Registration completed successfully!';
    resetForm();
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Gestion des erreurs spécifiques du serveur
      if (error.response?.status === 400) {
        errorMessage.value = error.response.data.errors?.join(', ') || 'Validation error';
      } else {
        errorMessage.value = error.response?.data?.error || 'An error occurred during registration';
      }
    } else {
      errorMessage.value = 'An unexpected error occurred';
    }
    console.error('Registration error:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  formData.value = {
    companyName: '',
    phoneNumber: '',
    taxRegistrationNumber: '',
    legalStatus: '',
    registeredOfficeAddress: '',
    email: '',
    password: '',
    confirmPassword: '',
  };
  removeImage();
  errorMessage.value = '';
};
</script>

<style scoped>
.registration-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  font-family: system-ui, -apple-system, sans-serif;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 35% 65%;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

/* Left Panel Styles */
.info-panel {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 3rem;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.info-content {
  max-width: 400px;
  margin: 0 auto;
}

.info-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.info-content p {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.feature-icon {
  width: 24px;
  height: 24px;
  color: #60a5fa;
}

/* Right Panel Styles */
.form-panel {
  background: white;
  padding: 3rem;
  overflow-y: auto;
}

.registration-form {
  max-width: 800px;
  margin: 0 auto;
}

/* Logo Upload Styles */
.logo-section {
  width: 150px;
  height: 150px;
  margin: 0 auto 2rem;
  position: relative;
}

.logo-upload {
  width: 100%;
  height: 100%;
  border: 2px dashed #60a5fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  background: white;
  transition: all 0.3s ease;
}

.logo-upload:hover {
  border-color: #2563eb;
  background: #f0f9ff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #60a5fa;
}

.upload-icon {
  width: 32px;
  height: 32px;
}

.logo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-logo {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.remove-logo:hover {
  background: #dc2626;
}

.remove-icon {
  width: 16px;
  height: 16px;
}

/* Form Fields Styles */
.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.field-group {
  position: relative;
}

.field-group.full-width {
  grid-column: span 2;
}

.field-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #64748b;
}

.field-group input,
.field-group select {
  width: 80%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  transition: all 0.3s ease;
}

.field-group input:focus,
.field-group select:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  outline: none;
}

.field-group input.error {
  border-color: #ef4444;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.submit-button,
.reset-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-button {
  background: #2563eb;
  color: white;
  border: none;
}

.submit-button:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.reset-button {
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.reset-button:hover {
  background: #f8fafc;
  border-color: #60a5fa;
  color: #2563eb;
}

.button-icon {
  width: 20px;
  height: 20px;
}

/* Messages */
.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.message.error {
  background: #fef2f2;
  color: #dc2626;
  border-left: 4px solid #dc2626;
}

.message.success {
  background: #f0fdf4;
  color: #16a34a;
  border-left: 4px solid #16a34a;
}

.message-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.hidden {
  display: none;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .info-panel {
    display: none;
  }

  .form-panel {
    padding: 2rem;
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }

  .field-group.full-width {
    grid-column: auto;
  }

  .form-actions {
    flex-direction: column;
  }

  .submit-button,
  .reset-button {
    width: 100%;
    justify-content: center;
  }
}
</style>