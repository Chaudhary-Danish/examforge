import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

// GET single conversation with messages
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyAuth(req)
        const { id } = await params
        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json({ messages: [] })
        }

        // Get conversation messages
        const { data: messages, error } = await supabase
            .from('ai_chat_history')
            .select('role, content, created_at')
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

// DELETE conversation
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyAuth(req)
        const { id } = await params
        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json({ success: true })
        }

        // Delete messages first
        await supabase
            .from('ai_chat_history')
            .delete()
            .eq('conversation_id', id)

        // Delete conversation
        await supabase
            .from('ai_conversations')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error('Delete conversation error:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
