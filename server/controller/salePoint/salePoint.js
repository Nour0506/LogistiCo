import express from 'express';
import mongoose from 'mongoose';
import SalePoint from '../../models/salePoint.js';
import authori from '../../middleware/authADD.js';
import Joi from 'joi';
import { getExactCoordinates } from '../../services/gecodingService.js';
import Contract from '../../models/contract.js';

const router = express.Router();

// Schéma de validation Joi
const salePointSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  type: Joi.string().required(),
  address: Joi.string().required().min(5)
  
});

// Middleware de validation des coordonnées
const validateCoordinates = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lon, lat] = coords;
  return (
    typeof lon === 'number' && lon >= -180 && lon <= 180 &&
    typeof lat === 'number' && lat >= -90 && lat <= 90
  );
};

// Récupérer tous les points de vente
router.get('/getSalePoints', authori, async (req, res) => {
  try {
    if (!req.company) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès refusé - Aucune entreprise associée' 
      });
    }

    const { search, type } = req.query;
    const query = { companyId: req.company._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) query.type = type;

    const salePoints = await SalePoint.find(query).sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      count: salePoints.length, 
      data: salePoints 
    });
  } catch (error) {
    console.error('Erreur dans getSalePoints:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Récupérer un point de vente spécifique
router.get('/getSalePoint/:id', authori, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const salePoint = await SalePoint.findOne({ 
      _id: req.params.id, 
      companyId: req.company._id 
    });

    if (!salePoint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Point de vente non trouvé ou non autorisé' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: salePoint 
    });
  } catch (error) {
    console.error('Erreur dans getSalePoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Ajouter un point de vente
router.post('/addSalePoint', authori, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validation des données
    const { error, value } = salePointSchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    // Géocodage
    let coordinates = [0, 0];
    try {
      const [lat, lon] = await getExactCoordinates(value.address, value.name); // [latitude, longitude]
     if (!validateCoordinates(coordinates)) {
        throw new Error('Coordonnées invalides');
      }
      console.log(`Coordonnées pour ${value.name}: [lat: ${lat}, lon: ${lon}] -> [lon: ${lon}, lat: ${lat}]`);
    } catch (geocodeError) {
      console.error('Échec du géocodage initial:', geocodeError.message);
    }

    // Création du point de vente
    const newSalePoint = await SalePoint.create([{
      name: value.name,
      type: value.type,
      address: value.address,
     
      companyId: req.company._id,
      createdBy: req.user._id,
      position: {
        type: 'Point',
        coordinates: coordinates
      }
    }], { session });

    await session.commitTransaction();

    // Réponse
    const responseData = {
      ...newSalePoint[0].toObject(),
      __v: undefined
    };

    res.status(201).json({
      success: true,
      message: coordinates[0] !== 0 ? 
        'Point de vente créé avec succès' : 
        'Point de vente créé - Géocodage en cours',
      data: responseData
    });

    // Géocodage asynchrone de secours
    if (coordinates[0] === 0 && coordinates[1] === 0) {
      try {
        const [lat, lon] = await getExactCoordinates(value.address, value.name);
        const validCoords =  [lat, lon];
        if (!validateCoordinates(validCoords)) {
          throw new Error('Coordonnées invalides');
        }
        await SalePoint.updateOne(
          { _id: newSalePoint[0]._id },
          { 'position.coordinates': validCoords }
        );
        console.log(`Position mise à jour pour ${value.name}: [lon: ${lon}, lat: ${lat}]`);
      } catch (retryError) {
        console.error('Échec du géocodage asynchrone:', retryError.message);
      }
    }
  } catch (error) {
    await session.abortTransaction();
    console.error('Erreur dans addSalePoint:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    let status = 500;
    let errorMessage = 'Erreur serveur';
    let errorDetails = {};

    if (error.code === 11000) {
      status = 409;
      errorMessage = 'Un point de vente avec ce nom existe déjà';
      errorDetails.duplicateField = Object.keys(error.keyValue)[0];
    } else if (error.name === 'ValidationError') {
      status = 400;
      errorMessage = 'Erreur de validation des données';
      errorDetails.errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
    }

    res.status(status).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && {
        error: {
          message: error.message,
          ...errorDetails
        }
      })
    });
  } finally {
    session.endSession();
  }
});

