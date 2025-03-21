import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true }, // Index unique ici
    password: { type: String, required: true },
    resetPasswordOTP: String,
    resetPasswordOTPExpires: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpires: String,
    role: { type: String, enum: ['admin', 'entreprise', 'transporteur'] }
});

// Méthode pour comparer les mots de passe
userSchema.methods.isPasswordValid = async function (password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;