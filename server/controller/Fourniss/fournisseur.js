import express from 'express';
import mongoose from 'mongoose';
import Supplier from '../../models/Fourniss.js';
import authori from '../../middleware/authADD.js';
import Joi from 'joi';
import { getExactCoordinates } from '../../services/gecodingService.js';
import DistanceService from '../../services/DistanceService.js'; // Importez DistanceService

const router = express.Router();

// Schéma de validation Joi pour le fournisseur
const supplierSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  contact: Joi.string().trim().min(2).max(100).required(),
  category: Joi.string().valid('electronics',   
      'clothing',      
      'food',          
      'furniture',    
      'health',        
      'beauty',        
      'sports',       
      'automotive',    
      'home',         
      'books'   ).required(),
  location: Joi.string().trim().min(2).max(500).required(),
  companyId: Joi.string().hex().length(24).required(),
  position: Joi.object({
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array()
      .items(Joi.number().required())
      .length(2)
      .required()
      .description('Must be [longitude, latitude] array')
  }).required()
}).messages({
  'array.length': 'Les coordonnées doivent contenir exactement 2 valeurs [longitude, latitude]',
  'number.base': 'Les coordonnées doivent être des nombres'
});

// Schéma de validation pour les produits
const productSchema = Joi.object({
  name: Joi.string().required(),
  quantity: Joi.number().min(1).required()
});

// Validation des coordonnées
const validateCoordinates = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lon, lat] = coords;
  return (
    typeof lon === 'number' && lon >= -180 && lon <= 180 &&
    typeof lat === 'number' && lat >= -90 && lat <= 90
  );
};

// Récupérer tous les fournisseurs
router.get('/getFourniseurs', authori, async (req, res) => {
  try {
    if (!req.company) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Aucune entreprise associée'
      });
    }

    const { search, category } = req.query;
    const query = { companyId: req.company._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.category = category;

    const fournisseurs = await Supplier.find(query).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: fournisseurs.length,
      data: fournisseurs
    });
  } catch (error) {
    console.error('Erreur dans getFourniseurs:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
      companyId: req.company?._id
    });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// Ajouter un fournisseur
router.post('/addFournisseur', authori, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Received payload:', req.body);

    // Validation des données
    const { error, value } = supplierSchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Échec de la validation',
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    // Validation des coordonnées
    if (!validateCoordinates(value.position.coordinates)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Coordonnées invalides : doivent être [longitude, latitude] dans les plages valides'
      });
    }

    // Utiliser les coordonnées fournies
    let coordinates = [...value.position.coordinates]; // Cloner pour éviter la mutation

    // Géocodage pour vérifier les coordonnées
    try {
      const [lat, lon] = await getExactCoordinates(value.location, value.name); // [latitude, longitude]
      const geocodedCoords = [lat, lon]; // [longitude, latitude]
      if (!validateCoordinates(geocodedCoords)) {
        throw new Error('Coordonnées géocodées invalides');
      }
      coordinates = geocodedCoords;
      console.log(`Coordonnées géocodées pour ${value.name}: [lat: ${lat}, lon: ${lon}] -> [lon: ${lon}, lat: ${lat}]`);
    } catch (geocodeError) {
      console.warn('Échec du géocodage, utilisation des coordonnées fournies:', geocodeError.message);
    }

    // Création du fournisseur
    const newFournisseur = await Supplier.create(
      [{
        name: value.name,
        contact: value.contact,
        category: value.category,
        location: value.location,
        companyId: value.companyId,
        createdBy: req.user._id,
        position: {
          type: 'Point',
          coordinates
        }
      }],
      { session }
    );

    await session.commitTransaction();

    // Mise à jour des distances
    if (coordinates[0] !== 0 && coordinates[1] !== 0) {
      try {
        await DistanceService.updateSupplierDistances(newFournisseur[0]);
      } catch (distanceError) {
        console.error('Échec de la mise à jour des distances:', distanceError.message);
      }
    }

    // Réponse
    const responseData = {
      ...newFournisseur[0].toObject(),
      __v: undefined
    };

    res.status(201).json({
      success: true,
      message: 'Fournisseur ajouté avec succès',
      data: responseData
    });

    // Tentative asynchrone de géocodage si les coordonnées sont [0, 0]
    if (coordinates[0] === 0 && coordinates[1] === 0) {
      setImmediate(async () => {
        try {
          const [lat, lon] = await getExactCoordinates(value.location, value.name);
          const updatedCoords = [lon, lat];
          if (!validateCoordinates(updatedCoords)) {
            throw new Error('Coordonnées invalides');
          }
          await Supplier.findByIdAndUpdate(newFournisseur[0]._id, {
            position: { type: 'Point', coordinates: updatedCoords }
          });
          console.log(`Position mise à jour pour ${value.name}: [lon: ${lon}, lat: ${lat}]`);
          await DistanceService.updateSupplierDistances({
            ...newFournisseur[0].toObject(),
            position: { type: 'Point', coordinates: updatedCoords }
          });
        } catch (retryError) {
          console.error('Échec de la tentative asynchrone de géocodage:', retryError.message);
        }
      });
    }
  } catch (error) {
    await session.abortTransaction();
    console.error('Erreur dans addFournisseur:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
      companyId: req.company?._id,
      code: error.code
    });

    let status = 500;
    let message = 'Erreur serveur';
    let details = {};

    if (error.name === 'ValidationError') {
      status = 400;
      message = 'Erreur de validation des données';
      details.errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
    } else if (error.code === 11000) {
      status = 409;
      message = 'Un fournisseur avec ce nom existe déjà';
      details.duplicateField = Object.keys(error.keyValue)[0];
    }

    res.status(status).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { error: { message, ...details } })
    });
  } finally {
    session.endSession();
  }
});

