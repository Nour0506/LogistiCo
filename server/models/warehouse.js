import mongoose from 'mongoose';
import DistanceService from '../services/DistanceService.js';

const warehouseSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Le nom est obligatoire'],
        trim: true,
        maxlength: [100, 'Le nom ne peut excéder 100 caractères']
    },
    type: { 
        type: String, 
        enum: ['internal', 'external'],
        required: [true, 'Le type (internal/external) est obligatoire']
    },
    location: { 
        type: String, 
        required: [true, 'La localisation est obligatoire'],
        trim: true
    },
    storage_type: {
        type: String,
        enum: ['freezer', 'refrigerated', 'ambient', 'controlled'],
        required: [true, 'Le type de stockage est obligatoire']
    },
    capacity: { 
        type: Number, 
        required: [ 'La capacité est obligatoire'],
        min: [1, 'La capacité doit être supérieure à 0']
    },
    current_usage: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'maintenance'],
        default: 'available'
    },
    company_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company',
        required: false
    },
    products: {
        type: [{
            product: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'Product'
            },
            quantity: { 
                type: Number, 
                required: true,
                min: [1, 'La quantité doit être au moins 1']
            }
        }],
        default: []
    },
    position: {
    type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number],
        index: '2dsphere',
        required: [true, 'Les coordonnées sont obligatoires'],
        validate: {
            validator: function(coords) {
                return Array.isArray(coords) &&
                       coords.length === 2 &&
                       coords.every(coord => typeof coord === 'number' && !isNaN(coord)) &&
                       coords[0] >= -180 && coords[0] <= 180 &&
                       coords[1] >= -90 && coords[1] <= 90;
            },
            message: 'Coordonnées [longitude, latitude] invalides: doivent être un tableau de deux nombres valides'
        }
    }
}
}, {
    timestamps: true,  // Ajout automatique de createdAt et updatedAt
    toJSON: { virtuals: true },  // Pour inclure les virtuals dans les réponses JSON
    toObject: { virtuals: true }  // Pour inclure les virtuals quand on convertit en objet
});

// Index pour optimiser les requêtes
warehouseSchema.index({ company_id: 1 });
warehouseSchema.index({ name: 1 });
warehouseSchema.index({ type: 1 });
warehouseSchema.index({ status: 1 });

// Hooks avec gestion d'erreur
warehouseSchema.post('save', async function(doc, next) {
    try {
        if (doc.position?.coordinates) {
            await DistanceService.updateWarehouseDistances(doc);
        }
    } catch (error) {
        console.error('Error in warehouse post-save hook:', error);
        // On ne passe pas l'erreur à next() pour ne pas interrompre le flux
    }
    next();
});

warehouseSchema.post('findOneAndUpdate', async function(doc, next) {
    try {
        if (doc?.position?.coordinates) {
            await DistanceService.updateWarehouseDistances(doc);
        }
    } catch (error) {
        console.error('Error in warehouse post-update hook:', error);
    }
    next();
});

warehouseSchema.post(['deleteOne', 'findOneAndDelete'], async function(doc, next) {
    try {
        await DistanceService.handleEntityDeletion('warehouse', doc._id);
    } catch (error) {
        console.error('Error in warehouse post-delete hook:', error);
    }
    next();
});

// Virtual pour calculer l'espace disponible
warehouseSchema.virtual('available_space').get(function() {
    return this.capacity - this.current_usage;
});

// Validation supplémentaire avant sauvegarde
// Exemple pour Warehouse
warehouseSchema.post('save', async function(doc, next) {
    try {
        if (doc.isModified('position')) { // Ne traitez que si la position a changé
            await DistanceService.updateWarehouseDistances(doc);
        }
    } catch (error) {
        console.error('Error in post-save hook:', error);
    }
    next();
});

const Warehouse = mongoose.model('Warehouse', warehouseSchema);
export default Warehouse;