-- COPY THIS ENTIRE BLOCK
-- Go to Supabase Dashboard -> SQL Editor
-- Paste and Run

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_conversations' AND column_name = 'subject_id') THEN
        ALTER TABLE ai_conversations ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
        RAISE NOTICE 'Fixed: Added subject_id column';
    ELSE
        RAISE NOTICE 'Already Fixed: subject_id column exists';
    END IF;
END $$;
