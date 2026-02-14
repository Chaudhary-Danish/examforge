import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

// Generate 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        // Generate OTP
        const otp = generateOTP()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Invalidate any existing OTPs for this email
        await supabase
            .from('email_otps')
            .update({ used: true })
            .eq('email', email.toLowerCase())
            .eq('used', false)

        // Store new OTP
        const { error: otpError } = await supabase
            .from('email_otps')
            .insert({
                email: email.toLowerCase(),
                otp_code: otp,
                expires_at: expiresAt.toISOString()
            })

        if (otpError) {
            console.error('OTP storage error:', otpError)
            return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
        }

        // Send email via Resend
        const resendApiKey = process.env.RESEND_API_KEY

        if (resendApiKey) {
            const resend = new Resend(resendApiKey)

            const fromEmail = process.env.RESEND_FROM_EMAIL || 'ExamForge <onboarding@resend.dev>'

            try {
                const emailResult = await resend.emails.send({
                    from: fromEmail,
                    to: email,
                    subject: 'Your ExamForge Login Code',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                            <h1 style="color: #FF6B35; text-align: center;">🦊 ExamForge</h1>
                            <p style="font-size: 16px; color: #333;">Your login verification code is:</p>
                            <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FF6B35;">${otp}</span>
                            </div>
                            <p style="font-size: 14px; color: #666;">This code expires in 10 minutes.</p>
                            <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #999; text-align: center;">ExamForge - AI-Powered Exam Preparation</p>
                        </div>
                    `
                })
                console.log(`✅ OTP email sent to ${email}`, emailResult)
            } catch (emailError) {
                console.error('❌ OTP email send FAILED:', JSON.stringify(emailError, null, 2))
                console.error('OTP email error details:', emailError)
                // Still log OTP for debugging
                console.log(`📧 OTP for ${email}: ${otp}`)
            }
        } else {
            // No Resend API key - log OTP to console
            console.log(`\n📧 OTP for ${email}: ${otp}\n`)
        }

        return NextResponse.json({
            success: true,
            message: 'Verification code sent to your email'
        })

    } catch (error) {
        console.error('Send OTP error:', error)
        return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
    }
}
