-- Migration: Initial Schema
-- Generated: 2026-01-01
-- Description: Creates all base tables for the EduManage SA school management system.

-- Enums
CREATE TYPE "Role" AS ENUM (
  'SUPER_ADMIN',
  'PRINCIPAL',
  'TEACHER',
  'STUDENT',
  'PARENT',
  'FINANCE_OFFICER',
  'ADMIN_STAFF',
  'LIBRARIAN',
  'SGB_MEMBER',
  'TRANSPORT_MANAGER'
);

CREATE TYPE "StudentStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'GRADUATED',
  'TRANSFERRED',
  'EXPELLED',
  'SUSPENDED'
);

CREATE TYPE "TeacherStatus" AS ENUM (
  'ACTIVE',
  'ON_LEAVE',
  'RESIGNED',
  'RETIRED',
  'TERMINATED'
);

CREATE TYPE "AssignmentType" AS ENUM (
  'HOMEWORK',
  'PROJECT',
  'ESSAY',
  'QUIZ',
  'PRESENTATION'
);

CREATE TYPE "SubmissionStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'GRADED',
  'RETURNED'
);

CREATE TYPE "QuestionType" AS ENUM (
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'FILL_BLANK',
  'SHORT_ANSWER',
  'ESSAY'
);

CREATE TYPE "DiscussionCategory" AS ENUM (
  'QUESTION',
  'STUDY_GROUP',
  'GROUP_PROJECT',
  'ANNOUNCEMENT',
  'GENERAL'
);

CREATE TYPE "AttendanceStatus" AS ENUM (
  'PRESENT',
  'ABSENT',
  'LATE',
  'EXCUSED',
  'SICK'
);

CREATE TYPE "FeeType" AS ENUM (
  'TUITION',
  'REGISTRATION',
  'EXAM',
  'TRANSPORT',
  'LIBRARY',
  'ACTIVITY',
  'OTHER'
);

CREATE TYPE "PaymentMethod" AS ENUM (
  'CASH',
  'EFT',
  'CARD',
  'MOBILE_MONEY',
  'CHEQUE'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE "Priority" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

CREATE TYPE "BorrowStatus" AS ENUM (
  'BORROWED',
  'RETURNED',
  'OVERDUE',
  'LOST'
);

-- institutions
CREATE TABLE "institutions" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "emisNumber" TEXT,
  "province" TEXT NOT NULL,
  "district" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "principal" TEXT,
  "foundedDate" TIMESTAMP(3),
  "logo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "institutions_emisNumber_key" ON "institutions"("emisNumber");

-- users
CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "avatar" TEXT,
  "phone" TEXT,
  "idNumber" TEXT,
  "institutionId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLogin" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_idNumber_key" ON "users"("idNumber");

-- students
CREATE TABLE "students" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "admissionNumber" TEXT NOT NULL,
  "admissionDate" TIMESTAMP(3) NOT NULL,
  -- Personal Information
  "emisNumber" TEXT,
  "preferredName" TEXT,
  "dateOfBirth" TIMESTAMP(3) NOT NULL,
  "gender" TEXT NOT NULL,
  "nationality" TEXT NOT NULL DEFAULT 'South African',
  "race" TEXT,
  "homeLanguage" TEXT,
  "additionalLanguages" TEXT[] NOT NULL DEFAULT '{}',
  "religion" TEXT,
  "passportNumber" TEXT,
  -- Contact Information
  "address" TEXT,
  "suburb" TEXT,
  "city" TEXT,
  "province" TEXT,
  "postalCode" TEXT,
  "postalAddress" TEXT,
  "secondaryPhone" TEXT,
  "secondaryEmail" TEXT,
  -- Guardian Information
  "guardianName" TEXT,
  "guardianPhone" TEXT,
  "guardianEmail" TEXT,
  "guardianRelation" TEXT,
  "emergencyContact" TEXT,
  "emergencyPhone" TEXT,
  -- Academic Information
  "currentGrade" TEXT NOT NULL,
  "gradeApplyingFor" TEXT,
  "yearOfAdmission" INTEGER,
  "previousSchool" TEXT,
  "previousSchoolEmis" TEXT,
  "transferCardReceived" BOOLEAN NOT NULL DEFAULT false,
  "reasonForLeaving" TEXT,
  "lastGradePassed" TEXT,
  "repeatingGrade" BOOLEAN NOT NULL DEFAULT false,
  "classId" TEXT,
  -- Curriculum
  "lolt" TEXT,
  "assessmentAccommodations" TEXT,
  -- Medical Information
  "medicalConditions" TEXT,
  "allergies" TEXT,
  "medications" TEXT,
  "bloodType" TEXT,
  "medicalAidName" TEXT,
  "medicalAidNumber" TEXT,
  "doctorName" TEXT,
  "doctorPhone" TEXT,
  "chronicIllnesses" TEXT,
  "disabilities" TEXT,
  "dietaryRequirements" TEXT,
  "emergencyTreatmentConsent" BOOLEAN NOT NULL DEFAULT false,
  -- Special Needs
  "learningBarriers" TEXT,
  "iepRequired" BOOLEAN NOT NULL DEFAULT false,
  "psychologicalAssessments" TEXT,
  "supportServices" TEXT,
  -- Financial Information
  "feeCategory" TEXT NOT NULL DEFAULT 'Standard',
  "feeExemption" BOOLEAN NOT NULL DEFAULT false,
  "exemptionReason" TEXT,
  "outstandingBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "householdIncomeBracket" TEXT,
  "parentEmploymentStatus" TEXT,
  "billingContact" TEXT,
  "paymentPlan" TEXT,
  "accountNumber" TEXT,
  -- Transport
  "transportRequired" BOOLEAN NOT NULL DEFAULT false,
  "transportPickupAddress" TEXT,
  "transportDropoffAddress" TEXT,
  "transportProvider" TEXT,
  "transportRouteNumber" TEXT,
  -- Admin
  "capturedById" TEXT,
  "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "students_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "students_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");
