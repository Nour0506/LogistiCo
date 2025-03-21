import express from 'express';
import Joi from 'joi';
import User from '../../models/user.js';
import bcrypt from 'bcryptjs';
import authorization from '../../middleware/authorization.js';
import Company from '../../models/company.js';
const router = express.Router();

// 📌 Validation des données pour un admin
const validateAdminRequest = (data) => {
    return Joi.object({
        firstName: Joi.string(),
        lastName: Joi.string(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('admin')
    }).validate(data);
};

// 📌 Route pour enregistrer un administrateur
router.post('/admin', async (req, res) => {
    try {
        // Validation des données de l'admin
        const { error } = validateAdminRequest(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Vérification de l'existence de l'email dans la collection 'users'
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) { 
            return res.status(400).json({ error: 'Cette adresse e-mail est déjà utilisée.' });
        }

        // Création du nouvel utilisateur Admin
        const newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password, // Le mot de passe sera haché automatiquement
            role: 'admin' // Définir le rôle de l'utilisateur comme 'admin'
        });
       const salt = await bcrypt.genSalt(10);
       newUser.password = await bcrypt.hash(newUser.password, salt);
       
        // Sauvegarde de l'utilisateur dans la base de données
        await newUser.save(); 
        
        // Réponse en cas de succès
        res.status(201).json({ message: 'Administrateur enregistré avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'admin:', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});
// 📌 4️⃣ Route pour récupérer les entreprises en attente d'approbation
router.get('/pending-companies', authorization, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Seul un administrateur peut voir les entreprises en attente." });
        }

        // Récupérer les entreprises non approuvées
        const pendingCompanies = await Company.find({ isApproved: false }).select('-password');

        res.status(200).json(pendingCompanies);
    } catch (error) {
        console.error("🔥 Erreur lors de la récupération des entreprises en attente:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});


router.put('/approve-company', authorization, async (req, res) => {
    try {
        console.log("Approbation d'une entreprise...");

        // Vérifier si l'utilisateur est admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Seul un administrateur peut approuver une entreprise." });
        }

        // Récupérer l'companyId depuis le corps de la requête
        const { companyId } = req.body;
        if (!companyId) {
            return res.status(400).json({ error: "L'ID de l'entreprise est requis." });
        }

        // Trouver l'entreprise et l'activer
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ error: "Entreprise non trouvée." });
        }

        company.isApproved = true;
        await company.save();

        // Activer le compte utilisateur lié
        await User.findByIdAndUpdate(company.userId, { isActive: true });

        console.log("Entreprise approuvée !");
        res.status(200).json({ message: "Entreprise approuvée avec succès." });

    } catch (error) {
        console.error("Erreur lors de l'approbation de l'entreprise:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// 📌 Route pour récupérer toutes les entreprises
router.get('/companies', authorization, async (req, res) => {
    try {
        console.log("Récupération de toutes les entreprises...");

        // Vérifier si l'utilisateur est admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Seul un administrateur peut voir toutes les entreprises." });
        }

        // Récupérer toutes les entreprises
        const companies = await Company.find().populate('userId', 'email');

        // Répondre avec la liste des entreprises
        res.status(200).json(companies);
    } catch (error) {
        console.error("Erreur lors de la récupération de toutes les entreprises:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// Rejeter une entreprise (supprimer)
router.delete('/reject-company', authorization, async (req, res) => {
    try {
        console.log("Rejet d'une entreprise...");

        // Vérifier si l'utilisateur est admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Seul un administrateur peut rejeter une entreprise." });
        }

        // Récupérer l'companyId depuis le corps de la requête
        const { companyId } = req.body;
        if (!companyId) {
            return res.status(400).json({ error: "L'ID de l'entreprise est requis." });
        }

        // Trouver et supprimer l'entreprise
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ error: "Entreprise non trouvée." });
        }

        // Supprimer aussi l'utilisateur associé
        await User.findByIdAndDelete(company.userId);
        await Company.findByIdAndDelete(companyId);

        console.log("Entreprise rejetée et supprimée.");
        res.status(200).json({ message: "Entreprise rejetée et supprimée avec succès." });

    } catch (error) {
        console.error("Erreur lors du rejet de l'entreprise:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});


router.delete('/delete-company', authorization, async (req, res) => {
    try {
        console.log("Suppression de l'entreprise...");

        // Vérifier si l'utilisateur est admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Seul un administrateur peut supprimer une entreprise." });
        }

        // Récupérer l'companyId depuis le corps de la requête
        const { companyId } = req.body;
        if (!companyId) {
            return res.status(400).json({ error: "L'ID de l'entreprise est requis." });
        }

        // Trouver et supprimer l'entreprise
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ error: "Entreprise non trouvée." });
        }

        // Supprimer aussi l'utilisateur associé
        await User.findByIdAndDelete(company.userId);
        await Company.findByIdAndDelete(companyId);

        console.log("Entreprise supprimée.");
        res.status(200).json({ message: "Entreprise supprimée avec succès." });

    } catch (error) {
        console.error("Erreur lors de la suppression de l'entreprise:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});
export default router;
