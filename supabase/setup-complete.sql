-- MASTER SETUP SCRIPT for ExamForge - V3 (Custom Auth Compatible)
-- Run this in Supabase SQL Editor to fix ALL database issues.
-- This version removes "REFERENCES users(id)" because you use custom 'students'/'admin' tables.

-- ==========================================
-- 0. CLEANUP (Drop broken tables to start fresh)
-- ==========================================
DROP TABLE IF EXISTS ai_chat_history CASCADE;
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS subject_chat_messages CASCADE;
DROP TABLE IF EXISTS subject_conversations CASCADE;
DROP TABLE IF EXISTS notice_reactions CASCADE;
-- We do NOT drop uploaded_pdfs to preserve data, but we will ensure columns exist.

-- ==========================================
-- 1. AI Conversations (Main Chat)
-- ==========================================
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- No Foreign Key (works for students & admins)
    title TEXT DEFAULT 'New Chat',
    preview TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- No Foreign Key
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_chat_history_conv ON ai_chat_history(conversation_id);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for Service Role usage, but keeping structure)
CREATE POLICY "Users view own conversations" ON ai_conversations FOR SELECT USING (true); -- Logic handled in API
CREATE POLICY "Users create own conversations" ON ai_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users delete own conversations" ON ai_conversations FOR DELETE USING (true);
CREATE POLICY "Users update own conversations" ON ai_conversations FOR UPDATE USING (true);
CREATE POLICY "Users view own chat history" ON ai_chat_history FOR SELECT USING (true);
CREATE POLICY "Users create chat messages" ON ai_chat_history FOR INSERT WITH CHECK (true);

-- ==========================================
-- 2. Subject Conversations (Subject Chat)
-- ==========================================
CREATE TABLE subject_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- No Foreign Key
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Chat',
    preview TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subject_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES subject_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- No Foreign Key
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subject_conv_user ON subject_conversations(user_id);
CREATE INDEX idx_subject_conv_subject ON subject_conversations(subject_id);
CREATE INDEX idx_subject_msg_conv ON subject_chat_messages(conversation_id);

ALTER TABLE subject_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subject conversations" ON subject_conversations FOR SELECT USING (true);
CREATE POLICY "Users create subject conversations" ON subject_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users delete own subject conversations" ON subject_conversations FOR DELETE USING (true);
CREATE POLICY "Users update own subject conversations" ON subject_conversations FOR UPDATE USING (true);
CREATE POLICY "Users view own subject messages" ON subject_chat_messages FOR SELECT USING (true);
CREATE POLICY "Users create subject messages" ON subject_chat_messages FOR INSERT WITH CHECK (true);

-- ==========================================
-- 3. Uploaded PDFs (Ensure Structure)
-- ==========================================
CREATE TABLE IF NOT EXISTS uploaded_pdfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    type TEXT DEFAULT 'pyq',
    year INTEGER,
    exam_type TEXT,
    author TEXT,
    file_url TEXT,
    text_content TEXT,
    uploaded_by UUID, -- No Foreign Key
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist (idempotent)
DO $$
BEGIN
    ALTER TABLE uploaded_pdfs ADD COLUMN IF NOT EXISTS text_content TEXT;
    ALTER TABLE uploaded_pdfs ADD COLUMN IF NOT EXISTS file_url TEXT;
    ALTER TABLE uploaded_pdfs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    -- Try to drop constraint if it exists (might fail if name differs, but okay to ignore)
    ALTER TABLE uploaded_pdfs DROP CONSTRAINT IF EXISTS uploaded_pdfs_uploaded_by_fkey;
EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Constraint drop failed or column exists';
END $$;

CREATE INDEX IF NOT EXISTS idx_uploaded_pdfs_subject ON uploaded_pdfs(subject_id);

ALTER TABLE uploaded_pdfs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all uploaded_pdfs" ON uploaded_pdfs;
CREATE POLICY "Allow all uploaded_pdfs" ON uploaded_pdfs FOR ALL USING (true);

-- ==========================================
-- 4. Notice Reactions
-- ==========================================
CREATE TABLE notice_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- No Foreign Key
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notice_id, user_id, emoji)
);

ALTER TABLE notice_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view reactions" ON notice_reactions FOR SELECT USING (true);
CREATE POLICY "Users add reactions" ON notice_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users remove own reactions" ON notice_reactions FOR DELETE USING (true);
