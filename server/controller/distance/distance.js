import Distance from '../../models/DistanceFromWarehouseToSP.js';
import Warehouse from '../../models/warehouse.js';
import SalePoint from '../../models/salePoint.js';

// Haversine formula for distance calculation
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const toRadians = (deg) => deg * Math.PI / 180;

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(4)); // 4 decimals precision
}

// Validate GeoJSON coordinates
const validateCoordinates = (coords, id, type) => {
  if (!Array.isArray(coords) || coords.length !== 2) {
    console.warn(`Invalid coordinates format for ${type} ${id}: ${JSON.stringify(coords)}`);
    return false;
  }

  const [val1, val2] = coords;
  let lon, lat;

  // Assume GeoJSON [longitude, latitude]
  if (Math.abs(val1) <= 180 && Math.abs(val2) <= 90) {
    [lon, lat] = coords;
  } else {
    console.warn(`Unexpected coordinate order for ${type} ${id}: [${val1}, ${val2}]`);
    return false;
  }

  const isValid =
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180;

  if (!isValid) {
    console.warn(`Out-of-range coordinates for ${type} ${id}: [lon: ${lon}, lat: ${lat}]`);
  }

  return isValid;
};

// Validate GeoJSON position object
const validateGeoJSON = (position, id, type) => {
  if (!position || !position.type || position.type !== 'Point' || !position.coordinates) {
    console.warn(`Invalid GeoJSON for ${type} ${id}: ${JSON.stringify(position)}`);
    return false;
  }
  return validateCoordinates(position.coordinates, id, type);
};

export default async function recalculateDistances() {
  try {
    console.log('Starting distance recalculation...');

    // Fetch warehouses and sale points with optimized projection
    const warehouses = await Warehouse.find({ type: 'internal' })
      .select('_id position name')
      .lean();

    const salePoints = await SalePoint.find()
      .select('_id position name')
      .lean();

    if (!warehouses.length || !salePoints.length) {
      console.warn(`No data to process: ${warehouses.length} warehouses, ${salePoints.length} sale points`);
      return { success: true, processedCount: 0 };
    }

    console.log(`Processing ${warehouses.length} warehouses and ${salePoints.length} sale points`);

    // Prepare batch operations
    const operations = [];
    const batchSize = 1000;
    let processedCount = 0;

    for (const warehouse of warehouses) {
      if (!validateGeoJSON(warehouse.position, warehouse._id, `warehouse ${warehouse.name}`)) {
        console.warn(`Skipping warehouse ${warehouse.name} due to invalid GeoJSON`);
        continue;
      }

      const [whLon, whLat] = warehouse.position.coordinates; // [longitude, latitude]

      for (const salePoint of salePoints) {
        if (!validateGeoJSON(salePoint.position, salePoint._id, `sale point ${salePoint.name}`)) {
          console.warn(`Skipping sale point ${salePoint.name} due to invalid GeoJSON`);
          continue;
        }

        const [spLon, spLat] = salePoint.position.coordinates; // [longitude, latitude]
        const distance = calculateHaversineDistance(whLat, whLon, spLat, spLon);

        console.log(
          `Calculated distance for ${warehouse.name} to ${salePoint.name}: ${distance} km ` +
          `[wh: ${whLat}, ${whLon}, sp: ${spLat}, ${spLon}]`
        );

        operations.push({
          updateOne: {
            filter: {
              warehouseId: warehouse._id,
              salesPointId: salePoint._id,
            },
            update: {
              $set: {
                distance,
                warehousePosition: [whLon, whLat], // [longitude, latitude]
                salesPointPosition: [spLon, spLat], // [longitude, latitude]
                lastUpdated: new Date(),
              },
            },
            upsert: true,
          },
        });

        // Process batch if size limit reached
        if (operations.length >= batchSize) {
          try {
            await Distance.bulkWrite(operations);
            processedCount += operations.length;
            console.log(`Processed batch of ${operations.length} distances`);
            operations.length = 0; // Clear array
          } catch (batchError) {
            console.error(`Batch write failed: ${batchError.message}`);
            throw batchError;
          }
        }
      }
    }

    // Process remaining operations
    if (operations.length > 0) {
      try {
        await Distance.bulkWrite(operations);
        processedCount += operations.length;
        console.log(`Processed final batch of ${operations.length} distances`);
      } catch (batchError) {
        console.error(`Final batch write failed: ${batchError.message}`);
        throw batchError;
      }
    }

    console.log(`${processedCount} distances recalculated successfully`);
    return { success: true, processedCount };

  } catch (error) {
    console.error('Error recalculating distances:', error);
    throw new Error(`Recalculation failed: ${error.message}`);
  }
}