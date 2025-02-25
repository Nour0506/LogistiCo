import { createApp } from 'vue'
import App from './App.vue' // Import the root component
import router from './router/index' // Import the router
import './assets/css/HomeEntreprise.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
