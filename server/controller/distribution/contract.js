import Contract from '../../models/contract.js';
import Distribution from '../../models/Distribution.js';
import Router from 'express';
import express from 'express';
import { isValidObjectId } from 'mongoose';
import authenticate from '../../middleware/authADD.js';
import mongoose from 'mongoose';
const router = Router();
router.use(express.json());

// Helper function to validate quantities
const validateQuantities = (warehouse, supplier, tonnage) => {
  if (warehouse && supplier) {
    const total = Number(warehouse.quantity || 0) + Number(supplier.quantity || 0);
    return Math.abs(total - Number(tonnage)) <= 0.01;
  }
  return true;
};

// Helper function to validate dates
const validateDates = (startDate, endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const contractStartDate = new Date(startDate);
  contractStartDate.setHours(0, 0, 0, 0);

  if (contractStartDate < today) {
    return { valid: false, message: 'La date de début ne peut pas être antérieure à aujourd\'hui' };
  }

  if (new Date(endDate) < contractStartDate) {
    return { valid: false, message: 'La date de fin ne peut pas être antérieure à la date de début' };
  }

  return { valid: true };
};

export const createContract = async (req, res) => {
  try {
    const { warehouseId, supplierId, tonnage, warehouseQuantity, supplierQuantity, startDate, endDate, ...rest } = req.body;

    // Validate dates
    const dateValidation = validateDates(startDate, endDate);
    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message
      });
    }

    if (!validateQuantities({ quantity: warehouseQuantity }, { quantity: supplierQuantity }, tonnage)) {
      return res.status(400).json({
        success: false,
        message: 'Sum of warehouse and supplier quantities must match total tonnage'
      });
    }

    const contractData = {
      ...rest,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      product: { 
        id: rest.productId,
        totalQuantity: Number(tonnage)
      },
      warehouse: warehouseId ? { id: warehouseId, quantity: Number(warehouseQuantity) || 0 } : undefined,
      supplier: supplierId ? { id: supplierId, quantity: Number(supplierQuantity) || 0 } : undefined
    };

    const newContract = await Contract.create(contractData);
    
    const populated = await Contract.findById(newContract._id)
      .populate('salesPointIds', 'name address position')
      .populate('product.id', 'name category')
      .populate('warehouse.id', 'name storage_type capacity position products')
      .populate('supplier.id', 'name position products');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create contract'
    });
  }
};
export const updateContract = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }

    const { 
      name,
      startDate, 
      endDate, 
      salesPointIds,
      productId,
      tonnage,
      frequency, 
      deliveryDays, 
      deliveryDates,
      warehouseId, 
      supplierId, 
      warehouseQuantity, 
      supplierQuantity
    } = req.body;

    // Verify if the contract exists
    const existingContract = await Contract.findById(req.params.id);
    if (!existingContract) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contract not found' 
      });
    }

    // Validate dates
    const dateValidation = validateDates(
      startDate || existingContract.startDate,
      endDate || existingContract.endDate
    );
    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message
      });
    }

    // Validate salesPointIds
    if (salesPointIds && (!Array.isArray(salesPointIds) || !salesPointIds.every(id => isValidObjectId(id)))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salesPointIds format'
      });
    }

    // Validate productId
    if (productId && !isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid productId format'
      });
    }

    // Validate tonnage
    if (tonnage !== undefined && (isNaN(tonnage) || tonnage <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Tonnage must be a positive number'
      });
    }

    // Validate quantities if provided
    if (tonnage && (warehouseQuantity !== undefined || supplierQuantity !== undefined)) {
      if (!validateQuantities(
        { quantity: warehouseQuantity },
        { quantity: supplierQuantity },
        tonnage
      )) {
        return res.status(400).json({
          success: false,
          message: 'Sum of warehouse and supplier quantities must match total tonnage'
        });
      }
    }

    // Validate deliveryDates for custom frequency
    if (frequency === 'custom' && Array.isArray(deliveryDates)) {
      for (const dd of deliveryDates) {
        if (!dd.date || isNaN(new Date(dd.date).getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid delivery date'
          });
        }
        if (!['en cours', 'livree', 'en attente'].includes(dd.status)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid delivery status'
          });
        }
      }
    }

    // Validate deliveryDays for custom frequency
    if (frequency === 'custom' && Array.isArray(deliveryDays)) {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (!deliveryDays.every(day => validDays.includes(day))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid delivery days'
        });
      }
    }

    // Validate warehouseId and supplierId
    if (warehouseId && !isValidObjectId(warehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouseId format'
      });
    }
    if (supplierId && !isValidObjectId(supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplierId format'
      });
    }

    // Prepare update data with $set
    const updateData = {};

    if (name !== undefined) updateData['name'] = name;
    if (startDate) updateData['startDate'] = new Date(startDate);
    if (endDate) updateData['endDate'] = new Date(endDate);
    if (salesPointIds) updateData['salesPointIds'] = salesPointIds;
    if (productId || tonnage !== undefined) {
      updateData['product'] = {
        id: productId || existingContract.product.id,
        totalQuantity: tonnage !== undefined ? Number(tonnage) : existingContract.product.totalQuantity
      };
    }
    if (frequency) updateData['frequency'] = frequency;
    if (frequency === 'custom' && deliveryDays) updateData['deliveryDays'] = deliveryDays;
    if (frequency === 'custom' && deliveryDates) {
      updateData['deliveryDates'] = deliveryDates.map(dd => ({
        date: new Date(dd.date),
        status: dd.status
      }));
    }
    if (warehouseId !== undefined) {
      updateData['warehouse'] = warehouseId ? {
        id: warehouseId,
        quantity: Number(warehouseQuantity) || 0
      } : null;
    }
    if (supplierId !== undefined) {
      updateData['supplier'] = supplierId ? {
        id: supplierId,
        quantity: Number(supplierQuantity) || 0
      } : null;
    }

    // Perform the update
    const updated = await Contract.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData },
      { 
        new: true, 
        runValidators: true
      }
    )
      .populate('salesPointIds', 'name address position')
      .populate('product.id', 'name category')
      .populate('warehouse.id', 'name storage_type capacity position products')
      .populate('supplier.id', 'name position products');

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contract not found after update' 
      });
    }

    res.json({ 
      success: true, 
      data: updated,
      message: 'Contract updated successfully'
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update contract'
    });
  }
};
export const getContracts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (status === 'active') {
      query = { 
        startDate: { $lte: today }, 
        endDate: { $gte: today } 
      };
    } else if (status === 'expired') {
      query = { endDate: { $lt: today } };
    } else if (status === 'upcoming') {
      query = { startDate: { $gt: today } };
    }

    const [contracts, total] = await Promise.all([
      Contract.find(query)
        .populate('salesPointIds', 'name address')
        .populate('product.id', 'name category')
        .populate('warehouse.id', 'name storage_type')
        .populate('supplier.id', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Contract.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: contracts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch contracts'
    });
  }
};

