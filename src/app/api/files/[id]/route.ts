import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTelegramFileUrl } from '@/lib/telegram'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = createClient()

    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    try {
        // 1. Get file metadata
        const { data: file, error } = await supabase
            .from('uploaded_pdfs')
            .select('file_url, title, type')
            .eq('id', id)
            .single()

        if (error || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // 2. Handle Telegram storage — proxy download instead of redirect
        if (file.file_url?.startsWith('telegram://')) {
            const fileId = file.file_url.replace('telegram://', '')
            try {
                const downloadUrl = await getTelegramFileUrl(fileId)

                // Proxy the file: fetch from Telegram and stream to client
                const fileResponse = await fetch(downloadUrl)
                if (!fileResponse.ok) {
                    throw new Error(`Telegram file fetch failed: ${fileResponse.status}`)
                }

                const fileBuffer = await fileResponse.arrayBuffer()
                const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream'

                // Sanitize filename for Content-Disposition
                const safeTitle = (file.title || 'download').replace(/[^a-zA-Z0-9._-]/g, '_')
                const extension = contentType.includes('pdf') ? '.pdf' : ''
                const filename = safeTitle.endsWith('.pdf') ? safeTitle : `${safeTitle}${extension}`

                return new NextResponse(fileBuffer, {
                    status: 200,
                    headers: {
                        'Content-Type': contentType,
                        'Content-Disposition': `attachment; filename="${filename}"`,
                        'Content-Length': fileBuffer.byteLength.toString(),
                        'Cache-Control': 'private, max-age=3600',
                    },
                })
            } catch (tgError) {
                console.error('Telegram download error:', tgError)
                return NextResponse.json({ error: 'Failed to retrieve file from storage' }, { status: 502 })
            }
        }

        // 3. Handle local storage reference
        if (file.file_url?.startsWith('local://')) {
            return NextResponse.json({ error: 'File is stored locally and cannot be downloaded in production' }, { status: 400 })
        }

        // 4. For direct URLs (e.g. Supabase Storage), redirect
        if (file.file_url) {
            return NextResponse.redirect(file.file_url)
        }

        return NextResponse.json({ error: 'No file URL available' }, { status: 400 })

    } catch (e) {
        console.error('Download error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE method to remove a file
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const user = await verifyAuth(req)

        // Only admins can delete
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createClient()
        if (!supabase) return NextResponse.json({ error: 'Database error' }, { status: 500 })

        const { error } = await supabase
            .from('uploaded_pdfs')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
