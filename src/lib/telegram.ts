import { NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim()
const CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim()

export async function uploadToTelegram(fileBuffer: Buffer, fileName: string, mimeType: string) {
    if (!BOT_TOKEN || !CHAT_ID) {
        throw new Error('Telegram credentials missing')
    }

    const formData = new FormData()
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType })
    formData.append('document', blob, fileName)
    formData.append('chat_id', CHAT_ID)

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: formData
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Telegram upload failed: ${err}`)
    }

    const data = await res.json()
    if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`)
    }

    // Return the file_id for storage
    return data.result.document.file_id
}

export async function getTelegramFileUrl(fileId: string) {
    if (!BOT_TOKEN) throw new Error('Bot token missing')

    // 1. Get file path
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`)
    const data = await res.json()

    if (!data.ok) throw new Error(`Telegram getFile error: ${data.description}`)

    const filePath = data.result.file_path

    // 2. Construct download URL
    return `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`
}
