import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
    try {
        await verifyAuth(req)

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json([])
        }

        const { data: pyqs, error } = await supabase
            .from('uploaded_pdfs')
            .select('id, title, year, exam_type, file_url')
            .eq('type', 'pyq')
            .order('year', { ascending: false })

        if (error) throw error

        return NextResponse.json(pyqs || [])
    } catch (error) {
        console.error('Get PYQs error:', error)
        return NextResponse.json([])
    }
}
