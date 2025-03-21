import express from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import User from '../../models/user.js';
import Company from '../../models/company.js';
import authorization from '../../middleware/authorization.js';

const router = express.Router();

// 📌 Validation des données de l'entreprise
const validateCompanyRequest = (data) => {
    return Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        phoneNumber: Joi.string().required(),
        companyName: Joi.string().required(),
        registeredOfficeAddress: Joi.string().required(),
        legalStatus: Joi.string().required(),
        taxRegistrationNumber: Joi.string().required()
    }).validate(data);
};

router.post('/company', async (req, res) => {
    try {
        // Vérification de l'email dans la collection 'users'
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ error: 'Cette adresse e-mail est déjà utilisée dans la base des utilisateurs.' });
        }

        // Créer un nouvel utilisateur avec les données de l'entreprise
        const newUser = new User({
            email: req.body.email,
            password: req.body.password,
            role: 'entreprise', // Assigner le rôle 'entreprise'
        });

        // Hacher le mot de passe avant d'enregistrer l'utilisateur
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(newUser.password, salt);

        // Sauvegarder l'utilisateur
        await newUser.save();

        // Créer un nouvel objet 'Company' lié à l'utilisateur nouvellement créé
        const newCompany = new Company({
            userId: newUser._id, // Référence à l'utilisateur créé
            email: req.body.email, // Assure-toi que l'email est défini
            password: newUser.password, // Assure-toi que le mot de passe est défini
            companyName: req.body.companyName,
            registeredOfficeAddress: req.body.registeredOfficeAddress,
            legalStatus: req.body.legalStatus,
            taxRegistrationNumber: req.body.taxRegistrationNumber,
            phoneNumber: req.body.phoneNumber,
            isApproved: false // Définir par défaut comme non approuvé
        });

        // Sauvegarder l'entreprise
        await newCompany.save();

        // Répondre avec succès
        res.status(201).json({ message: 'Entreprise enregistrée avec succès. Attente de l\'approbation de l\'administrateur.' });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'L\'adresse e-mail est déjà utilisée dans la base de données.' });
        }
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});
//consulter profile company 
router.get('/company/:id', authorization, async (req, res) => {
    try {
      const companyId = req.params.id;
  
      // Vérifie si l'entreprise existe
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ error: 'Entreprise non trouvée' });
      }
  
      // Répondre avec les informations de l'entreprise
      res.status(200).json({ company });
    } catch (error) {
      console.error('Erreur lors de la consultation du profil:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  });


export default router;