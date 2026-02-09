-- Add AI Chat History table for storing student conversations
-- This version works standalone without foreign key dependencies

CREATE TABLE IF NOT EXISTS ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON ai_chat_history(user_id);

-- Create uploaded_pdfs table if not exists
CREATE TABLE IF NOT EXISTS uploaded_pdfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject_id UUID,
    type TEXT DEFAULT 'pyq', -- 'pyq' or 'book'
    year INTEGER,
    exam_type TEXT,
    author TEXT,
    file_url TEXT,
    text_content TEXT, -- Extracted text for AI training
    uploaded_by UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_uploaded_pdfs_subject ON uploaded_pdfs(subject_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_pdfs_type ON uploaded_pdfs(type);

-- Enable RLS
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_pdfs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (simplified for development)
DROP POLICY IF EXISTS "Allow all ai_chat_history" ON ai_chat_history;
CREATE POLICY "Allow all ai_chat_history" ON ai_chat_history FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all uploaded_pdfs" ON uploaded_pdfs;
CREATE POLICY "Allow all uploaded_pdfs" ON uploaded_pdfs FOR ALL USING (true);
