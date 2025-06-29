import express from 'express';
import Warehouse from '../../models/warehouse.js';
import authori from '../../middleware/authADD.js';
import adminCheck from '../../middleware/adminCheck.js';
import Product from '../../models/Product.js';
import Company from '../../models/company.js';
import RentalRequest from '../../models/RentalWarehouse.js';
import mongoose from 'mongoose';
import ExternalWarehouse from '../../models/ExternalWarehouses.js';
import { getExactCoordinates } from '../../services/gecodingService.js';
import recalculateDistancess from '../distance/distanceWToSup.js';
import SalePoint from '../../models/salePoint.js';
import Supplier from '../../models/Fourniss.js';
import Contract from '../../models/contract.js';
const router = express.Router();

// Middleware de validation des coordonnées
const validateCoordinates = (req, res, next) => {
  if (req.body.position?.coordinates) {
    const [lon, lat] = req.body.position.coordinates;
    if (
      typeof lon !== 'number' || lon < -180 || lon > 180 ||
      typeof lat !== 'number' || lat < -90 || lat > 90
    ) {
      return res.status(400).json({
        success: false,
        message: 'Coordonnées invalides. La longitude doit être entre -180 et 180, et la latitude entre -90 et 90'
      });
    }
  }
  next();
};

// Fonction utilitaire pour formater et valider les coordonnées
const formatCoordinates = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) {
    return null;
  }

  let lon, lat;
  const [val1, val2] = coords;

  // Déterminer l'ordre : [latitude, longitude] ou [longitude, latitude]
  if (Math.abs(val1) <= 90 && Math.abs(val2) <= 180) {
    [lat, lon] = coords; // [latitude, longitude]
  } else if (Math.abs(val1) <= 180 && Math.abs(val2) <= 90) {
   [lat, lon] = coords; // [longitude, latitude]
  } else {
    return null;
  }

  // Valider les coordonnées
  if (
    typeof lon !== 'number' || lon < -180 || lon > 180 ||
    typeof lat !== 'number' || lat < -90 || lat > 90
  ) {
    return null;
  }

  return [lat, lon]; // Retourne [longitude, latitude] pour GeoJSON
};