CREATE UNIQUE INDEX "students_admissionNumber_key" ON "students"("admissionNumber");

-- parents
CREATE TABLE "parents" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "occupation" TEXT,
  "employer" TEXT,
  "workPhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "parents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "parents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "parents_userId_key" ON "parents"("userId");

-- Parent-Student join table
CREATE TABLE "_ParentToStudent" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_ParentToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "parents"("id") ON DELETE CASCADE,
  CONSTRAINT "_ParentToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "students"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "_ParentToStudent_AB_unique" ON "_ParentToStudent"("A", "B");
CREATE INDEX "_ParentToStudent_B_index" ON "_ParentToStudent"("B");

-- teachers
CREATE TABLE "teachers" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "employeeNumber" TEXT NOT NULL,
  "saceNumber" TEXT,
  "qualifications" TEXT,
  "specialization" TEXT,
  "yearsExperience" INTEGER,
  "hireDate" TIMESTAMP(3) NOT NULL,
  "contractType" TEXT NOT NULL,
  "employmentStatus" TEXT NOT NULL DEFAULT 'Active',
  "salary" DECIMAL(10,2),
  "address" TEXT,
  "emergencyContact" TEXT,
  "emergencyPhone" TEXT,
  "status" "TeacherStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "teachers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "teachers_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "teachers_userId_key" ON "teachers"("userId");
CREATE UNIQUE INDEX "teachers_employeeNumber_key" ON "teachers"("employeeNumber");
CREATE UNIQUE INDEX "teachers_saceNumber_key" ON "teachers"("saceNumber");

-- classes
CREATE TABLE "classes" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "section" TEXT,
  "academicYear" INTEGER NOT NULL,
  "institutionId" TEXT NOT NULL,
  "classTeacherId" TEXT,
  "capacity" INTEGER NOT NULL DEFAULT 40,
  "room" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "classes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "classes_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE,
  CONSTRAINT "classes_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "classes_name_academicYear_institutionId_key" ON "classes"("name", "academicYear", "institutionId");

-- Add FK from students to classes (now classes exists)
ALTER TABLE "students" ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL;

-- subjects
CREATE TABLE "subjects" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "grade" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "isCore" BOOLEAN NOT NULL DEFAULT false,
  "credits" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subjects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subjects_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- subject_teachers
CREATE TABLE "subject_teachers" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subject_teachers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subject_teachers_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE,
  CONSTRAINT "subject_teachers_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "subject_teachers_teacherId_subjectId_academicYear_key" ON "subject_teachers"("teacherId", "subjectId", "academicYear");

