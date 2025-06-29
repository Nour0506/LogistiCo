import mongoose from 'mongoose';

const TruckSchema = new mongoose.Schema({
    vehicle: { 
        type: String, 
        required: [true, 'Le nom du camion est obligatoire'],
        trim: true,
        maxlength: [100, 'Le nom ne peut excéder 100 caractères']
    },
    type: { 
        type: String, 
        enum: ['A1', 'A', 'B', 'B+E', 'C', 'C+E', 'D', 'D1', 'D+E', 'H '],
        required: [true, 'Le type de camion est obligatoire']
    },
    status: {
        type: String,
        enum: ['available', 'in transit', 'maintenance'],
        default: 'available'
    },
    capacity: {
        type: Number,
        required: [true, ],
        min: [500]
    },
    company_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true 
    }
});

const Truck = mongoose.model('Truck', TruckSchema);
export default Truck;