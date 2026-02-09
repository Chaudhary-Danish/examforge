import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        // Find student by email
        const { data: student, error } = await supabase
            .from('students')
            .select('*, department:departments(code), year:years(code)')
            .eq('email', email.toLowerCase())
            .single()

        if (error || !student) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Check password
        if (student.password !== password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Update last login
        await supabase
            .from('students')
            .update({ last_login: new Date().toISOString() })
            .eq('id', student.id)

        // Generate JWT token
        const token = generateToken({
            id: student.id,
            email: student.email,
            name: student.full_name,
            role: 'student'
        })

        // Create response with cookie
        // Check if environment is effectively local (localhost or local IP)
        const host = req.headers.get('host') || ''
        const isLocal = host.includes('localhost') ||
            host.includes('127.0.0.1') ||
            host.startsWith('10.') ||
            host.startsWith('192.168.') ||
            host.startsWith('172.16.')

        const response = NextResponse.json({
            success: true,
            user: {
                id: student.id,
                email: student.email,
                name: student.full_name,
                role: 'student',
                departmentId: student.department_id,
                yearId: student.year_id
            }
        })

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && !isLocal,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        })

        return response

    } catch (error) {
        console.error('Student login error:', error)
        return NextResponse.json({ error: 'Login failed' }, { status: 500 })
    }
}
