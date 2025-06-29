import express from 'express';
import mongoose from 'mongoose';
import Contract from '../../models/contract.js';
import Warehouse from '../../models/warehouse.js';
import SalePoint from '../../models/salePoint.js';
import Supplier from '../../models/Fourniss.js';
import DistanceWS from '../../models/DistanceFromWarehouseToSP.js';
import DistanceWToSupplier from '../../models/DistanceFromWarehouseToSupplier.js';
import DistanceSPToSP from '../../models/DistanceFromSpToSp.js';
import Truck from '../../models/Truck.js';
import Transporter from '../../models/transporter.js';
import User from '../../models/User.js';
import authenticateToken from '../../middleware/authADD.js';

const router = express.Router();

// Configuration
const STRICT_COMPANY_CHECK = false;
const ALLOW_NULL_TRANSPORTER = true;

// Helper functions
const haversineDistance = (coords1, coords2) => {
  if (!coords1 || !coords2) {
    console.log('Missing coordinates for distance calculation:', { coords1, coords2 });
    return 0;
  }
  
  const toRad = (value) => (value * Math.PI) / 180;
  const lat1 = coords1.lat;
  const lon1 = coords1.lng;
  const lat2 = coords2.lat;
  const lon2 = coords2.lng;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

const formatDistance = (distance) => {
  if (distance === undefined || distance === null || isNaN(distance)) return 0;
  return parseFloat(distance.toFixed(2));
};

const getDayName = (date) => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getNextDeliveryDay = (currentDate, deliveryDays, endDate) => {
  const normalizedDeliveryDays = deliveryDays?.length ? deliveryDays.map(day => day.toLowerCase()) : [];
  if (!normalizedDeliveryDays.length) {
    console.log('No delivery days provided, defaulting to next day');
    return addDays(currentDate, 1);
  }

  const dayMap = {
    'lundi': 1, 'mardi': 2, 'mercredi': 3, 'jeudi': 4, 'vendredi': 5, 'samedi': 6, 'dimanche': 0,
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0
  };

  let minDays = 7;
  for (const day of normalizedDeliveryDays) {
    if (!dayMap.hasOwnProperty(day)) {
      console.log(`Invalid delivery day: ${day}`);
      continue;
    }
    
    const targetDay = dayMap[day];
    let daysUntil = (targetDay - currentDate.getDay() + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;
    if (daysUntil < minDays) minDays = daysUntil;
  }

  if (minDays === 7) {
    console.log('No valid delivery day found within a week');
    return addDays(currentDate, 7);
  }

  const nextDate = addDays(currentDate, minDays);
  return nextDate > endDate ? null : nextDate;
};

router.post('/optimize-greedy', authenticateToken, async (req, res) => {
  console.log('Received request body:', JSON.stringify(req.body, null, 2));
  try {
    const { selectedContracts, planDate } = req.body;

    // Validate request
    if (!Array.isArray(selectedContracts)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request format: selectedContracts must be an array'
      });
    }
    if (!selectedContracts.length) {
      return res.status(400).json({
        success: false,
        message: 'No contracts provided'
      });
    }
    if (selectedContracts.some(c => !c._id || !mongoose.Types.ObjectId.isValid(c._id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract IDs provided'
      });
    }
    if (!planDate || isNaN(new Date(planDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid planDate provided'
      });
    }

    const distributionPlan = [];
    const errorMessages = [];
    const distanceCache = new Map();
    const now = new Date(planDate);

    // Process contracts
    const contractPromises = selectedContracts.map(async (contractData) => {
      try {
        const contract = await Contract.findById(contractData._id)
          .populate('warehouse.id')
          .populate('supplier.id')
          .populate('salesPointIds');
        console.log(`Processing contract ${contractData._id}:`, contract ? {
          id: contract._id,
          name: contract.name,
          frequency: contract.frequency,
          deliveryDays: contract.deliveryDays,
          startDate: contract.startDate,
          endDate: contract.endDate,
          salesPointIds: contract.salesPointIds?.map(sp => sp._id),
          warehouse: contract.warehouse?.id?._id,
          product: contract.product
        } : 'Not found');

        if (!contract) {
          errorMessages.push(`Contrat ${contractData._id} non trouvé`);
          return null;
        }

        // Validate contract data
        if (!contract.salesPointIds?.length) {
          errorMessages.push(`Aucun point de vente pour le contrat ${contract._id}`);
          return null;
        }
        if (!contract.warehouse?.id) {
          errorMessages.push(`Aucun entrepôt assigné au contrat ${contract._id}`);
          return null;
        }
        if (!contract.warehouse.id.position?.coordinates) {
          errorMessages.push(`Position de l'entrepôt manquante pour le contrat ${contract._id}`);
          return null;
        }
        if (!contract.product?.name || !contract.product?.totalQuantity) {
          errorMessages.push(`Produit invalide pour le contrat ${contract._id}`);
          return null;
        }
        if (contract.salesPointIds.some(sp => !sp.position?.coordinates)) {
          errorMessages.push(`Position manquante pour un point de vente du contrat ${contract._id}`);
          return null;
        }

        // Validate dates
        const startDate = new Date(contract.startDate);
        const endDate = new Date(contract.endDate);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errorMessages.push(`Dates invalides pour le contrat ${contract._id}`);
          return null;
        }
        if (now < startDate || now > endDate) {
          errorMessages.push(`Le contrat ${contract._id} n'est pas actif pour la date ${now.toLocaleDateString()}`);
          return null;
        }

        // Handle delivery days
        let deliveryDays = contract.deliveryDays || [];
        if (!deliveryDays.length) {
          console.log(`No delivery days for contract ${contract._id}, applying default based on frequency`);
          if (contract.frequency === 'weekly') {
            deliveryDays = ['monday', 'wednesday', 'friday'];
          } else if (contract.frequency === 'daily') {
            deliveryDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          } else {
            // Allow delivery on planDate
            deliveryDays = [getDayName(now)];
          }
        }

        // Generate schedule
        const schedule = [];
        let currentDate = new Date(Math.max(startDate, now));
        let iterationCount = 0;
        const maxIterations = 1000;

        // Include planDate if it's a valid delivery day
        const planDateDay = getDayName(now).toLowerCase();
        if (deliveryDays.some(day => day.toLowerCase() === planDateDay) && currentDate <= endDate) {
          schedule.push(new Date(now));
        }

        while (currentDate <= endDate && iterationCount < maxIterations) {
          iterationCount++;
          
          const dayName = getDayName(currentDate).toLowerCase();
          const isDeliveryDay = deliveryDays.some(day => day.toLowerCase() === dayName);
          
          if (isDeliveryDay && currentDate > now) {
            schedule.push(new Date(currentDate));
          }

          // Move to next potential delivery date
          switch (contract.frequency) {
            case 'daily':
              currentDate = addDays(currentDate, 1);
              break;
            case 'weekly':
              currentDate = getNextDeliveryDay(currentDate, deliveryDays, endDate) || addDays(currentDate, 7);
              break;
            case 'biweekly':
              currentDate = addDays(currentDate, 14);
              break;
            case 'monthly':
              currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
              break;
            default:
              currentDate = getNextDeliveryDay(currentDate, deliveryDays, endDate) || addDays(currentDate, 1);
          }

          if (!currentDate) {
            console.log(`No further delivery dates for contract ${contract._id}`);
            break;
          }
        }

        if (!schedule.length) {
          errorMessages.push(`Aucun jour de livraison valide pour le contrat ${contract._id} (frequency: ${contract.frequency}, deliveryDays: ${JSON.stringify(deliveryDays)})`);
          return null;
        }

        console.log(`Generated schedule for contract ${contract._id}:`, schedule.map(d => d.toISOString()));

        // Generate route for each delivery date
        const routePromises = schedule.map(async (deliveryDate) => {
          // Fetch resources
          const [trucks, transporters] = await Promise.all([
            Truck.find({ status: 'available' }),
            Transporter.find({ status: 'Available' }).populate('userId')
          ]);
          console.log(`Available trucks for ${contract._id} on ${deliveryDate.toLocaleDateString()}:`, trucks.map(t => ({
            id: t._id,
            capacity: t.capacity,
            type: t.type
          })));
          console.log(`Available transporters for ${contract._id} on ${deliveryDate.toLocaleDateString()}:`, transporters.map(t => ({
            id: t._id,
            typeDrivingLicence: t.typeDrivingLicence
          })));

          const suitableTruck = trucks.find(t => t.capacity >= contract.product.totalQuantity);
          if (!suitableTruck) {
            console.log(`No suitable truck found for contract ${contract._id} (required capacity: ${contract.product.totalQuantity})`);
          }

          const suitableTransporter = suitableTruck ? transporters.find(t => 
            t.typeDrivingLicence === suitableTruck.type &&
            (!STRICT_COMPANY_CHECK || t.companyId.toString() === suitableTruck.company_id.toString())
          ) : null;

          if (!suitableTransporter && suitableTruck && !ALLOW_NULL_TRANSPORTER) {
            console.log(`No suitable transporter found for contract ${contract._id} on ${deliveryDate.toLocaleDateString()}`);
          }

          // Generate waypoints
          const waypoints = [];
          let totalDistance = 0;

          // Warehouse point
          const warehouse = contract.warehouse.id;
          const warehousePoint = {
            type: 'warehouse',
            id: warehouse._id,
            name: warehouse.name,
            location: warehouse.position?.coordinates ? {
              lat: warehouse.position.coordinates[1],
              lng: warehouse.position.coordinates[0]
            } : null,
            distanceFromPrevious: 0,
            cumulativeDistance: 0,
            sequence: 1
          };
          waypoints.push(warehousePoint);

          // Supplier if needed
          const needsSupplier = contract.product.totalQuantity > (contract.warehouse?.quantity || 0);
          const supplier = contract.supplier?.id;
          let currentLocation = warehousePoint;

          if (needsSupplier && supplier) {
            if (!supplier.position?.coordinates) {
              errorMessages.push(`Position du fournisseur manquante pour le contrat ${contract._id}`);
              return null;
            }

            const supplierPoint = {
              type: 'supplier',
              id: supplier._id,
              name: supplier.name,
              location: supplier.position.coordinates ? {
                lat: supplier.position.coordinates[1],
                lng: supplier.position.coordinates[0]
              } : null
            };

            const distance = await getDistance(
              'warehouse', warehouse._id,
              'supplier', supplier._id,
              warehousePoint.location,
              supplierPoint.location,
              distanceCache
            );

            totalDistance += distance;
            supplierPoint.distanceFromPrevious = formatDistance(distance);
            supplierPoint.cumulativeDistance = formatDistance(totalDistance);
            supplierPoint.sequence = waypoints.length + 1;
            waypoints.push(supplierPoint);
            currentLocation = supplierPoint;
          }

          // Sales points
          const salesPoints = contract.salesPointIds;
          const spDistances = {};

          // Pre-calculate distances between sales points
          for (let i = 0; i < salesPoints.length; i++) {
            for (let j = i + 1; j < salesPoints.length; j++) {
              const sp1 = salesPoints[i];
              const sp2 = salesPoints[j];
              
              const distance = await getDistance(
                'salespoint', sp1._id,
                'salespoint', sp2._id,
                sp1.position?.coordinates ? {
                  lat: sp1.position.coordinates[1],
                  lng: sp1.position.coordinates[0]
                } : null,
                sp2.position?.coordinates ? {
                  lat: sp2.position.coordinates[1],
                  lng: sp2.position.coordinates[0]
                } : null,
                distanceCache
              );

              spDistances[`${sp1._id}-${sp2._id}`] = distance;
              spDistances[`${sp2._id}-${sp1._id}`] = distance;
            }
          }

          // Visit sales points using nearest neighbor algorithm
          const pointsToVisit = salesPoints.map(sp => ({
            type: 'salespoint',
            id: sp._id,
            name: sp.name,
            location: sp.position?.coordinates ? {
              lat: sp.position.coordinates[1],
              lng: sp.position.coordinates[0]
            } : null
          }));

          while (pointsToVisit.length > 0) {
            let closestPoint = null;
            let minDistance = Infinity;

            for (const point of pointsToVisit) {
              let distance;
              
              if (currentLocation.type === 'supplier') {
                distance = await getDistance(
                  'supplier', currentLocation.id,
                  'salespoint', point.id,
                  currentLocation.location,
                  point.location,
                  distanceCache
                );
              } else if (currentLocation.type === 'salespoint') {
                distance = spDistances[`${currentLocation.id}-${point.id}`] || 0;
              } else {
                distance = await getDistance(
                  'warehouse', currentLocation.id,
                  'salespoint', point.id,
                  currentLocation.location,
                  point.location,
                  distanceCache
                );
              }

              if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
              }
            }

            if (!closestPoint) {
              console.log(`No closest point found for contract ${contract._id} from ${currentLocation.type}:${currentLocation.id}`);
              errorMessages.push(`Impossible de trouver le prochain point de vente pour le contrat ${contract._id}`);
              break;
            }

            totalDistance += minDistance;
            currentLocation = closestPoint;
            
            waypoints.push({
              ...closestPoint,
              distanceFromPrevious: formatDistance(minDistance),
              cumulativeDistance: formatDistance(totalDistance),
              sequence: waypoints.length + 1
            });

            pointsToVisit.splice(pointsToVisit.findIndex(p => p.id === closestPoint.id), 1);
          }

          // Return to warehouse
          const returnDistance = await getDistance(
            currentLocation.type,
            currentLocation.id,
            'warehouse',
            warehouse._id,
            currentLocation.location,
            warehousePoint.location,
            distanceCache
          );

          totalDistance += returnDistance;
          waypoints.push({
            ...warehousePoint,
            type: 'warehouse-return',
            distanceFromPrevious: formatDistance(returnDistance),
            cumulativeDistance: formatDistance(totalDistance),
            sequence: waypoints.length + 1
          });

          return {
            deliveryDates: [{
              date: deliveryDate.toISOString(),
              status: 'en attente'
            }],
            dayOfWeek: getDayName(deliveryDate),
            contractName: contract.name,
            warehouse: warehouse.name,
            supplier: supplier ? supplier.name : null,
            salesPoints: salesPoints.map(sp => sp.name),
            product: contract.product.name,
            quantity: contract.product.totalQuantity,
            truck: suitableTruck ? {
              id: suitableTruck._id,
              name: suitableTruck.vehicle,
              licensePlate: suitableTruck.vehicle,
              type: suitableTruck.type
            } : null,
            transporter: suitableTransporter ? {
              id: suitableTransporter._id,
              firstName: suitableTransporter.userId.firstName,
              lastName: suitableTransporter.userId.lastName
            } : null,
            route: {
              waypoints,
              totalDistance: formatDistance(totalDistance),
              totalTime: Math.floor((totalDistance / 96 * 60) + (waypoints.length * 10)),
              salesPointsVisited: salesPoints.length,
              totalPoints: salesPoints.length,
              hasSupplier: needsSupplier && !!supplier
            }
          };
        });

        const routes = (await Promise.all(routePromises)).filter(Boolean);
        console.log(`Generated ${routes.length} routes for contract ${contract._id}`);
        return routes;
      } catch (error) {
        console.error(`Error processing contract ${contractData._id}:`, error);
        errorMessages.push(`Erreur lors du traitement du contrat ${contractData._id}: ${error.message}`);
        return null;
      }
    });

    const results = await Promise.all(contractPromises);
    results.flat().filter(Boolean).forEach(plan => distributionPlan.push(plan));

    // Sort by date
    distributionPlan.sort((a, b) => new Date(a.deliveryDates[0].date) - new Date(b.deliveryDates[0].date));

    if (!distributionPlan.length) {
      console.log('No distribution plan generated. Error messages:', errorMessages);
      return res.status(400).json({
        success: false,
        message: 'Aucun plan de distribution généré',
        errors: errorMessages.length ? errorMessages : ['Aucun itinéraire valide trouvé pour les contrats fournis']
      });
    }

    res.json({
      success: true,
      distributionPlan
    });
  } catch (error) {
    console.error('Erreur d\'optimisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'optimisation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to get or calculate distance
async function getDistance(fromType, fromId, toType, toId, fromLocation, toLocation, cache) {
  const cacheKey = `${fromType}:${fromId}:${toType}:${toId}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    let distanceDoc;

    if (fromType === 'warehouse' && toType === 'supplier') {
      distanceDoc = await DistanceWToSupplier.findOne({
        warehouseId: fromId,
        supplierId: toId
      });
    } else if (fromType === 'warehouse' && toType === 'salespoint') {
      distanceDoc = await DistanceWS.findOne({
        warehouseId: fromId,
        salesPointId: toId
      });
    } else {
      distanceDoc = await DistanceSPToSP.findOne({
        $or: [
          { fromId: fromId, toId: toId },
          { fromId: toId, toId: fromId }
        ]
      });
    }

    let distance = 0;
    
    if (distanceDoc?.distance) {
      distance = formatDistance(distanceDoc.distance);
    } else if (fromLocation && toLocation) {
      distance = haversineDistance(fromLocation, toLocation);
    } else {
      console.log(`No distance data or coordinates for ${cacheKey}`);
    }

    cache.set(cacheKey, distance);
    return distance;
  } catch (error) {
    console.error(`Error fetching distance ${cacheKey}:`, error);
    cache.set(cacheKey, 0);
    return 0;
  }
}

export default router;