// Mettre à jour un fournisseur
router.put('/updateFournisseur/:id', authori, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validation des données
    const updateSchema = Joi.object({
      name: Joi.string().trim().min(2).max(100),
      contact: Joi.string().trim().min(2).max(100),
      category: Joi.string().valid('electronics',   
      'clothing',      
      'food',          
      'furniture',    
      'health',        
      'beauty',        
      'sports',       
      'automotive',    
      'home',         
      'books'   ),
      location: Joi.string().trim().min(2).max(500),
      lastOrder: Joi.date().allow(null)
    });

    const { error, value } = updateSchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Échec de la validation',
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    // Validation de l'ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    // Vérification de l'existence
    const existingSupplier = await Supplier.findOne({
      _id: req.params.id,
      companyId: req.company._id
    }).session(session);

    if (!existingSupplier) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé ou non autorisé'
      });
    }

    // Préparer les données de mise à jour
    const updateData = {
      ...(value.name && { name: value.name.trim() }),
      ...(value.contact && { contact: value.contact.trim() }),
      ...(value.category && { category: value.category }),
       ...(value.lastOrder !== undefined && { lastOrder: value.lastOrder }),
      updatedAt: new Date()
    };

    // Gestion du changement de localisation et géocodage
    let coordinates = existingSupplier.position.coordinates;
    const locationChanged = value.location && value.location !== existingSupplier.location;

    if (locationChanged) {
      updateData.location = value.location.trim();
      try {
        const [lat, lon] = await getExactCoordinates(value.location, value.name || existingSupplier.name); // [latitude, longitude]
        coordinates = [lon, lat]; // [longitude, latitude]
        if (!validateCoordinates(coordinates)) {
          throw new Error('Coordonnées géocodées invalides');
        }
        updateData.position = { type: 'Point', coordinates };
        console.log(`Coordonnées géocodées pour ${value.name || existingSupplier.name}: [lat: ${lat}, lon: ${lon}] -> [lon: ${lon}, lat: ${lat}]`);
      } catch (geocodeError) {
        console.warn('Échec du géocodage:', geocodeError.message);
        coordinates = [0, 0];
        updateData.position = { type: 'Point', coordinates };
      }
    }

    // Mise à jour du fournisseur
    const updatedSupplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, companyId: req.company._id },
      updateData,
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction();

    // Mise à jour des distances
    if (locationChanged && coordinates[0] !== 0 && coordinates[1] !== 0) {
      try {
        await DistanceService.updateSupplierDistances(updatedSupplier);
      } catch (distanceError) {
        console.error('Échec de la mise à jour des distances:', distanceError.message);
      }
    }

    // Réponse
    const responseData = updatedSupplier.toObject();
    delete responseData.__v;

    res.status(200).json({
      success: true,
      message: locationChanged && coordinates[0] === 0 ? 'Fournisseur mis à jour - Géocodage en cours' : 'Fournisseur mis à jour',
      data: responseData
    });

    // Tentative asynchrone de géocodage
    if (locationChanged && coordinates[0] === 0) {
      setImmediate(async () => {
        try {
          const [lat, lon] = await getExactCoordinates(value.location, value.name || existingSupplier.name);
          coordinates = [lon, lat];
          if (!validateCoordinates(coordinates)) {
            throw new Error('Coordonnées invalides');
          }
          const updated = await Supplier.findByIdAndUpdate(
            req.params.id,
            { position: { type: 'Point', coordinates } },
            { new: true }
          );
          console.log(`Position mise à jour pour ${value.name || existingSupplier.name}: [lon: ${lon}, lat: ${lat}]`);
          await DistanceService.updateSupplierDistances(updated);
        } catch (retryError) {
          console.error('Échec de la tentative asynchrone de géocodage:', retryError.message);
        }
      });
    }
  } catch (error) {
    await session.abortTransaction();
    console.error('Erreur dans updateFournisseur:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
      companyId: req.company?._id,
      supplierId: req.params.id,
      body: req.body
    });

    let status = 500;
    let message = 'Erreur serveur';
    let details = {};

    if (error.name === 'ValidationError') {
      status = 400;
      message = 'Erreur de validation des données';
      details.errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
    } else if (error.code === 11000) {
      status = 409;
      message = 'Un fournisseur avec ce nom existe déjà';
      details.duplicateField = Object.keys(error.keyValue)[0];
    }

    res.status(status).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { error: { message, ...details } })
    });
  } finally {
    session.endSession();
  }
});

