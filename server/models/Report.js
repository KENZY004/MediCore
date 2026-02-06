const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: [true, 'Please provide appointment ID']
    },
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
    diagnosis: {
        type: String,
        required: [true, 'Please provide diagnosis'],
        trim: true
    },
    prescription: {
        type: String,
        required: [true, 'Please provide prescription'],
        trim: true
    },
    labTests: [{
        testName: String,
        result: String,
        date: Date
    }],
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for search
reportSchema.index({ patientId: 1, doctorId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