-- enrollments
CREATE TABLE "enrollments" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER,
  "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE,
  CONSTRAINT "enrollments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "enrollments_studentId_subjectId_academicYear_key" ON "enrollments"("studentId", "subjectId", "academicYear");

-- lessons
CREATE TABLE "lessons" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "content" TEXT,
  "subjectId" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "term" INTEGER,
  "week" INTEGER,
  "pdfFiles" TEXT[] NOT NULL DEFAULT '{}',
  "videoUrls" TEXT[] NOT NULL DEFAULT '{}',
  "presentationUrls" TEXT[] NOT NULL DEFAULT '{}',
  "externalLinks" TEXT[] NOT NULL DEFAULT '{}',
  "duration" INTEGER,
  "createdById" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "publishedAt" TIMESTAMP(3),
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lessons_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lessons_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE,
  CONSTRAINT "lessons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id")
);

-- lesson_progress
CREATE TABLE "lesson_progress" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lesson_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "lesson_progress_studentId_lessonId_key" ON "lesson_progress"("studentId", "lessonId");

-- assignments
CREATE TABLE "assignments" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "instructions" TEXT,
  "subjectId" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "type" "AssignmentType" NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "maxGrade" DECIMAL(5,2) NOT NULL DEFAULT 100,
  "submissionType" TEXT NOT NULL,
  "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
  "isGroupAssignment" BOOLEAN NOT NULL DEFAULT false,
  "groupSize" INTEGER,
  "createdById" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE,
  CONSTRAINT "assignments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id")
);

-- assignment_submissions
CREATE TABLE "assignment_submissions" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fileUrls" TEXT[] NOT NULL DEFAULT '{}',
  "textContent" TEXT,
  "linkUrl" TEXT,
  "grade" DECIMAL(5,2),
  "feedback" TEXT,
  "gradedAt" TIMESTAMP(3),
  "gradedById" TEXT,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assignment_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE,
  CONSTRAINT "assignment_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "assignment_submissions_assignmentId_studentId_key" ON "assignment_submissions"("assignmentId", "studentId");

-- exams
CREATE TABLE "exams" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "subjectId" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "duration" INTEGER NOT NULL,
  "totalMarks" DECIMAL(5,2) NOT NULL DEFAULT 100,
  "passingMarks" DECIMAL(5,2) NOT NULL DEFAULT 50,
  "scheduledDate" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exams_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exams_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE,
  CONSTRAINT "exams_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id")
);

-- exam_questions
CREATE TABLE "exam_questions" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "questionNumber" INTEGER NOT NULL,
  "type" "QuestionType" NOT NULL,
  "question" TEXT NOT NULL,
  "options" TEXT[] NOT NULL DEFAULT '{}',
  "correctAnswer" TEXT,
  "marks" DECIMAL(5,2) NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exam_questions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "exam_questions_examId_questionNumber_key" ON "exam_questions"("examId", "questionNumber");

-- exam_attempts
CREATE TABLE "exam_attempts" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "answers" JSONB NOT NULL,
  "autoGradedScore" DECIMAL(5,2),
  "manualGradedScore" DECIMAL(5,2),
  "totalScore" DECIMAL(5,2),
  "feedback" TEXT,
  "status" TEXT NOT NULL DEFAULT 'InProgress',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exam_attempts_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE,
  CONSTRAINT "exam_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "exam_attempts_examId_studentId_key" ON "exam_attempts"("examId", "studentId");

-- discussions
CREATE TABLE "discussions" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" "DiscussionCategory" NOT NULL,
  "subjectId" TEXT,
  "authorId" TEXT NOT NULL,
  "isSolved" BOOLEAN NOT NULL DEFAULT false,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "discussions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "discussions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- discussion_replies
CREATE TABLE "discussion_replies" (
  "id" TEXT NOT NULL,
  "discussionId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "isAcceptedAnswer" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "discussion_replies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "discussion_replies_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "discussions"("id") ON DELETE CASCADE,
  CONSTRAINT "discussion_replies_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- attendance
CREATE TABLE "attendance" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "status" "AttendanceStatus" NOT NULL,
  "checkInTime" TIMESTAMP(3),
  "checkOutTime" TIMESTAMP(3),
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "attendance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE,
  CONSTRAINT "attendance_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "attendance_studentId_date_key" ON "attendance"("studentId", "date");

-- teacher_attendance
CREATE TABLE "teacher_attendance" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "status" "AttendanceStatus" NOT NULL,
  "checkInTime" TIMESTAMP(3),
  "checkOutTime" TIMESTAMP(3),
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "teacher_attendance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "teacher_attendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "teacher_attendance_teacherId_date_key" ON "teacher_attendance"("teacherId", "date");

-- grades
CREATE TABLE "grades" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "assessmentType" TEXT NOT NULL,
  "assessmentName" TEXT NOT NULL,
  "score" DECIMAL(5,2) NOT NULL,
  "maxScore" DECIMAL(5,2) NOT NULL,
  "percentage" DECIMAL(5,2) NOT NULL,
  "letterGrade" TEXT,
  "weight" DECIMAL(3,2),
  "remarks" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "grades_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "grades_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE
);

