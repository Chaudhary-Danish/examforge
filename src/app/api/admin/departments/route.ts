import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'


// GET - List all departments with years
export async function GET(req: NextRequest) {
    try {
        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        const { data: departments, error } = await supabase
            .from('departments')
            .select(`
                *,
                years:years(id, name, code, order_index)
            `)
            .eq('is_active', true)
            .order('name')

        if (error) throw error

        // Sort years by order_index
        const sorted = departments?.map(dept => ({
            ...dept,
            years: dept.years?.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index) || []
        })) || []

        return NextResponse.json(sorted)
    } catch (error) {
        console.error('Get departments error:', error)
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
    }
}

// POST - Create new department with auto-generated years and semesters (Admin only)
export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { name, code, description } = await req.json()

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        // Create department (Initial Attempt)
        let { data: department, error } = await supabase
            .from('departments')
            .insert({ name, code: code.toUpperCase(), description })
            .select()
            .single()

        if (error) {
            // Check for unique constraint violation (code 23505)
            if (error.code === '23505') {
                // Check if a "Deleted" (Inactive) department exists with this code
                const { data: ghostDept } = await supabase
                    .from('departments')
                    .select('id')
                    .eq('code', code.toUpperCase())
                    .eq('is_active', false)
                    .single()

                if (ghostDept) {
                    console.log(`Found Ghost Department ${code}. Purging...`)
                    // PURGE LOGIC
                    const { data: years } = await supabase.from('years').select('id').eq('department_id', ghostDept.id)
                    const yearIds = years?.map(y => y.id) || []

                    let semesterIds: string[] = []
                    if (yearIds.length > 0) {
                        const { data: semesters } = await supabase.from('semesters').select('id').in('year_id', yearIds)
                        semesterIds = semesters?.map(s => s.id) || []
                    }

                    let subjectIds: string[] = []
                    if (semesterIds.length > 0) {
                        const { data: subjects } = await supabase.from('subjects').select('id').in('semester_id', semesterIds)
                        subjectIds = subjects?.map(s => s.id) || []
                    }

                    if (subjectIds.length > 0) await supabase.from('uploaded_pdfs').delete().in('subject_id', subjectIds)
                    if (subjectIds.length > 0) await supabase.from('subjects').delete().in('id', subjectIds)
                    await supabase.from('students').delete().eq('department_id', ghostDept.id)
                    if (semesterIds.length > 0) await supabase.from('semesters').delete().in('id', semesterIds)
                    if (yearIds.length > 0) await supabase.from('years').delete().in('id', yearIds)
                    await supabase.from('departments').delete().eq('id', ghostDept.id)

                    // RETRY INSERT
                    const retry = await supabase
                        .from('departments')
                        .insert({ name, code: code.toUpperCase(), description })
                        .select()
                        .single()

                    if (retry.error) throw retry.error
                    department = retry.data
                } else {
                    return NextResponse.json({ error: 'Department code already exists' }, { status: 409 })
                }
            } else {
                throw error
            }
        }

        // Auto-create years: FY, SY, TY
        const yearDefinitions = [
            { name: 'First Year', code: 'FY', order_index: 1 },
            { name: 'Second Year', code: 'SY', order_index: 2 },
            { name: 'Third Year', code: 'TY', order_index: 3 }
        ]

        const { data: years } = await supabase
            .from('years')
            .insert(
                yearDefinitions.map(y => ({
                    ...y,
                    department_id: department.id
                }))
            )
            .select()

        // Auto-create semesters for each year: SEM1, SEM2
        if (years) {
            const semesterInserts = years.flatMap(year => [
                { year_id: year.id, name: 'Semester 1', code: 'SEM1', order_index: 1 },
                { year_id: year.id, name: 'Semester 2', code: 'SEM2', order_index: 2 }
            ])

            await supabase.from('semesters').insert(semesterInserts)
        }

        // Fetch the full department with years
        const { data: fullDepartment } = await supabase
            .from('departments')
            .select(`
                *,
                years:years(id, name, code, order_index)
            `)
            .eq('id', department.id)
            .single()

        return NextResponse.json(fullDepartment, { status: 201 })
    } catch (error) {
        console.error('Create department error:', error)
        return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
    }
}

