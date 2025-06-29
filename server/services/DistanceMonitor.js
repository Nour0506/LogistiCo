import mongoose from 'mongoose';
import DistanceService from './DistanceService.js';

class DistanceMonitor {
  static init() {
    // Surveille tous les modèles concernés
    this.watchWarehouses();
    this.watchSalePoints();
    this.watchSuppliers();
    
    console.log('🔍 Distance Monitoring Started');
  }

  static watchWarehouses() {
    const warehouseSchema = mongoose.model('Warehouse').schema;
    warehouseSchema.post('save', async (doc) => {
      await DistanceService.updateWarehouseDistances(doc);
    });
  }

  static watchSalePoints() {
    const salePointSchema = mongoose.model('SalePoint').schema;
    salePointSchema.post('save', async (doc) => {
      await DistanceService.updateSalePointDistances(doc);
    });
  }

  static watchSuppliers() {
    const supplierSchema = mongoose.model('Supplier').schema;
    supplierSchema.post('save', async (doc) => {
      await DistanceService.updateSupplierDistances(doc);
    });
  }
}

export default DistanceMonitor;