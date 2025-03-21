import { createRouter, createWebHistory } from 'vue-router'
import HomeEntreprise from '../views/HomeEntreprise.vue'
import FormPage from '../components/AccountEntreprise/formulaire.vue'
import Login from '../components/ForgetPassword/ForgetPassword.vue';

// Define your routes
const routes = [
  {
    path: '/',
    name: 'Home', // Add a name for the route (optional but recommended)
    component: HomeEntreprise,
  },
  {
    path: '/create-account',
    name: 'CreateAccount', // Add a name for the route (optional but recommended)
    component: FormPage,
  },
  {
    path: '/login', // Nouvelle route pour la page de connexion
    name: 'Login', // Nom de la route
    component: Login, // Composant associé
  },
]

// Create the router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Use `import.meta.env.BASE_URL` for dynamic base URL
  routes, // Pass the routes array
})

// Export the router instance
export default router
