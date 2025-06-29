import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Test d'upload
const uploadTest = async () => {
  try {
    const result = await cloudinary.uploader.upload('https://picsum.photos/200', {
      folder: 'test'
    });
    console.log('Upload réussi!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    
    // Optionnel: Supprimer l'image de test
    await cloudinary.uploader.destroy(result.public_id);
    console.log('Image test supprimée');
  } catch (error) {
    console.error('Erreur:', error.message);
  }
};

uploadTest();