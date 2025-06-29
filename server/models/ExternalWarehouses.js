import mongoose from 'mongoose';

const ExternalSchema = new mongoose.Schema({
    warehouseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Warehouse',
        required: true,
        unique: true
    }
});

const ExternalWarehouse = mongoose.model('ExternalWarehouse', ExternalSchema);
export default ExternalWarehouse;