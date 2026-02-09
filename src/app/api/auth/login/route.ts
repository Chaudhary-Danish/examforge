import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { generateToken, JWTPayload } from '@/lib/auth'

// Mock users for development (when Supabase is not configured)
const MOCK_USERS = {
    students: [
        {
            id: 'mock-student-1',
            student_id: 'STU-2024-001',
            full_name: 'John Doe',
            email: 'john@example.com',
            password_hash: '$2a$10$pWgRlSlJ/bT725A6.ngHTedE3UGxLBZiRbv0rXCXMIl70Da1tJhK.', // password: demo123
            is_active: true
        }
    ],
    admin: {
        id: 'mock-admin-1',
        admin_id: 'ADMIN',
        full_name: 'System Administrator',
        email: 'admin@examforge.app',
        password_hash: '$2a$10$pWgRlSlJ/bT725A6.ngHTedE3UGxLBZiRbv0rXCXMIl70Da1tJhK.' // password: demo123
    }
}

interface LoginBody {
    id: string
    password: string
    role: 'student' | 'admin'
}

export async function POST(req: NextRequest) {
    try {
        const body: LoginBody = await req.json()
        const { id, password, role } = body

        if (!id || !password || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const supabase = createClient()

        if (role === 'student') {
            let student: typeof MOCK_USERS.students[0] | null = null

            if (supabase) {
                // Use Supabase
                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .eq('student_id', id)
                    .eq('is_active', true)
                    .single()

                if (error || !data) {
                    return NextResponse.json(
                        { error: 'Invalid credentials' },
                        { status: 401 }
                    )
                }
                student = data
            } else {
                // Use mock data
                student = MOCK_USERS.students.find(s => s.student_id === id) || null
            }

            if (!student) {
                return NextResponse.json(
                    { error: 'Invalid credentials' },
                    { status: 401 }
                )
            }

            // Verify password
            const isValid = await bcrypt.compare(password, student.password_hash)
            if (!isValid) {
                return NextResponse.json(
                    { error: 'Invalid credentials' },
                    { status: 401 }
                )
            }

            // Update last login if using Supabase
            if (supabase) {
                await supabase
                    .from('students')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', student.id)
            }

            // Generate JWT
            const payload: JWTPayload = {
                id: student.id,
                studentId: student.student_id,
                role: 'student',
                email: student.email,
                name: student.full_name
            }

            const token = generateToken(payload)

            // Set cookie and return response
            const response = NextResponse.json({
                success: true,
                redirect: '/student/dashboard',
                user: {
                    id: student.id,
                    name: student.full_name,
                    email: student.email,
                    studentId: student.student_id
                }
            })

            response.cookies.set('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            })

            return response

        } else if (role === 'admin') {
            let admin: typeof MOCK_USERS.admin | null = null

            if (supabase) {
                // Use Supabase
                const { data, error } = await supabase
                    .from('admin')
                    .select('*')
                    .eq('admin_id', id)
                    .single()

                if (error || !data) {
                    return NextResponse.json(
                        { error: 'Invalid credentials' },
                        { status: 401 }
                    )
                }
                admin = data
            } else {
                // Use mock data
                if (MOCK_USERS.admin.admin_id === id) {
                    admin = MOCK_USERS.admin
                }
            }

            if (!admin) {
                return NextResponse.json(
                    { error: 'Invalid credentials' },
                    { status: 401 }
                )
            }

            // Verify password
            const isValid = await bcrypt.compare(password, admin.password_hash)
            if (!isValid) {
                return NextResponse.json(
                    { error: 'Invalid credentials' },
                    { status: 401 }
                )
            }

            // Generate JWT
            const payload: JWTPayload = {
                id: admin.id,
                adminId: admin.admin_id,
                role: 'admin',
                email: admin.email,
                name: admin.full_name
            }

            const token = generateToken(payload)

            // Set cookie and return response
            const response = NextResponse.json({
                success: true,
                redirect: '/admin/dashboard',
                user: {
                    id: admin.id,
                    name: admin.full_name,
                    email: admin.email
                }
            })

            response.cookies.set('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7
            })

            return response
        }

        return NextResponse.json(
            { error: 'Invalid role' },
            { status: 400 }
        )

    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
