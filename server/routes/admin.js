const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');
const Bill = require('../models/Bill');
const { protect, authorize } = require('../middleware/auth');

// All routes are admin-only
router.use(protect, authorize('admin'));

// @route   GET /api/admin/analytics
// @desc    Get dashboard analytics
// @access  Private (admin only)
router.get('/analytics', async (req, res, next) => {
    try {
        // Total counts
        const totalPatients = await Patient.countDocuments();
        const totalDoctors = await Doctor.countDocuments();
        const totalAppointments = await Appointment.countDocuments();
        const totalReports = await Report.countDocuments();
        const totalBills = await Bill.countDocuments();

        // Appointment statistics by status
        const appointmentsByStatus = await Appointment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Revenue statistics
        const revenueStats = await Bill.aggregate([
            {
                $group: {
                    _id: '$paymentStatus',
                    total: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Calculate total revenue and pending amount
        let totalRevenue = 0;
        let pendingAmount = 0;
        revenueStats.forEach(stat => {
            if (stat._id === 'paid') {
                totalRevenue = stat.total;
            } else if (stat._id === 'pending') {
                pendingAmount = stat.total;
            }
        });

        // Recent appointments (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentAppointments = await Appointment.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        // Patient demographics (gender distribution)
        const patientsByGender = await Patient.aggregate([
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalPatients,
                    totalDoctors,
                    totalAppointments,
                    totalReports,
                    totalBills,
                    totalRevenue,
                    pendingAmount,
                    recentAppointments
                },
                appointmentsByStatus,
                revenueStats,
                patientsByGender
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (admin only)
router.get('/users', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, role } = req.query;

        // Build query
        const query = {};
        if (role) {
            query.role = role;
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: { users },
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

// @route   GET /api/admin/users/:id
// @desc    Get single user
// @access  Private (admin only)
router.get('/users/:id', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/admin/patients
// @desc    Get all patients (admin view)
// @access  Private (admin only)
router.get('/patients', async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const patients = await Patient.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('userId', 'name email');

        const total = await Patient.countDocuments();

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

// @route   GET /api/admin/patients/:id
// @desc    Get single patient (admin view)
// @access  Private (admin only)
router.get('/patients/:id', async (req, res, next) => {
    try {
        const patient = await Patient.findById(req.params.id).populate('userId', 'name email role');

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
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

// @route   GET /api/admin/appointments
// @desc    Get all appointments (admin view)
// @access  Private (admin only)
router.get('/appointments', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const appointments = await Appointment.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('patientId', 'name phone')
            .populate('doctorId', 'name specialization');

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

// @route   GET /api/admin/appointments/:id
// @desc    Get single appointment (admin view)
// @access  Private (admin only)
router.get('/appointments/:id', async (req, res, next) => {
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

        res.status(200).json({
            success: true,
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/admin/reports
// @desc    Get all reports (admin view)
// @access  Private (admin only)
router.get('/reports', async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const reports = await Report.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('patientId', 'name phone')
            .populate('doctorId', 'name specialization');

        const total = await Report.countDocuments();

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

// @route   GET /api/admin/reports/:id
// @desc    Get single report (admin view)
// @access  Private (admin only)
router.get('/reports/:id', async (req, res, next) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('patientId', 'name age gender phone')
            .populate('doctorId', 'name specialization')
            .populate('appointmentId', 'date time');

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { report }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/admin/bills
// @desc    Get all bills (admin view)
// @access  Private (admin only)
router.get('/bills', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, paymentStatus } = req.query;

        const query = {};
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const bills = await Bill.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('patientId', 'name phone');

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

// @route   GET /api/admin/bills/:id
// @desc    Get single bill (admin view)
// @access  Private (admin only)
router.get('/bills/:id', async (req, res, next) => {
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

        res.status(200).json({
            success: true,
            data: { bill }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
