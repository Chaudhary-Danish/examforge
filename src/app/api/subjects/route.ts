
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'


// GET - List all subjects with stats
export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        const supabase = createClient()


        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        let query = supabase
            .from('subjects')
            .select(`
                *,
                semester:semesters (
                    year:years (
                        department:departments (
                            code,
                            name
                        )
                    )
                )
            `)
            .eq('is_active', true)
            .order('name')

        // Filter for students
        if (user.role === 'student') {
            const { data: student } = await supabase
                .from('students')
                .select('semester_id')
                .eq('id', user.id)
                .single()

            if (student && student.semester_id) {
                query = query.eq('semester_id', student.semester_id)
            } else {
                // Safety: If student has no semester assigned, show NO subjects
                return NextResponse.json([])
            }
        }

        // Get subjects
        const { data: subjects, error } = await query

        if (error) throw error

        // Get PYQ counts per subject
        const { data: pyqCounts } = await supabase
            .from('uploaded_pdfs')
            .select('subject_id')
            .eq('type', 'pyq')
            .eq('is_active', true)

        // Get book counts per subject  
        const { data: bookCounts } = await supabase
            .from('uploaded_pdfs')
            .select('subject_id')
            .eq('type', 'book')
            .eq('is_active', true)

        // Calculate stats
        const subjectsWithStats = subjects?.map(subject => {
            const pyqCount = pyqCounts?.filter(p => p.subject_id === subject.id).length || 0
            const bookCount = bookCounts?.filter(b => b.subject_id === subject.id).length || 0
            return {
                ...subject,
                pyqCount,
                bookCount,
                chatCount: 0
            }
        }) || []

        return NextResponse.json(subjectsWithStats)

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Subjects fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
    }
}

// POST - Create new subject (Admin only)
export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { name, code, description, semesterId } = await req.json()

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        const { data: subject, error } = await supabase
            .from('subjects')
            .insert({
                name,
                code: code.toUpperCase(),
                description: description || null,
                semester_id: semesterId || null,
                is_active: true
            })
            .select()
            .single()

        if (error) {
            console.error('Subject creation error:', error)
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Subject code already exists' }, { status: 409 })
            }
            throw error
        }

        return NextResponse.json(subject, { status: 201 })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Subject creation error:', error)
        return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 })
    }
}

// PUT - Update subject (Admin only)
export async function PUT(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { id, name, code, description, semesterId, is_active } = await req.json()

        if (!id) {
            return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        const updates: Record<string, unknown> = {}
        if (name !== undefined) updates.name = name
        if (code !== undefined) updates.code = code.toUpperCase()
        if (description !== undefined) updates.description = description
        if (semesterId !== undefined) updates.semester_id = semesterId
        if (is_active !== undefined) updates.is_active = is_active

        const { data: subject, error } = await supabase
            .from('subjects')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(subject)
    } catch (error) {
        console.error('Update subject error:', error)
        return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
    }
}

// DELETE - Delete subject (Admin only)
export async function DELETE(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        // Soft delete
        const { error } = await supabase
            .from('subjects')
            .update({ is_active: false })
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete subject error:', error)
        return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
    }
}
