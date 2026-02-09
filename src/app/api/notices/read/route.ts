import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

// POST - Mark notice as read
export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req)

        if (user.role !== 'student') {
            return NextResponse.json({ error: 'Students only' }, { status: 403 })
        }

        const { notice_id } = await req.json()

        if (!notice_id) {
            return NextResponse.json({ error: 'Notice ID required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        // Upsert - create or ignore if exists
        await supabase
            .from('notice_reads')
            .upsert({
                notice_id,
                student_id: user.id
            }, {
                onConflict: 'notice_id,student_id'
            })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Mark notice read error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
