import mongoose from 'mongoose';
import User from './user.js';

const transporteurSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transportRegisterNumber: { type: String, required: true, trim: true },
    profilePhoto: { type: String, trim: true },
    transportType: { type: String, required: true, trim: true }
});

const Transporteur = mongoose.model('Transporter', transporteurSchema);
export default Transporteur;
