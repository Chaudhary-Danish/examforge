import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        // Return a mock client for development without Supabase
        console.warn('Supabase credentials not found. Using mock client.')
        return null
    }

    return createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false
        }
    })
}

// Type definitions for database tables
export interface Subject {
    id: string
    name: string
    code: string
    description?: string
    created_at: string
    updated_at: string
}

export interface Student {
    id: string
    student_id: string
    full_name: string
    email: string
    password_hash: string
    is_active: boolean
    last_login?: string
    created_at: string
    updated_at: string
}

export interface Admin {
    id: string
    admin_id: string
    full_name: string
    email: string
    password_hash: string
    created_at: string
}

export interface PYQ {
    id: string
    subject_id: string
    title: string
    exam_type: 'final' | 'mid-semester' | 'quiz' | 'assignment'
    year: number
    month?: string
    file_url: string
    file_key: string
    file_size_bytes?: number
    download_count: number
    view_count: number
    uploaded_at: string
}

export interface ReferenceBook {
    id: string
    subject_id: string
    title: string
    author?: string
    edition?: string
    file_url: string
    file_key: string
    file_size_bytes?: number
    gemini_file_uri?: string
    is_processed: boolean
    processing_status: 'pending' | 'processing' | 'completed' | 'failed'
    processing_error?: string
    download_count: number
    uploaded_at: string
    processed_at?: string
}

export interface AIConversation {
    id: string
    student_id: string
    subject_id: string
    question: string
    answer: string
    sources?: { title: string; page: number }[]
    confidence_score?: number
    response_time_ms?: number
    created_at: string
}
