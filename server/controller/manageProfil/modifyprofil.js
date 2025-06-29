import express from 'express';
import Joi from 'joi';
import User from '../../models/user.js';
import Company from '../../models/company.js';
import Transporteur from '../../models/transporter.js';
import bcrypt from 'bcryptjs';
import authenticateToken from '../../middleware/authModify.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

/**
 * Validation des données pour la mise à jour de l'utilisateur.
 */
const validateUserRequest = (data, role) => {
    const baseSchema = {
        firstName: Joi.string().trim(),
        lastName: Joi.string().trim(),
        email: Joi.string().email().trim(),
        oldPassword: Joi.string().min(6).trim(),
        newPassword: Joi.string().min(6).trim(),
        role: Joi.string().valid('admin', 'entreprise', 'transporteur'),
    };

    if (role === 'transporteur') {
        baseSchema.transportRegisterNumber = Joi.string().trim().required();
        baseSchema.profilePhoto = Joi.string().trim();
        baseSchema.transportType = Joi.string().trim();
    } else if (role === 'entreprise') {
        baseSchema.companyName = Joi.string().trim().required();
        baseSchema.registeredOfficeAddress = Joi.string().trim();
        baseSchema.legalStatus =Joi.string().valid('SARL', 'SNC', 'SUARL', 'SA').trim(),
        baseSchema.taxRegistrationNumber = Joi.string().trim();
        baseSchema.phoneNumber = Joi.string().trim();
    }

    return Joi.object(baseSchema).validate(data);
};

/**
 * Route pour mettre à jour les informations de l'utilisateur.
 */
router.put('/modify/me', authenticateToken, asyncHandler(async (req, res) => {
    try {
        // Récupérer l'utilisateur à mettre à jour
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        // Validation des données
        const { error } = validateUserRequest(req.body, user.role);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Vérifier le mot de passe actuel si un nouveau mot de passe est fourni
        if (req.body.newPassword) {
            if (!req.body.oldPassword) {
                return res.status(400).json({ error: 'Le mot de passe actuel est requis pour changer le mot de passe.' });
            }

            const isPasswordValid = await bcrypt.compare(req.body.oldPassword, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
            }

            // Hacher et mettre à jour le nouveau mot de passe
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.newPassword, salt);

            // Si l'utilisateur est une entreprise, mettre à jour le mot de passe de l'entreprise
            if (user.role === 'entreprise') {
                const company = await Company.findOne({ userId: user._id });
                if (company) {
                    company.password = await bcrypt.hash(req.body.newPassword, salt);
                    await company.save();
                } else {
                    return res.status(404).json({ error: 'Entreprise non trouvée.' });
                }
            }
        }

        // Mettre à jour les champs communs
        if (req.body.firstName) user.firstName = req.body.firstName;
        if (req.body.lastName) user.lastName = req.body.lastName;
        if (req.body.email) user.email = req.body.email;
        if (req.body.role) user.role = req.body.role;

        // Sauvegarder les modifications de l'utilisateur
        await user.save();

        // Mettre à jour les informations spécifiques au rôle
        if (user.role === 'entreprise') {
            const company = await Company.findOne({ userId: user._id });
            if (company) {
                // Mettre à jour les champs de l'entreprise
                if (req.body.companyName) company.companyName = req.body.companyName;
                if (req.body.registeredOfficeAddress) company.registeredOfficeAddress = req.body.registeredOfficeAddress;
                if (req.body.legalStatus) company.legalStatus = req.body.legalStatus;
                if (req.body.taxRegistrationNumber) company.taxRegistrationNumber = req.body.taxRegistrationNumber;
                if (req.body.phoneNumber) company.phoneNumber = req.body.phoneNumber;

                await company.save();
            } else {
                return res.status(404).json({ error: 'Entreprise non trouvée.' });
            }
        } else if (user.role === 'transporteur') {
            const transporteur = await Transporteur.findOne({ userId: user._id });
            if (transporteur) {
                // Mettre à jour les champs du transporteur
                if (req.body.transportRegisterNumber) transporteur.transportRegisterNumber = req.body.transportRegisterNumber;
                if (req.body.profilePhoto) transporteur.profilePhoto = req.body.profilePhoto;
                if (req.body.transportType) transporteur.transportType = req.body.transportType;

                await transporteur.save();
            } else {
                return res.status(404).json({ error: 'Transporteur non trouvé.' });
            }
        }

        // Réponse en cas de succès
        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(200).json({ 
            message: 'Utilisateur mis à jour avec succès.', 
            user: userResponse 
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
}));

export default router;