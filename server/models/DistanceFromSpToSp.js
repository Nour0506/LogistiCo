import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  salePoint1: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SalePoint',
    required: true
  },
  salePoint2: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SalePoint',
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  pairId: {
    type: String,
    unique: true,
    required: true
  }
}, { timestamps: true });

// Index pour les recherches
schema.index({ salePoint1: 1 });
schema.index({ salePoint2: 1 });
schema.index({ pairId: 1 }, { unique: true });

// Validation avant sauvegarde
schema.pre('save', function(next) {
  // Vérifie que salePoint1 et salePoint2 sont différents
  if (this.salePoint1.equals(this.salePoint2)) {
    const err = new Error('salePoint1 and salePoint2 cannot be the same');
    return next(err);
  }

  // Génère le pairId trié
  const sortedIds = [this.salePoint1.toString(), this.salePoint2.toString()]
    .sort();
  this.pairId = sortedIds.join('_');
  
  next();
});

// Middleware pour nettoyer les références
schema.statics.cleanupAfterDeletion = async function(salePointId) {
  try {
    // Supprime toutes les distances où le salePoint apparaît
    await this.deleteMany({
      $or: [
        { salePoint1: salePointId },
        { salePoint2: salePointId }
      ]
    });
  } catch (error) {
    console.error('Error in cleanupAfterDeletion:', error);
    throw error;
  }
};

export default mongoose.model('DistanceFromSpToSp', schema);