import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            // Allow it for now since user is desperate, or just check role
            return NextResponse.json({ error: 'Admin only' }, { status: 403 })
        }

        const supabase = createClient()
        if (!supabase) return NextResponse.json({ error: 'DB Error' })

        const { searchParams } = new URL(req.url)
        const targetCode = searchParams.get('code')

        let query = supabase.from('departments').select('id, name, code')

        if (targetCode) {
            // Target specific department (Active OR Inactive)
            query = query.eq('code', targetCode.toUpperCase())
        } else {
            // Default: Target only ghosts
            query = query.eq('is_active', false)
        }

        const { data: ghosts } = await query

        if (!ghosts || ghosts.length === 0) {
            return NextResponse.json({ message: targetCode ? `Department ${targetCode} not found.` : 'Database is clean. No ghost departments found.' })
        }

        const logs = []
        for (const dept of ghosts) {
            logs.push(`Purging ${dept.name} (${dept.code})...`)

            // Get Years
            const { data: years } = await supabase.from('years').select('id').eq('department_id', dept.id)
            const yearIds = years?.map(y => y.id) || []

            let semesterIds: string[] = []
            if (yearIds.length > 0) {
                const { data: sems } = await supabase.from('semesters').select('id').in('year_id', yearIds)
                semesterIds = sems?.map(s => s.id) || []
            }

            let subjectIds: string[] = []
            if (semesterIds.length > 0) {
                const { data: subs } = await supabase.from('subjects').select('id').in('semester_id', semesterIds)
                subjectIds = subs?.map(s => s.id) || []
            }

            // Delete cascading
            if (subjectIds.length > 0) await supabase.from('uploaded_pdfs').delete().in('subject_id', subjectIds)
            if (subjectIds.length > 0) await supabase.from('subjects').delete().in('id', subjectIds)
            await supabase.from('students').delete().eq('department_id', dept.id)
            if (semesterIds.length > 0) await supabase.from('semesters').delete().in('id', semesterIds)
            if (yearIds.length > 0) await supabase.from('years').delete().in('id', yearIds)

            // Delete Dept
            await supabase.from('departments').delete().eq('id', dept.id)
        }

        return NextResponse.json({
            success: true,
            message: `Purged ${ghosts.length} departments.`,
            details: logs
        })

    } catch (error) {
        return NextResponse.json({ error: 'Cleanup failed: ' + error }, { status: 500 })
    }
}
