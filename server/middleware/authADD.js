import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/company.js';

async function authenticateToken(req, res, next) {
    try {
        // 1. Récupération du token depuis différents emplacements
        const authHeader = req.headers['authorization'];
        const cookieToken = req.cookies?.accessToken;
        let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookieToken;

        // 2. Vérification de la présence du token
        if (!token) {
            console.warn("Tentative d'accès non authentifiée", {
                ip: req.ip,
                url: req.originalUrl,
                method: req.method
            });
            return res.status(401).json({ 
                success: false,
                message: "Authentification requise" 
            });
        }

        // 3. Vérification et décodage du token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Récupération de l'utilisateur et de son entreprise
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.warn("Token valide mais utilisateur introuvable", {
                userId: decoded.id,
                ip: req.ip
            });
            return res.status(403).json({
                success: false,
                message: "Accès refusé - Compte utilisateur introuvable"
            });
        }

        // 5. Récupération de l'entreprise associée (pour les rôles entreprise)
        let company = null;
        if (user.role === 'entreprise') {
            company = await Company.findOne({ userId: user._id });
            if (!company) {
                console.warn("Aucune entreprise associée à l'utilisateur", {
                    userId: user._id,
                    email: user.email
                });
                return res.status(403).json({
                    success: false,
                    message: "Accès refusé - Aucune entreprise associée"
                });
            }
        }

        // 6. Ajout des informations à la requête
        req.token = token;
        req.user = {
            _id: user._id,
            email: user.email,
            role: user.role
        };
        
        if (company) {
            req.company = {
                _id: company._id,
                name: company.companyName
            };
        }

        console.log(`Accès autorisé : ${user.email} (${user.role})`);
        next();

    } catch (error) {
        // Gestion des erreurs spécifiques JWT
        if (error.name === 'TokenExpiredError') {
            console.error("Token expiré", {
                ip: req.ip,
                url: req.originalUrl
            });
            return res.status(403).json({
                success: false,
                message: "Session expirée - Veuillez vous reconnecter"
            });
        }

        if (error.name === 'JsonWebTokenError') {
            console.error("Token invalide", {
                ip: req.ip,
                url: req.originalUrl,
                error: error.message
            });
            return res.status(403).json({
                success: false,
                message: "Token invalide"
            });
        }

        // Erreurs inattendues
        console.error("Erreur d'authentification", {
            ip: req.ip,
            url: req.originalUrl,
            error: error.stack
        });
        return res.status(500).json({
            success: false,
            message: "Erreur interne d'authentification"
        });
    }
}

export default authenticateToken;