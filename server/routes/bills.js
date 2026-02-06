const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/bills
// @desc    Create new bill
// @access  Private (admin, reception)
router.post('/', protect, authorize('admin', 'reception'), async (req, res, next) => {
    try {
        const { patientId, appointmentId, services, totalAmount, paymentMethod } = req.body;

        // Verify patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }

        // Verify appointment exists (if provided)
        if (appointmentId) {
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    error: 'Appointment not found'
                });
            }
        }

        // Create bill
        const bill = await Bill.create({
            patientId,
            appointmentId,
            services,
            totalAmount,
            paymentMethod,
            createdBy: req.user.id
        });

        // Populate details
        await bill.populate('patientId', 'name phone');
        await bill.populate('appointmentId', 'date time');

        res.status(201).json({
            success: true,
            message: 'Bill created successfully',
            data: { bill }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/bills
// @desc    Get all bills (with pagination, filter by status)
// @access  Private (admin, reception)
router.get('/', protect, authorize('admin', 'reception'), async (req, res, next) => {
    try {
        const { page = 1, limit = 10, paymentStatus, sort = 'createdAt', order = 'desc' } = req.query;

        // Build query
        const query = {};

        // Filter by payment status
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sort order
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortObj = { [sort]: sortOrder };

        // Execute query
        const bills = await Bill.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .populate('patientId', 'name phone')
            .populate('appointmentId', 'date time')
            .populate('createdBy', 'name email');

        // Get total count
        const total = await Bill.countDocuments(query);

        res.status(200).json({
            success: true,
            data: { bills },
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

// @route   GET /api/bills/:id
// @desc    Get single bill
// @access  Private (admin, reception, patient - own only)
router.get('/:id', protect, async (req, res, next) => {
    try {
        const bill = await Bill.findById(req.params.id)
            .populate('patientId', 'name phone address')
            .populate('appointmentId', 'date time')
            .populate('createdBy', 'name email');

        if (!bill) {
            return res.status(404).json({
                success: false,
                error: 'Bill not found'
            });
        }

        // If patient, verify they can only see their own bills
        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ userId: req.user.id });
            if (!patient || bill.patientId._id.toString() !== patient._id.toString()) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to view this bill'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: { bill }
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/bills/:id
// @desc    Update bill
// @access  Private (admin, reception)
router.put('/:id', protect, authorize('admin', 'reception'), async (req, res, next) => {
    try {
        const { services, totalAmount, paymentStatus, paymentMethod, paymentId } = req.body;

        let bill = await Bill.findById(req.params.id);

        if (!bill) {
            return res.status(404).json({
                success: false,
                error: 'Bill not found'
            });
        }

        // If payment status is being changed to 'paid', set paidAt timestamp
        const updateData = { services, totalAmount, paymentStatus, paymentMethod, paymentId };
        if (paymentStatus === 'paid' && bill.paymentStatus !== 'paid') {
            updateData.paidAt = new Date();
        }

        // Update bill
        bill = await Bill.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('patientId', 'name phone')
            .populate('appointmentId', 'date time');

        res.status(200).json({
            success: true,
            message: 'Bill updated successfully',
            data: { bill }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/bills/pdf/:id
// @desc    Generate and download bill PDF
// @access  Private (admin, reception, patient - own only)
router.get('/pdf/:id', protect, async (req, res, next) => {
    try {
        const bill = await Bill.findById(req.params.id)
            .populate('patientId', 'name phone address')
            .populate('appointmentId', 'date time');

        if (!bill) {
            return res.status(404).json({
                success: false,
                error: 'Bill not found'
            });
        }

        // If patient, verify they can only download their own bills
        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ userId: req.user.id });
            if (!patient || bill.patientId._id.toString() !== patient._id.toString()) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to download this bill'
                });
            }
        }

        // TODO: Implement PDF generation in Phase 7
        // For now, return placeholder
        res.status(200).json({
            success: true,
            message: 'PDF generation will be implemented in Phase 7',
            data: { bill }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