// PUT - Update department (Admin only)
export async function PUT(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { id, name, code, description, is_active } = await req.json()

        if (!id) {
            return NextResponse.json({ error: 'Department ID is required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        const updates: Record<string, unknown> = {}
        if (name !== undefined) updates.name = name
        if (code !== undefined) updates.code = code.toUpperCase()
        if (description !== undefined) updates.description = description
        if (is_active !== undefined) updates.is_active = is_active

        const { data: department, error } = await supabase
            .from('departments')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(department)
    } catch (error) {
        console.error('Update department error:', error)
        return NextResponse.json({ error: 'Failed to update department' }, { status: 500 })
    }
}

// DELETE - Cascade Delete department and all related data (Admin only)
export async function DELETE(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Department ID is required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        console.log('Starting Cascade Delete for Dept ID:', id)

        // 1. Get all Years and Semesters linked to this Department
        const { data: years } = await supabase
            .from('years')
            .select('id')
            .eq('department_id', id)

        const yearIds = years?.map(y => y.id) || []

        let semesterIds: string[] = []
        if (yearIds.length > 0) {
            const { data: semesters } = await supabase
                .from('semesters')
                .select('id')
                .in('year_id', yearIds)
            semesterIds = semesters?.map(s => s.id) || []
        }

        let subjectIds: string[] = []
        if (semesterIds.length > 0) {
            const { data: subjects } = await supabase
                .from('subjects')
                .select('id')
                .in('semester_id', semesterIds)
            subjectIds = subjects?.map(s => s.id) || []
        }

        console.log(`Found: ${yearIds.length} Years, ${semesterIds.length} Semesters, ${subjectIds.length} Subjects`)

        // 2. DELETE Uploaded PDFs (linked to Subjects)
        if (subjectIds.length > 0) {
            const { error: pdfError } = await supabase
                .from('uploaded_pdfs')
                .delete()
                .in('subject_id', subjectIds)
            if (pdfError) console.error('Error deleting PDFs:', pdfError)
        }

        // 3. DELETE Subjects (linked to Semesters)
        if (subjectIds.length > 0) {
            const { error: subjError } = await supabase
                .from('subjects')
                .delete()
                .in('id', subjectIds)
            if (subjError) console.error('Error deleting Subjects:', subjError)
        }

        // 4. DELETE Students (linked to Department)
        // Note: This deletes Student Profile data. Auth users remain but lose access.
        const { error: studError } = await supabase
            .from('students')
            .delete()
            .eq('department_id', id)
        if (studError) console.error('Error deleting Students:', studError)

        // 5. DELETE Semesters (linked to Years)
        if (semesterIds.length > 0) {
            const { error: semError } = await supabase
                .from('semesters')
                .delete()
                .in('id', semesterIds)
            if (semError) console.error('Error deleting Semesters:', semError)
        }

        // 6. DELETE Years (linked to Department)
        if (yearIds.length > 0) {
            const { error: yearError } = await supabase
                .from('years')
                .delete()
                .in('id', yearIds)
            if (yearError) console.error('Error deleting Years:', yearError)
        }

        // 7. FINALLY Delete Department
        // We use DELETE (Hard Delete) instead of Soft Delete as requested
        const { error: deptError } = await supabase
            .from('departments')
            .delete() // HARD DELETE
            .eq('id', id)

        if (deptError) {
            console.error('Delete department error:', deptError)
            throw deptError
        }

        return NextResponse.json({ success: true, message: 'Department and all related data deleted permanentely' })

    } catch (error) {
        console.error('Cascade Delete error:', error)
        return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 })
    }
}
