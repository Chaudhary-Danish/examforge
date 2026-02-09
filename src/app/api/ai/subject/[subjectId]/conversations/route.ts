import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

// GET conversations for a specific subject
export async function GET(req: NextRequest, { params }: { params: Promise<{ subjectId: string }> }) {
    try {
        const user = await verifyAuth(req)
        const { subjectId } = await params
        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json([])
        }

        const { data: conversations, error } = await supabase
            .from('ai_conversations')
            .select('id, title, created_at, preview')
            .eq('user_id', user.id)
            .eq('subject_id', subjectId)
            .order('created_at', { ascending: false })
            .limit(30)

        if (error) {
            console.error('Error fetching subject conversations:', error)
            return NextResponse.json([])
        }

        return NextResponse.json(conversations || [])
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json([])
    }
}

// POST create new conversation for subject
export async function POST(req: NextRequest, { params }: { params: Promise<{ subjectId: string }> }) {
    try {
        const user = await verifyAuth(req)
        const { subjectId } = await params
        const { title, firstMessage } = await req.json()
        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json({ error: 'Database not available' }, { status: 500 })
        }

        const { data: conversation, error } = await supabase
            .from('ai_conversations')
            .insert({
                user_id: user.id,
                subject_id: subjectId,
                title: title || 'New Chat',
                preview: firstMessage?.substring(0, 50) || ''
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating conversation:', error)
            return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
        }

        return NextResponse.json(conversation)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
