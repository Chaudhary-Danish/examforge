import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await verifyAuth(req)
        const { id } = await params
        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json({
                id,
                name: 'Subject',
                code: 'SUB',
                description: '',
                pyqs: [],
                books: []
            })
        }

        // Get subject
        const { data: subject, error: subjectError } = await supabase
            .from('subjects')
            .select('*')
            .eq('id', id)
            .single()

        if (subjectError || !subject) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
        }

        // Get PYQs from uploaded_pdfs table
        const { data: pyqs } = await supabase
            .from('uploaded_pdfs')
            .select('id, title, year, exam_type, file_url')
            .eq('subject_id', id)
            .eq('type', 'pyq')
            .eq('is_active', true)
            .order('year', { ascending: false })

        // Get Books from uploaded_pdfs table
        const { data: books } = await supabase
            .from('uploaded_pdfs')
            .select('id, title, author, file_url')
            .eq('subject_id', id)
            .eq('type', 'book')
            .eq('is_active', true)

        return NextResponse.json({
            ...subject,
            pyqs: pyqs?.map(p => ({
                id: p.id,
                title: p.title,
                year: p.year || new Date().getFullYear(),
                exam_type: p.exam_type || 'exam',
                file_url: p.file_url || '#'
            })) || [],
            books: books?.map(b => ({
                id: b.id,
                title: b.title,
                author: b.author || 'Unknown',
                file_url: b.file_url || '#'
            })) || []
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Subject fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch subject' }, { status: 500 })
    }
}

// UPDATE SUBJECT (Admin only)
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params
        const body = await req.json()
        const { name, code, description } = body

        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json({ id, name, code, description })
        }

        const { data: subject, error } = await supabase
            .from('subjects')
            .update({ name, code: code?.toUpperCase(), description })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(subject)

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Subject update error:', error)
        return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
    }
}

// DELETE SUBJECT (Admin only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params
        const supabase = createClient()

        if (!supabase) {
            return NextResponse.json({ success: true })
        }

        // Soft delete
        const { error } = await supabase
            .from('subjects')
            .update({ is_active: false })
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Subject delete error:', error)
        return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
    }
}
