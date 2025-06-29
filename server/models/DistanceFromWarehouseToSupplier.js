import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Le fournisseur est obligatoire']
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'L\'entrepôt est obligatoire']
  },
  distance: {
    type: Number,
    required: [true, 'La distance est obligatoire'],
    min: [0, 'La distance ne peut pas être négative']
  },
  pairId: {
    type: String,
    required: [true, 'L\'identifiant de paire est obligatoire'],
    unique: true,
    index: true
  }
}, {
  timestamps: true,
  strict: true, // Empêche l'ajout de champs non définis dans le schéma
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware pour générer automatiquement le pairId avant la sauvegarde
schema.pre('save', function(next) {
  if (!this.pairId) {
    this.pairId = [this.supplier, this.warehouse]
      .map(id => id.toString())
      .sort()
      .join('_');
  }
  next();
});

// Index composé pour éviter les doublons
schema.index({ supplier: 1, warehouse: 1 }, { unique: true });

// Index sur pairId (déjà déclaré dans le schéma)
// schema.index({ pairId: 1 }, { unique: true }); // Déjà fait dans la définition du champ

// Validation supplémentaire
schema.pre('save', function(next) {
  if (this.supplier && this.warehouse && this.supplier.equals(this.warehouse)) {
    throw new Error('Un fournisseur ne peut pas être son propre entrepôt');
  }
  next();
});

export default mongoose.model('DistanceFromWarehouseToSupplier', schema);