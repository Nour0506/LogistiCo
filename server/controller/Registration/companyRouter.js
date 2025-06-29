import express from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import User from '../../models/user.js';
import Company from '../../models/company.js';
import authorization from '../../middleware/authorization.js';
import { v2 as cloudinary } from 'cloudinary';
import RentalWarehouse from '../../models/RentalWarehouse.js'; 
import multer from 'multer';
import upload from '../../utils/upload.js'
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});


// Validation schema (sans le fichier)
const validateCompanyRequest = (data) => {
    return Joi.object({
        companyName: Joi.string().required(),
        phoneNumber: Joi.string().required(),
        taxRegistrationNumber: Joi.string().required(),
        legalStatus: Joi.string().required(),
        registeredOfficeAddress: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required()
    }).validate(data);
};
router.post('/company', upload.single('Logo'), async (req, res) => {
    try {
        const { error } = validateCompanyRequest(req.body);
        if (error) {
            if (req.file) {
                await cloudinary.uploader.destroy(req.file.filename);
            }
            return res.status(400).json({ 
                success: false,
                error: error.details[0].message 
            });
        }

        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            if (req.file) {
                await cloudinary.uploader.destroy(req.file.filename);
            }
            return res.status(400).json({ 
                success: false,
                error: "Email already exists" 
            });
        }

        // Create new user
        const newUser = new User({
            email: req.body.email,
            password: req.body.password,
            role: "entreprise",
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(newUser.password, salt);
        await newUser.save();

        // Create new company
        const newCompany = new Company({
            userId: newUser._id,
            email: req.body.email,
            companyName: req.body.companyName,
            registeredOfficeAddress: req.body.registeredOfficeAddress,
            legalStatus: req.body.legalStatus,
            taxRegistrationNumber: req.body.taxRegistrationNumber,
            phoneNumber: req.body.phoneNumber,
            Logo: req.file ? req.file.path : null,
            isApproved: false,
        });

        await newCompany.save();

        // Success response
        res.status(201).json({
            success: true,
            message: "Company registered successfully!",
            company: {
                id: newCompany._id,
                name: newCompany.companyName,
                email: newCompany.email,
                logo: newCompany.Logo,
            },
        });

    } catch (err) {
        console.error("Server Error:", err.message); // Add .message
        console.error(err.stack); // Log full stack trace if needed
        
        if (req.file) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
            } catch (cloudinaryErr) {
                console.error("Cloudinary cleanup error:", cloudinaryErr.message);
            }
        }
        
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});
router.get('/me', authorization, async (req, res) => {
    try {
        // Récupérer l'ID de l'utilisateur à partir du token
        const userId = req.user.userId;

        // Trouver l'utilisateur dans la base de données
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Trouver l'entreprise associée à l'utilisateur
        const company = await Company.findOne({ userId: user._id });
        if (!company) {
            return res.status(404).json({ error: 'Entreprise non trouvée pour cet utilisateur' });
        }

        // Répondre avec les informations de l'utilisateur et l'ID de l'entreprise
        res.status(200).json({
            userId: user._id,
            email: user.email,
            company:company , // Inclure l'ID de l'entreprise
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des informations de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});
router.get('/meCompany', authorization, async (req, res) => {
    try {
        // Récupérer l'ID de l'utilisateur à partir du token
        const userId = req.user.userId;

        // Trouver l'utilisateur dans la base de données
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Trouver l'entreprise associée à l'utilisateur
        const company = await Company.findOne({ userId: user._id });
        if (!company) {
            return res.status(404).json({ error: 'Entreprise non trouvée pour cet utilisateur' });
        }

        // Répondre avec l'ID de l'entreprise et les informations de l'utilisateur
        res.status(200).json({
            userId: user._id,
            email: user.email,
            companyId: company._id, // Retourner uniquement l'ID de l'entreprise
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des informations de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

router.get('/profile/:id', authorization, async (req, res) => {
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
// Add this after the refresh token endpoint
router.post('/logout', (req, res) => {
    // Clear both tokens from cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
});
// Dans votre fichier de routes auth.js
router.post('/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });
  
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId);
  
      if (!user) return res.status(403).json({ error: "Invalid user" });
  
      const newAccessToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      res.json({ accessToken: newAccessToken });
    } catch (err) {
      res.status(403).json({ error: "Invalid refresh token" });
    }
  });

  router.post('/companyAdmin', upload.single('logo'), async (req, res) => {
    try {
        const { error } = validateCompanyRequest(req.body);
        if (error) {
            if (req.file) {
                await cloudinary.uploader.destroy(req.file.filename);
            }
            return res.status(400).json({ 
                success: false,
                error: error.details[0].message 
            });
        }

        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            if (req.file) {
                await cloudinary.uploader.destroy(req.file.filename);
            }
            return res.status(400).json({ 
                success: false,
                error: "Email already exists" 
            });
        }

        // Create new user
        const newUser = new User({
            email: req.body.email,
            password: req.body.password,
            role: "entreprise",
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(newUser.password, salt);
        await newUser.save();

        // Create new company
        const newCompany = new Company({
            userId: newUser._id,
            email: req.body.email,
            companyName: req.body.companyName,
            registeredOfficeAddress: req.body.registeredOfficeAddress,
            legalStatus: req.body.legalStatus,
            taxRegistrationNumber: req.body.taxRegistrationNumber,
            phoneNumber: req.body.phoneNumber,
            Logo: req.file ? req.file.path : null,
            isApproved: true,
        });

        await newCompany.save();

        // Success response
        res.status(201).json({
            success: true,
            message: "Company registered successfully!",
            company: {
                id: newCompany._id,
                name: newCompany.companyName,
                email: newCompany.email,
                logo: newCompany.Logo,
            },
        });

    } catch (err) {
        console.error("Server Error:", err.message); // Add .message
        console.error(err.stack); // Log full stack trace if needed
        
        if (req.file) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
            } catch (cloudinaryErr) {
                console.error("Cloudinary cleanup error:", cloudinaryErr.message);
            }
        }
        
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
  });
export default router;