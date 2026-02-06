const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Please provide patient ID']
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    services: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        cost: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    totalAmount: {
        type: Number,
        required: [true, 'Please provide total amount'],
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'online'],
        default: 'cash'
    },
    paymentId: {
        type: String, // Razorpay payment ID
        trim: true
    },
    paidAt: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for filtering
billSchema.index({ patientId: 1, paymentStatus: 1 });
billSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Bill', billSchema);
