import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

// Generate permanent password: SYIT-26-124 format
function generatePassword(yearCode: string, deptCode: string): string {
    const currentYear = new Date().getFullYear().toString().slice(-2) // "26"
    const randomNum = Math.floor(100 + Math.random() * 900).toString() // 3-digit
    return `${yearCode}${deptCode}-${currentYear}-${randomNum}`
}

export async function POST(req: NextRequest) {
    try {
        const { email, fullName, departmentId, yearId, semesterId } = await req.json()

        if (!email || !fullName || !departmentId || !yearId || !semesterId) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        // Check if student already exists
        const { data: existing } = await supabase
            .from('students')
            .select('id')
            .eq('email', email.toLowerCase())
            .single()

        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
        }

        // Get department and year codes
        const { data: dept } = await supabase
            .from('departments')
            .select('code')
            .eq('id', departmentId)
            .single()

        const { data: year } = await supabase
            .from('years')
            .select('code')
            .eq('id', yearId)
            .single()

        if (!dept || !year) {
            return NextResponse.json({ error: 'Invalid department or year' }, { status: 400 })
        }

        // Generate permanent password
        const password = generatePassword(year.code, dept.code)

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create student
        const { data: student, error: createError } = await supabase
            .from('students')
            .insert({
                email: email.toLowerCase(),
                full_name: fullName,
                password: hashedPassword,
                student_id: password, // Use readable password format as student ID
                department_id: departmentId,
                year_id: yearId,
                semester_id: semesterId,
                is_active: true
            })
            .select()
            .single()

        if (createError) {
            console.error('Student creation error:', createError)
            return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
        }

        // Send password via email (Gmail SMTP)
        const emailResult = await sendEmail({
            to: email,
            subject: 'Welcome to ExamForge - Your Login Credentials',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-radius: 20px;">
                    <h1 style="color: #FF6B35; text-align: center; margin-bottom: 20px;">🦊 Welcome to ExamForge!</h1>
                    <p style="color: white; font-size: 16px;">Hi ${fullName},</p>
                    <p style="color: rgba(255,255,255,0.8); font-size: 14px;">Your account has been created successfully. Here are your permanent login credentials:</p>
                    
                    <div style="background: rgba(255,255,255,0.1); padding: 24px; border-radius: 16px; text-align: center; margin: 24px 0; border: 1px solid rgba(255,255,255,0.2);">
                        <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 8px;">Your Permanent Password</p>
                        <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #FF6B35; font-family: monospace;">${password}</span>
                    </div>
                    
                    <p style="color: rgba(255,255,255,0.6); font-size: 12px; text-align: center;">Keep this password safe. You'll use it to login every time.</p>
                    
                    <div style="text-align: center; margin-top: 24px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://examforgeapp.vercel.app'}/login" style="background: #FF6B35; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">Login Now</a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;">
                    <p style="font-size: 11px; color: rgba(255,255,255,0.4); text-align: center;">ExamForge - AI-Powered Exam Preparation</p>
                </div>
            `
        })

        if (!emailResult.success) {
            console.warn(`⚠️ Password email to ${email} failed: ${emailResult.error}. Password shown on screen.`)
        }

        return NextResponse.json({
            success: true,
            password: password, // Also return for immediate display
            user: {
                id: student.id,
                email: student.email,
                name: student.full_name
            }
        })

    } catch (error) {
        console.error('Student signup error:', error)
        return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
    }
}
