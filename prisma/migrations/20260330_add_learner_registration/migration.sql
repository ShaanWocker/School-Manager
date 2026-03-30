-- Migration: Add Learner Registration models and extended Student fields
-- Generated: 2026-03-30
-- Description: Adds Guardian, EmergencyContact, StudentDocument, StudentConsent,
--              RegistrationAuditLog models and extends Student with comprehensive
--              SA Government school admission fields.

-- Enums
CREATE TYPE "DocumentType" AS ENUM (
  'BIRTH_CERTIFICATE',
  'LEARNER_ID',
  'GUARDIAN_ID',
  'PROOF_OF_RESIDENCE',
  'IMMUNISATION_CARD',
  'PREVIOUS_REPORT',
  'TRANSFER_LETTER',
  'COURT_ORDER',
  'MEDICAL_CERTIFICATE',
  'OTHER'
);

CREATE TYPE "DocumentVerificationStatus" AS ENUM (
  'PENDING',
  'VERIFIED',
  'REJECTED'
);

CREATE TYPE "ConsentType" AS ENUM (
  'POPIA',
  'MEDIA',
  'CODE_OF_CONDUCT',
  'INDEMNITY',
  'ICT_POLICY'
);

-- Extend students table with new fields
ALTER TABLE "students"
  ADD COLUMN IF NOT EXISTS "emisNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "preferredName" TEXT,
  ADD COLUMN IF NOT EXISTS "race" TEXT,
  ADD COLUMN IF NOT EXISTS "additionalLanguages" TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "passportNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "suburb" TEXT,
  ADD COLUMN IF NOT EXISTS "postalAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "secondaryPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "secondaryEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "gradeApplyingFor" TEXT,
  ADD COLUMN IF NOT EXISTS "yearOfAdmission" INTEGER,
  ADD COLUMN IF NOT EXISTS "previousSchoolEmis" TEXT,
  ADD COLUMN IF NOT EXISTS "transferCardReceived" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "reasonForLeaving" TEXT,
  ADD COLUMN IF NOT EXISTS "lastGradePassed" TEXT,
  ADD COLUMN IF NOT EXISTS "repeatingGrade" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lolt" TEXT,
  ADD COLUMN IF NOT EXISTS "assessmentAccommodations" TEXT,
  ADD COLUMN IF NOT EXISTS "medicalAidName" TEXT,
  ADD COLUMN IF NOT EXISTS "medicalAidNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "doctorName" TEXT,
  ADD COLUMN IF NOT EXISTS "doctorPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "chronicIllnesses" TEXT,
  ADD COLUMN IF NOT EXISTS "disabilities" TEXT,
  ADD COLUMN IF NOT EXISTS "dietaryRequirements" TEXT,
  ADD COLUMN IF NOT EXISTS "emergencyTreatmentConsent" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "learningBarriers" TEXT,
  ADD COLUMN IF NOT EXISTS "iepRequired" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "psychologicalAssessments" TEXT,
  ADD COLUMN IF NOT EXISTS "supportServices" TEXT,
  ADD COLUMN IF NOT EXISTS "householdIncomeBracket" TEXT,
  ADD COLUMN IF NOT EXISTS "parentEmploymentStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "billingContact" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentPlan" TEXT,
  ADD COLUMN IF NOT EXISTS "accountNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "transportRequired" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "transportPickupAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "transportDropoffAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "transportProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "transportRouteNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "capturedById" TEXT;

-- Guardians table
CREATE TABLE IF NOT EXISTS "guardians" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "idNumber" TEXT,
  "passportNumber" TEXT,
  "relationship" TEXT NOT NULL,
  "isPrimaryGuardian" BOOLEAN NOT NULL DEFAULT false,
  "livesWithLearner" BOOLEAN NOT NULL DEFAULT true,
  "hasLegalCustody" BOOLEAN NOT NULL DEFAULT false,
  "courtOrderReference" TEXT,
  "mobilePhone" TEXT,
  "workPhone" TEXT,
  "email" TEXT,
  "occupation" TEXT,
  "employer" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "guardians_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guardians_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE
);

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS "emergency_contacts" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "relationship" TEXT NOT NULL,
  "primaryPhone" TEXT NOT NULL,
  "alternatePhone" TEXT,
  "alternateContact" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "emergency_contacts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE
);

-- Student documents table
CREATE TABLE IF NOT EXISTS "student_documents" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "documentType" "DocumentType" NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" TEXT,
  "verificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "verifiedById" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "notes" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE
);

-- Student consents table
CREATE TABLE IF NOT EXISTS "student_consents" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "consentType" "ConsentType" NOT NULL,
  "granted" BOOLEAN NOT NULL DEFAULT false,
  "grantedBy" TEXT,
  "grantedAt" TIMESTAMP(3),
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "student_consents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_consents_studentId_consentType_key" UNIQUE ("studentId", "consentType"),
  CONSTRAINT "student_consents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE
);

-- Registration audit log table
CREATE TABLE IF NOT EXISTS "registration_audit_logs" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "fieldName" TEXT,
  "oldValue" TEXT,
  "newValue" TEXT,
  "performedById" TEXT NOT NULL,
  "performedByName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "registration_audit_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "registration_audit_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE
);
