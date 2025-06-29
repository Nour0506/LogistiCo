import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
    try {
        // 1. Récupérer le token depuis l'en-tête Authorization ou depuis le cookie
        const authHeader = req.headers['authorization'];  // L'header Authorization
        const cookieToken = req.cookies?.accessToken;  // Le cookie contenant le token
        let token = null;

        // 2. Vérifier si le token est présent dans l'Authorization Header
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];  // Extraire le token après 'Bearer'
        } 
        // 3. Vérifier si le token est présent dans les cookies
        else if (cookieToken) {
            token = cookieToken;  // Si le token est trouvé dans le cookie
        }

        // 4. Si aucun token n'est trouvé, retourner une erreur
        if (!token) {
            console.warn("Tentative d'accès sans token ! IP:", req.ip, "URL:", req.originalUrl);
            return res.status(401).json({ error: "Accès refusé : Token manquant !" });
        }

        // 5. Vérification et décodage du token
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    console.error("Token expiré :", err.message, "IP:", req.ip, "URL:", req.originalUrl);
                    return res.status(403).json({ error: "Accès refusé : Token expiré !" });
                } else {
                    console.error("Token invalide :", err.message, "IP:", req.ip, "URL:", req.originalUrl);
                    return res.status(403).json({ error: "Accès refusé : Token invalide !" });
                }
            }

            // 6. Vérifier le rôle de l'utilisateur
            if (user.role !== 'admin' && user.role !== 'company') {
                console.warn(`Accès refusé : ${user.username || user.email} (ID: ${user.userId}) n'a pas le rôle requis.`);
                return res.status(403).json({ error: "Accès refusé : Rôle non autorisé !" });
            }

            // 7. Ajouter les informations de l'utilisateur dans la requête pour les étapes suivantes
            req.user = user;
            console.log(`Accès autorisé : ${user.username || user.email} (ID: ${user.userId}, Rôle: ${user.role})`);
            next();  // Continuer avec la requête
        });

    } catch (error) {
        // 8. Si une erreur se produit dans le processus, retourner une erreur serveur interne
        console.error("Erreur dans le middleware d'authentification :", error, "IP:", req.ip, "URL:", req.originalUrl);
        return res.status(500).json({ error: "Erreur interne du serveur" });
    }
}

export default authenticateToken;