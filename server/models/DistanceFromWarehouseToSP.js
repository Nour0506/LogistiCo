import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    // Vos champs existants...
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    salePoint: { type: mongoose.Schema.Types.ObjectId, ref: 'SalePoint' },
    // Ou autres champs selon le modèle
    
    // Ajoutez ce champ
    pairId: {
        type: String,
        unique: true,
        required: true
    },
    distance: {
        type: Number,
        required: true
    }
}, {
    // Désactivez le strict mode pour les updates si nécessaire
    strict: false,  // ou strict: 'throw' selon vos besoins
    timestamps: true
});
schema.pre(['save', 'updateOne', 'findOneAndUpdate','delete'], function(next) {
    const ids = [this.salePoint || this._update.warehouse, 
                 this.salePoint || this._update.warehouse]
                 .map(id => id ? id.toString() : null)
                 .filter(Boolean);
    
    if (ids.length === 2) {
      this.pairId = ids.sort().join('_');
      if (this._update) {
        this._update.pairId = this.pairId;
      }
    }
    next();
  });
// Un seul index pour pairId (supprimez les déclarations en double)
schema.index({ pairId: 1 }, { unique: true });

// Vos autres indexes spécifiques
schema.index({ warehouse: 1, salePoint: 1 }, { unique: true });

export default mongoose.model('DistanceFromWarehouseToSP', schema);