// Supprimer un fournisseur
router.delete('/deletFournisseur/:id', authori, async (req, res) => {
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

    const deletedFournisseur = await Supplier.findOneAndDelete(
      { _id: req.params.id, companyId: req.company._id },
      { session }
    );

    if (!deletedFournisseur) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé ou non autorisé'
      });
    }

    await session.commitTransaction();

    // Mise à jour des distances
    try {
      await DistanceService.handleEntityDeletion('supplier', req.params.id);
    } catch (distanceError) {
      console.error('Échec de la mise à jour des distances après suppression:', distanceError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Fournisseur supprimé avec succès',
      data: {
        id: req.params.id,
        name: deletedFournisseur.name
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Erreur dans deletFournisseur:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
      companyId: req.company?._id,
      supplierId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression',
      ...(process.env.NODE_ENV === 'development' && { error: { message: error.message } })
    });
  } finally {
    session.endSession();
  }
});

// Ajouter un produit
router.post('/:supplierId/products', authori, async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const supplier = await Supplier.findOneAndUpdate(
      {
        _id: req.params.supplierId,
        companyId: req.company._id,
        'products.name': { $ne: req.body.name }
      },
      { $push: { products: req.body } },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: 'Fournisseur non trouvé ou produit avec ce nom existe déjà'
      });
    }

    res.status(201).json({
      success: true,
      data: supplier.products
    });
  } catch (error) {
    console.error('Erreur dans l\'ajout du produit:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
      supplierId: req.params.supplierId
    });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// Mettre à jour un produit
router.put('/:supplierId/products/:productName', authori, async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const supplier = await Supplier.findOneAndUpdate(
      {
        _id: req.params.supplierId,
        companyId: req.company._id,
        'products.name': req.params.productName
      },
      {
        $set: {
          'products.$.name': req.body.name,
          'products.$.quantity': req.body.quantity
        }
      },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: supplier.products
    });
  } catch (error) {
    console.error('Erreur dans la mise à jour du produit:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
      supplierId: req.params.supplierId,
      productName: req.params.productName
    });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// Supprimer un produit
router.delete('/:supplierId/products/:productName', authori, async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.supplierId, companyId: req.company._id },
      { $pull: { products: { name: req.params.productName } } },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Produit supprimé avec succès',
      data: supplier.products
    });
  } catch (error) {
    console.error('Erreur dans la suppression du produit:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
      supplierId: req.params.supplierId,
      productName: req.params.productName
    });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

export default router;