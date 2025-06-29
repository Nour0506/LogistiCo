import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import warehouseRoutes from './controller/Warehouses/warehouse.js';
import companyRoutes from './controller/Registration/companyRouter.js';
import adminRoutes from './controller/Registration/adminRouter.js';
import transporterRoutes from './controller/Registration/transporterRouter.js';
import AuthCompany from './controller/Login/companyLogin.js';
import AuthTransporter from './controller/Login/transporterLogin.js';
import AuthAdmin from './controller/Login/adminLogin.js';
import otp from './controller/reinitialisationPassword/OTP.js';
import modifyprofil from './controller/manageProfil/modifyprofil.js';
import deleteprofil from './controller/manageProfil/deleteProfil.js';
import fournisseur from './controller/Fourniss/fournisseur.js';
import salePoint from './controller/salePoint/salePoint.js';
import RentalRequest from './controller/Warehouses/rentalRequestController.js';
import truck from './controller/Truck/truck.js';
import { connection } from './db.js';
import product from './controller/distribution/ProductRouter.js';
import contract from './controller/distribution/contract.js';
import DistanceService from './services/DistanceService.js';
import routes from './controller/distribution/routeOptimizer.js';
import routess from './controller/distribution/greedy.js';


// Configuration initiale
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Connexion à la base de données
connection();

// Routes
app.use('/api/users', companyRoutes);
app.use('/api/users', adminRoutes);
app.use('/api/users', transporterRoutes);
app.use('/api/authCompany', AuthCompany);
app.use('/api/authTransporter', AuthTransporter);
app.use('/api/authAdmin', AuthAdmin);
app.use('/api/Profile', modifyprofil);
app.use('/api/Profile', deleteprofil);
app.use('/api/otp', otp);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/Request', RentalRequest);
app.use('/api/fournisseur', fournisseur);
app.use('/api/salePoints', salePoint);
app.use('/api/trucks', truck);
app.use('/api/products', product);
app.use('/api/contract', contract);
app.use('/api/distances', routes);
app.use('/api/routes', routess);



// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('Erreur globale:', err);
    res.status(500).json({ error: 'Une erreur interne est survenue' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
// app.js
// app.js
const startServer = async () => {
    try {
      // Attendre que la connexion DB soit établie
      await connection(); 
      
      const server = app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
      });
  
      // Initialisation asynchrone des services
      try {
        await DistanceService.updateAll();
        console.log('✅ Distance services initialized');
      } catch (error) {
        console.error('⚠️ Failed to initialize distance services:', error);
        // Ne pas crasher le serveur pour cette erreur
      }
  
      return server;
    } catch (error) {
      console.error("❌ Server startup error:", error);
      process.exit(1);
    }
  };
  
  startServer();
export default app;