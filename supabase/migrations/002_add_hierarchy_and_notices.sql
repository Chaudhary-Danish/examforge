-- ExamForge Migration: v1 to v2
-- Adds hierarchical department structure (years, semesters) and notices system
-- Safe to run on existing databases with data
-- ================================================================

-- Create schema_migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check if already applied
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = 2) THEN
    RAISE NOTICE 'Migration v2 already applied, skipping';
    RETURN;
  END IF;

  -- ===========================================
  -- Create new tables if not exist
  -- ===========================================
  
  -- Years table
  CREATE TABLE IF NOT EXISTS years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Semesters table
  CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_id UUID REFERENCES years(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Notices table
  CREATE TABLE IF NOT EXISTS notices (
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

  -- Notice reads table
  CREATE TABLE IF NOT EXISTS notice_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notice_id, student_id)
  );

  -- ===========================================
  -- Add new columns to existing tables
  -- ===========================================

  -- Add semester_id to subjects
  ALTER TABLE subjects ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE;

  -- Add new columns to students for permanent auth
  ALTER TABLE students ADD COLUMN IF NOT EXISTS password TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS student_id TEXT UNIQUE;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
  ALTER TABLE students ADD COLUMN IF NOT EXISTS year_id UUID REFERENCES years(id);
  ALTER TABLE students ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id);
  ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_picture TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS bio TEXT;

  -- Add semester_id to uploaded_pdfs
  ALTER TABLE uploaded_pdfs ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id);

  -- Update type check constraint to include 'image'
  ALTER TABLE uploaded_pdfs DROP CONSTRAINT IF EXISTS uploaded_pdfs_type_check;
  ALTER TABLE uploaded_pdfs ADD CONSTRAINT uploaded_pdfs_type_check 
    CHECK (type IN ('book', 'pyq', 'notes', 'image'));

  -- ===========================================
  -- Create indexes
  -- ===========================================
  CREATE INDEX IF NOT EXISTS idx_years_department ON years(department_id);
  CREATE INDEX IF NOT EXISTS idx_semesters_year ON semesters(year_id);
  CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester_id);
  CREATE INDEX IF NOT EXISTS idx_students_department ON students(department_id);
  CREATE INDEX IF NOT EXISTS idx_notices_department ON notices(department_id);
  CREATE INDEX IF NOT EXISTS idx_notice_reads_student ON notice_reads(student_id);

  -- ===========================================
  -- Enable RLS on new tables
  -- ===========================================
  ALTER TABLE years ENABLE ROW LEVEL SECURITY;
  ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;

  -- Create policies for new tables
  CREATE POLICY "Service role access" ON years FOR ALL USING (true);
  CREATE POLICY "Service role access" ON semesters FOR ALL USING (true);
  CREATE POLICY "Service role access" ON notices FOR ALL USING (true);
  CREATE POLICY "Service role access" ON notice_reads FOR ALL USING (true);

  -- Record migration
  INSERT INTO schema_migrations (version, name) VALUES (2, 'add_hierarchical_structure_and_notices');
  
  RAISE NOTICE 'Migration v2 applied successfully';
END $$;
