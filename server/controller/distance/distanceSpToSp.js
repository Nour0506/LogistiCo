import DistanceSpToSp from '../../models/DistanceFromSpToSp.js';
import SalePoint from '../../models/salePoint.js';

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return parseFloat((R * c).toFixed(2)); // Arrondi à 2 décimales
}

const validateCoordinates = coords =>
  Array.isArray(coords) && coords.length === 2 &&
  !isNaN(coords[0]) && !isNaN(coords[1]) &&
  Math.abs(coords[0]) <= 180 && Math.abs(coords[1]) <= 90;

const getNormalizedPairId = (id1, id2) => {
  return [id1.toString(), id2.toString()].sort().join('_');
};

export default async function recalculateSpToSpDistances() {
  try {
    console.log('🌊 Début du recalcul des distances entre points de vente...');

    const allPoints = await SalePoint.find({
      'position.coordinates': { $exists: true, $type: 'array' },
      companyId: { $exists: true }
    }).select('_id name position.coordinates companyId').lean();

    const validPoints = allPoints.filter(point => 
      validateCoordinates(point.position?.coordinates) && point.companyId
    );

    if (validPoints.length < 2) {
      console.warn('⚠️ Pas assez de SalePoints valides pour recalculer les distances.');
      return;
    }

    const operations = [];
    const processedPairs = new Set();

    for (let i = 0; i < validPoints.length; i++) {
      const pointA = validPoints[i];
      const [lon1, lat1] = pointA.position.coordinates;

      for (let j = i + 1; j < validPoints.length; j++) {
        const pointB = validPoints[j];
        const [lon2, lat2] = pointB.position.coordinates;

        // Vérifie que les points appartiennent à la même entreprise
        if (pointA.companyId.toString() !== pointB.companyId.toString()) continue;

        const pairId = getNormalizedPairId(pointA._id, pointB._id);
        if (processedPairs.has(pairId)) continue;

        processedPairs.add(pairId);

        const distance = calculateHaversineDistance(lon1, lat1, lon2, lat2);

        operations.push({
          updateOne: {
            filter: { 
              pairId: pairId // Utilise pairId comme filtre unique
            },
            update: {
              $set: {
                salePoint1: pointA._id,
                salePoint2: pointB._id,
                distance: distance,
                pairId: pairId,
                updatedAt: new Date()
              }
            },
            upsert: true
          }
        });
      }
    }

    if (operations.length > 0) {
      await DistanceSpToSp.bulkWrite(operations);
      console.log(`✅ ${operations.length} distances recalculées avec succès.`);
    } else {
      console.log('ℹ️ Aucune distance à recalculer.');
    }
  } catch (error) {
    console.error('❌ Erreur lors du recalcul des distances:', error);
    throw error;
  }
}