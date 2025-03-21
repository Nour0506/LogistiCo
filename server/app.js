import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import companyRoutes from './controller/Registration/companyRouter.js';
import adminRoutes from './controller/Registration/adminRouter.js';
import transporterRoutes from './controller/Registration/transporterRouter.js';
import AuthCompany from './controller/Login/companyLogin.js';
import AuthAdmin from './controller/Login/adminLogin.js';
import otp from './controller/reinitialisationPassword/OTP.js';
import modifyprofil from './controller/manageProfil/modifyprofil.js';
import deleteprofil from './controller/manageProfil/deleteProfil.js';
import { connection } from './db.js';

const app = express(); 

dotenv.config();
connection(); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.use('/api/users', companyRoutes);
app.use('/api/users', adminRoutes);
app.use('/api/users', transporterRoutes);
app.use('/api/authCompany', AuthCompany);
app.use('/api/authAdmin', AuthAdmin);
app.use('/api/Profile', modifyprofil);
app.use('/api/Profile', deleteprofil);
app.use('/api/otp', otp);

export default app;

const PORT = process.env.PORT || 3000;
console.log("⚡ Tentative de démarrage du serveur...");

try {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
} catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur :", error);
}