-- fees
CREATE TABLE "fees" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "feeType" "FeeType" NOT NULL,
  "grade" TEXT,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER,
  "dueDate" TIMESTAMP(3),
  "isCompulsory" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fees_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fees_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

-- payments
CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "referenceNumber" TEXT,
  "description" TEXT,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER,
  "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "payments_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "payments_referenceNumber_key" ON "payments"("referenceNumber");

-- timetables
CREATE TABLE "timetables" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "term" INTEGER NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "timetables_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "timetables_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

-- timetable_slots (base columns only; recurrenceType/startDate/endDate added by later migration)
CREATE TABLE "timetable_slots" (
  "id" TEXT NOT NULL,
  "timetableId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "periodNumber" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "room" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "timetable_slots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "timetable_slots_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "timetables"("id") ON DELETE CASCADE,
  CONSTRAINT "timetable_slots_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE,
  CONSTRAINT "timetable_slots_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE,
  CONSTRAINT "timetable_slots_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "timetable_slots_timetableId_dayOfWeek_periodNumber_classId_key" ON "timetable_slots"("timetableId", "dayOfWeek", "periodNumber", "classId");

-- announcements
CREATE TABLE "announcements" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "targetAudience" TEXT[] NOT NULL DEFAULT '{}',
  "targetGrades" TEXT[] NOT NULL DEFAULT '{}',
  "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  "publishedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "announcements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "announcements_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

-- sgb_members
CREATE TABLE "sgb_members" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "memberType" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "appointedDate" TIMESTAMP(3) NOT NULL,
  "termEndDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sgb_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sgb_members_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

-- library_books
CREATE TABLE "library_books" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "isbn" TEXT,
  "title" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "publisher" TEXT,
  "publicationYear" INTEGER,
  "category" TEXT NOT NULL,
  "subject" TEXT,
  "totalCopies" INTEGER NOT NULL DEFAULT 1,
  "availableCopies" INTEGER NOT NULL DEFAULT 1,
  "location" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Available',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "library_books_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "library_books_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "library_books_isbn_key" ON "library_books"("isbn");

-- library_borrows
CREATE TABLE "library_borrows" (
  "id" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "borrowDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "returnDate" TIMESTAMP(3),
  "status" "BorrowStatus" NOT NULL DEFAULT 'BORROWED',
  "fineAmount" DECIMAL(10,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "library_borrows_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "library_borrows_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "library_books"("id") ON DELETE CASCADE,
  CONSTRAINT "library_borrows_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE
);

-- transport_routes
CREATE TABLE "transport_routes" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "routeNumber" TEXT NOT NULL,
  "routeName" TEXT NOT NULL,
  "startPoint" TEXT NOT NULL,
  "endPoint" TEXT NOT NULL,
  "stops" TEXT[] NOT NULL DEFAULT '{}',
  "distance" DECIMAL(5,2),
  "estimatedTime" INTEGER,
  "vehicleNumber" TEXT,
  "driverName" TEXT,
  "driverPhone" TEXT,
  "capacity" INTEGER NOT NULL DEFAULT 40,
  "monthlyCost" DECIMAL(10,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transport_routes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transport_routes_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "transport_routes_routeNumber_key" ON "transport_routes"("routeNumber");

-- transport_assignments
CREATE TABLE "transport_assignments" (
  "id" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "pickupStop" TEXT NOT NULL,
  "dropoffStop" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transport_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transport_assignments_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transport_routes"("id") ON DELETE CASCADE,
  CONSTRAINT "transport_assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "transport_assignments_routeId_studentId_startDate_key" ON "transport_assignments"("routeId", "studentId", "startDate");