// Mettre à jour un point de vente
router.put('/update/:id', authori, async (req, res) => {
  try {
    // Validation des données
    const { error, value } = salePointSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details[0].message,
        details: error.details
      });
    }

    // Vérification de l'existence
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const existingSalePoint = await SalePoint.findOne({
      _id: req.params.id,
      companyId: req.company._id
    });

    if (!existingSalePoint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Point de vente non trouvé ou non autorisé' 
      });
    }

    // Préparer les données de mise à jour
    const updateData = {
      name: value.name,
      type: value.type,
      updatedAt: new Date()
    };

    // Gestion de l'adresse et géocodage
    const addressChanged = value.address && value.address !== existingSalePoint.address;
    
    if (addressChanged) {
      updateData.address = value.address;
      
      try {
        const [lat, lon] = await getExactCoordinates(value.address, value.name); // [latitude, longitude]
        const coordinates = [lon, lat]; // [longitude, latitude]
        if (!validateCoordinates(coordinates)) {
          throw new Error('Coordonnées invalides');
        }
        updateData.position = {
          type: 'Point',
          coordinates
        };
        console.log(`Coordonnées pour ${value.name}: [lat: ${lat}, lon: ${lon}] -> [lon: ${lon}, lat: ${lat}]`);
      } catch (geocodeError) {
        console.error('Erreur de géocodage:', geocodeError);
        updateData.position = { type: 'Point', coordinates: [0, 0] };
      }
    }

    // Mise à jour
    const updatedSalePoint = await SalePoint.findOneAndUpdate(
      { _id: req.params.id, companyId: req.company._id },
      updateData,
      { new: true, runValidators: true }
    );

    // Géocodage asynchrone si nécessaire
    if (addressChanged && updateData.position.coordinates[0] === 0) {
      getExactCoordinates(value.address, value.name)
        .then(async ([lat, lon]) => {
          const coordinates = [lon, lat];
          if (!validateCoordinates(coordinates)) {
            throw new Error('Coordonnées invalides');
          }
          await SalePoint.findByIdAndUpdate(
            req.params.id,
            { 
              position: {
                type: 'Point',
                coordinates
              }
            }
          );
          console.log(`Position mise à jour pour ${value.name}: [lon: ${lon}, lat: ${lat}]`);
        })
        .catch(err => console.error('Échec du géocodage asynchrone:', err));
    }

    // Réponse
    const responseData = updatedSalePoint.toObject();
    delete responseData.__v;

    res.status(200).json({ 
      success: true, 
      message: addressChanged && responseData.position.coordinates[0] === 0 ? 
        'Point de vente mis à jour - Géocodage en cours' : 
        'Point de vente mis à jour',
      data: responseData
    });
  } catch (error) {
    console.error('Erreur dans updateSalePoint:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Un point de vente avec ce nom existe déjà' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Supprimer un point de vente
router.delete('/deleteSalePoint/:id', authori, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'ID invalide'
      });
    }

    const salePoint = await SalePoint.findOne({
      _id: req.params.id,
      companyId: req.company._id
    }).session(session);

    if (!salePoint) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Point de vente non trouvé ou accès non autorisé'
      });
    }

    const hasContracts = await Contract.exists({
      salePointId: req.params.id
    }).session(session);

    if (hasContracts) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: 'Impossible de supprimer - Des contrats sont associés à ce point de vente',
        data: {
          associatedContracts: await Contract.countDocuments({ 
            salePointId: req.params.id 
          })
        }
      });
    }

    await SalePoint.deleteOne({ 
      _id: req.params.id 
    }).session(session);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Point de vente supprimé avec succès',
      data: {
        id: req.params.id,
        name: salePoint.name
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Erreur dans deleteSalePoint:', {
      message: error.message,
      stack: error.stack,
      params: req.params
    });

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression',
      ...(process.env.NODE_ENV === 'development' && {
        error: {
          name: error.name,
          message: error.message
        }
      })
    });
  } finally {
    session.endSession();
  }
});
// Nouvelle route pour récupérer plusieurs points de vente par IDs
router.post('/getSalePointsByIds', authori, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ids doit être un tableau' 
      });
    }

    // Vérifier que tous les IDs sont valides
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Certains IDs sont invalides' 
      });
    }

    const salePoints = await SalePoint.find({
      _id: { $in: validIds },
      companyId: req.company._id
    });

    res.status(200).json({ 
      success: true, 
      count: salePoints.length,
      data: salePoints 
    });
  } catch (error) {
    console.error('Erreur dans getSalePointsByIds:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});
// Nouvelle route pour récupérer des points de vente par IDs
router.post('/getSalePointsByIds', authori, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le paramètre "ids" doit être un tableau' 
      });
    }

    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun ID valide fourni' 
      });
    }

    const salePoints = await SalePoint.find({
      _id: { $in: validIds },
      companyId: req.company._id
    });

    res.status(200).json({ 
      success: true, 
      count: salePoints.length,
      data: salePoints 
    });
  } catch (error) {
    console.error('Erreur dans getSalePointsByIds:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});
// Dans votre fichier backend (routes/salePoints.js)

// Route optimisée pour récupérer plusieurs points de vente
router.get('/getSalePointsByIds', authori, async (req, res) => {
  try {
    // 1. Récupération des IDs depuis les query params
    const idsParam = req.query.ids;
    
    if (!idsParam) {
      return res.status(400).json({
        success: false,
        message: 'Le paramètre "ids" est requis'
      });
    }

    // 2. Conversion en tableau et validation
    const idsArray = idsParam.split(',');
    const validIds = idsArray.filter(id => mongoose.Types.ObjectId.isValid(id.trim()));

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun ID valide fourni'
      });
    }

    // 3. Récupération des points de vente
    const salePoints = await SalePoint.find({
      _id: { $in: validIds },
      companyId: req.company._id
    });

    res.status(200).json({
      success: true,
      count: salePoints.length,
      data: salePoints
    });

  } catch (error) {
    console.error('Erreur dans getSalePointsByIds:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
export default router;