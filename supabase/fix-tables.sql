-- Quick fix for uploaded_pdfs and AI chat
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS ai_chat_history CASCADE;
DROP TABLE IF EXISTS uploaded_pdfs CASCADE;

-- Create uploaded_pdfs table
CREATE TABLE uploaded_pdfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject_id UUID,
    type TEXT DEFAULT 'pyq',
    year INTEGER,
    exam_type TEXT,
    author TEXT,
    file_url TEXT,
    text_content TEXT,
    uploaded_by UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI chat history table
CREATE TABLE ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_uploaded_pdfs_subject ON uploaded_pdfs(subject_id);
CREATE INDEX idx_uploaded_pdfs_type ON uploaded_pdfs(type);
CREATE INDEX idx_ai_chat_history_user_id ON ai_chat_history(user_id);

-- Enable RLS
ALTER TABLE uploaded_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (for development)
CREATE POLICY "Allow all uploaded_pdfs" ON uploaded_pdfs FOR ALL USING (true);
CREATE POLICY "Allow all ai_chat_history" ON ai_chat_history FOR ALL USING (true);

-- Verify tables created
SELECT 'uploaded_pdfs created' as status, count(*) as rows FROM uploaded_pdfs
UNION ALL
SELECT 'ai_chat_history created' as status, count(*) as rows FROM ai_chat_history;
