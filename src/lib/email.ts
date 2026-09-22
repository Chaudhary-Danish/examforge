import nodemailer from 'nodemailer'

// Create reusable transporter
function createTransporter() {
    const GMAIL_USER = process.env.GMAIL_USER
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        return null
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD,
        },
    })
}

interface SendEmailOptions {
    to: string
    subject: string
    html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
    const transporter = createTransporter()

    if (!transporter) {
        console.warn('📧 Email not configured (GMAIL_USER or GMAIL_APP_PASSWORD missing)')
        return { success: false, error: 'Email not configured' }
    }

    try {
        const info = await transporter.sendMail({
            from: `ExamForge 🦊 <${process.env.GMAIL_USER || 'no-reply@examforge.com'}>`,
            to,
            subject,
            html,
        })

        console.log(`✅ Email sent to ${to} — Message ID: ${info.messageId}`)
        return { success: true }
    } catch (error) {
        console.error('❌ Email send failed:', error)
        const message = error instanceof Error ? error.message : 'Unknown email error'
        return { success: false, error: message }
    }
}
