import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTelegramFileUrl } from '@/lib/telegram'

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

        // 2. Handle storage types
        let downloadUrl = file.file_url

        if (file.file_url?.startsWith('telegram://')) {
            const fileId = file.file_url.replace('telegram://', '')
            try {
                // Get fresh download URL from Telegram
                downloadUrl = await getTelegramFileUrl(fileId)

                // 3. Redirect to fresh URL (Seamless Download)
                return NextResponse.redirect(downloadUrl)
            } catch (tgError) {
                console.error('Telegram extraction error:', tgError)
                return NextResponse.json({ error: 'Failed to retrieve file from storage' }, { status: 502 })
            }
        }

        if (file.file_url?.startsWith('local://')) {
            return NextResponse.json({ error: 'File is stored locally and cannot be downloaded in production' }, { status: 400 })
        }

        // 4. Default Redirect (e.g. Supabase Storage)
        if (downloadUrl) {
            return NextResponse.redirect(downloadUrl)
        }

        return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 })

        // ... existing code ...

        return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 })

    } catch (e) {
        console.error('Download error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE method to remove a file
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'


export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const user = await verifyAuth(req)

        // Only admins can delete for now
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
