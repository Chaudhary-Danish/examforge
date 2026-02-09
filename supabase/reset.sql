-- ExamForge Database Reset Script
-- WARNING: This will DELETE ALL DATA. Only use for fresh installs.
-- ================================================================

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS uploaded_pdfs CASCADE;
DROP TABLE IF EXISTS notice_reads CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;
DROP TABLE IF EXISTS years CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop any RLS policies (they'll be recreated)
-- Note: Policies are automatically dropped with tables

-- Success
SELECT 'Database reset complete. Now run schema.sql' as status;
