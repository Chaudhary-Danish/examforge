import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json(
                { error: 'Database not configured' },
                { status: 500 }
            )
        }

        // Find admin by email
        const { data: admin, error } = await supabase
            .from('admin')
            .select('*')
            .eq('email', email.toLowerCase())
            .single()

        if (error || !admin) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password_hash)
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Generate JWT token
        const token = generateToken({
            id: admin.id,
            email: admin.email,
            name: admin.full_name,
            role: 'admin'
        })

        // Create response with cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.full_name,
                role: 'admin'
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
        console.error('Admin login error:', error)
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        )
    }
}
