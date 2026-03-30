const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth.middleware');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// ============================================
// @route   POST /api/registrations
// @desc    Full learner registration (single transaction)
// @access  Private (Admin, Principal, Admin Staff)
// ============================================

router.post('/', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  // Learner personal info
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').notEmpty().withMessage('Gender is required'),
  body('currentGrade').notEmpty().withMessage('Grade is required'),
  body('admissionDate').isISO8601().withMessage('Valid admission date is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      // User / Learner identity
      email,
      firstName,
      lastName,
      phone,
      idNumber,
      passportNumber,
      preferredName,
      dateOfBirth,
      gender,
      nationality = 'South African',
      race,
      homeLanguage,
      additionalLanguages = [],
      religion,

      // Address
      address,
      suburb,
      city,
      province,
      postalCode,
      postalAddress,
      secondaryPhone,
      secondaryEmail,

      // Academic
      currentGrade,
      gradeApplyingFor,
      yearOfAdmission,
      admissionDate,
      previousSchool,
      previousSchoolEmis,
      transferCardReceived = false,
      reasonForLeaving,
      lastGradePassed,
      repeatingGrade = false,
      classId,
      lolt,
      assessmentAccommodations,

      // Medical
      medicalAidName,
      medicalAidNumber,
      doctorName,
      doctorPhone,
      medicalConditions,
      allergies,
      chronicIllnesses,
      disabilities,
      medications,
      bloodType,
      dietaryRequirements,
      emergencyTreatmentConsent = false,

      // Special Needs
      learningBarriers,
      iepRequired = false,
      psychologicalAssessments,
      supportServices,

      // Financial
      feeCategory = 'Standard',
      feeExemption = false,
      exemptionReason,
      householdIncomeBracket,
      parentEmploymentStatus,
      billingContact,
      paymentPlan,
      accountNumber,

      // Transport
      transportRequired = false,
      transportPickupAddress,
      transportDropoffAddress,
      transportProvider,
      transportRouteNumber,

      // Guardians array
      guardians = [],

      // Emergency contacts array
      emergencyContacts = [],

      // Consents
      consents = {},
    } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Generate admission number
    const studentCount = await prisma.student.count({ where: { institutionId: req.user.institutionId } });
    const admissionNumber = `STU${new Date().getFullYear()}${String(studentCount + 1).padStart(4, '0')}`;

    // Default password
    const rawId = idNumber || passportNumber || 'Student123';
    const defaultPassword = rawId.slice(-6) || 'Student123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Derive primary guardian fields for legacy compatibility
    const primaryGuardian = guardians.find(g => g.isPrimaryGuardian) || guardians[0];

    // Create everything in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          idNumber,
          role: 'STUDENT',
          institutionId: req.user.institutionId,
        },
      });

      // 2. Create Student
      const student = await tx.student.create({
        data: {
          userId: user.id,
          institutionId: req.user.institutionId,
          admissionNumber,
          admissionDate: new Date(admissionDate),
          passportNumber,
          preferredName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          nationality,
          race,
          homeLanguage,
          additionalLanguages,
          religion,
          address,
          suburb,
          city,
          province,
          postalCode,
          postalAddress,
          secondaryPhone,
          secondaryEmail,
          currentGrade,
          gradeApplyingFor,
          yearOfAdmission: yearOfAdmission ? parseInt(yearOfAdmission) : null,
          previousSchool,
          previousSchoolEmis,
          transferCardReceived,
          reasonForLeaving,
          lastGradePassed,
          repeatingGrade,
          classId,
          lolt,
          assessmentAccommodations,
          medicalAidName,
          medicalAidNumber,
          doctorName,
          doctorPhone,
          medicalConditions,
          allergies,
          chronicIllnesses,
          disabilities,
          medications,
          bloodType,
          dietaryRequirements,
          emergencyTreatmentConsent,
          learningBarriers,
          iepRequired,
          psychologicalAssessments,
          supportServices,
          feeCategory,
          feeExemption,
          exemptionReason,
          householdIncomeBracket,
          parentEmploymentStatus,
          billingContact,
          paymentPlan,
          accountNumber,
          transportRequired,
          transportPickupAddress,
          transportDropoffAddress,
          transportProvider,
          transportRouteNumber,
          capturedById: req.user.id,
          // Legacy single-guardian fields
          guardianName: primaryGuardian ? `${primaryGuardian.firstName} ${primaryGuardian.lastName}` : undefined,
          guardianPhone: primaryGuardian?.mobilePhone || undefined,
          guardianEmail: primaryGuardian?.email || undefined,
          guardianRelation: primaryGuardian?.relationship || undefined,
          emergencyContact: emergencyContacts[0]?.fullName || undefined,
          emergencyPhone: emergencyContacts[0]?.primaryPhone || undefined,
          status: 'ACTIVE',
        },
      });

      // 3. Create Guardians
      if (guardians.length > 0) {
        await tx.guardian.createMany({
          data: guardians.map(g => ({
            studentId: student.id,
            firstName: g.firstName,
            lastName: g.lastName,
            idNumber: g.idNumber,
            passportNumber: g.passportNumber,
            relationship: g.relationship,
            isPrimaryGuardian: g.isPrimaryGuardian || false,
            livesWithLearner: g.livesWithLearner !== undefined ? g.livesWithLearner : true,
            hasLegalCustody: g.hasLegalCustody || false,
            courtOrderReference: g.courtOrderReference,
            mobilePhone: g.mobilePhone,
            workPhone: g.workPhone,
            email: g.email,
            occupation: g.occupation,
            employer: g.employer,
          })),
        });
      }

      // 4. Create Emergency Contacts
      if (emergencyContacts.length > 0) {
        await tx.emergencyContact.createMany({
          data: emergencyContacts.map(ec => ({
            studentId: student.id,
            fullName: ec.fullName,
            relationship: ec.relationship,
            primaryPhone: ec.primaryPhone,
            alternatePhone: ec.alternatePhone,
            alternateContact: ec.alternateContact,
          })),
        });
      }

      // 5. Create Consents
      const consentEntries = [];
      const consentTypes = ['POPIA', 'MEDIA', 'CODE_OF_CONDUCT', 'INDEMNITY', 'ICT_POLICY'];
      for (const ct of consentTypes) {
        if (consents[ct] !== undefined) {
          consentEntries.push({
            studentId: student.id,
            consentType: ct,
            granted: Boolean(consents[ct]),
            grantedBy: consents[`${ct}_grantedBy`] || (primaryGuardian ? `${primaryGuardian?.firstName} ${primaryGuardian?.lastName}` : null),
            grantedAt: consents[ct] ? new Date() : null,
          });
        }
      }
      if (consentEntries.length > 0) {
        await tx.studentConsent.createMany({ data: consentEntries });
      }

      // 6. Audit log
      await tx.registrationAuditLog.create({
        data: {
          studentId: student.id,
          action: 'REGISTRATION_CREATED',
          newValue: `Admission: ${admissionNumber}`,
          performedById: req.user.id,
          performedByName: `${req.user.firstName} ${req.user.lastName}`,
        },
      });

      return student;
    });

    // Return full dossier
    const dossier = await _getRegistrationDossier(result.id);

    res.status(201).json({
      success: true,
      data: dossier,
      message: 'Learner registered successfully',
      defaultPassword,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/registrations/:studentId
// @desc    Get full registration dossier for a student
// @access  Private
// ============================================

router.get('/:studentId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const dossier = await _getRegistrationDossier(req.params.studentId);
    if (!dossier) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    res.json({ success: true, data: dossier });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/registrations/:studentId
// @desc    Update registration details
// @access  Private (Admin, Principal, Admin Staff)
// ============================================

router.put('/:studentId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const existing = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const {
      firstName, lastName, phone, preferredName, race, additionalLanguages, religion,
      address, suburb, city, province, postalCode, postalAddress, secondaryPhone, secondaryEmail,
      currentGrade, gradeApplyingFor, yearOfAdmission, previousSchool, previousSchoolEmis,
      transferCardReceived, reasonForLeaving, lastGradePassed, repeatingGrade, classId,
      lolt, assessmentAccommodations,
      medicalAidName, medicalAidNumber, doctorName, doctorPhone, medicalConditions, allergies,
      chronicIllnesses, disabilities, medications, bloodType, dietaryRequirements, emergencyTreatmentConsent,
      learningBarriers, iepRequired, psychologicalAssessments, supportServices,
      feeCategory, feeExemption, exemptionReason, householdIncomeBracket, parentEmploymentStatus,
      billingContact, paymentPlan, accountNumber,
      transportRequired, transportPickupAddress, transportDropoffAddress, transportProvider, transportRouteNumber,
      status,
    } = req.body;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existing.userId },
        data: { firstName, lastName, phone },
      });

      await tx.student.update({
        where: { id: studentId },
        data: {
          preferredName, race,
          additionalLanguages: additionalLanguages || undefined,
          religion,
          address, suburb, city, province, postalCode, postalAddress, secondaryPhone, secondaryEmail,
          currentGrade, gradeApplyingFor,
          yearOfAdmission: yearOfAdmission ? parseInt(yearOfAdmission) : undefined,
          previousSchool, previousSchoolEmis, transferCardReceived, reasonForLeaving, lastGradePassed, repeatingGrade,
          classId, lolt, assessmentAccommodations,
          medicalAidName, medicalAidNumber, doctorName, doctorPhone, medicalConditions, allergies,
          chronicIllnesses, disabilities, medications, bloodType, dietaryRequirements, emergencyTreatmentConsent,
          learningBarriers, iepRequired, psychologicalAssessments, supportServices,
          feeCategory, feeExemption, exemptionReason, householdIncomeBracket, parentEmploymentStatus,
          billingContact, paymentPlan, accountNumber,
          transportRequired, transportPickupAddress, transportDropoffAddress, transportProvider, transportRouteNumber,
          status,
        },
      });

      await tx.registrationAuditLog.create({
        data: {
          studentId,
          action: 'REGISTRATION_UPDATED',
          performedById: req.user.id,
          performedByName: `${req.user.firstName} ${req.user.lastName}`,
        },
      });
    });

    const dossier = await _getRegistrationDossier(studentId);
    res.json({ success: true, data: dossier, message: 'Registration updated successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/registrations/:studentId/guardians
// @desc    Add guardian to student
// @access  Private (Admin, Principal, Admin Staff)
// ============================================

router.post('/:studentId/guardians', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('relationship').notEmpty().withMessage('Relationship is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const guardian = await prisma.guardian.create({
      data: {
        studentId: req.params.studentId,
        ...req.body,
      },
    });

    res.status(201).json({ success: true, data: guardian });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   DELETE /api/registrations/:studentId/guardians/:guardianId
// @desc    Remove guardian from student
// @access  Private (Admin, Principal)
// ============================================

router.delete('/:studentId/guardians/:guardianId', protect, authorize('SUPER_ADMIN', 'PRINCIPAL'), async (req, res, next) => {
  try {
    await prisma.guardian.delete({ where: { id: req.params.guardianId } });
    res.json({ success: true, message: 'Guardian removed' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/registrations/:studentId/emergency-contacts
// @desc    Add emergency contact
// @access  Private (Admin, Principal, Admin Staff)
// ============================================

router.post('/:studentId/emergency-contacts', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('relationship').notEmpty().withMessage('Relationship is required'),
  body('primaryPhone').notEmpty().withMessage('Primary phone is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const contact = await prisma.emergencyContact.create({
      data: { studentId: req.params.studentId, ...req.body },
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   POST /api/registrations/:studentId/documents
// @desc    Upload document for a student
// @access  Private (Admin, Principal, Admin Staff)
// ============================================

router.post('/:studentId/documents', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { documentType, notes } = req.body;

    if (!req.files || !req.files.document) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file = req.files.document;
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents', studentId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const { v4: uuidv4 } = require('uuid');
    const safeFileName = `${Date.now()}_${uuidv4()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFileName);
    await file.mv(filePath);

    const fileUrl = `/uploads/documents/${studentId}/${safeFileName}`;

    const doc = await prisma.studentDocument.create({
      data: {
        studentId,
        documentType: documentType || 'OTHER',
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        notes,
      },
    });

    await prisma.registrationAuditLog.create({
      data: {
        studentId,
        action: 'DOCUMENT_UPLOADED',
        newValue: `${documentType}: ${file.name}`,
        performedById: req.user.id,
        performedByName: `${req.user.firstName} ${req.user.lastName}`,
      },
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/registrations/:studentId/documents
// @desc    List documents for a student
// @access  Private
// ============================================

router.get('/:studentId/documents', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const docs = await prisma.studentDocument.findMany({
      where: { studentId: req.params.studentId },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json({ success: true, data: docs });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PATCH /api/registrations/:studentId/documents/:docId/verify
// @desc    Update document verification status
// @access  Private (Admin, Principal)
// ============================================

router.patch('/:studentId/documents/:docId/verify', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), [
  body('verificationStatus').isIn(['PENDING', 'VERIFIED', 'REJECTED']).withMessage('Invalid status'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { verificationStatus, notes } = req.body;
    const doc = await prisma.studentDocument.update({
      where: { id: req.params.docId },
      data: {
        verificationStatus,
        verifiedById: req.user.id,
        verifiedAt: new Date(),
        notes,
      },
    });
    res.json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   PUT /api/registrations/:studentId/consents
// @desc    Update consents for a student
// @access  Private (Admin, Principal, Admin Staff)
// ============================================

router.put('/:studentId/consents', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const consents = req.body; // { POPIA: true, MEDIA: false, ... }

    const consentTypes = ['POPIA', 'MEDIA', 'CODE_OF_CONDUCT', 'INDEMNITY', 'ICT_POLICY'];
    for (const ct of consentTypes) {
      if (consents[ct] !== undefined) {
        await prisma.studentConsent.upsert({
          where: { studentId_consentType: { studentId, consentType: ct } },
          update: { granted: Boolean(consents[ct]), grantedAt: consents[ct] ? new Date() : null },
          create: { studentId, consentType: ct, granted: Boolean(consents[ct]), grantedAt: consents[ct] ? new Date() : null },
        });
      }
    }

    const updated = await prisma.studentConsent.findMany({ where: { studentId } });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// ============================================
// @route   GET /api/registrations/:studentId/audit
// @desc    Get audit log for a student registration
// @access  Private (Admin, Principal)
// ============================================

router.get('/:studentId/audit', protect, authorize('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN_STAFF'), async (req, res, next) => {
  try {
    const logs = await prisma.registrationAuditLog.findMany({
      where: { studentId: req.params.studentId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

// ============================================
// HELPER: Get full registration dossier
// ============================================

async function _getRegistrationDossier(studentId) {
  return prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, phone: true, idNumber: true, avatar: true, isActive: true },
      },
      class: true,
      guardians: true,
      emergencyContacts: true,
      documents: { orderBy: { uploadedAt: 'desc' } },
      consents: true,
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      enrollments: { include: { subject: true, class: true } },
    },
  });
}

module.exports = router;