export const getContractById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }

    const contract = await Contract.findById(req.params.id)
      .populate('salesPointIds', 'name address position')
      .populate('product.id', 'name category')
      .populate('warehouse.id', 'name storage_type capacity')
      .populate('supplier.id', 'name position');

    if (!contract) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contract not found' 
      });
    }

    // Add status information
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const status = 
      contract.startDate > today ? 'upcoming' :
      contract.endDate < today ? 'expired' : 'active';

    res.json({ 
      success: true, 
      data: {
        ...contract.toObject(),
        status
      } 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch contract'
    });
  }
};

const deleteContract = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }

    const deleted = await Contract.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contract not found' 
      });
    }

    res.json({ 
      success: true, 
      data: { id: deleted._id },
      message: 'Contract deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete contract'
    });
  }
};

// Helper function to validate waypoints
const validateWaypoints = (waypoints) => {
  if (!Array.isArray(waypoints) || waypoints.length === 0) return false;
  return waypoints.every(wp => 
    wp.type && 
    wp.id && 
    wp.name && 
    Number.isInteger(wp.sequence) && 
    (!wp.location || (typeof wp.location.lat === 'number' && typeof wp.location.lng === 'number'))
  );
};

router.post('/save', authenticate, async (req, res) => {
  try {
    const { distributionOrders, metadata } = req.body;
    console.log('Received save request:', { distributionOrders, metadata });

    // Validation de base
    if (!Array.isArray(distributionOrders)) {
      return res.status(400).json({
        success: false,
        message: 'distributionOrders doit être un tableau'
      });
    }

    if (!metadata || !metadata.savedAt || !metadata.savedBy) {
      return res.status(400).json({
        success: false,
        message: 'Métadonnées manquantes ou invalides'
      });
    }

    const errors = [];
    const savedDistributions = [];

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const order of distributionOrders) {
        // Validation des champs obligatoires
        if (!order.contract) {
          errors.push('Nom du contrat manquant');
          continue;
        }

        if (!Array.isArray(order.deliveryDates) || order.deliveryDates.length === 0) {
          errors.push(`Dates de livraison manquantes pour le contrat ${order.contract}`);
          continue;
        }

        if (!Array.isArray(order.waypoints) || order.waypoints.length === 0) {
          errors.push(`Points de passage manquants pour le contrat ${order.contract}`);
          continue;
        }

        // Validation des dates de livraison
        const validatedDeliveryDates = [];
        for (const dd of order.deliveryDates) {
          if (!dd.date || isNaN(new Date(dd.date).getTime())) {
            errors.push(`Date de livraison invalide pour le contrat ${order.contract}`);
            continue;
          }
          
          if (!['en cours', 'livree', 'en attente'].includes(dd.status)) {
            errors.push(`Statut de livraison invalide pour le contrat ${order.contract}`);
            continue;
          }

          validatedDeliveryDates.push({
            date: new Date(dd.date),
            status: dd.status
          });
        }

        if (validatedDeliveryDates.length === 0) {
          errors.push(`Aucune date de livraison valide pour le contrat ${order.contract}`);
          continue;
        }

        // Validation des waypoints
        const validatedWaypoints = [];
        for (const wp of order.waypoints) {
          if (!wp.type || !['warehouse', 'supplier', 'salespoint', 'warehouse-return'].includes(wp.type)) {
            errors.push(`Type de point de passage invalide pour le contrat ${order.contract}`);
            continue;
          }

          if (!wp.id || !wp.name || typeof wp.sequence !== 'number') {
            errors.push(`Données de point de passage incomplètes pour le contrat ${order.contract}`);
            continue;
          }

          validatedWaypoints.push({
            type: wp.type,
            id: wp.id,
            name: wp.name,
            sequence: wp.sequence,
            location: wp.location ? {
              lat: Number(wp.location.lat),
              lng: Number(wp.location.lng)
            } : undefined,
            distanceFromPrevious: wp.distanceFromPrevious ? Number(wp.distanceFromPrevious) : undefined,
            cumulativeDistance: wp.cumulativeDistance ? Number(wp.cumulativeDistance) : undefined
          });
        }

        if (validatedWaypoints.length === 0) {
          errors.push(`Aucun point de passage valide pour le contrat ${order.contract}`);
          continue;
        }

        // Trouver le contrat dans la base de données
        const contract = await Contract.findById(order.contract);
        if (!contract) {
          errors.push(`Contrat ${order.contract} non trouvé`);
          continue;
        }

        // Vérifier si une distribution existe déjà pour ce contrat à ces dates
        const existingDistribution = await Distribution.findOne({
          contracts: contract._id,
          'deliveryDates.date': { $in: validatedDeliveryDates.map(dd => dd.date) }
        });

        if (existingDistribution) {
          errors.push(`Une distribution existe déjà pour le contrat ${order.contract} à certaines de ces dates`);
          continue;
        }

        // Créer la nouvelle distribution
        const newDistribution = new Distribution({
          contracts: [contract._id],
          deliveryDates: validatedDeliveryDates,
          waypoints: validatedWaypoints,
          truck: order.truck?.id || null,
          transporter: order.transporter?.id || null,
          createdAt: new Date(metadata.savedAt),
          createdBy: metadata.savedBy
        });

        await newDistribution.save({ session });
        savedDistributions.push(newDistribution);
      }

      if (errors.length > 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors
        });
      }

      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: 'Distributions enregistrées avec succès',
        data: savedDistributions
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des distributions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'enregistrement',
      error: error.message
    });
  }
});

router.use(authenticate);
// Define routes
router.post('/', createContract);
router.get('/', getContracts);
router.get('/:id', getContractById);
router.put('/:id', updateContract);
router.patch('/:id', updateContract);
router.delete('/:id', deleteContract);

export default router;