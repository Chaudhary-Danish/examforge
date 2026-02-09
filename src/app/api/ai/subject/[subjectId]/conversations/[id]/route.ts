import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

// GET messages for a conversation
export async function GET(req: NextRequest, { params }: { params: Promise<{ subjectId: string; id: string }> }) {
    try {
        const user = await verifyAuth(req)
        const { id } = await params
        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json({ messages: [] })
        }

        const { data: messages, error } = await supabase
            .from('ai_chat_history')
            .select('id, role, content, created_at')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching messages:', error)
            return NextResponse.json({ messages: [] })
        }

        return NextResponse.json({ messages: messages || [] })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ messages: [] })
    }
}

// DELETE a conversation
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ subjectId: string; id: string }> }) {
    try {
        const user = await verifyAuth(req)
        const { id } = await params
        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json({ error: 'Database not available' }, { status: 500 })
        }

        // Delete messages first
        await supabase
            .from('ai_chat_history')
            .delete()
            .eq('conversation_id', id)

        // Delete conversation
        const { error } = await supabase
            .from('ai_conversations')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Error deleting conversation:', error)
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

// POST save message to conversation
export async function POST(req: NextRequest, { params }: { params: Promise<{ subjectId: string; id: string }> }) {
    try {
        const user = await verifyAuth(req)
        const { id } = await params
        const { role, content } = await req.json()
        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json({ error: 'Database not available' }, { status: 500 })
        }

        const { error } = await supabase
            .from('ai_chat_history')
            .insert({
                conversation_id: id,
                user_id: user.id,
                role,
                content
            })

        if (error) {
            console.error('Error saving message:', error)
            return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
        }

        // Update conversation preview
        if (role === 'user') {
            await supabase
                .from('ai_conversations')
                .update({
                    preview: content.substring(0, 50),
                    title: content.substring(0, 30) + (content.length > 30 ? '...' : '')
                })
                .eq('id', id)
        }

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
