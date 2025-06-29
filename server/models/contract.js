import mongoose from 'mongoose';

const ContractSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  salesPointIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SalePoint', 
    required: true 
  }],
  warehouse: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Warehouse'
    },
    name: {
      type: String
    },
    quantity: {
      type: Number,
      min: 0
    }
  },
  supplier: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Supplier'
    },
    name: {
      type: String
    },
    quantity: {
      type: Number,
      min: 0
    }
  },
  product: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true
    },
    name: {
      type: String
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom'],
    default: 'weekly'
  },
  deliveryDays: {
    type: [String],
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    default: []
  }
}, {
  timestamps: true
});

// Indexes
ContractSchema.index({ name: 1 });
ContractSchema.index({ startDate: 1, endDate: 1 });
ContractSchema.index({ 'warehouse.id': 1 });
ContractSchema.index({ 'supplier.id': 1 });
ContractSchema.index({ 'product.id': 1 });

// Pre-save hook to populate names
ContractSchema.pre('save', async function(next) {
  try {
    if (this.warehouse?.id && !this.warehouse.name) {
      const warehouse = await mongoose.model('Warehouse').findById(this.warehouse.id);
      if (warehouse) this.warehouse.name = warehouse.name;
    }
    
    if (this.supplier?.id && !this.supplier.name) {
      const supplier = await mongoose.model('Supplier').findById(this.supplier.id);
      if (supplier) this.supplier.name = supplier.name;
    }
    
    if (this.product?.id && !this.product.name) {
      const product = await mongoose.model('Product').findById(this.product.id);
      if (product) this.product.name = product.name;
    }
    
    next();
  } catch (err) {
    next(err);
  }
});

const Contract = mongoose.model('Contract', ContractSchema);
export default Contract;