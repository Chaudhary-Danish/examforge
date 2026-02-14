import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim()
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim()

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req)

        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
        }

        const supabase = createClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const title = formData.get('title') as string
        const subject_id = formData.get('subject_id') as string
        const type = formData.get('type') as string // 'pyq' or 'book'
        const year = formData.get('year') as string
        const exam_type = formData.get('exam_type') as string
        const author = formData.get('author') as string

        if (!title || !type) {
            return NextResponse.json({ error: 'Title and type are required' }, { status: 400 })
        }

        let file_url = ''
        let text_content = ''

        // Handle file upload if provided
        if (file && file.size > 0) {
            // Validate file size (reduced limits for faster uploads)
            const maxSize = type === 'book' ? 20 * 1024 * 1024 : 10 * 1024 * 1024 // 20MB books, 10MB PYQs
            if (file.size > maxSize) {
                return NextResponse.json({
                    error: `File too large. Max ${type === 'book' ? '20MB' : '10MB'}`
                }, { status: 400 })
            }

            try {
                // Convert file to buffer
                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                // 1. Extract Text for AI (only for PDFs, with timeout)
                if (file.type === 'application/pdf') {
                    try {
                        console.log('Starting PDF parsing...')
                        // pdf-parse is listed in serverExternalPackages, so direct require works
                        const pdfParse = require('pdf-parse')
                        const data = await pdfParse(buffer)
                        text_content = data.text || ''
                        console.log('PDF parsed successfully, length:', text_content.length)
                    } catch (parseError) {
                        console.error('PDF Parse Error (non-fatal, continuing upload):', parseError)
                        text_content = ''
                    }
                }

                // 2. Upload to Telegram
                if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
                    try {
                        const tgFormData = new FormData()
                        const blob = new Blob([new Uint8Array(buffer)], { type: file.type })
                        tgFormData.append('document', blob, file.name)
                        tgFormData.append('chat_id', TELEGRAM_CHAT_ID)
                        tgFormData.append('caption', `ExamForge: ${title} (${type})`)

                        // Add timeout for Telegram upload (60 seconds max)
                        const controller = new AbortController()
                        const timeout = setTimeout(() => controller.abort(), 60000)

                        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
                            method: 'POST',
                            body: tgFormData,
                            signal: controller.signal
                        })

                        clearTimeout(timeout)

                        if (!tgRes.ok) throw new Error(`Telegram Upload Failed: ${await tgRes.text()}`)

                        const tgData = await tgRes.json()
                        if (!tgData.ok) throw new Error(`Telegram API Error: ${tgData.description}`)

                        const fileId = tgData.result.document.file_id
                        file_url = `telegram://${fileId}`
                    } catch (tgError) {
                        if (tgError instanceof Error && tgError.name === 'AbortError') {
                            console.error('Telegram upload timed out after 60s')
                        } else {
                            console.error('Telegram upload failed:', tgError)
                        }
                        file_url = `local://${file.name}`
                    }
                } else {
                    console.warn('Telegram storage not configured. Saving as local reference.')
                    file_url = `local://${file.name}`
                }
            } catch (bufferError) {
                console.error('Buffer processing error:', bufferError)
                return NextResponse.json({ error: 'File processing failed' }, { status: 500 })
            }
        }

        // Save to database
        const { data, error } = await supabase
            .from('uploaded_pdfs')
            .insert({
                title,
                subject_id: subject_id || null,
                type,
                year: year ? parseInt(year) : null,
                exam_type: exam_type || null,
                author: author || null,
                file_url: file_url || null,
                text_content: text_content || null,
                uploaded_by: user.id,
                is_active: true
            })
            .select()
            .single()

        if (error) {
            console.error('Database insert error:', error)
            return NextResponse.json({ error: 'Failed to save to database: ' + error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data,
            message: file_url.startsWith('telegram://')
                ? 'Upload successful (Telegram Storage)'
                : 'Saved with local reference (Storage not configured)'
        })
    } catch (error) {
        console.error('Upload error:', error)
        const message = error instanceof Error ? error.message : 'Upload failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
