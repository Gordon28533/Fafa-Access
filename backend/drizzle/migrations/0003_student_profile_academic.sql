-- Migration 0003: Student Profile Academic Info
-- This migration adds academic information fields to student profiles

ALTER TABLE "student_profiles" ADD COLUMN "academic_year" varchar(50);
ALTER TABLE "student_profiles" ADD COLUMN "field_of_study" varchar(255);
ALTER TABLE "student_profiles" ADD COLUMN "gpa" decimal(3,2);
ALTER TABLE "student_profiles" ADD COLUMN "index_number" varchar(50);
