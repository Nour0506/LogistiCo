import express from 'express';
import Joi from 'joi';
import User from '../../models/user.js';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import RentalWarehouses from '../../models/RentalWarehouse.js';
import authorization from '../../middleware/authorization.js';
import Company from '../../models/company.js';
import { v2 as cloudinary } from 'cloudinary';

import upload from '../../utils/upload.js'

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
        await newUser.save(); // Le hachage du mot de passe est effectué ici grâce au middleware 'pre'

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


router.put('/approve-company/:companyId', authorization, async (req, res) => {
    try {
        console.log(" Validation de l'entreprise:", req.params.companyId);

        //  Vérifier si l'utilisateur est admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Seul un administrateur peut approuver une entreprise." });
        }

        //  Trouver l'entreprise et l'activer
        const company = await Company.findById(req.params.companyId);
        if (!company) return res.status(404).json({ error: "Entreprise non trouvée." });

        company.isApproved = true;
        await company.save();

        //  Activer le compte utilisateur lié
        await User.findByIdAndUpdate(company.userId, { isActive: true });

        console.log(" Entreprise approuvée !");
        res.status(200).json({ message: "Entreprise approuvée avec succès." });

    } catch (error) {
        console.error(" Erreur lors de l'approbation de l'entreprise:", error);
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
router.delete('/reject-company/:companyId', authorization, async (req, res) => {
    try {
        console.log("Rejet de l'entreprise:", req.params.companyId);

        //  Vérifier si l'utilisateur est admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Seul un administrateur peut rejeter une entreprise." });
        }

        //  Trouver et supprimer l'entreprise
        const company = await Company.findById(req.params.companyId);
        if (!company) return res.status(404).json({ error: "Entreprise non trouvée." });

        // Supprimer aussi l'utilisateur associé
        await User.findByIdAndDelete(company.userId);
        await Company.findByIdAndDelete(req.params.companyId);

        console.log("Entreprise rejetée et supprimée.");
        res.status(200).json({ message: "Entreprise rejetée et supprimée." });

    } catch (error) {
        console.error("Erreur lors du rejet de l'entreprise:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// Récupérer toutes les entreprises validées
router.get('/approved-companies', authorization, async (req, res) => {
    try {
        console.log("Récupération des entreprises approuvées...");

        //  Vérifier si l'utilisateur est admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Seul un administrateur peut voir les entreprises approuvées." });
        }

        // Récupérer les entreprises approuvées
        const approvedCompanies = await Company.find({ isApproved: true }).populate('userId', 'email');
        res.status(200).json(approvedCompanies);

    } catch (error) {
        console.error("Erreur lors de la récupération des entreprises approuvées:", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});
router.delete('/delete-company/:companyId', authorization, async (req, res) => {
    try {
        console.log("Suppression de l'entreprise:", req.params.companyId);

        // Vérifier si l'utilisateur est admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Seul un administrateur peut supprimer une entreprise." });
        }

        // Trouver l'entreprise
        const company = await Company.findById(req.params.companyId);
        if (!company) return res.status(404).json({ error: "Entreprise non trouvée." });

        // Vérifier les locations actives de cette entreprise
        const activeRentals = await RentalWarehouses.find({
            company_id: req.params.companyId,
            status: { $in: ['pending', 'approved'] },
            end_date: { $gte: new Date() }
        });

        if (activeRentals.length > 0) {
            return res.status(400).json({
                error: "Enable to delete - this company has active rentals.",
                activeRentals: activeRentals.map(r => ({
                    warehouse: r.warehouse_id.name,
                    period: `${r.start_date.toISOString().split('T')[0]} au ${r.end_date.toISOString().split('T')[0]}`,
                    status: r.status
                }))
            });
        }

        // Si pas de locations actives, procéder à la suppression
        await User.findByIdAndDelete(company.userId);
        await Company.findByIdAndDelete(req.params.companyId);

        console.log("Entreprise supprimée.");
        res.status(200).json({ message: "Entreprise supprimée avec succès." });

    } catch (error) {
        console.error("Erreur lors de la suppression de l'entreprise:", error);
        res.status(500).json({ 
            error: "Erreur interne du serveur",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.get('/meAdmin', authorization, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password -resetPasswordOTP -resetPasswordOTPExpires -resetPasswordToken -resetPasswordTokenExpires');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: user.toObject()
        });
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user profile
router.get('/profileAdmin', authorization, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password -resetPasswordOTP -resetPasswordToken');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            profile: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
router.put('/profileAdmin', authorization,
    [
        body('firstName').optional().trim().escape(),
        body('lastName').optional().trim().escape(),
        body('email').optional().isEmail().normalizeEmail(),
        body('newPassword').optional().isLength({ min: 6 }),
        body('currentPassword').optional()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Verify current password if changing password
            if (req.body.newPassword) {
                if (!req.body.currentPassword) {
                    return res.status(400).json({ error: 'Current password is required' });
                }
                const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
                if (!isMatch) {
                    return res.status(401).json({ error: 'Current password is incorrect' });
                }
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.newPassword, salt);
            }

            // Update fields
            if (req.body.firstName) user.firstName = req.body.firstName;
            if (req.body.lastName) user.lastName = req.body.lastName;
            if (req.body.email) user.email = req.body.email;

            await user.save();

            // Return updated profile
            const profile = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            };

            res.json({
                success: true,
                message: 'Profile updated successfully',
                profile
            });
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);
export default router;
