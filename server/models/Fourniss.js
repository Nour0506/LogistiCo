import mongoose from 'mongoose';
import DistanceService from '../services/DistanceService.js';


const SupplierSchema = mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, "Company reference is required"]
    },
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true
    },
    contact: {
      type: String,
      required: [true, "Supplier contact is required"],
      trim: true
    },
    category: {
      type: String,
      enum: ['electronics',   
      'clothing',      
      'food',          
      'furniture',    
      'health',        
      'beauty',        
      'sports',       
      'automotive',    
      'home',         
      'books'   ],
      required: [true, "Supplier category is required"],
    },
    lastOrder: {
      type: Date,
      default: null
    },
    products: {
      type: [{
        name: { 
          type: String, 
          required: true 
        },
        quantity: { 
          type: Number, 
          required: true,
          min: 1 
        }
      }],
      default: []
    },
    location: {
      type: String,
      required: [true, "Supplier location is required"],
      trim: true
    },
  
    position: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: {
            type: [Number],
            required: [true, "Les coordonnées sont obligatoires"],
            index: '2dsphere',
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
}, {
   toJSON: { virtuals: true },  // Inclut les virtuals dans les réponses JSON
    toObject: { virtuals: true }  // Inclut les virtuals quand converti en objet
});

// Index supplémentaires pour optimisation
SupplierSchema.index({ name: 1 });
SupplierSchema.index({ category: 1 });
SupplierSchema.index({ companyId: 1, name: 1 });

// Hooks avec gestion d'erreur améliorée
SupplierSchema.post('save', async function(doc, next) {
    try {
        if (doc.position?.coordinates) {
            await DistanceService.updateSupplierDistances(doc);
        }
    } catch (error) {
        console.error('Erreur dans le hook post-save:', error);
        // On ne bloque pas le flux pour une erreur de distance
    }
    next();
});

SupplierSchema.post('findOneAndUpdate', async function(doc, next) {
    try {
        if (doc?.position?.coordinates) {
            await DistanceService.updateSupplierDistances(doc);
        }
    } catch (error) {
        console.error('Erreur dans le hook post-update:', error);
    }
    next();
});

SupplierSchema.post(['deleteOne', 'findOneAndDelete'], async function(doc, next) {
    try {
        await DistanceService.handleEntityDeletion('supplier', doc._id);
    } catch (error) {
        console.error('Erreur dans le hook post-delete:', error);
    }
    next();
});

// Virtual pour le statut du fournisseur
SupplierSchema.virtual('status').get(function() {
    return this.lastOrder 
        ? (new Date() - this.lastOrder < 30*24*60*60*1000 ? 'active' : 'inactive') 
        : 'new';
});

// Validation avant sauvegarde
SupplierSchema.pre('save', function(next) {
    if (this.name) {
        this.name = this.name.trim();
    }
    next();
});

const Supplier = mongoose.model('Supplier', SupplierSchema);
export default Supplier;