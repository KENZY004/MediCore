# HOSPITAL MANAGEMENT SYSTEM
## Advanced Project Planning Document (Enhanced - v4)

**Course:** BTech CSE (LPU)  
**Subject:** Placement Enhancement Program (PEP)  
**Technology Stack:** React, Node.js, Express, MongoDB, JWT Authentication, Nodemailer, Payment Gateway API, Chart.js, PDFKit

---

## 1. Introduction

This document describes the planning and system design of an **Advanced Hospital Management System**. The system is designed to provide a secure, role-based, and scalable web platform that supports hospital operations including patient management, appointment scheduling, medical reporting, billing, automated notifications, and online payments.

The system manages patients, doctors, hospital staff, medical records, appointments, billing, and reports in a unified digital platform.

The project demonstrates full-stack development using **React** for the frontend, **Node.js** and **Express** for backend APIs, and **MongoDB** for database management. Security and access control are implemented using **JWT authentication** and role-based authorization.

---

## 2. Project Objectives

The main objectives of this project are:

- To design a secure login system using JWT authentication
- To implement role-based access for Admin, Doctor, Reception, and Patient users
- To manage patient records using full CRUD operations
- To allow appointment scheduling, approval, and tracking
- To generate medical reports and prescriptions
- To implement automated email notifications
- To implement online billing and payment processing
- To design complete RESTful APIs with single-record and collection-level access
- **To implement search, filtering, and pagination for efficient data retrieval**
- **To provide dashboard analytics with visual charts and statistics**
- **To generate PDF documents for prescriptions and bills**
- **To implement secure password reset functionality**
- To demonstrate industry-level full-stack architecture

---

## 3. System Architecture

The system follows a **client-server architecture**:

### Frontend:
- React-based user interface for Admin, Doctor, Reception, and Patient roles
- Protected routes using authentication context
- Form validation and real-time status updates
- **Dashboard with analytics charts using Chart.js/Recharts**
- **Search and filter components for data exploration**
- **PDF preview and download functionality**

### Backend:
- Node.js and Express REST API server
- JWT-based authentication and role-based middleware
- Email service integration using Nodemailer
- Payment service integration using third-party payment gateway API
- **PDF generation using PDFKit**
- **Input validation and sanitization using express-validator**
- **Pagination and search query handling**

### Database:
- MongoDB for storing users, patients, doctors, appointments, reports, and billing data
- **Indexed fields for optimized search and query performance**
- **Aggregation pipelines for analytics data**

All protected API requests include a JWT token in the Authorization header. The backend verifies both token validity and user role before granting access.

---

## 4. User Roles and Responsibilities

### Admin:
- Manage users and doctors
- View all patients, appointments, reports, and billing records
- Access system analytics and statistics
- **View dashboard with charts showing appointment trends, revenue, patient statistics**
- Fetch individual records using entity ID
- **Search and filter across all entities**

### Doctor:
- View assigned appointments
- Create, update, and view medical reports
- Issue prescriptions
- **Generate PDF prescriptions**
- View individual patient and appointment records using ID
- **View personal dashboard with appointment statistics**

### Reception:
- Register new patients
- Book and manage appointments
- Trigger appointment confirmation emails
- **Search patients by name, phone, or ID**
- **View daily appointment schedule**

### Patient:
- View appointments and medical history
- Receive email notifications
- View and pay bills online
- **Download prescription and bill PDFs**
- **Update profile information**
- **Reset password via email**

---

## 5. Database Design (Collections)

### Users
- `name` (String, required)
- `email` (String, required, unique, indexed)
- `password` (String, hashed, required)
- `role` (String, enum: ['admin', 'doctor', 'reception', 'patient'])
- `resetPasswordToken` (String)
- `resetPasswordExpires` (Date)
- `createdAt` (Date)
- `updatedAt` (Date)

