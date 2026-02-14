import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'

// GET all students
export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json([])
        }

        const { data: students, error } = await supabase
            .from('students')
            .select(`
                id, email, full_name, student_id, is_active, created_at,
                departments(id, name, code),
                years(id, name, code),
                semesters(id, name, code)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching students:', error)
            return NextResponse.json([])
        }

        return NextResponse.json(students || [])
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}

// POST create new student
export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { email, full_name, department_id, year_id, semester_id } = await req.json()

        if (!email || !full_name || !department_id || !year_id || !semester_id) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not available' }, { status: 500 })
        }

        // Get department and year codes for student ID
        const { data: dept } = await supabase
            .from('departments')
            .select('code')
            .eq('id', department_id)
            .single()

        const { data: year } = await supabase
            .from('years')
            .select('code')
            .eq('id', year_id)
            .single()

        if (!dept || !year) {
            return NextResponse.json({ error: 'Invalid department or year' }, { status: 400 })
        }

        // Generate unique student ID like SYIT-26-001
        const currentYear = new Date().getFullYear().toString().slice(-2)
        const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', department_id)
            .eq('year_id', year_id)

        const sequence = String((count || 0) + 1).padStart(3, '0')
        const studentId = `${year.code}${dept.code}-${currentYear}-${sequence}`

        // Password is the student ID
        const password = studentId
        const passwordHash = await bcrypt.hash(password, 10)

        // Check if email exists
        const { data: existing } = await supabase
            .from('students')
            .select('id')
            .eq('email', email.toLowerCase())
            .single()

        if (existing) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
        }

        // Create student
        const { data: student, error } = await supabase
            .from('students')
            .insert({
                email: email.toLowerCase(),
                full_name,
                password: passwordHash,
                student_id: studentId,
                department_id,
                year_id,
                semester_id,
                is_active: true
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating student:', error)
            return NextResponse.json({ error: 'Failed to create student' }, { status: 500 })
        }

        // Send email with credentials (Gmail SMTP)
        const emailResult = await sendEmail({
            to: email,
            subject: 'Welcome to ExamForge - Your Login Credentials',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #f97316; margin: 0;">🦊 ExamForge</h1>
                        <p style="color: #64748b;">AI-Powered Exam Preparation</p>
                    </div>
                    
                    <h2 style="color: #1e293b;">Welcome, ${full_name}!</h2>
                    
                    <p style="color: #475569;">Your ExamForge account has been created. Here are your login credentials:</p>
                    
                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                        <p style="margin: 0 0 10px 0;"><strong>Student ID:</strong> ${studentId}</p>
                        <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 0;"><strong>Password:</strong> <code style="background: #fef3c7; padding: 2px 8px; border-radius: 4px;">${password}</code></p>
                    </div>
                    
                    <p style="color: #ef4444; font-size: 14px;">⚠️ Please save this password safely. This is your permanent login credential.</p>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://examforgeapp.vercel.app'}/login" style="display: inline-block; background: linear-gradient(to right, #f97316, #ea580c); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px;">
                        Login to ExamForge →
                    </a>
                    
                    <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">
                        If you didn't request this account, please ignore this email.
                    </p>
                </div>
            `
        })

        if (!emailResult.success) {
            console.warn(`⚠️ Credentials email to ${email} failed: ${emailResult.error}`)
        }

        return NextResponse.json({
            success: true,
            student,
            credentials: { studentId, password } // Return for admin to see
        })
    } catch (error) {
        console.error('Student creation error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

// DELETE student
export async function DELETE(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not available' }, { status: 500 })
        }

        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete error:', error)
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}
