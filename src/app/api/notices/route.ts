import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'


// GET - List notices (filtered by user's department if student)
export async function GET(req: NextRequest) {
    try {
        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        const user = await verifyAuth(req)

        if (user.role === 'admin') {
            // Admin sees all notices
            const { data: notices, error } = await supabase
                .from('notices')
                .select(`
                    *,
                    department:departments(id, name, code),
                    year:years(id, name, code),
                    created_by_admin:admin(full_name)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            return NextResponse.json(notices || [])
        }

        // Student - get their department
        const { data: student } = await supabase
            .from('students')
            .select('department_id, year_id')
            .eq('id', user.id)
            .single()

        if (!student) {
            return NextResponse.json([])
        }

        // Get notices for their department or all-department notices
        const { data: notices, error } = await supabase
            .from('notices')
            .select(`
                *,
                department:departments(id, name, code),
                year:years(id, name, code)
            `)
            .or(`department_id.is.null,department_id.eq.${student.department_id}`)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Get read status for each notice
        const { data: reads } = await supabase
            .from('notice_reads')
            .select('notice_id')
            .eq('student_id', user.id)

        const readIds = new Set(reads?.map(r => r.notice_id) || [])

        const noticesWithReadStatus = notices?.map(n => ({
            ...n,
            is_read: readIds.has(n.id)
        })) || []

        return NextResponse.json(noticesWithReadStatus)

    } catch (error) {
        console.error('Get notices error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

// POST - Create notice (Admin only)
export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { title, content, department_id, year_id, is_urgent, file_url, file_name } = await req.json()

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        const { data: notice, error } = await supabase
            .from('notices')
            .insert({
                title,
                content,
                department_id: department_id || null,
                year_id: year_id || null,
                is_urgent: is_urgent || false,
                file_url,
                file_name,
                created_by: user.id
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(notice, { status: 201 })

    } catch (error) {
        console.error('Create notice error:', error)
        return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
    }
}

// DELETE - Delete notice (Admin only)
export async function DELETE(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Notice ID required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        const { error } = await supabase
            .from('notices')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Delete notice error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
