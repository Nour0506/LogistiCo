import jwt from 'jsonwebtoken';
import { promisify } from 'util';

const verifyToken = promisify(jwt.verify);

/**
 * Middleware pour authentifier les requêtes avec un token JWT.
 * Vérifie la présence et la validité du token, puis ajoute les informations de l'utilisateur à `req.user`.
 */
async function authenticateToken(req, res, next) {
    try {
        // 1. Récupérer le token depuis l'en-tête Authorization ou depuis le cookie
        const authHeader = req.headers['authorization'];
        const cookieToken = req.cookies?.accessToken;
        let token = null;

        // 2. Extraire le token
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1]; // Extraire le token après 'Bearer'
        } else if (cookieToken) {
            token = cookieToken; // Utiliser le token du cookie
        }

        // 3. Si aucun token n'est trouvé, retourner une erreur
        if (!token) {
            console.warn(`[${new Date().toISOString()}] Tentative d'accès sans token ! IP: ${req.ip}, URL: ${req.originalUrl}`);
            return res.status(401).json({ error: "Accès refusé : Token manquant !" });
        }

        // 4. Vérification et décodage du token
        const user = await verifyToken(token, process.env.JWT_SECRET);
        if (!user || !user.userId) {
            console.error(`[${new Date().toISOString()}] Token invalide : informations manquantes. IP: ${req.ip}, URL: ${req.originalUrl}`);
            return res.status(403).json({ error: "Accès refusé : Token invalide !" });
        }

        // 5. Ajouter les informations de l'utilisateur dans la requête
        req.user = user;
        console.log(`[${new Date().toISOString()}] Accès autorisé : ${user.email || user.username || 'Utilisateur anonyme'} (ID: ${user.userId}) - URL: ${req.originalUrl} - Méthode: ${req.method}`);
        next();
    } catch (error) {
        // 6. Gestion des erreurs
        if (error.name === 'TokenExpiredError') {
            console.error(`[${new Date().toISOString()}] Token expiré : ${error.message}. IP: ${req.ip}, URL: ${req.originalUrl}`);
            return res.status(403).json({ error: "Accès refusé : Token expiré !" });
        } else {
            console.error(`[${new Date().toISOString()}] Erreur dans le middleware d'authentification : ${error.message}. IP: ${req.ip}, URL: ${req.originalUrl}`);
            return res.status(500).json({ error: "Erreur interne du serveur" });
        }
    }
}

export default authenticateToken;