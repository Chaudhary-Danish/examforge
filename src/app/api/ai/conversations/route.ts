import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'


// GET all conversations for user
export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json([])
        }

        const { data: conversations, error } = await supabase
            .from('ai_conversations')
            .select('id, title, created_at, preview')
            .eq('user_id', user.id)
            .is('subject_id', null)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error fetching conversations:', error)
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

// POST create new conversation
export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        const { title, preview } = await req.json()
        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json({ id: `temp-${Date.now()}` })
        }

        const { data, error } = await supabase
            .from('ai_conversations')
            .insert({
                user_id: user.id,
                title: title || 'New Chat',
                preview: preview || ''
            })
            .select('id')
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: unknown) {
        console.error('Create conversation error:', error)
        return NextResponse.json({ id: `temp-${Date.now()}` })
    }
}
