import express from 'express';
import Truck from '../../models/Truck.js';
import authori from '../../middleware/authADD.js';
import mongoose from 'mongoose';
const router = express.Router();

// 🔍 GET - Récupérer tous les camions
router.get('/getTrucks', authori, async (req, res) => {
    try {
        if (!req.company) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé - Aucune entreprise associée'
            });
        }

        const { search, type, status, fuel, capacityMin, capacityMax } = req.query;
        const query = { company_id: req.company._id };

        if (search) {
            query.$or = [
                { vehicle: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } }
            ];
        }

        if (type) query.type = type;
        if (status) query.status = status;
        if (fuel) query.fuel = { $gte: parseInt(fuel) };
        if (capacityMin || capacityMax) {
            query.capacity = {};
            if (capacityMin) query.capacity.$gte = parseInt(capacityMin);
            if (capacityMax) query.capacity.$lte = parseInt(capacityMax);
        }

        const trucks = await Truck.find(query)
            .sort({ createdAt: -1 })
            .select('_id vehicle type status fuel capacity company_id createdAt updatedAt');

        res.status(200).json({
            success: true,
            count: trucks.length,
            data: trucks
        });

    } catch (error) {
        console.error('Error in /getTrucks:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des camions',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ➕ POST - Créer un nouveau camion
router.post('/addTruck', authori, async (req, res) => {
    try {
        const { vehicle, type, status, capacity, company_id } = req.body;

        if (!vehicle?.trim() || !type || !company_id || !capacity) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont obligatoires',
                received: req.body
            });
        }

        const validTypes = ['A1', 'A', 'B', 'B+E', 'C', 'C+E', 'D', 'D1', 'D+E', 'H '];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type de camion invalide',
                validTypes,
                received: type
            });
        }

        const newTruck = new Truck({
            vehicle: vehicle.trim(),
            type,
            status: status || 'available',
            capacity,
            company_id,
            createdBy: req.user._id
        });

        await newTruck.save();

        res.status(201).json({
            success: true,
            message: 'Camion ajouté avec succès',
            data: newTruck
        });

    } catch (error) {
        console.error('Error details:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Un camion avec ce nom existe déjà pour votre entreprise',
                error: error.keyValue
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.put('/updateTruck/:id', authori, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { vehicle, type, status, capacity } = req.body;

        // 1. Validation des données
        if (!vehicle?.trim() || !type || !capacity) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Vehicle, type and capacity are required'
            });
        }

        // 2. Vérification de l'existence
        const truck = await Truck.findOne({
            _id: req.params.id,
            company_id: req.company._id
        }).session(session);

        if (!truck) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Truck not found or not authorized'
            });
        }

        // 3. Mise à jour
        truck.vehicle = vehicle.trim();
        truck.type = type;
        truck.status = status || 'available';
        truck.capacity = capacity;
        truck.updatedAt = new Date();

        await truck.save({ session });
        await session.commitTransaction();

        res.status(200).json({
            success: true,
            data: truck
        });

    } catch (error) {
        await session.abortTransaction();
        
        console.error('Update truck error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        session.endSession();
    }
});
// 🗑 DELETE - Supprimer un camion
router.delete('/deleteTruck/:id', authori, async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'ID invalide'
            });
        }

        const deletedTruck = await Truck.findOneAndDelete({
            _id: req.params.id,
            company_id: req.company._id
        });

        if (!deletedTruck) {
            return res.status(404).json({
                success: false,
                message: 'Camion non trouvé ou non autorisé'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Camion supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du camion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;