### Patients
- `name` (String, required, indexed)
- `age` (Number, required)
- `gender` (String, enum: ['Male', 'Female', 'Other'])
- `phone` (String, required, indexed)
- `address` (String)
- `userId` (ObjectId, ref: 'User')
- `createdAt` (Date)
- `updatedAt` (Date)

### Doctors
- `name` (String, required)
- `specialization` (String, required)
- `availability` (Array of Objects: { day, startTime, endTime })
- `userId` (ObjectId, ref: 'User')
- `createdAt` (Date)
- `updatedAt` (Date)

### Appointments
- `patientId` (ObjectId, ref: 'Patient', indexed)
- `doctorId` (ObjectId, ref: 'Doctor', indexed)
- `date` (Date, required, indexed)
- `status` (String, enum: ['pending', 'approved', 'cancelled', 'completed'], indexed)
- `emailNotificationStatus` (Boolean, default: false)
- `createdAt` (Date)
- `updatedAt` (Date)

### Reports
- `appointmentId` (ObjectId, ref: 'Appointment')
- `patientId` (ObjectId, ref: 'Patient')
- `doctorId` (ObjectId, ref: 'Doctor')
- `diagnosis` (String, required)
- `prescription` (String, required)
- `createdBy` (ObjectId, ref: 'User')
- `createdAt` (Date)
- `updatedAt` (Date)

### Bills
- `patientId` (ObjectId, ref: 'Patient', indexed)
- `appointmentId` (ObjectId, ref: 'Appointment')
- `services` (Array of Objects: { name, cost })
- `totalAmount` (Number, required)
- `paymentStatus` (String, enum: ['pending', 'paid', 'failed'], indexed)
- `paymentId` (String)
- `createdAt` (Date)
- `updatedAt` (Date)

---

