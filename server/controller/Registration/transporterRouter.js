import express from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../../models/user.js';
import Transporteur from '../../models/transporter.js';
import authorization from '../../middleware/authorizationTransporter.js';

dotenv.config(); // Charge les variables d'environnement

const router = express.Router();

// 📌 Validation des données de transporteur
const validateTransporteur = (data) => {
    return Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        transportRegisterNumber: Joi.string().required(),
        profilePhoto: Joi.string().optional(),
        transportType: Joi.string().required(),
    }).validate(data);
};

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    debug: true // Active le débogage
});

// 📌 Route protégée : Seul un admin ou une entreprise connectée peut ajouter un transporteur
router.post('/transporteur', authorization, async (req, res) => {
    try {
        console.log("📥 Ajout d'un transporteur:", req.body);
        console.log("Utilisateur connecté :", req.user); // Log pour déboguer

        // ✅ Validation des données
        const { error } = validateTransporteur(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // 🔍 Vérifier si l'utilisateur connecté est admin ou entreprise
        if (req.user.role !== "admin" && req.user.role !== "entreprise") {
            return res.status(403).json({ error: "Seuls un admin ou une entreprise peuvent ajouter un transporteur." });
        }

        // 🔍 Si c'est une entreprise, vérifier qu'elle ajoute bien un transporteur pour elle-même
        if (req.user.role === "entreprise") {
            if (!req.body.companyId || req.body.companyId !== req.user.companyId.toString()) {
                return res.status(403).json({ error: "Vous ne pouvez ajouter un transporteur que pour votre propre entreprise." });
            }
        }

        // 🔍 Vérification si l'email existe déjà
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).json({ error: 'Un compte avec cet email existe déjà.' });
        }

        // 🔒 Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // 📌 Création du compte transporteur
        const newUser = new User({
            email: req.body.email,
            password: hashedPassword,
            role: 'transporteur',
        });
        await newUser.save();

        // 📌 Enregistrement des infos de transporteur 
            const newTransporteur = new Transporteur({
            userId: newUser._id,
            companyId: req.body.companyId || null,
            transportRegisterNumber: req.body.transportRegisterNumber,
            profilePhoto: req.body.profilePhoto,
            transportType: req.body.transportType,
            addedBy: req.user._id,
        });
        await newTransporteur.save();

        // 📧 Envoi d'un email d'accès au transporteur (format HTML)
        const emailSubject = "Vos informations d'accès à la plateforme LogistiCo";
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #007BFF;">Bonjour,</h2>
                <p>Vous avez été ajouté en tant que transporteur sur notre plateforme. Voici vos informations d'accès :</p>
                <ul>
                    <li><strong>Email :</strong> ${req.body.email}</li>
                    <li><strong>Mot de passe :</strong> ${req.body.password}</li>
                </ul>
                <p>Nous vous recommandons de changer ce mot de passe après votre première connexion.</p>
                <a href="https://votreplateforme.com/login" style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: #fff; text-decoration: none; border-radius: 5px;">
                    Se connecter
                </a>
                <p>Cordialement,</p>
                <p><strong>L'équipe de la plateforme LogistiCo</strong></p>
            </div>
        `;

        // Configuration de l'email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.body.email,
            subject: emailSubject,
            html: emailHtml,
        };

        // Envoyer l'email avec gestion des erreurs
        try {
            await transporter.sendMail(mailOptions);
            console.log("📧 Email envoyé à :", req.body.email);
        } catch (emailError) {
            console.error("🔥 Erreur lors de l'envoi de l'email:", emailError);
            throw emailError; // Relancez l'erreur pour qu'elle soit capturée par le bloc catch global
        }

        console.log("✅ Transporteur ajouté et email envoyé !");
        res.status(201).json({ message: "Transporteur ajouté avec succès", user: newUser });

    } catch (error) {
        console.error("🔥 Erreur lors de l'ajout du transporteur:", error);
        res.status(500).json({ error: "Erreur interne du serveur", details: error.message });
    }
});

export default router;