import { createRouter, createWebHistory } from 'vue-router';
import HomeEntreprise from '../views/HomeEntreprise.vue';
import FormPage from '../components/AccountEntreprise/formulaire.vue';
import DashEntreprise from '../views/DashEntrepise.vue';
import Login from '../components/HomeEntreprise/Footer.vue';
import DefaultDash from '../components/CompanyDashboard/DefaultDash.vue';
import about from '../components/HomeEntreprise/SectionOne.vue';
import contact from '../components/HomeEntreprise/Contact.vue';
import services from '../components/HomeEntreprise/SectionTwo.vue';
import profile from '../components/CompanyDashboard/profile.vue';
import Salepoint from '../components/CompanyDashboard/SalePoint.vue';
import TransEntrep from '../components/CompanyDashboard/TransEntrep.vue';
import WareHouse from '../components/CompanyDashboard/WareHouse.vue';
import Fournisseur from '../components/CompanyDashboard/fourniss.vue';
import trucks from '../components/CompanyDashboard/vehicles.vue';
import company from '../components/AdminDashboard/company.vue';
import { setupRouterGuards } from './authGuards.js';
import Rental from '../components/AdminDashboard/Rental.vue';
import AdminDashboard from '../views/AdminDashboard.vue';
import edit from '../components/CompanyDashboard/EditProfile.vue';
import warehouse from '../components/AdminDashboard/warehouse.vue';
import DefaultDashADD from '../components/AdminDashboard/DefaultDashADD.vue';
import distributionPlan from '../components/CompanyDashboard/distributionPlan.vue';
import products from '../components/CompanyDashboard/Product.vue';
// Définir les routes
const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeEntreprise,
  },
  {
    path: '/Login', 
    component: Login,
    name: 'Login',
  },
  {
    path: '/about', 
    component: about,
    name: 'about',
  },
  {
    path: '/contact', 
    component: contact,
    name: 'contact',
  },
  {
    path: '/services', 
    component: services,
    name: 'services',
  },
  {
    path: '/create-account',
    name: 'CreateAccount',
    component: FormPage,
  },
  {
    path: '/dashCompany',
    name: 'DashEntreprise',
    component: DashEntreprise,
    children: [
      {
        path: '', 
        component: DefaultDash,
        name: 'DefaultDash',
      },
      {
        path: 'products', 
        component: products,
        name: 'products',
      },
      {
        path: 'distributionPlan', 
        component: distributionPlan,
        name: 'distributionPlan',
      },
      
      {
        path: 'Salepoint',
        component: Salepoint,
        name: 'SalePoint',
      },
      {
        path: 'TransEntrep',
        component: TransEntrep,
        name: 'TransEntrep',
      },
      {
        path: 'WareHouse',
        component: WareHouse,
        name: 'WareHouse',
      },
      {
        path: 'trucks',
        component: trucks,
        name: 'trucks',
      },
      {
        path: 'Fourniss',
        component: Fournisseur,
        name: 'Fournisseur',
      },
       {
         path: '/profile',
         component: profile,
         name: 'profile',
       },
       {
         path: '/Edit',
       component: edit,
         name: 'edit',
       }
      
    ],
  },
  
  {
    path: '/AdminDashboard',
    name: 'AdminDashboard',
    component: AdminDashboard, 
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'DefaultDashADD', 
        component: DefaultDashADD,
        name: 'DefaultDashADD',
      },
     
      {
        path: 'Company',
        component: company,
        name: 'company',
      },
       {
        path: 'Rental',
        component: Rental,
        name: 'Rental',
      }, 
      {
        path: 'warehouse',
        component: warehouse,
        name: 'warehouse',
      },     
    ]
  }
    
    
]

// Créer l'instance du routeur
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Utiliser import.meta.env.BASE_URL pour l'URL de base dynamique
  routes, // Passer le tableau des routes
});
setupRouterGuards(router)

// Exporter l'instance du routeur
export default router;