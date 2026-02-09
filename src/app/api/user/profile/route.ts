import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req)

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        if (user.role === 'student') {
            const { data: student, error } = await supabase
                .from('students')
                .select(`
                    *,
                    department:departments(id, name, code),
                    year:years(id, name, code)
                `)
                .eq('id', user.id)
                .single()

            if (error) throw error

            return NextResponse.json({
                id: student.id,
                email: student.email,
                name: student.full_name,
                role: 'student',
                student_id: student.student_id,
                department: student.department,
                year: student.year,
                profile_picture: student.profile_picture,
                bio: student.bio
            })
        }

        // Admin profile
        const { data: admin, error } = await supabase
            .from('admin')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) throw error

        return NextResponse.json({
            id: admin.id,
            email: admin.email,
            name: admin.full_name,
            role: 'admin'
        })

    } catch (error) {
        console.error('Get profile error:', error)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        const { full_name, bio, profile_picture } = await req.json()

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        if (user.role === 'student') {
            const updates: Record<string, unknown> = {}
            if (full_name !== undefined) updates.full_name = full_name
            if (bio !== undefined) updates.bio = bio
            if (profile_picture !== undefined) updates.profile_picture = profile_picture

            const { data: student, error } = await supabase
                .from('students')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single()

            if (error) throw error

            return NextResponse.json({
                success: true,
                name: student.full_name,
                bio: student.bio
            })
        }

        // Admin update
        const updates: Record<string, unknown> = {}
        if (full_name !== undefined) updates.full_name = full_name

        const { data: admin, error } = await supabase
            .from('admin')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({
            success: true,
            name: admin.full_name
        })

    } catch (error) {
        console.error('Update profile error:', error)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}
