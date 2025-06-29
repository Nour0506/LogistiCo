<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="brand">
          <span class="brand-icon">📦</span>
          <h1 class="brand-name">LogistiCo</h1>
        </div>
        <p class="welcome-text">Welcome back! Please login to your account.</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="identifier">
            <span class="input-icon">📧</span>
            Email or Phone
          </label>
          <input
            v-model="loginData.identifier"
            id="identifier"
            type="text"
            placeholder="Enter your email or phone number"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">
            <span class="input-icon">🔑</span>
            Password
          </label>
          <div class="password-field">
            <input
              v-model="loginData.password"
              id="password"
              type="password"
              placeholder="Enter your password"
              required
            />
            <button type="button" class="toggle-password">
              <span class="password-icon">🔒</span>
            </button>
          </div>
        </div>

        <button type="submit" class="submit-button" :disabled="isLoading">
          <span class="button-content">
            <span class="button-icon">{{ isLoading ? '⌛' : '➜' }}</span>
            <span>{{ isLoading ? 'Authenticating...' : 'Sign In' }}</span>
          </span>
        </button>

        <div class="auth-footer">
          <a href="#" @click.prevent="showForgotPasswordAlert" class="forgot-link">
            Forgot your password?
          </a>
          <div class="separator">
            <span>or</span>
          </div>
          <p class="signup-text">
            Don't have an account?
            <a href="#" @click.prevent="goToCreateAccount" class="signup-link">
              Create one now
            </a>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

interface LoginData {
  identifier: string;
  password: string;
}

const router = useRouter();
const loginData = ref<LoginData>({ identifier: '', password: '' });
const isLoading = ref(false);

const goToCreateAccount = () => {
  router.push('/create-account');
};

const handleLogin = async () => {
  if (!loginData.value.identifier || !loginData.value.password) {
    alert('Please fill in all fields.');
    return;
  }

  isLoading.value = true;

  try {
    const response = await fetch('http://localhost:3000/api/authCompany/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginData.value.identifier,
        password: loginData.value.password
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('role', data.user.role);
    localStorage.setItem('user', JSON.stringify(data.user));

    const redirectPath = localStorage.getItem('redirectPath') ||
      (data.user.role === 'admin' ? '/AdminDashboard/DefaultDashADD' : '/dashCompany');

    router.push(redirectPath);
    localStorage.removeItem('redirectPath');

  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    alert(errorMessage);
  } finally {
    isLoading.value = false;
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
        const response = await fetch('http://localhost:3000/api/otp/request-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      Swal.fire({
        title: 'Enter OTP',
        text: 'A 6-digit OTP has been sent to your email.',
        input: 'text',
        inputPlaceholder: 'Enter OTP',
        showCancelButton: true,
        confirmButtonText: 'Verify OTP',
        showLoaderOnConfirm: true,
        preConfirm: async (otp) => {
          try {
            const response = await fetch('http://localhost:3000/api/otp/verify-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: result.value.email, otp }),
            });

            if (!response.ok) {
              throw new Error(response.statusText);
            }

            return await response.json();
          } catch (error) {
            Swal.showValidationMessage(`OTP verification failed: ${(error as Error).message}`);
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      });
    }
  });
};
</script>

<style scoped>
/* Importing a modern font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Main container with a subtle gradient background */
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #e0e7ff 0%, #e6e6fa 100%);
  padding: 1.5rem;
  font-family: 'Inter', sans-serif;
}

/* Card with a floating effect and subtle border */
.auth-card {
  width: 80%;
  max-width: 460px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

/* Header with centered branding */
.auth-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.brand-icon {
  font-size: 2.75rem;
  transition: transform 0.3s ease;
}

.brand-icon:hover {
  transform: scale(1.1);
}

.brand-name {
  font-size: 2.25rem;
  font-weight: 700;
  color: #1e3a8a;
  margin: 0;
  letter-spacing: -0.025em;
}

.welcome-text {
  color: #64748b;
  font-size: 1rem;
  font-weight: 400;
  margin: 0;
  line-height: 1.5;
}

/* Form styling with smooth transitions */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1e3a8a;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.input-icon {
  font-size: 1.125rem;
  color: #3b82f6;
}

.form-group input {
  width: 90%;
  padding: 0.875rem 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
  color: #1e3a8a;
  background: #f9fafb;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  background: #ffffff;
}

/* Password field with toggle button */
.password-field {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #64748b;
  transition: color 0.2s ease;
}

.toggle-password:hover {
  color: #3b82f6;
}

/* Submit button with gradient and animation */
.submit-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

/* Footer with links and separator */
.auth-footer {
  text-align: center;
  margin-top: 2rem;
}

.forgot-link {
  color: #64748b;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.forgot-link:hover {
  color: #3b82f6;
}

.separator {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
}

.separator::before,
.separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.separator span {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.signup-text {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

.signup-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.signup-link:hover {
  color: #1e40af;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .auth-card {
    padding: 1.75rem;
    border-radius: 16px;
  }

  .brand-name {
    font-size: 1.875rem;
  }

  .brand-icon {
    font-size: 2.25rem;
  }

  .submit-button {
    padding: 0.875rem;
  }
}
</style>