import mongoose from 'mongoose';

const rentalRequestSchema = new mongoose.Schema({
  warehouse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExternalWarehouse',
    required: true
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  requested_capacity: {
    type: Number,
    required: true,
    min: 1
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.start_date;
      },
      message: 'End date must be after start date'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
 
}, );

export default mongoose.model('RentalWarehouses', rentalRequestSchema);