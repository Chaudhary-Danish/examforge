-- Subject-specific AI Chat History Tables
-- Run this in Supabase SQL Editor

-- Subject Conversations Table
CREATE TABLE IF NOT EXISTS subject_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Chat',
    preview TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subject Chat Messages Table
CREATE TABLE IF NOT EXISTS subject_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES subject_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subject_conv_user ON subject_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_subject_conv_subject ON subject_conversations(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_conv_created ON subject_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subject_msg_conv ON subject_chat_messages(conversation_id);

-- RLS Policies
ALTER TABLE subject_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subject conversations
CREATE POLICY "Users view own subject conversations" ON subject_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create subject conversations" ON subject_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own subject conversations" ON subject_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Users can manage their own messages
CREATE POLICY "Users view own subject messages" ON subject_chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create subject messages" ON subject_chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);
