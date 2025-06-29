import mongoose from 'mongoose';

// Définir le schéma du modèle Transporter
const TransporterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },

  CIN: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  typeDrivingLicence: {
    type: String,
    enum:  ['A1', 'A', 'B', 'B+E', 'C', 'C+E', 'D', 'D1', 'D+E', 'H '],
    required: true
  },
  profilePicture: {
    type: String // Stockage sous forme d'URL ou chemin du fichier
  },
  status: {
    type: String,
    enum: ["Available", "On mission", "On leave"],
    default: "Available"
  }
}, );

// Définir le modèle basé sur le schéma
const Transporter = mongoose.model("Transporter", TransporterSchema);

// Exportation du modèle correctement
export default Transporter;