// Récupérer les entrepôts internes
router.get('/getInternalDepots', authori, async (req, res) => {
  try {
    if (!req.company) {
      return res.status(403).json({ success: false, message: 'Accès refusé - Aucune entreprise associée' });
    }

    const { search, status, storage_type } = req.query;
    const query = { type: 'internal', company_id: req.company._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (storage_type) query.storage_type = storage_type;

    const depots = await Warehouse.find(query).select('-rental_requests');

    res.status(200).json({ success: true, count: depots.length, data: depots });
  } catch (error) {
    console.error('Erreur dans getInternalDepots:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// Ajout d'entrepôt interne
router.post('/addInternalDepot', authori, validateCoordinates, async (req, res) => {
  try {
    console.log('Début de addInternalDepot');
    const { name, location, storage_type, capacity } = req.body;

    // Validation
    if (!name || !location || !storage_type || isNaN(capacity)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs sont obligatoires' 
      });
    }

    // Géocodage
    let coordinates = [0, 0];
    try {
      const coords = await getExactCoordinates(location, name);
      console.log(`Coordonnées brutes de getExactCoordinates: ${JSON.stringify(coords)}`);
      coordinates = formatCoordinates(coords);
      if (!coordinates) {
        throw new Error('Coordonnées invalides');
      }
      console.log(`Coordonnées converties pour ${name}: [lon: ${coordinates[0]}, lat: ${coordinates[1]}]`);
    } catch (error) {
      console.error('Échec du géocodage:', error.message);
    }

    // Création avec coordonnées validées
    const newWarehouse = await Warehouse.create({
      name,
      type: 'internal',
      location,
      storage_type,
      capacity: Number(capacity),
      status: 'available',
      company_id: req.company._id,
      position: {
        type: 'Point',
        coordinates: coordinates
      }
    });

    console.log(`Coordonnées enregistrées: ${JSON.stringify(newWarehouse.position.coordinates)}`);

    // Retry géocodage en arrière-plan si échec
    if (coordinates[0] === 0 && coordinates[1] === 0) {
      getExactCoordinates(location, name)
        .then(async (coords) => {
          const retryCoords = formatCoordinates(coords);
          if (!retryCoords) {
            throw new Error('Coordonnées invalides');
          }
          await Warehouse.findByIdAndUpdate(
            newWarehouse._id,
            { 
              position: {
                type: 'Point',
                coordinates: retryCoords
              }
            }
          );
          console.log(`Coordonnées mises à jour pour ${name}: [lon: ${retryCoords[0]}, lat: ${retryCoords[1]}]`);
        })
        .catch(error => console.error('Échec du retry géocodage:', error.message));
    }

    res.status(201).json({
      success: true,
      message: 'Entrepôt créé avec succès',
      data: newWarehouse
    });
  } catch (error) {
    console.error('Erreur dans addInternalDepot:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Ajout d'entrepôt externe
router.post('/addExternalDepot', adminCheck, validateCoordinates, async (req, res) => {
  try {
    console.log('Début de addExternalDepot');
    const { name, location, storage_type, capacity } = req.body;

    // Validation
    if (!name || !location || !storage_type || isNaN(capacity)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs sont obligatoires' 
      });
    }

    // Géocodage
    let coordinates = [0, 0];
    try {
      const coords = await getExactCoordinates(location, name);
      console.log(`Coordonnées brutes de getExactCoordinates: ${JSON.stringify(coords)}`);
      coordinates = formatCoordinates(coords);
      if (!coordinates) {
        throw new Error('Coordonnées invalides');
      }
      console.log(`Coordonnées converties pour ${name}: [lon: ${coordinates[0]}, lat: ${coordinates[1]}]`);
    } catch (error) {
      console.error('Échec du géocodage:', error.message);
    }

    // Création initiale
    const newDepot = await Warehouse.create({
      name,
      type: 'external',
      location,
      storage_type,
      capacity: Number(capacity),
      status: 'available',
      position: {
        type: 'Point',
        coordinates: coordinates
      }
    });

    // Création entrée externe
    await ExternalWarehouse.create({
      warehouseId: newDepot._id
    });

    // Retry géocodage en arrière-plan si échec
    if (coordinates[0] === 0 && coordinates[1] === 0) {
      getExactCoordinates(location, name)
        .then(async (coords) => {
          const retryCoords = formatCoordinates(coords);
          if (!retryCoords) {
            throw new Error('Coordonnées invalides');
          }
          await Warehouse.findByIdAndUpdate(
            newDepot._id,
            {
              position: {
                type: 'Point',
                coordinates: retryCoords
              }
            }
          );
          console.log(`Coordonnées mises à jour pour ${name}: [lon: ${retryCoords[0]}, lat: ${retryCoords[1]}]`);
        })
        .catch(error => console.error('Échec du retry géocodage:', error.message));
    }

    res.status(201).json({
      success: true,
      message: 'Entrepôt externe ajouté',
      data: newDepot
    });
  } catch (error) {
    console.error('Erreur dans addExternalDepot:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mise à jour de la position d'un entrepôt
router.put('/:id/updatePosition', authori, validateCoordinates, async (req, res) => {
  try {
    const { coordinates } = req.body;
    const formattedCoords = formatCoordinates(coordinates);

    if (!formattedCoords) {
      return res.status(400).json({
        success: false,
        message: 'Coordonnées invalides'
      });
    }

    const updated = await Warehouse.findByIdAndUpdate(
      req.params.id,
      {
        position: {
          type: 'Point',
          coordinates: formattedCoords
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Entrepôt non trouvé'
      });
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Erreur dans updatePosition:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer les entrepôts externes
router.get('/getExternalDepots', authori, async (req, res) => {
  try {
    const { search, storage_type } = req.query;
    const query = { type: 'external' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (storage_type) query.storage_type = storage_type;

    const externalEntries = await ExternalWarehouse.find()
      .select('warehouseId')
      .lean();

    const warehouseIds = externalEntries.map(entry => entry.warehouseId);

    if (warehouseIds.length === 0) {
      return res.status(200).json({ 
        success: true, 
        count: 0, 
        data: [] 
      });
    }

    query._id = { $in: warehouseIds };

    const depots = await Warehouse.find(query).select('-rental_requests -owner_id');

    res.status(200).json({ 
      success: true, 
      count: depots.length, 
      data: depots 
    });
  } catch (error) {
    console.error('Erreur dans getExternalDepots:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// Supprimer un entrepôt externe
router.delete('/deleteExternalDepot/:id', adminCheck, async (req, res) => {
  try {
    const depotId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(depotId)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    await ExternalWarehouse.findOneAndDelete({ warehouseId: depotId });

    const deletedDepot = await Warehouse.findOneAndDelete({ 
      _id: depotId, 
      type: 'external' 
    });

    if (!deletedDepot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Entrepôt externe non trouvé' 
      });
    }

    const salePoints = await SalePoint.find();
    const suppliers = await Supplier.find();

    await recalculateDistancess(deletedDepot, salePoints, suppliers);

    res.json({ 
      success: true, 
      message: 'Entrepôt supprimé avec succès', 
      data: deletedDepot 
    });
  } catch (error) {
    console.error('Erreur dans deleteExternalDepot:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// Mettre à jour un entrepôt externe
router.put('/updateExternalDepot/:id', adminCheck, validateCoordinates, async (req, res) => {
  try {
    console.log('Début de updateExternalDepot');
    const { name, location, storage_type, capacity, status, position } = req.body;
    const depotId = req.params.id;

    if (!name || !location || !storage_type || isNaN(capacity)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Données invalides' 
      });
    }

    let coordinates = [0, 0];
    if (location) {
      try {
        const coords = await getExactCoordinates(location, name);
        console.log(`Coordonnées brutes de getExactCoordinates: ${JSON.stringify(coords)}`);
        coordinates = formatCoordinates(coords);
        if (!coordinates) {
          throw new Error('Coordonnées invalides');
        }
        console.log(`Coordonnées converties pour ${name}: [lon: ${coordinates[0]}, lat: ${coordinates[1]}]`);
      } catch (error) {
        console.error('Échec du géocodage:', error.message);
      }
    } else if (position?.coordinates) {
      coordinates = formatCoordinates(position.coordinates);
      if (!coordinates) {
        return res.status(400).json({ success: false, message: 'Coordonnées invalides' });
      }
    }

    const updatedDepot = await Warehouse.findOneAndUpdate(
      { _id: depotId, type: 'external' },
      { 
        name, 
        location, 
        storage_type, 
        capacity, 
        status,
        position: {
          type: 'Point',
          coordinates: coordinates
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedDepot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Entrepôt non trouvé' 
      });
    }

    console.log(`Coordonnées enregistrées pour update: ${JSON.stringify(updatedDepot.position.coordinates)}`);

    res.status(200).json({
      success: true,
      message: 'Entrepôt mis à jour',
      data: updatedDepot
    });
  } catch (error) {
    console.error('Erreur dans updateExternalDepot:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Mettre à jour un entrepôt interne
router.put('/updateInternalDepot/:id', authori, validateCoordinates, async (req, res) => {
  try {
    console.log('Début de updateInternalDepot');
    const { name, location, storage_type, capacity, status, position } = req.body;
    const warehouseId = req.params.id;

    if (!name || !location || !storage_type || isNaN(capacity)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Données invalides' 
      });
    }

    let coordinates = [0, 0];
    if (location) {
      try {
        const coords = await getExactCoordinates(location, name);
        console.log(`Coordonnées brutes de getExactCoordinates: ${JSON.stringify(coords)}`);
        coordinates = formatCoordinates(coords);
        if (!coordinates) {
          throw new Error('Coordonnées invalides');
        }
        console.log(`Coordonnées converties pour ${name}: [lon: ${coordinates[0]}, lat: ${coordinates[1]}]`);
      } catch (error) {
        console.error('Échec du géocodage:', error.message);
      }
    } else if (position?.coordinates) {
      coordinates = formatCoordinates(position.coordinates);
      if (!coordinates) {
        return res.status(400).json({ success: false, message: 'Coordonnées invalides' });
      }
    }

    const updatedWarehouse = await Warehouse.findOneAndUpdate(
      { _id: warehouseId, type: 'internal', company_id: req.company._id },
      { 
        name, 
        location, 
        storage_type, 
        capacity, 
        status,
        position: {
          type: 'Point',
          coordinates: coordinates
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedWarehouse) {
      return res.status(404).json({ 
        success: false, 
        message: 'Entrepôt non trouvé' 
      });
    }

    console.log(`Coordonnées enregistrées pour update: ${JSON.stringify(updatedWarehouse.position.coordinates)}`);

    res.status(200).json({
      success: true,
      message: 'Entrepôt mis à jour',
      data: updatedWarehouse
    });
  } catch (error) {
    console.error('Erreur dans updateInternalDepot:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Supprimer un entrepôt interne
router.delete('/deleteInternalDepot/:id', authori, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }
    const currentDate = new Date();
    const activeContracts = await Contract.find({
      'warehouse.id': req.params.id,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).lean();

    if (activeContracts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer l\'entrepôt car il est référencé dans des contrats actifs',
        activeContractsCount: activeContracts.length,
        contractIds: activeContracts.map(c => c._id)
      });
    }
    const deletedDepot = await Warehouse.findOneAndDelete({ 
      _id: req.params.id, 
      type: 'internal', 
      company_id: req.company._id 
    });

    if (!deletedDepot) {
      return res.status(404).json({ success: false, message: 'Dépôt non trouvé ou non autorisé' });
    }

    res.status(200).json({ success: true, message: 'Dépôt supprimé avec succès' });
  } catch (error) {
    console.error('Erreur dans deleteInternalDepot:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// Ajouter un produit à un entrepôt
router.post('/:warehouseId/products', authori, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { warehouseId } = req.params;
    const { productId, quantity } = req.body;
    const companyId = req.company._id;

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(warehouseId)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Format ID invalide' });
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'La quantité doit être un nombre positif' });
    }

    const externalWarehouse = await ExternalWarehouse.findOne({ warehouseId }).session(session);
    const isExternal = !!externalWarehouse;

    const [warehouse, product] = await Promise.all([
      Warehouse.findById(warehouseId).session(session),
      Product.findById(productId).session(session)
    ]);

    if (!warehouse || !product) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Entrepôt ou produit non trouvé' });
    }

    if (product.storage_type !== warehouse.storage_type) {
      await session.abortTransaction();
      return res.status(400).json({ 
        error: `Le produit nécessite un stockage ${product.storage_type} mais l'entrepôt est ${warehouse.storage_type}`
      });
    }

    const currentUsage = warehouse.products.reduce((sum, p) => sum + p.quantity, 0);
    let maxCapacity;

    if (!isExternal) {
      maxCapacity = warehouse.capacity;
    } else {
      const activeRental = await RentalRequest.findOne({
        warehouse_id: externalWarehouse.warehouseId,
        company_id: companyId,
        status: 'approved',
        start_date: { $lte: new Date() },
        end_date: { $gte: new Date() }
      }).session(session);

      if (!activeRental) {
        await session.abortTransaction();
        return res.status(400).json({
          error: 'Aucun contrat de location actif pour cet entrepôt',
          solution: 'Veuillez louer l\'entrepôt avant d\'ajouter des produits'
        });
      }

      maxCapacity = activeRental.requested_capacity;
    }

    const availableCapacity = maxCapacity - currentUsage;

    if (availableCapacity <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        error: 'Entrepôt plein',
        details: { maxCapacity, currentUsage, available: availableCapacity }
      });
    }

    if (quantity > availableCapacity) {
      await session.abortTransaction();
      return res.status(400).json({
        error: 'Pas assez de place',
        details: {
          requested: quantity,
          available: availableCapacity,
          solution: `Vous pouvez ajouter jusqu'à ${availableCapacity} unités`
        }
      });
    }

    const productIndex = warehouse.products.findIndex(p => p.product.toString() === productId);
    
    if (productIndex >= 0) {
      warehouse.products[productIndex].quantity += quantity;
    } else {
      warehouse.products.push({ product: productId, quantity });
    }

    warehouse.current_usage = currentUsage + quantity;

    await warehouse.save({ session });
    await session.commitTransaction();

    const updatedWarehouse = await Warehouse.findById(warehouseId)
      .populate('products.product', 'name category storage_type')
      .session(null);

    res.json({
      success: true,
      data: {
        warehouse: updatedWarehouse,
        capacityInfo: {
          maxCapacity,
          currentUsage: warehouse.current_usage,
          available: maxCapacity - warehouse.current_usage
        }
      },
      message: 'Produit ajouté avec succès'
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Erreur dans addProduct:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
});

// Mettre à jour un produit dans un entrepôt
router.put('/:warehouseId/products/:productId', authori, async (req, res) => {
  try {
    const { warehouseId, productId } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'La quantité doit être un nombre positif ou zéro'
      });
    }

    const warehouse = await Warehouse.findOne({
      _id: warehouseId,
      company_id: req.company._id
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Entrepôt non trouvé ou non autorisé'
      });
    }

    const productIndex = warehouse.products.findIndex(
      p => p.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé dans cet entrepôt'
      });
    }

    const currentProduct = warehouse.products[productIndex];
    const totalUsage = warehouse.current_usage - currentProduct.quantity + quantity;

    if (totalUsage > warehouse.capacity) {
      return res.status(400).json({
        success: false,
        message: `Capacité insuffisante. Disponible: ${warehouse.capacity - (warehouse.current_usage - currentProduct.quantity)}, Demandé: ${quantity}`
      });
    }

    warehouse.products[productIndex].quantity = quantity;
    warehouse.current_usage = totalUsage;

    await warehouse.save();

    res.status(200).json({
      success: true,
      message: 'Produit mis à jour avec succès',
      data: warehouse
    });
  } catch (error) {
    console.error('Erreur dans updateProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Supprimer un produit d'un entrepôt
router.delete('/:warehouseId/products/:productId', authori, async (req, res) => {
  try {
    const { warehouseId, productId } = req.params;

    const warehouse = await Warehouse.findOne({
      _id: warehouseId,
      company_id: req.company._id
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Entrepôt non trouvé ou non autorisé'
      });
    }

    const productIndex = warehouse.products.findIndex(
      p => p.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé dans cet entrepôt'
      });
    }

    const productQuantity = warehouse.products[productIndex].quantity;
    warehouse.products.splice(productIndex, 1);
    warehouse.current_usage -= productQuantity;

    await warehouse.save();

    res.status(200).json({
      success: true,
      message: 'Produit supprimé avec succès',
      data: warehouse
    });
  } catch (error) {
    console.error('Erreur dans deleteProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Obtenir les produits d'un entrepôt
router.get('/:warehouseId/products', authori, async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const warehouse = await Warehouse.findOne({
      _id: warehouseId,
      company_id: req.company._id
    }).populate('products.product', 'name category description');

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Entrepôt non trouvé ou non autorisé'
      });
    }

    res.status(200).json({
      success: true,
      data: warehouse.products
    });
  } catch (error) {
    console.error('Erreur dans getProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Obtenir les entrepôts de l'entreprise
router.get('/getCompanyWarehouses', authori, async (req, res) => {
  try {
    if (!req.user || !req.company?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const companyId = req.company._id;
    const { search, status, storage_type } = req.query;
    const baseQuery = {};

    if (search) {
      baseQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) baseQuery.status = status;
    if (storage_type) baseQuery.storage_type = storage_type;

    const internalDepots = await Warehouse.find({
      ...baseQuery,
      type: 'internal',
      company_id: companyId
    }).lean();

    const now = new Date();
    const rentalRequests = await RentalRequest.find({
      company_id: companyId,
      status: 'approved',
      end_date: { $gte: now }
    })
      .select('warehouse_id requested_capacity start_date end_date')
      .lean();

    await RentalRequest.deleteMany({
      company_id: companyId,
      status: 'approved',
      end_date: { $lt: now }
    });

    const rentedWarehouseIds = [...new Set(
      rentalRequests.map(r => r.warehouse_id?.toString()).filter(Boolean)
    )];

    const rentalData = rentalRequests.reduce((acc, request) => {
      const warehouseId = request.warehouse_id?.toString();
      if (!warehouseId) return acc;
      
      if (!acc[warehouseId]) {
        acc[warehouseId] = {
          total_rented_capacity: 0,
          requests: []
        };
      }
      acc[warehouseId].total_rented_capacity += request.requested_capacity || 0;
      acc[warehouseId].requests.push({
        requested_capacity: request.requested_capacity,
        start_date: request.start_date,
        end_date: request.end_date
      });
      return acc;
    }, {});

    const externalWarehouseEntries = await ExternalWarehouse.find({
      warehouseId: { $in: rentedWarehouseIds }
    })
      .select('warehouseId')
      .lean();

    const validExternalWarehouseIds = externalWarehouseEntries.map(entry => entry.warehouseId);

    let externalDepots = [];
    if (validExternalWarehouseIds.length > 0) {
      externalDepots = await Warehouse.find({
        ...baseQuery,
        _id: { $in: validExternalWarehouseIds },
        type: 'external'
      }).lean();
    }

    const response = {
      success: true,
      data: {
        internal: internalDepots,
        external: externalDepots.map(depot => ({
          _id: depot._id,
          name: depot.name,
          type: depot.type,
          location: depot.location,
          storage_type: depot.storage_type,
          capacity: depot.capacity,
          status: depot.status,
          is_rented: true,
          rented_capacity: rentalData[depot._id.toString()]?.total_rented_capacity || 0,
          rental_requests: rentalData[depot._id.toString()]?.requests || []
        }))
      },
      company_info: {
        company_id: companyId,
        company_name: req.company.name
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Erreur dans getCompanyWarehouses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;