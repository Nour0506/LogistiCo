import calculateDistance from '../utils/distanceCalculator.js';
import Warehouse from '../models/warehouse.js';
import SalePoint from '../models/salePoint.js';
import Supplier from '../models/Fourniss.js';
import Distance from '../models/DistanceFromWarehouseToSP.js';
import DistanceSpToSp from '../models/DistanceFromSpToSp.js';
import DistanceFromWarehouseToSupplier from '../models/DistanceFromWarehouseToSupplier.js';

class DistanceService {
  static async updateAll() {
    const [warehouses, salePoints, suppliers] = await Promise.all([
      Warehouse.find().select('position'),
      SalePoint.find().select('position'),
      Supplier.find().select('position')
    ]);

    await Promise.all([
      ...warehouses.map(w => this.updateWarehouseDistances(w)),
      ...salePoints.map(sp => this.updateSalePointDistances(sp)),
      ...suppliers.map(s => this.updateSupplierDistances(s))
    ]);
  }

  static async updateWarehouseDistances(warehouse) {
    if (!this._hasValidCoordinates(warehouse)) return;
    
    const [salePoints, suppliers] = await Promise.all([
      SalePoint.find().select('position'),
      Supplier.find().select('position')
    ]);

    await Promise.all([
      this._processDistanceUpdates('warehouse', warehouse, 'salePoint', salePoints),
      this._processDistanceUpdates('warehouse', warehouse, 'supplier', suppliers)
    ]);
  }

  static async updateSalePointDistances(salePoint) {
    if (!this._hasValidCoordinates(salePoint)) return;

    const [warehouses, otherSalePoints] = await Promise.all([
      Warehouse.find().select('position'),
      SalePoint.find({ _id: { $ne: salePoint._id } }).select('position')
    ]);

    await Promise.all([
      this._processDistanceUpdates('salePoint', salePoint, 'warehouse', warehouses),
      this._processDistanceUpdates('salePoint', salePoint, 'salePoint', otherSalePoints)
    ]);
  }

  static async updateSupplierDistances(supplier) {
    if (!this._hasValidCoordinates(supplier)) return;

    const warehouses = await Warehouse.find().select('position');
    await this._processDistanceUpdates('supplier', supplier, 'warehouse', warehouses);
  }

  static async handleEntityDeletion(type, entityId) {
    const deletionConfig = {
      warehouse: {
        models: [Distance, DistanceFromWarehouseToSupplier],
        fields: ['warehouse', 'warehouse']
      },
      salePoint: {
        models: [Distance, DistanceSpToSp],
        fields: ['salePoint', 'salePoint1']
      },
      supplier: {
        models: [DistanceFromWarehouseToSupplier],
        fields: ['supplier']
      }
    };

    const config = deletionConfig[type];
    if (!config) return;

    await Promise.all(
      config.models.map((Model, index) => 
        Model.deleteMany({ [config.fields[index]]: entityId })
      )
    );

    await this.updateAll();
  }

  // Méthodes privées
  static _hasValidCoordinates(entity) {
    return entity?.position?.coordinates?.length === 2;
  }

  static _isSameEntity(entity1, entity2) {
    return entity1._id.equals(entity2._id);
  }

  static _generatePairId(id1, id2) {
    return [id1.toString(), id2.toString()].sort().join('_');
  }

  static async _processDistanceUpdates(fromType, fromEntity, toType, toEntities) {
    const updates = toEntities
      .filter(toEntity => 
        this._hasValidCoordinates(toEntity) && 
        !this._isSameEntity(fromEntity, toEntity)
      )
      .map(toEntity => ({
        fromId: fromEntity._id,
        toId: toEntity._id,
        distance: this._calculateDistanceBetween(fromEntity, toEntity),
        pairId: this._generatePairId(fromEntity._id, toEntity._id)
      }));

    if (updates.length > 0) {
      await this._saveDistanceUpdates(fromType, toType, updates);
    }
  }

  static _calculateDistanceBetween(entity1, entity2) {
    const [lon1, lat1] = entity1.position.coordinates;
    const [lon2, lat2] = entity2.position.coordinates;
    return calculateDistance(lon1, lat1, lon2, lat2);
  }

  static async _saveDistanceUpdates(fromType, toType, updates) {
    const Model = this._getDistanceModel(fromType, toType);
    const { field1, field2 } = this._getFieldNames(fromType, toType);

    const bulkOps = updates.map(update => ({
        updateOne: {
            filter: { 
                pairId: update.pairId // Utilisez seulement pairId comme filtre
            },
            update: { 
                $set: { 
                    distance: update.distance,
                    [field1]: update.fromId,
                    [field2]: update.toId,
                    pairId: update.pairId
                } 
            },
            upsert: true
        }
    }));

    try {
        if (bulkOps.length > 0) {
            await Model.bulkWrite(bulkOps);
        }
    } catch (error) {
        console.error('Error saving distance updates:', error);
        throw error;
    }
}

  static _getDistanceModel(fromType, toType) {
    const models = {
      'warehouse-salePoint': Distance,
      'warehouse-supplier': DistanceFromWarehouseToSupplier,
      'salePoint-warehouse': Distance,
      'salePoint-salePoint': DistanceSpToSp,
      'supplier-warehouse': DistanceFromWarehouseToSupplier
    };

    const model = models[`${fromType}-${toType}`];
    if (!model) throw new Error(`No model for ${fromType}-${toType}`);
    return model;
  }

  static _getFieldNames(fromType, toType) {
    const fields = {
      'warehouse-salePoint': { field1: 'warehouse', field2: 'salePoint' },
      'warehouse-supplier': { field1: 'warehouse', field2: 'supplier' },
      'salePoint-warehouse': { field1: 'salePoint', field2: 'warehouse' },
      'salePoint-salePoint': { field1: 'salePoint1', field2: 'salePoint2' },
      'supplier-warehouse': { field1: 'supplier', field2: 'warehouse' }
    };

    return fields[`${fromType}-${toType}`];
  }
}

export default DistanceService;