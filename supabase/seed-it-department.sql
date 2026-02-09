-- Seed Data: Add IT Department with Years and Semesters
-- Run this after setup-fresh.sql

-- Insert IT Department
INSERT INTO departments (name, code, description) 
VALUES ('Information Technology', 'IT', 'Bachelor of Science in Information Technology')
ON CONFLICT (code) DO NOTHING;

-- Get the department ID and create years
DO $$
DECLARE
  dept_id UUID;
  fy_id UUID;
  sy_id UUID;
  ty_id UUID;
BEGIN
  SELECT id INTO dept_id FROM departments WHERE code = 'IT';
  
  IF dept_id IS NOT NULL THEN
    -- Create years
    INSERT INTO years (department_id, name, code, order_index) 
    VALUES (dept_id, 'First Year', 'FY', 1) 
    ON CONFLICT DO NOTHING
    RETURNING id INTO fy_id;
    
    INSERT INTO years (department_id, name, code, order_index) 
    VALUES (dept_id, 'Second Year', 'SY', 2) 
    ON CONFLICT DO NOTHING
    RETURNING id INTO sy_id;
    
    INSERT INTO years (department_id, name, code, order_index) 
    VALUES (dept_id, 'Third Year', 'TY', 3) 
    ON CONFLICT DO NOTHING
    RETURNING id INTO ty_id;
    
    -- Get IDs if they already existed
    IF fy_id IS NULL THEN SELECT id INTO fy_id FROM years WHERE department_id = dept_id AND code = 'FY'; END IF;
    IF sy_id IS NULL THEN SELECT id INTO sy_id FROM years WHERE department_id = dept_id AND code = 'SY'; END IF;
    IF ty_id IS NULL THEN SELECT id INTO ty_id FROM years WHERE department_id = dept_id AND code = 'TY'; END IF;
    
    -- Create semesters for each year
    IF fy_id IS NOT NULL THEN
      INSERT INTO semesters (year_id, name, code, order_index) VALUES (fy_id, 'Semester 1', 'SEM1', 1) ON CONFLICT DO NOTHING;
      INSERT INTO semesters (year_id, name, code, order_index) VALUES (fy_id, 'Semester 2', 'SEM2', 2) ON CONFLICT DO NOTHING;
    END IF;
    
    IF sy_id IS NOT NULL THEN
      INSERT INTO semesters (year_id, name, code, order_index) VALUES (sy_id, 'Semester 1', 'SEM1', 1) ON CONFLICT DO NOTHING;
      INSERT INTO semesters (year_id, name, code, order_index) VALUES (sy_id, 'Semester 2', 'SEM2', 2) ON CONFLICT DO NOTHING;
    END IF;
    
    IF ty_id IS NOT NULL THEN
      INSERT INTO semesters (year_id, name, code, order_index) VALUES (ty_id, 'Semester 1', 'SEM1', 1) ON CONFLICT DO NOTHING;
      INSERT INTO semesters (year_id, name, code, order_index) VALUES (ty_id, 'Semester 2', 'SEM2', 2) ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'IT Department with years and semesters created successfully!';
  END IF;
END $$;

SELECT 'IT Department seed data added!' as status;
