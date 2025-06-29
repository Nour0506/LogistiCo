import express from 'express';
import User from '../../models/user.js';
import Company from '../../models/company.js';
import Transporteur from '../../models/transporter.js'; // Importez le modèle Transporteur
import authorization from '../../middleware/authorization.js';

const router = express.Router();

// 🔹 Route pour supprimer un utilisateur et ses données associées
router.delete('/users/me', authorization, async (req, res) => {
    try {
        // Récupérer l'utilisateur à supprimer
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        // Supprimer les données associées en fonction du rôle
        if (user.role === 'entreprise') {
            // Supprimer l'entreprise associée
            await Company.findOneAndDelete({ userId: user._id });
        } else if (user.role === 'transporteur') {
            // Supprimer le transporteur associé
            await Transporteur.findOneAndDelete({ userId: user._id });
        }

        // Supprimer l'utilisateur
        await User.findByIdAndDelete(req.params.userId);

        // Réponse en cas de succès
        res.status(200).json({ message: 'Utilisateur et données associées supprimés avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

export default router;