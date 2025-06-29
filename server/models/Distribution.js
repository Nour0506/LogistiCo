import mongoose from 'mongoose';

const waypointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['warehouse', 'supplier', 'salespoint', 'warehouse-return'],
    required: true
  },
  id: { type: String, required: true },
  name: { type: String, required: true },
  location: {
    lat: Number,
    lng: Number
  },
  sequence: { type: Number, required: true },
  distanceFromPrevious: Number,
  cumulativeDistance: Number
}, { _id: false });

const deliveryDateSchema = new mongoose.Schema({
  date: { 
    type: Date,
    required: true 
  },
  status: {
    type: String,
    enum: ['en cours', 'livrée', 'en attente'],
    required: true
  }
}, { _id: false });

const distributionSchema = new mongoose.Schema({
  contracts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  }],
  deliveryDates: [deliveryDateSchema], // Tableau d'objets {date, status}
  waypoints: [waypointSchema],
  truck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck',
    required: true
  },
  transporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transporter',
    required: true
  }
});

// Middleware pour mettre à jour la date de modification
distributionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Distribution', distributionSchema);