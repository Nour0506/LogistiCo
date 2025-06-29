import User from '../../models/user.js';
import express from 'express';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config(); // Charger les variables d'environnement
const router = express.Router();

// 🔍 Validation des données de connexion
const validateLogin = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    });
    return schema.validate(data);
};

router.post('/loginAdmin', async (req, res) => {
    try {
        console.log('Requête de connexion:', req.body);

        // Validation des données
        const { error } = validateLogin(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Recherche de l'utilisateur
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            console.log('Aucun utilisateur trouvé pour:', req.body.email);
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Vérification du mot de passe
        const validPassword = await user.isPasswordValid(req.body.password);
        if (!validPassword) {
            console.log('Mot de passe incorrect pour:', req.body.email);
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Vérification des clés JWT
        if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
            throw new Error('Les clés JWT ne sont pas configurées dans les variables d\'environnement.');
        }

        // Génération des tokens
        const accessToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Définir les cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 36000000000, // 1 heure
            sameSite: 'Strict',
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 604800000, // 7 jours
            sameSite: 'Strict',
        });

        console.log('Connexion réussie pour:', req.body.email);
        res.status(200).json({ message: 'Connexion réussie', accessToken });

    } catch (error) {
        console.error('Erreur lors du login:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token invalide' });
        }
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});
export default router;