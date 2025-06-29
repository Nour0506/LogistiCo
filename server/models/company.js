import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
    email: String,
    password: String, // Mot de passe de l'entreprise
    companyName: String,
    registeredOfficeAddress: String,
    legalStatus: String,
    taxRegistrationNumber: String,
    phoneNumber: String,
    Logo: {
        type: String,
        default: '' // Ou une URL par défaut si vous voulez
    },
    isApproved: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ,
    resetPasswordOTP: String, // Code de vérification (OTP)
    resetPasswordOTPExpires: Date });



const Company = mongoose.model('Company', companySchema);

export default Company;