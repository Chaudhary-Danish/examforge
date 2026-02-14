import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
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

        // Check password (supports both bcrypt hash and legacy plaintext)
        const isHashed = student.password && student.password.startsWith('$2')
        let passwordValid = false

        if (isHashed) {
            passwordValid = await bcrypt.compare(password, student.password)
        } else {
            // Legacy plaintext comparison — will be migrated
            passwordValid = student.password === password
        }

        if (!passwordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // If password was plaintext, migrate to bcrypt hash
        if (!isHashed && passwordValid) {
            const hashedPassword = await bcrypt.hash(password, 10)
            await supabase
                .from('students')
                .update({ password: hashedPassword })
                .eq('id', student.id)
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
            secure: process.env.NODE_ENV === 'production',
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
