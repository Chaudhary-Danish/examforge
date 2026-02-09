import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { email, otp, fullName } = await req.json()

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        // Find valid OTP
        const { data: otpRecord, error: otpError } = await supabase
            .from('email_otps')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('otp_code', otp)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (otpError || !otpRecord) {
            return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
        }

        // Mark OTP as used
        await supabase
            .from('email_otps')
            .update({ used: true })
            .eq('id', otpRecord.id)

        // Check if student exists
        let { data: student } = await supabase
            .from('students')
            .select('*')
            .eq('email', email.toLowerCase())
            .single()

        if (!student) {
            // Auto-create new student
            const name = fullName || email.split('@')[0] // Use email prefix as default name

            const { data: newStudent, error: createError } = await supabase
                .from('students')
                .insert({
                    email: email.toLowerCase(),
                    full_name: name,
                    is_verified: true,
                    is_active: true
                })
                .select()
                .single()

            if (createError) {
                console.error('Student creation error:', createError)
                return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
            }

            student = newStudent
        } else {
            // Update last login
            await supabase
                .from('students')
                .update({ last_login: new Date().toISOString() })
                .eq('id', student.id)
        }

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
                role: 'student'
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
        console.error('Verify OTP error:', error)
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }
}
