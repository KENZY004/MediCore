const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private (admin, reception, patient)
router.post('/', protect, authorize('admin', 'reception', 'patient'), async (req, res, next) => {
    try {
        const { patientId, doctorId, date, time, reason, notes } = req.body;

        // Verify patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }

        // Verify doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                error: 'Doctor not found'
            });
        }

        // Create appointment
        const appointment = await Appointment.create({
            patientId,
            doctorId,
            date,
            time,
            reason,
            notes,
            createdBy: req.user.id
        });

        // Populate patient and doctor details
        await appointment.populate('patientId', 'name phone');
        await appointment.populate('doctorId', 'name specialization');

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/appointments
// @desc    Get all appointments (with pagination, filter by date/status)
// @access  Private (admin, reception, doctor)
router.get('/', protect, authorize('admin', 'reception', 'doctor'), async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, date, sort = 'date', order = 'desc' } = req.query;

        // Build query
        const query = {};

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by date
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        // If doctor, only show their appointments
        if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({ userId: req.user.id });
            if (doctor) {
                query.doctorId = doctor._id;
            }
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sort order
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortObj = { [sort]: sortOrder };

        // Execute query with pagination
        const appointments = await Appointment.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .populate('patientId', 'name age gender phone')
            .populate('doctorId', 'name specialization')
            .populate('createdBy', 'name email');

        // Get total count
        const total = await Appointment.countDocuments(query);

        res.status(200).json({
            success: true,
            data: { appointments },
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

// @route   GET /api/appointments/doctor/:doctorId
// @desc    Get appointments by doctor
// @access  Private (admin, reception, doctor)
router.get('/doctor/:doctorId', protect, authorize('admin', 'reception', 'doctor'), async (req, res, next) => {
    try {
        const { status, date } = req.query;

        // Build query
        const query = { doctorId: req.params.doctorId };

        if (status) {
            query.status = status;
        }

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const appointments = await Appointment.find(query)
            .sort({ date: 1, time: 1 })
            .populate('patientId', 'name age gender phone')
            .populate('doctorId', 'name specialization');

        res.status(200).json({
            success: true,
            data: { appointments },
            count: appointments.length
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/appointments/patient/:patientId
// @desc    Get appointments by patient
// @access  Private (admin, reception, doctor, patient)
router.get('/patient/:patientId', protect, async (req, res, next) => {
    try {
        const { status } = req.query;

        // If user is patient, verify they can only see their own appointments
        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ userId: req.user.id });
            if (!patient || patient._id.toString() !== req.params.patientId) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to view these appointments'
                });
            }
        }

        // Build query
        const query = { patientId: req.params.patientId };

        if (status) {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .sort({ date: -1 })
            .populate('patientId', 'name age gender phone')
            .populate('doctorId', 'name specialization');

        res.status(200).json({
            success: true,
            data: { appointments },
            count: appointments.length
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private (admin, reception, doctor, patient)
router.get('/:id', protect, async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('patientId', 'name age gender phone address')
            .populate('doctorId', 'name specialization phone email')
            .populate('createdBy', 'name email');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        // If patient, verify they can only see their own appointments
        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ userId: req.user.id });
            if (!patient || appointment.patientId._id.toString() !== patient._id.toString()) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to view this appointment'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private (admin, reception, doctor)
router.put('/:id', protect, authorize('admin', 'reception', 'doctor'), async (req, res, next) => {
    try {
        const { date, time, status, reason, notes } = req.body;

        let appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        // Update appointment
        appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { date, time, status, reason, notes },
            { new: true, runValidators: true }
        )
            .populate('patientId', 'name age gender phone')
            .populate('doctorId', 'name specialization');

        res.status(200).json({
            success: true,
            message: 'Appointment updated successfully',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment
// @access  Private (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        await appointment.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Appointment deleted successfully',
            data: {}
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/appointments/:id/notify
// @desc    Send email notification for appointment
// @access  Private (admin, reception)
router.post('/:id/notify', protect, authorize('admin', 'reception'), async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('patientId', 'name phone')
            .populate('doctorId', 'name specialization');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        // TODO: Implement email sending logic in Phase 7
        // For now, just mark as notified
        appointment.emailNotificationSent = true;
        await appointment.save();

        res.status(200).json({
            success: true,
            message: 'Email notification sent successfully (placeholder)',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
