import WarehouseSalepointDistance from '../models/DistanceFromWarehouseToSP.js';
import WarehouseSupplierDistance from '../models/DistanceFromWarehouseToSupplier.js';
import SalepointSalepointDistance from '../models/DistanceFromSpToSp.js';
import calculateDistance from './distance.js';

async function updateDistances(companyId) {
    try {
        // Récupérer l'entrepôt principal de la compagnie
        const Warehouse = await Warehouse.findOne({ companyId });
        if (!Warehouse) {
            console.log('Aucun entrepôt trouvé pour cette compagnie');
            return;
        }

        // Récupérer tous les points de vente
        const salepoints = await SalePoint.find({ companyId });
        
        // Récupérer tous les fournisseurs
        const suppliers = await Supplier.find({ companyId });

        // Mise à jour des distances entre Warehouse et Salepoint
        for (let salepoint of salepoints) {
            if (salepoint.position && salepoint.position.coordinates) {
                const distance = calculateDistance(
                    Warehouse.position.coordinates[1], // lat
                    Warehouse.position.coordinates[0], // lon
                    salepoint.position.coordinates[1],
                    salepoint.position.coordinates[0]
                );
                await WarehouseSalepointDistance.findOneAndUpdate(
                    { warehouseId: Warehouse._id, salepointId: salepoint._id },
                    { distance },
                    { upsert: true }
                );
            }
        }

        // Mise à jour des distances entre Warehouse et Supplier
        for (let supplier of suppliers) {
            if (supplier.position && supplier.position.coordinates) {
                const distance = calculateDistance(
                    Warehouse.position.coordinates[1],
                    Warehouse.position.coordinates[0],
                    supplier.position.coordinates[1],
                    supplier.position.coordinates[0]
                );
                await WarehouseSupplierDistance.findOneAndUpdate(
                    { warehouseId: Warehouse._id, supplierId: supplier._id },
                    { distance },
                    { upsert: true }
                );
            }
        }

        // Mise à jour des distances entre Salepoints
        for (let i = 0; i < salepoints.length; i++) {
            if (!salepoints[i].position?.coordinates) continue;
            
            for (let j = i + 1; j < salepoints.length; j++) {
                if (!salepoints[j].position?.coordinates) continue;
                
                const distance = calculateDistance(
                    salepoints[i].position.coordinates[1],
                    salepoints[i].position.coordinates[0],
                    salepoints[j].position.coordinates[1],
                    salepoints[j].position.coordinates[0]
                );
                await SalepointSalepointDistance.findOneAndUpdate(
                    { salepointId1: salepoints[i]._id, salepointId2: salepoints[j]._id },
                    { distance },
                    { upsert: true }
                );
            }
        }
    } catch (error) {
        console.error('Error in updateDistances:', error);
        throw error;
    }
}

export default updateDistances;