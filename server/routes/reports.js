const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/reports
// @desc    Create new report
// @access  Private (admin, doctor)
router.post('/', protect, authorize('admin', 'doctor'), async (req, res, next) => {
    try {
        const { appointmentId, patientId, doctorId, diagnosis, prescription, labTests, notes } = req.body;

        // Verify appointment exists
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

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

        // Create report
        const report = await Report.create({
            appointmentId,
            patientId,
            doctorId,
            diagnosis,
            prescription,
            labTests,
            notes,
            createdBy: req.user.id
        });

        // Populate details
        await report.populate('patientId', 'name age gender phone');
        await report.populate('doctorId', 'name specialization');
        await report.populate('appointmentId', 'date time');

        res.status(201).json({
            success: true,
            message: 'Report created successfully',
            data: { report }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/reports
// @desc    Get all reports (with pagination)
// @access  Private (admin, doctor)
router.get('/', protect, authorize('admin', 'doctor'), async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

        // Build query
        const query = {};

        // If doctor, only show their reports
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

        // Execute query
        const reports = await Report.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .populate('patientId', 'name age gender phone')
            .populate('doctorId', 'name specialization')
            .populate('appointmentId', 'date time');

        // Get total count
        const total = await Report.countDocuments(query);

        res.status(200).json({
            success: true,
            data: { reports },
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

// @route   GET /api/reports/:id
// @desc    Get single report
// @access  Private (admin, doctor, patient - own only)
router.get('/:id', protect, async (req, res, next) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('patientId', 'name age gender phone address')
            .populate('doctorId', 'name specialization phone email')
            .populate('appointmentId', 'date time status')
            .populate('createdBy', 'name email');

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        // If patient, verify they can only see their own reports
        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ userId: req.user.id });
            if (!patient || report.patientId._id.toString() !== patient._id.toString()) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to view this report'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: { report }
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private (admin, doctor)
router.put('/:id', protect, authorize('admin', 'doctor'), async (req, res, next) => {
    try {
        const { diagnosis, prescription, labTests, notes } = req.body;

        let report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        // Update report
        report = await Report.findByIdAndUpdate(
            req.params.id,
            { diagnosis, prescription, labTests, notes },
            { new: true, runValidators: true }
        )
            .populate('patientId', 'name age gender phone')
            .populate('doctorId', 'name specialization')
            .populate('appointmentId', 'date time');

        res.status(200).json({
            success: true,
            message: 'Report updated successfully',
            data: { report }
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        await report.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Report deleted successfully',
            data: {}
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/reports/pdf/:id
// @desc    Generate and download prescription PDF
// @access  Private (admin, doctor, patient - own only)
router.get('/pdf/:id', protect, async (req, res, next) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('patientId', 'name age gender phone address')
            .populate('doctorId', 'name specialization phone email')
            .populate('appointmentId', 'date time');

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        // If patient, verify they can only download their own reports
        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ userId: req.user.id });
            if (!patient || report.patientId._id.toString() !== patient._id.toString()) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to download this report'
                });
            }
        }

        // TODO: Implement PDF generation in Phase 7
        // For now, return placeholder
        res.status(200).json({
            success: true,
            message: 'PDF generation will be implemented in Phase 7',
            data: { report }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