## 6. API Design

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password with token
GET    /api/auth/me                - Get current user profile
PUT    /api/auth/profile           - Update user profile
```

### Patients
```
POST   /api/patients               - Create new patient
GET    /api/patients               - Get all patients (with pagination, search, filter)
GET    /api/patients/:id           - Get single patient by ID
PUT    /api/patients/:id           - Update patient
DELETE /api/patients/:id           - Delete patient
GET    /api/patients/search        - Search patients by name/phone
```

### Appointments
```
POST   /api/appointments           - Create new appointment
GET    /api/appointments           - Get all appointments (with pagination, filter by date/status)
GET    /api/appointments/:id       - Get single appointment
PUT    /api/appointments/:id       - Update appointment
DELETE /api/appointments/:id       - Delete appointment
POST   /api/appointments/:id/notify - Send email notification
GET    /api/appointments/doctor/:doctorId - Get appointments by doctor
GET    /api/appointments/patient/:patientId - Get appointments by patient
```

### Reports
```
POST   /api/reports                - Create new report
GET    /api/reports                - Get all reports (with pagination)
GET    /api/reports/:id            - Get single report
PUT    /api/reports/:id            - Update report
DELETE /api/reports/:id            - Delete report
GET    /api/reports/pdf/:id        - Generate and download prescription PDF
```

### Billing and Payments
```
POST   /api/bills                  - Create new bill
GET    /api/bills                  - Get all bills (with pagination, filter by status)
GET    /api/bills/:id              - Get single bill
PUT    /api/bills/:id              - Update bill
GET    /api/bills/pdf/:id          - Generate and download bill PDF
POST   /api/payments/checkout      - Create payment session
POST   /api/payments/verify        - Verify payment status
```

### Admin Routes (Admin-Only Access)
```
GET    /api/admin/users            - Get all users
GET    /api/admin/users/:id        - Get single user
GET    /api/admin/patients         - Get all patients
GET    /api/admin/patients/:id     - Get single patient
GET    /api/admin/appointments     - Get all appointments
GET    /api/admin/appointments/:id - Get single appointment
GET    /api/admin/reports          - Get all reports
GET    /api/admin/reports/:id      - Get single report
GET    /api/admin/bills            - Get all bills
GET    /api/admin/bills/:id        - Get single bill
GET    /api/admin/analytics        - Get dashboard analytics
```

### Analytics
```
GET    /api/analytics/dashboard    - Get dashboard statistics
GET    /api/analytics/appointments - Get appointment trends
GET    /api/analytics/revenue      - Get revenue statistics
```

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

### Query Parameters for Pagination and Search
```
?page=1&limit=10                    - Pagination
?search=keyword                     - Search by name/phone
?status=approved                    - Filter by status
?date=2024-01-01                    - Filter by date
?sort=createdAt&order=desc          - Sorting
```

---

## 7. Email Notification System

- Email notifications are triggered on appointment creation, approval, and cancellation
- **Password reset emails with secure token links**
- Nodemailer is used to send emails via a secure SMTP service (Gmail/SendGrid)
- Email templates are used to format appointment and billing notifications
- Notification logs are stored in the database for tracking delivery status

### Email Templates:
1. **Appointment Confirmation** - Sent when appointment is created
2. **Appointment Approval** - Sent when appointment is approved by doctor
3. **Appointment Cancellation** - Sent when appointment is cancelled
4. **Password Reset** - Sent with secure reset link
5. **Bill Payment Confirmation** - Sent after successful payment

---

## 8. Payment System Design

- Online payment is integrated using a third-party payment gateway API (Razorpay/Stripe)
- Payment sessions are created from the backend
- Frontend redirects users to a secure checkout page
- Payment verification is handled through backend webhooks
- Payment status is stored in the Bills collection
- **PDF receipt is generated after successful payment**

---

## 9. Security Design

### Authentication & Authorization
- Password hashing using **bcrypt** (salt rounds: 10)
- JWT-based authentication for all users
- Token expiration: 7 days
- Role-based authorization middleware
- Secure API routes with token validation

### Input Security
- **Input validation and sanitization using express-validator**
- Protection against NoSQL injection
- XSS (Cross-Site Scripting) protection
- CSRF (Cross-Site Request Forgery) protection for forms

### Additional Security Measures
- **Rate limiting on login attempts** (max 5 attempts per 15 minutes)
- **Password reset token expiration** (1 hour)
- Secure password reset flow
- Environment variables for sensitive credentials
- HTTPS enforcement in production
- Secure HTTP headers using Helmet.js

### Error Handling
- Centralized error handling middleware
- User-friendly error messages on frontend
- Detailed error logging for debugging
- Validation error responses with field-specific messages
- Graceful handling of database connection errors

---

## 10. Dashboard Analytics

### Admin Dashboard
- **Total Patients Count** - Card display
- **Total Appointments** - Card display with status breakdown
- **Total Revenue** - Card display with monthly comparison
- **Pending Bills** - Card display
- **Appointment Trends Chart** - Line chart showing appointments over time
- **Revenue Chart** - Bar chart showing monthly revenue
- **Patient Demographics** - Pie chart showing age/gender distribution
- **Doctor Performance** - Table showing appointments per doctor

### Doctor Dashboard
- **Today's Appointments** - List view
- **Total Patients Treated** - Card display
- **Pending Reports** - Card display
- **Appointment Status Chart** - Pie chart

### Reception Dashboard
- **Today's Schedule** - Calendar view
- **Recent Registrations** - List view
- **Pending Appointments** - List view

### Patient Dashboard
- **Upcoming Appointments** - Card display
- **Medical History** - Timeline view
- **Pending Bills** - List view

**Technology:** Chart.js or Recharts for data visualization

---

## 11. PDF Generation

### Prescription PDF
- **Header:** Hospital logo and name
- **Patient Details:** Name, age, gender, contact
- **Doctor Details:** Name, specialization
- **Date:** Prescription date
- **Diagnosis:** Medical diagnosis
- **Prescription:** Medicines and dosage
- **Footer:** Doctor signature and hospital contact

### Bill PDF
- **Header:** Hospital logo and name
- **Bill Number:** Unique identifier
- **Patient Details:** Name, contact
- **Services:** Itemized list with costs
- **Total Amount:** Grand total
- **Payment Status:** Paid/Pending
- **Payment ID:** Transaction reference (if paid)
- **Footer:** Hospital contact and terms

**Technology:** PDFKit (Node.js) or jsPDF (client-side)

---

## 12. Search and Pagination

### Search Functionality
- **Patient Search:** By name, phone number, or patient ID
- **Appointment Search:** By patient name, doctor name, or date
- **Doctor Search:** By name or specialization
- **Bill Search:** By patient name or bill number
- **Real-time search** with debouncing for better performance

### Pagination
- Default page size: 10 records
- Configurable page size: 10, 20, 50, 100
- Page navigation: First, Previous, Next, Last
- Total records and page count display
- **Backend pagination** to reduce data transfer and improve performance

### Filtering
- **Appointments:** By status (pending, approved, cancelled, completed), date range
- **Bills:** By payment status (pending, paid, failed), date range
- **Patients:** By gender, age range
- **Reports:** By doctor, date range

---

## 13. Password Reset Flow

### Forgot Password Process:
1. User enters email on forgot password page
2. System generates unique reset token (crypto.randomBytes)
3. Token is hashed and stored in user document with expiration (1 hour)
4. Email sent with reset link containing token
5. User clicks link and is redirected to reset password page
6. User enters new password
7. System validates token and expiration
8. Password is updated and token is cleared
9. Confirmation email sent

### Security Measures:
- Token expires after 1 hour
- Token can only be used once
- Password strength validation
- Rate limiting on forgot password requests

---

## 14. Non-Functional Requirements

### Performance
- Page load time: < 3 seconds
- API response time: < 500ms for most endpoints
- Database query optimization with proper indexing
- Lazy loading for large datasets
- Image optimization and compression

### Scalability
- Support up to 1000 concurrent users
- Horizontal scaling capability
- Database connection pooling
- Efficient query design with pagination

### Availability
- Target uptime: 99%
- Graceful error handling and recovery
- Database backup strategy (daily automated backups)

### Usability
- Intuitive and user-friendly interface
- Minimal training required
- Responsive design for mobile and tablet devices
- Accessibility considerations (WCAG guidelines)

### Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Edge (latest 2 versions)
- Safari (latest 2 versions)

### Maintainability
- Clean and modular code structure
- Comprehensive code comments
- API documentation
- Version control using Git

---

## 15. Testing Strategy

### Unit Testing
- Test individual functions and components
- Test utility functions (validation, formatting)
- Test authentication and authorization logic
- **Tools:** Jest (JavaScript testing framework)

### API Testing
- Test all API endpoints for correct responses
- Test authentication and authorization
- Test error handling and edge cases
- Test pagination, search, and filtering
- **Tools:** Postman (API testing and documentation)

### Integration Testing
- Test complete user workflows (registration → login → booking appointment)
- Test email notification triggers
- Test payment flow integration
- **Tools:** Supertest (HTTP assertions)

### Frontend Testing
- Test React components rendering
- Test form validation
- Test user interactions
- **Tools:** React Testing Library

### User Acceptance Testing (UAT)
- **Admin Role:** Test user management, analytics, system-wide operations
- **Doctor Role:** Test appointment viewing, report creation, prescription generation
- **Reception Role:** Test patient registration, appointment booking
- **Patient Role:** Test appointment viewing, bill payment, profile update

### Test Coverage Goals
- Minimum 70% code coverage
- 100% coverage for critical paths (authentication, payment)

### Bug Tracking
- Document all bugs with severity levels
- Systematic bug fixing and retesting
- Use GitHub Issues for tracking

---

## 16. Development Plan and Timeline

### Phase 1: Setup and Configuration (Week 1)
- Setup GitHub repository
- Setup backend and frontend structure
- Connect MongoDB
- Configure environment variables
- Setup ESLint and Prettier

### Phase 2: Authentication and Roles (Week 2)
- User registration and login
- JWT token handling
- Role-based route protection
- **Forgot password and reset functionality**
- Profile management

### Phase 3: Core Modules (Weeks 3-4)
- Patient management (CRUD)
- Appointment system (CRUD)
- Doctor dashboard
- Medical reports (CRUD)
- **Search and pagination implementation**

### Phase 4: Advanced Features (Weeks 5-6)
- Email notification system
- Billing and payment integration
- **Dashboard analytics with charts**
- **PDF generation for prescriptions and bills**

### Phase 5: Testing and Optimization (Week 7)
- API testing using Postman
- Frontend testing
- Performance optimization
- Bug fixing
- Security audit

### Phase 6: Deployment and Documentation (Week 8)
- Deployment on cloud platform (Render/Vercel/Railway)
- Final testing on production
- User documentation
- Code documentation
- Project presentation preparation

---

## 17. Technology Justification

### React
Used for building a dynamic and scalable frontend using reusable components and efficient state management. Provides excellent developer experience and performance.

### Node.js and Express
Used for building a fast and maintainable backend server with RESTful APIs. Non-blocking I/O makes it ideal for handling multiple concurrent requests.

### MongoDB
Used for flexible and scalable NoSQL data storage. Schema-less design allows for easy modifications during development. Excellent for handling complex nested data structures.

### JWT (JSON Web Tokens)
Used for secure authentication and role-based access control. Stateless authentication reduces server load and enables horizontal scaling.

### Nodemailer
Used for implementing automated email notifications. Supports multiple email services and provides reliable email delivery.

### Payment Gateway API (Razorpay/Stripe)
Used for handling secure online transactions. Industry-standard security and compliance. Easy integration with comprehensive documentation.

### Chart.js / Recharts
Used for creating interactive and responsive data visualizations. Lightweight and easy to integrate with React.

### PDFKit / jsPDF
Used for generating professional PDF documents on the server or client side. Supports custom layouts and styling.

### express-validator
Used for robust input validation and sanitization. Prevents common security vulnerabilities.

---

## 18. Assumptions and Constraints

### Assumptions
- Users have stable internet connection
- Modern web browsers are used (Chrome, Firefox, Edge, Safari)
- Email service (Gmail/SendGrid) is available for notifications
- Payment gateway sandbox/test mode is available for development
- Users have basic computer literacy

### Constraints
- **Development Timeline:** 8-9 weeks
- **Team Size:** Individual project
- **Budget:** Free tier services only (MongoDB Atlas, Render/Vercel, Gmail SMTP)
- **Scope:** Limited to core hospital management features
- **Data Privacy:** Basic security measures (not HIPAA compliant)

---

## 19. Expected Outcomes

- Fully functional role-based hospital management system
- Complete RESTful API coverage with ID-based access
- Automated email notifications for appointments and billing
- Secure online payment processing
- **Interactive dashboard with analytics and charts**
- **Search, filter, and pagination for efficient data management**
- **PDF generation for prescriptions and bills**
- **Secure password reset functionality**
- Scalable and secure full-stack architecture
- Industry-ready project suitable for placements and internships
- Comprehensive documentation and testing
- **Demonstrates advanced full-stack development skills**

---

## 20. Future Enhancements (Post-Submission)

- Mobile application using React Native
- Real-time notifications using WebSocket/Socket.io
- Telemedicine integration (video consultations)
- Lab test management module
- Inventory and pharmacy management
- Multi-language support (i18n)
- Advanced analytics with AI-based insights
- Integration with insurance providers

---

**Document Version:** 4.0 (Enhanced)  
**Last Updated:** February 2026  
**Prepared By:** [Your Name]  
**Course:** BTech CSE - Placement Enhancement Program (PEP)  
**Institution:** Lovely Professional University (LPU)
