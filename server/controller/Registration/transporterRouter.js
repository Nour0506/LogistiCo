import express from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import Joi from 'joi';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../../models/user.js';
import Transporter from '../../models/transporter.js';
import authori from '../../middleware/authADD.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

dotenv.config();
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const upload = multer({ dest: 'uploads/' });
// Définissez la fonction de validation AVANT les routes
const validateTransporter = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().pattern(/^[A-Za-zÀ-ÿ\s'-]+$/).required()
      .messages({
        'string.pattern.base': 'Le prénom ne doit contenir que des lettres',
        'any.required': 'Le prénom est obligatoire'
      }),
    lastName: Joi.string().pattern(/^[A-Za-zÀ-ÿ\s'-]+$/).required()
      .messages({
        'string.pattern.base': 'Le nom ne doit contenir que des lettres',
        'any.required': 'Le nom est obligatoire'
      }),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).allow(''),
    CIN: Joi.string().pattern(/^[0-9]{8}$/).required(),
    phoneNumber: Joi.string().pattern(/^[0-9]{8}$/).required(),
    // Dans votre schéma de validation
typeDrivingLicence: Joi.string()
.valid("A1", "A", "B", "B+E", "C", "C+E", "D", "D1", "D+E", "H")
.required()
.messages({
  'any.only': 'Le type de permis doit être l\'un des suivants: A1, A, B, B+E, C, C+E, D, D1, D+E, H',
  'any.required': 'Le type de permis est obligatoire'
}),
    status: Joi.string().valid('Available', 'On mission', 'On leave')
      .default('Available')
  });

  return schema.validate(data, { abortEarly: false });
};

