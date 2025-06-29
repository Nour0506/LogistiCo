import mongoose from 'mongoose';
import express from 'express';
import Supplier from '../../models/Fourniss.js';  // Adjust path as needed
import Warehouse from '../../models/warehouse.js';
import SalesPoint from '../../models/salePoint.js';
import Product from '../../models/Product.js';
import DistanceFromWarehouseToSupplier from '../../models/DistanceFromWarehouseToSupplier.js';
const router = express.Router();


router.post('/find-optimal-warehouse', async (req, res) => {
  try {
    const { salesPointIds, productId, requiredQuantity, warehouseId } = req.body;

    // Validation des entrées
    if (!salesPointIds?.length || !productId || !requiredQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: salesPointIds, productId, requiredQuantity'
      });
    }

    // Récupération du produit
    const product = await Product.findById(productId).select('name storage_type');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Récupération des points de vente
    const salesPoints = await SalesPoint.find({
      _id: { $in: salesPointIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).select('position');

    if (salesPoints.length !== salesPointIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Some sales points not found'
      });
    }

    // Récupération de l'entrepôt sélectionné (optionnel)
    let warehouseSelected = null;
    if (warehouseId) {
      warehouseSelected = await Warehouse.findById(warehouseId).select('position');
    }

    // Recherche des entrepôts disponibles
    let warehouses = await Warehouse.find({
      'products.product': new mongoose.Types.ObjectId(productId),
      status: 'available'
    }).select('name position products.$ storage_type capacity current_usage');

    // Calcul des distances et des quantités disponibles
    warehouses = warehouses.map(warehouse => {
      const productData = warehouse.products.find(p => p.product.equals(productId));
      const totalDistance = salesPoints.reduce((sum, sp) => {
        if (!warehouse.position?.coordinates || !sp.position?.coordinates) return sum;
        return sum + calculateHaversineDistance(
          warehouse.position.coordinates,
          sp.position.coordinates
        );
      }, 0);
      
      return {
        ...warehouse.toObject(),
        distance: totalDistance / salesPoints.length,
        availableQty: productData ? productData.quantity : 0,
        hasEnough: productData ? productData.quantity >= requiredQuantity : false
      };
    }).sort((a, b) => a.distance - b.distance);

    // Vérification des entrepôts avec stock suffisant
    const sufficientWarehouses = warehouses.filter(w => w.hasEnough);
    if (sufficientWarehouses.length > 0) {
      return res.json({
        success: true,
        solution: 'warehouse',
        optimal: sufficientWarehouses[0],
        alternatives: sufficientWarehouses.slice(1, 3),
        insufficientWarehouses: warehouses.filter(w => !w.hasEnough).slice(0, 3)
      });
    }

    // Recherche des fournisseurs si aucun entrepôt ne convient
    let suppliers = await Supplier.find({
      'products.name': product.name,
      'products.quantity': { $gte: requiredQuantity }
    }).select('name position products.$');

    if (suppliers.length > 0) {
      const centroid = calculateCentroid(salesPoints.map(sp => sp.position.coordinates));
      
      suppliers = suppliers.map(supplier => {
        const distanceToCentroid = calculateHaversineDistance(
          supplier.position.coordinates,
          centroid
        );
        
        let distanceToWarehouse = 0;
        if (warehouseSelected?.position?.coordinates) {
          distanceToWarehouse = calculateHaversineDistance(
            supplier.position.coordinates,
            warehouseSelected.position.coordinates
          );
        }

        return {
          ...supplier.toObject(),
          distance: warehouseSelected
            ? (distanceToCentroid * 0.7 + distanceToWarehouse * 0.3) // Pondération
            : distanceToCentroid,
          availableQty: supplier.products.find(p => p.name === product.name).quantity
        };
      }).sort((a, b) => a.distance - b.distance);

      return res.json({
        success: true,
        solution: 'supplier',
        optimal: suppliers[0],
        alternatives: suppliers.slice(1, 3),
        closestWarehouses: warehouses.slice(0, 3)
      });
    }

    // Aucune solution trouvée
    res.json({
      success: false,
      message: 'No warehouse or supplier with sufficient quantity found',
      closestWarehouses: warehouses.slice(0, 3),
      requiredQuantity: Number(requiredQuantity)
    });

  } catch (error) {
    console.error('Error in route optimization:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to calculate centroid of multiple points
function calculateCentroid(points) {
  if (!points || points.length === 0) return [0, 0];
  
  const sum = points.reduce((acc, point) => {
    return [acc[0] + point[0], acc[1] + point[1]];
  }, [0, 0]);
  
  return [sum[0] / points.length, sum[1] / points.length];
}

function calculateHaversineDistance(coord1, coord2) {
  const toRad = x => x * Math.PI / 180;
  const [lon1, lat1] = coord1.map(toRad);
  const [lon2, lat2] = coord2.map(toRad);
  
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  
  const a = Math.sin(dLat/2)**2 + 
            Math.cos(lat1) * Math.cos(lat2) * 
            Math.sin(dLon/2)**2;
  
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); // Distance en km
}
// Route optimisée pour trouver le meilleur fournisseur
router.post('/find-optimal', async (req, res) => {
  try {
    const { warehouseId, productId, requiredQuantity } = req.body;
    
    // Validation des entrées
    if (!mongoose.Types.ObjectId.isValid(warehouseId) || 
        !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid warehouseId or productId format' 
      });
    }

    const quantity = Number(requiredQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity value'
      });
    }

    // 1. Récupérer les informations nécessaires
    const [warehouse, product] = await Promise.all([
      Warehouse.findById(warehouseId).select('position storage_type'),
      Product.findById(productId).select('name storage_type')
    ]);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // 2. Vérifier la compatibilité du type de stockage
    if (warehouse.storage_type !== product.storage_type) {
      return res.status(400).json({
        success: false,
        message: `Product requires ${product.storage_type} storage but warehouse has ${warehouse.storage_type}`
      });
    }

    // 3. Trouver les fournisseurs compatibles
    const suppliers = await Supplier.aggregate([
      {
        $match: {
          'products.name': product.name,
          'products.quantity': { $gte: quantity }
        }
      },
      {
        $addFields: {
          matchingProducts: {
            $filter: {
              input: '$products',
              as: 'product',
              cond: {
                $and: [
                  { $eq: ['$$product.name', product.name] },
                  { $gte: ['$$product.quantity', quantity] }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          contact: 1,
          position: 1,
          products: '$matchingProducts',
          status: 1
        }
      }
    ]);

    if (suppliers.length === 0) {
      return res.json({
        success: true,
        data: {
          optimalSupplier: null,
          alternatives: [],
          message: `No suppliers found with product '${product.name}' and sufficient quantity`
        }
      });
    }

    // 4. Calculer les distances et préparer les résultats
    const suppliersWithInfo = await Promise.all(
      suppliers.map(async supplier => {
        let distance;
        
        // Vérifier si la distance est déjà enregistrée
        const distanceRecord = await DistanceFromWarehouseToSupplier.findOne({
          warehouse: warehouse._id,
          supplier: supplier._id
        });

        if (distanceRecord) {
          distance = distanceRecord.distance;
        } else if (warehouse.position?.coordinates && supplier.position?.coordinates) {
          // Calculer et enregistrer la distance si nécessaire
          distance = calculateHaversineDistance(
            warehouse.position.coordinates,
            supplier.position.coordinates
          );
          
          await DistanceFromWarehouseToSupplier.create({
            warehouse: warehouse._id,
            supplier: supplier._id,
            distance: distance
          });
        } else {
          distance = Infinity;
        }

        return {
          ...supplier,
          distance: parseFloat(distance.toFixed(2)),
          availableQuantity: supplier.products[0].quantity,
          productName: product.name,
          storageType: product.storage_type
        };
      })
    );

    // 5. Trier les fournisseurs selon plusieurs critères
    suppliersWithInfo.sort((a, b) => {
      // Priorité 1: Fournisseurs actifs
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      
      // Priorité 2: Distance
      if (a.distance !== b.distance) return a.distance - b.distance;
      
      // Priorité 3: Quantité disponible
      return b.availableQuantity - a.availableQuantity;
    });

    // 6. Préparer la réponse
    const optimalSupplier = suppliersWithInfo[0];
    const alternatives = suppliersWithInfo.slice(1, 4);

    res.json({
      success: true,
      data: {
        optimalSupplier: optimalSupplier || null,
        alternatives,
        product: {
          id: product._id,
          name: product.name,
          storageType: product.storage_type
        },
        requiredQuantity: quantity,
        warehouse: {
          id: warehouse._id,
          storageType: warehouse.storage_type
        }
      }
    });

  } catch (error) {
    console.error('Error in find-optimal-supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
export default router;