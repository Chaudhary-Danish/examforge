import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
    try {
        // Allow public access for signup form
        // const user = await verifyAuth(req)
        // if (user.role !== 'admin') {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        // }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ years: [], semesters: [] })
        }

        const { searchParams } = new URL(req.url)
        const departmentId = searchParams.get('departmentId')
        const yearId = searchParams.get('yearId')

        // Fetch years for a department
        if (departmentId) {
            const { data: years, error } = await supabase
                .from('years')
                .select('id, name, code, order_index')
                .eq('department_id', departmentId)
                .order('order_index')

            if (error) throw error
            return NextResponse.json({ years: years || [] })
        }

        // Fetch semesters for a year
        if (yearId) {
            const { data: semesters, error } = await supabase
                .from('semesters')
                .select('id, name, code, order_index')
                .eq('year_id', yearId)
                .order('order_index')

            if (error) throw error
            return NextResponse.json({ semesters: semesters || [] })
        }

        // Fetch all semesters with relations
        const { data: semesters, error } = await supabase
            .from('semesters')
            .select(`
                id, name, code, order_index,
                year:years(id, name, code, department:departments(id, name, code))
            `)
            .order('order_index')

        if (error) throw error

        return NextResponse.json(semesters || [])
    } catch (error) {
        console.error('Get semesters error:', error)
        return NextResponse.json({ years: [], semesters: [] })
    }
}
