import jwt from 'jsonwebtoken';
import User from '../models/user.js';

async function authenticateToken(req, res, next) {
    try {
        // 1. Récupération du token
        const authHeader = req.headers['authorization'];
        const cookieToken = req.cookies?.accessToken;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookieToken;

        // 2. Vérification présence token
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentification requise" });
        }

        // 3. Décodage du token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Vérification de l'utilisateur
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(403).json({ success: false, message: "Utilisateur introuvable" });
        }

        // 5. Vérification du rôle admin
        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Accès réservé aux administrateurs" });
        }

        // 6. Passage des infos à req
        req.token = token;
        req.user = { _id: user._id, email: user.email, role: user.role };

        console.log(`Admin authentifié : ${user.email}`);
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ success: false, message: "Session expirée" });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ success: false, message: "Token invalide" });
        }
        return res.status(500).json({ success: false, message: "Erreur interne" });
    }
}

export default authenticateToken;
