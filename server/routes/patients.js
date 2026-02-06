const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private (admin, reception)
router.post('/', protect, authorize('admin', 'reception'), async (req, res, next) => {
    try {
        const { name, age, gender, phone, address, userId } = req.body;

        // Check if patient with phone already exists
        const existingPatient = await Patient.findOne({ phone });
        if (existingPatient) {
            return res.status(400).json({
                success: false,
                error: 'Patient with this phone number already exists'
            });
        }

        // Create patient
        const patient = await Patient.create({
            name,
            age,
            gender,
            phone,
            address,
            userId
        });

        res.status(201).json({
            success: true,
            message: 'Patient created successfully',
            data: { patient }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/patients
// @desc    Get all patients (with pagination, search, filter)
// @access  Private (admin, reception, doctor)
router.get('/', protect, authorize('admin', 'reception', 'doctor'), async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, gender, sort = 'createdAt', order = 'desc' } = req.query;

        // Build query
        const query = {};

        // Search by name or phone
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by gender
        if (gender) {
            query.gender = gender;
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sort order
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortObj = { [sort]: sortOrder };

        // Execute query with pagination
        const patients = await Patient.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .populate('userId', 'name email');

        // Get total count for pagination
        const total = await Patient.countDocuments(query);

        res.status(200).json({
            success: true,
            data: { patients },
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/patients/search
// @desc    Search patients by name/phone
// @access  Private (admin, reception, doctor)
router.get('/search', protect, authorize('admin', 'reception', 'doctor'), async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Please provide search query'
            });
        }

        // Search by name or phone
        const patients = await Patient.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { phone: { $regex: q, $options: 'i' } }
            ]
        })
            .limit(20)
            .select('name age gender phone')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: { patients },
            count: patients.length
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/patients/:id
// @desc    Get single patient by ID
// @access  Private (admin, reception, doctor, patient)
router.get('/:id', protect, async (req, res, next) => {
    try {
        const patient = await Patient.findById(req.params.id).populate('userId', 'name email role');

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }

        // If user is a patient, only allow viewing their own record
        if (req.user.role === 'patient' && patient.userId && patient.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to view this patient record'
            });
        }

        res.status(200).json({
            success: true,
            data: { patient }
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private (admin, reception)
router.put('/:id', protect, authorize('admin', 'reception'), async (req, res, next) => {
    try {
        const { name, age, gender, phone, address } = req.body;

        let patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }

        // Check if phone is being changed and if it already exists
        if (phone && phone !== patient.phone) {
            const existingPatient = await Patient.findOne({ phone });
            if (existingPatient) {
                return res.status(400).json({
                    success: false,
                    error: 'Patient with this phone number already exists'
                });
            }
        }

        // Update patient
        patient = await Patient.findByIdAndUpdate(
            req.params.id,
            { name, age, gender, phone, address },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Patient updated successfully',
            data: { patient }
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Private (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }

        await patient.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Patient deleted successfully',
            data: {}
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