// Update profile picture
router.patch('/:id/profile-picture', authori, upload.single('profilePicture'), async (req, res) => {
  try {
    const transporter = await Transporter.findOne({
      _id: req.params.id,
      companyId: req.company.companyId
    });

    if (!transporter) {
      return res.status(404).json({ message: 'Transporter not found or unauthorized' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'transporter-profiles'
    });

    const updatedTransporter = await Transporter.findByIdAndUpdate(
      req.params.id,
      { profilePicture: result.secure_url },
      { new: true }
    );

    await fs.unlink(req.file.path);
    res.json(updatedTransporter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all transporters
router.get('/transporters', authori, async (req, res) => {
  try {
    if (req.user.role !== 'entreprise') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const transporters = await Transporter.find({ companyId: req.company._id })
      .populate('userId', 'firstName lastName email')
      .lean();

    const formatted = transporters.map(t => ({
      _id: t._id,
      CIN: t.CIN,
      phoneNumber: t.phoneNumber,
      typeDrivingLicence: t.typeDrivingLicence,
      profilePicture: t.profilePicture,
      status: t.status,
      createdAt: t.createdAt,
      firstName: t.userId?.firstName || '',
      lastName: t.userId?.lastName || '',
      email: t.userId?.email || '',
      name: t.userId ? `${t.userId.firstName} ${t.userId.lastName}` : 'No name'
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching transporters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add transporter
// Dans votre route POST /add
router.post('/add', authori, upload.single('profilePicture'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validation manuelle si Joi pose problème
    if (!req.body.firstName || !/^[\wÀ-ÿ\s'-]+$/.test(req.body.firstName)) {
      throw new Error('Prénom invalide');
    }
    
    if (!req.body.typeDrivingLicence || !["A1","A","B","B+E","C","C+E","D","D1","D+E","H"].includes(req.body.typeDrivingLicence)) {
      throw new Error('Type de permis invalide');
    }

    // Création de l'utilisateur
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
      role: 'transporteur'
    });

    // Gestion de l'image
    let profilePictureUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'transporter-profiles'
      });
      profilePictureUrl = result.secure_url;
      await fs.unlink(req.file.path);
    }

    // Création du transporteur
    const newTransporter = new Transporter({
      userId: newUser._id,
      companyId: req.company._id,
      CIN: req.body.CIN,
      phoneNumber: req.body.phoneNumber,
      typeDrivingLicence: req.body.typeDrivingLicence,
      profilePicture: profilePictureUrl,
      status: req.body.status || 'Available'
    });

    await newUser.save({ session });
    await newTransporter.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: {
        _id: newTransporter._id,
        ...req.body,
        profilePicture: profilePictureUrl
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Erreur création transporteur:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  } finally {
    session.endSession();
  }
});

// Delete transporter
router.delete('/delete/:id', authori, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Trouver le transporteur
    const transporter = await Transporter.findOneAndDelete({
      _id: req.params.id,
      companyId: req.company._id
    }).populate('userId').session(session);

    if (!transporter) {
      return res.status(404).json({
        success: false,
        error: 'Transporteur non trouvé'
      });
    }

    // 2. Supprimer l'utilisateur associé
    await User.findByIdAndDelete(transporter.userId._id).session(session);

    // 3. Supprimer l'image Cloudinary si elle existe
    if (transporter.profilePicture) {
      const publicId = transporter.profilePicture
        .split('/')
        .pop()
        .split('.')[0];
        
      await cloudinary.uploader.destroy(`transporter-profiles/${publicId}`)
        .catch(console.error); // Ne pas bloquer si la suppression échoue
    }

    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'Transporteur supprimé avec succès',
      deletedId: req.params.id
    });

  } catch (error) {
    await session.abortTransaction();
    
    console.error('Erreur suppression transporteur:', {
      error: error.message,
      params: req.params,
      company: req.company._id
    });

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
});

router.put('/updateTransporter/:id', authori, upload.single('profilePicture'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Vérification des données requises
    if (!req.body.firstName || !req.body.lastName || !req.body.email) {
      return res.status(400).json({
        success: false,
        error: 'Les champs firstName, lastName et email sont obligatoires'
      });
    }

    // Récupération du transporteur
    const transporter = await Transporter.findOne({
      _id: req.params.id,
      companyId: req.company._id
    }).session(session);

    if (!transporter) {
      return res.status(404).json({
        success: false,
        error: 'Transporteur non trouvé'
      });
    }

    // Gestion de l'image
    if (req.file) {
      try {
        // Suppression de l'ancienne image si elle existe
        if (transporter.profilePicture) {
          const publicId = transporter.profilePicture.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`transporter-profiles/${publicId}`);
        }

        // Upload de la nouvelle image
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'transporter-profiles'
        });
        transporter.profilePicture = result.secure_url;
        await fs.unlink(req.file.path);
      } catch (uploadError) {
        console.error('Erreur Cloudinary:', uploadError);
        throw new Error('Erreur lors du traitement de l\'image');
      }
    }

    // Mise à jour de l'utilisateur
    const user = await User.findById(transporter.userId).session(session);
    if (!user) {
      throw new Error('Utilisateur associé non trouvé');
    }

    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.email = req.body.email;

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    // Mise à jour du transporteur
    transporter.CIN = req.body.CIN;
    transporter.phoneNumber = req.body.phoneNumber;
    transporter.typeDrivingLicence = req.body.typeDrivingLicence;
    transporter.status = req.body.status;

    // Validation avant sauvegarde
    const validationError = validateTransporter({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: req.body.password || 'dummypassword',
      CIN: transporter.CIN,
      phoneNumber: transporter.phoneNumber,
      typeDrivingLicence: transporter.typeDrivingLicence,
      status: transporter.status
    });

    if (validationError.error) {
      throw new Error(validationError.error.details.map(d => d.message).join(', '));
    }

    await user.save({ session });
    await transporter.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      data: {
        _id: transporter._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        CIN: transporter.CIN,
        phoneNumber: transporter.phoneNumber,
        typeDrivingLicence: transporter.typeDrivingLicence,
        profilePicture: transporter.profilePicture,
        status: transporter.status,
        createdAt: transporter.createdAt
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Erreur updateTransporter:', error);
    
    res.status(400).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    session.endSession();
  }
});
export default router;