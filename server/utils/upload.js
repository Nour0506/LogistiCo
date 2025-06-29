import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
dotenv.config();
// Configuration absolue du chemin .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug: Vérifiez les variables chargées
console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY?.slice(0, 4) + '...', // Masque partiellement la clé
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***set***' : 'missing'
});

if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  throw new Error(
    `Configuration Cloudinary manquante. Vérifiez que :
    1. Le fichier .env est dans le bon dossier
    2. Les variables commencent par CLOUDINARY_
    3. Aucun espace autour des = dans .env
    Chemin actuel: ${resolve(__dirname, '../../.env')}`
  );
}

// Le reste de votre configuration Cloudinary...
// Vérification des variables d'environnement
if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Configuration Cloudinary manquante dans le fichier .env');
}
// Configuration Cloudinary avec vérification
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  const missing = [];
  if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!apiKey) missing.push('CLOUDINARY_API_KEY');
  if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
  
  throw new Error(`Configuration Cloudinary manquante dans .env : ${missing.join(', ')}`);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});
// Configuration Cloudinary sécurisée
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Force l'utilisation de HTTPS
});

// Configuration du stockage Cloudinary optimisée
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'transporter-profiles',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      format: 'webp', // Conversion automatique en WebP
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'auto' },
        { quality: 'auto:best' }
      ],
      public_id: `transporter-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
      resource_type: 'auto'
    };
  }
});

// Filtrage des fichiers
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers JPEG, PNG et WebP sont autorisés'), false);
  }
};

// Configuration finale de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

export default upload;