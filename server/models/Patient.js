const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide patient name'],
        trim: true
    },
    age: {
        type: Number,
        required: [true, 'Please provide patient age'],
        min: [0, 'Age cannot be negative'],
        max: [150, 'Please provide a valid age']
    },
    gender: {
        type: String,
        required: [true, 'Please provide gender'],
        enum: ['Male', 'Female', 'Other']
    },
    phone: {
        type: String,
        required: [true, 'Please provide phone number'],
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    },
    address: {
        type: String,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional - for patients who register as users
    }
}, {
    timestamps: true
});

// Index for faster search
patientSchema.index({ name: 1, phone: 1 });

module.exports = mongoose.model('Patient', patientSchema);
