const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Please provide patient ID']
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Please provide doctor ID']
    },
    date: {
        type: Date,
        required: [true, 'Please provide appointment date']
    },
    time: {
        type: String,
        required: [true, 'Please provide appointment time']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'cancelled', 'completed'],
        default: 'pending'
    },
    reason: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    emailNotificationSent: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for filtering and search
appointmentSchema.index({ patientId: 1, doctorId: 1, date: 1 });
appointmentSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
