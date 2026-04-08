-- Migration: Remove recurrence fields from timetable_slots
-- Generated: 2026-04-08
-- Description: Scheduling is now determined solely by dayOfWeek and periodNumber.
--              recurrenceType, startDate and endDate are no longer used.

ALTER TABLE "timetable_slots" DROP COLUMN IF EXISTS "recurrenceType";
ALTER TABLE "timetable_slots" DROP COLUMN IF EXISTS "startDate";
ALTER TABLE "timetable_slots" DROP COLUMN IF EXISTS "endDate";
