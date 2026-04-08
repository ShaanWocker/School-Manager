-- AlterTable
ALTER TABLE "timetable_slots" ADD COLUMN "recurrenceType" TEXT NOT NULL DEFAULT 'weekly';
ALTER TABLE "timetable_slots" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "timetable_slots" ADD COLUMN "endDate" TIMESTAMP(3);
