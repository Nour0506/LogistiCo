// models/Product.ts
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'electronics',   
      'clothing',      
      'food',          
      'furniture',    
      'health',        
      'beauty',        
      'sports',       
      'automotive',    
      'home',         
      'books'          
    ],
  },
  storage_type: {
    type: String,
    required: true,
    enum: [
      'ambient',       // Stockage à température ambiante
      'refrigerated',  // Produits réfrigérés (4°C)
      'frozen',        // Produits surgelés (-18°C)
      'controlled'     // Environnement contrôlé (humidité/température)
    ],
  },
 
});

// Mise à jour automatique de la date de modification
productSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;