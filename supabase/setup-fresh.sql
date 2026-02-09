-- ExamForge Complete Database Setup v2
-- Run this SINGLE file in Supabase SQL Editor
-- ================================================================

-- ============ STEP 1: CREATE TABLES ============
-- Using CREATE OR REPLACE pattern - drops and recreates

-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS ai_conversations;
DROP TABLE IF EXISTS uploaded_pdfs;
DROP TABLE IF EXISTS notice_reads;
DROP TABLE IF EXISTS notices;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS admin;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS semesters;
DROP TABLE IF EXISTS years;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS schema_migrations;

-- Drop function (triggers are dropped with tables)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- DEPARTMENTS
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- YEARS (FY, SY, TY per department)
CREATE TABLE years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEMESTERS (SEM1, SEM2 per year)
CREATE TABLE semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBJECTS (belongs to semester)
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADMIN
CREATE TABLE admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDENTS
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT UNIQUE,
  department_id UUID REFERENCES departments(id),
  year_id UUID REFERENCES years(id),
  semester_id UUID REFERENCES semesters(id),
  profile_picture TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTICES
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  department_id UUID REFERENCES departments(id),
  year_id UUID REFERENCES years(id),
  semester_id UUID REFERENCES semesters(id),
  is_urgent BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES admin(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTICE READS
CREATE TABLE notice_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notice_id, student_id)
);

-- UPLOADED PDFs
CREATE TABLE uploaded_pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  semester_id UUID REFERENCES semesters(id),
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('book', 'pyq', 'notes', 'image')) NOT NULL,
  year INTEGER,
  exam_type TEXT,
  author TEXT,
  file_url TEXT,
  file_key TEXT,
  file_size_bytes BIGINT,
  extracted_text TEXT,
  is_processed BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI CONVERSATIONS
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ STEP 2: CREATE INDEXES ============
CREATE INDEX idx_years_department ON years(department_id);
CREATE INDEX idx_semesters_year ON semesters(year_id);
CREATE INDEX idx_subjects_semester ON subjects(semester_id);
CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_notices_department ON notices(department_id);
CREATE INDEX idx_notice_reads_student ON notice_reads(student_id);
CREATE INDEX idx_uploaded_pdfs_subject ON uploaded_pdfs(subject_id);

-- ============ STEP 3: ENABLE RLS ============
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Service role policies (full access)
CREATE POLICY "Service role access" ON departments FOR ALL USING (true);
CREATE POLICY "Service role access" ON years FOR ALL USING (true);
CREATE POLICY "Service role access" ON semesters FOR ALL USING (true);
CREATE POLICY "Service role access" ON subjects FOR ALL USING (true);
CREATE POLICY "Service role access" ON students FOR ALL USING (true);
CREATE POLICY "Service role access" ON admin FOR ALL USING (true);
CREATE POLICY "Service role access" ON notices FOR ALL USING (true);
CREATE POLICY "Service role access" ON notice_reads FOR ALL USING (true);
CREATE POLICY "Service role access" ON uploaded_pdfs FOR ALL USING (true);
CREATE POLICY "Service role access" ON ai_conversations FOR ALL USING (true);

-- ============ STEP 4: CREATE TRIGGERS ============
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ DONE ============
SELECT 'ExamForge database setup complete!' as status;
