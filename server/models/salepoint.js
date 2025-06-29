import mongoose from 'mongoose';
import DistanceService from '../services/DistanceService.js';

const SalePointSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    name: {
      type: String,
      required: [true, 'Please enter sale point name'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Store', 'Pickup Point', 'Distribution Center'],
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            validate: {
                validator: function(coords) {
                    return coords.length === 2 && 
                           !isNaN(coords[0]) && !isNaN(coords[1]) &&
                           coords[0] >= -180 && coords[0] <= 180 &&
                           coords[1] >= -90 && coords[1] <= 90;
                },
                message: 'Coordonnées [longitude, latitude] invalides'
            }
        }
    }
});

// Hooks cohérents avec Warehouse
SalePointSchema.post('save', async function(doc) {
    if (doc.position?.coordinates) {
        await DistanceService.updateSalePointDistances(doc);
    }
});

SalePointSchema.post('findOneAndUpdate', async function(doc) {
    if (doc?.position?.coordinates) {
        await DistanceService.updateSalePointDistances(doc);
    }
});
// Dans SalePoint.js
SalePointSchema.post(['deleteOne', 'findOneAndDelete'], async function(doc, next) {
  try {
      await DistanceService.handleEntityDeletion('salePoint', doc._id); 
  } catch (error) {
      console.error('Erreur dans le hook post-delete:', error);
  }
  next();
});
const SalePoint = mongoose.model('SalePoint', SalePointSchema);
export default SalePoint;