const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide doctor name'],
        trim: true
    },
    specialization: {
        type: String,
        required: [true, 'Please provide specialization'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Please provide phone number'],
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    },
    email: {
        type: String,
        required: [true, 'Please provide email'],
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    availability: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        startTime: {
            type: String, // Format: "09:00"
            required: true
        },
        endTime: {
            type: String, // Format: "17:00"
            required: true
        }
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Doctors must have user accounts
    }
}, {
    timestamps: true
});

// Index for search
doctorSchema.index({ name: 1, specialization: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
