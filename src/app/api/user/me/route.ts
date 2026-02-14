import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    try {
        const jwtUser = await verifyAuth(req)

        // Fetch fresh user data from database to get updated name
        const supabase = createClient()

        if (supabase && jwtUser.role === 'admin') {
            const { data: admin } = await supabase
                .from('admin')
                .select('id, email, full_name')
                .eq('id', jwtUser.id)
                .single()

            if (admin) {
                return NextResponse.json({
                    user: {
                        id: admin.id,
                        name: admin.full_name,
                        email: admin.email,
                        role: jwtUser.role,
                        adminId: jwtUser.adminId
                    }
                })
            }
        }

        if (supabase && jwtUser.role === 'student') {
            const { data: student } = await supabase
                .from('students')
                .select('id, email, full_name')
                .eq('id', jwtUser.id)
                .single()

            if (student) {
                return NextResponse.json({
                    user: {
                        id: student.id,
                        name: student.full_name,
                        email: student.email,
                        role: jwtUser.role,
                        studentId: jwtUser.studentId
                    }
                })
            }
        }

        return NextResponse.json({
            user: {
                id: jwtUser.id,
                name: jwtUser.name,
                email: jwtUser.email,
                role: jwtUser.role,
                studentId: jwtUser.studentId,
                adminId: jwtUser.adminId
            }
        })

    } catch (error) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }
}
