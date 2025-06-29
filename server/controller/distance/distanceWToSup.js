import DistanceService from '../../services/distanceService.js';
import Warehouse from '../../models/warehouse.js';

export default {
    async recalculateAll(req, res) {
        try {
            await DistanceService.recalculateAllDistances();
            res.json({ 
                success: true,
                message: 'Recalcul de toutes les distances terminé',
                data: {
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            console.error('Erreur dans recalculateAll:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du recalcul des distances',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    async updateForWarehouse(req, res) {
        try {
            const { warehouseId } = req.params;
            const warehouse = await Warehouse.findById(warehouseId);
            
            if (!warehouse) {
                return res.status(404).json({
                    success: false,
                    message: 'Entrepôt non trouvé'
                });
            }

            const results = await DistanceService.updateDistancesForEntity('warehouse', warehouse);
            
            res.json({
                success: true,
                message: 'Distances mises à jour pour cet entrepôt',
                data: {
                    warehouse: warehouseId,
                    updatedDistances: results.length,
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            console.error('Erreur dans updateForWarehouse:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};