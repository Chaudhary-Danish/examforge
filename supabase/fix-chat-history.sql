-- Fix for Chat History Not Saving
-- Run this in your Supabase SQL Editor

-- Allow users to update their own conversations (for title and preview)
CREATE POLICY "Users update own subject conversations" ON subject_conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Verify policies are active
SELECT * FROM pg_policies WHERE tablename = 'subject_conversations';
