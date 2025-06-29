import express from 'express';
import mongoose from 'mongoose';
import RentalRequest from '../../models/RentalWarehouse.js';
import Warehouse from '../../models/warehouse.js';
import adminCheck from '../../middleware/adminCheck.js';
import authenticateTokens from '../../middleware/authADD.js';
const router = express.Router();
const handleError = (res, error, statusCode = 500) => {
  console.error(error);
  res.status(statusCode).json({
    success: false,
    message: error.message || 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

router.get('/', adminCheck, async (req, res) => {
  try {
    const { company_id, status, warehouse_id, start_date, end_date } = req.query;
    const query = {};
    
    if (company_id) query.company_id = company_id;
    if (status) query.status = status;
    if (warehouse_id) query.warehouse_id = warehouse_id;
    
    if (start_date || end_date) {
      query.requested_at = {};
      if (start_date) query.requested_at.$gte = new Date(start_date);
      if (end_date) query.requested_at.$lte = new Date(end_date);
    }

    const requests = await RentalRequest.find(query)
      .populate({
        path: 'warehouse_id',
        select: 'name location capacity available_capacity status type',
        model: 'Warehouse' // Spécifiez explicitement le modèle
      })
      .populate({
        path: 'company_id',
        select: 'companyName email phone',
        model: 'Company' // Spécifiez explicitement le modèle
      })
      .lean();

    // Transformez les données pour le frontend
    const transformedRequests = requests.map(request => ({
      ...request,
      warehouse_id: request.warehouse_id || null, // Garantit un objet même si non peuplé
      company_id: request.company_id || null
    }));

    res.json({
      success: true,
      data: transformedRequests // Envoyez les données transformées
    });

  } catch (error) {
    handleError(res, error);
  }
});
router.post('/send', authenticateTokens, async (req, res) => {
  try {
    // Vérification du rôle entreprise
    if (req.user.role !== 'entreprise') {
      return handleError(res, new Error('Seules les entreprises peuvent faire des demandes de location'), 403);
    }

    const { warehouse_id, requested_capacity, start_date, end_date } = req.body;
    const company_id = req.company._id;

    // Validation des champs obligatoires
    if (!warehouse_id || !requested_capacity || !start_date || !end_date) {
      return handleError(res, new Error('Tous les champs sont obligatoires'), 400);
    }

    // Validation des dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return handleError(res, new Error('Format de date invalide'), 400);
    }

    if (endDate <= startDate) {
      return handleError(res, new Error('La date de fin doit être après la date de début'), 400);
    }

    // Vérification de l'entrepôt
    const warehouse = await Warehouse.findById(warehouse_id);
    if (!warehouse || warehouse.type !== 'external') {
      return handleError(res, new Error('Entrepôt externe non trouvé'), 404);
    }

    if (warehouse.status !== 'available') {
      return handleError(res, new Error("L'entrepôt n'est pas disponible à la location"), 400);
    }

    // Vérification des demandes existantes pour cette entreprise
    const existingRequest = await RentalRequest.findOne({
      warehouse_id,
      company_id,
      status: 'pending'
    });

    if (existingRequest) {
      return handleError(res, new Error('Votre entreprise a déjà une demande en attente pour cet entrepôt'), 400);
    }

    // Calcul de la capacité déjà réservée pendant cette période
    const overlappingRequests = await RentalRequest.find({
      warehouse_id,
      status: { $in: ['approved', 'pending'] }, // Inclure aussi les demandes en attente
      $or: [
        { start_date: { $lt: endDate }, end_date: { $gt: startDate } },
        { start_date: { $gte: startDate, $lt: endDate } }
      ]
    });

    // Calcul de la capacité déjà réservée ou en attente de réservation
    const totalReservedOrPendingCapacity = overlappingRequests.reduce(
      (sum, req) => sum + req.requested_capacity, 0
    );

    // Capacité réellement disponible (en tenant compte des réservations approuvées ET des demandes en attente)
    const trulyAvailableCapacity = warehouse.capacity - totalReservedOrPendingCapacity;

    // Vérification finale de la capacité
    if (requested_capacity > trulyAvailableCapacity) {
      return handleError(res, 
        new Error(`La capacité demandée (${requested_capacity}) dépasse la capacité disponible (${Math.max(0, trulyAvailableCapacity)} unités) pour la période demandée`), 
        400
      );
    }
    
    // Création de la demande
    const rentalRequest = new RentalRequest({
      warehouse_id,
      company_id,
      requested_capacity,
      start_date: startDate,
      end_date: endDate,
      status: 'pending'
    });

    await rentalRequest.save();

    res.status(201).json({
      success: true,
      data: rentalRequest
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});
router.put('/:id/status', adminCheck, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return handleError(res, new Error('Invalid request ID'), 400);
    }

    const { status, rejectionReason } = req.body;
    const validStatuses = ['approved', 'rejected'];
    
    if (!validStatuses.includes(status)) {
      return handleError(res, new Error('Invalid status. Must be "approved" or "rejected"'), 400);
    }

    const request = await RentalRequest.findById(req.params.id)
      .populate('warehouse_id', 'name')
      .populate('company_id', '_id');
    
    if (!request) {
      return handleError(res, new Error('Rental request not found'), 404);
    }

    if (request.status !== 'pending') {
      return handleError(res, new Error('Only pending requests can be updated'), 400);
    }

    // Mise à jour selon le statut
    if (status === 'approved') {
      // Mise à jour de la demande approuvée
      request.status = status;
      request.processed_at = new Date();
      await request.save();

      // Mise à jour de l'entrepôt
      if (request.warehouse_id) {
        await Warehouse.findByIdAndUpdate(
          request.warehouse_id._id,
          { 
            $inc: { 
              available_capacity: -request.requested_capacity,
              used_capacity: request.requested_capacity
            }
          }
        );
      }
    } else {
      // Marquer comme rejetée au lieu de supprimer
      request.status = 'rejected';
      request.rejection_reason = rejectionReason || 'Rejected by admin';
      request.processed_at = new Date();
      await request.save();
    }

    return res.json({
      success: true,
      data: request
    });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;