import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        const { notice_id, emoji } = await req.json()

        if (!notice_id || !emoji) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json({ success: true })
        }

        // Check if user already reacted with this emoji
        const { data: existing } = await supabase
            .from('notice_reactions')
            .select('id')
            .eq('notice_id', notice_id)
            .eq('user_id', user.id)
            .eq('emoji', emoji)
            .single()

        if (existing) {
            // Remove reaction (toggle off)
            await supabase
                .from('notice_reactions')
                .delete()
                .eq('id', existing.id)
        } else {
            // Add reaction
            await supabase
                .from('notice_reactions')
                .insert({
                    notice_id,
                    user_id: user.id,
                    emoji
                })
        }

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error('React error:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
