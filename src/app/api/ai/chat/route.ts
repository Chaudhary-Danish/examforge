import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

// Custom responses for specific questions
function getCustomResponse(message: string): string | null {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('who built you') ||
        lowerMessage.includes('who made you') ||
        lowerMessage.includes('who created you') ||
        lowerMessage.includes('who developed you') ||
        lowerMessage.includes('your creator') ||
        lowerMessage.includes('your developer')) {
        return "I'm built for a specific Exam purpose and the Name is ExamForge, built truly by Danish. 🦊"
    }

    if (lowerMessage.includes('what is examforge') || lowerMessage.includes('about examforge')) {
        return "ExamForge is an AI-powered exam preparation platform built by Danish. I help students prepare using PYQs, study materials, and AI tutoring. 🦊📚"
    }

    return null
}

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        const supabase = createClient()

        const { message, conversationId, file, subjectId } = await req.json()

        if (!message && !file) {
            return NextResponse.json({ error: 'Message or file is required' }, { status: 400 })
        }

        // Logic to get or create conversation
        let currentConversationId = conversationId;
        if (!currentConversationId && supabase) {
            const { data: newConv } = await supabase
                .from('ai_conversations')
                .insert({
                    user_id: user.id,
                    subject_id: subjectId || null, // Link to subject if applicable
                    title: message ? (message.substring(0, 30) + '...') : 'File Upload Analysis',
                    preview: message ? (message.substring(0, 50)) : 'Sent a file'
                })
                .select('id')
                .single()

            if (newConv) currentConversationId = newConv.id
        }

        // Check for custom responses first (only for text messages)
        if (message) {
            const customResponse = getCustomResponse(message)
            if (customResponse) {
                if (supabase && currentConversationId) {
                    await saveMessage(supabase, user.id, currentConversationId, 'user', message)
                    await saveMessage(supabase, user.id, currentConversationId, 'assistant', customResponse)
                }
                return NextResponse.json({
                    response: customResponse,
                    conversationId: currentConversationId
                })
            }
        }

        const apiKey = process.env.OPENROUTER_API_KEY
        if (!apiKey) {
            return NextResponse.json({ response: "AI service is not configured." })
        }

        // --- FILE PROCESSING ---
        let finalMessage = message || "Analyze this file."
        let geminiParts: any[] = [] // Parts for Gemini (Text + Image)
        let systemContextAddition = ""
        let userContextAddition = ""

        if (file && file.data) {
            console.log(`Processing file: ${file.name} (${file.type})`)

            if (file.type.startsWith('image/')) {
                // IMAGE: Send as inline data to Gemini
                // Remove header if present (data:image/png;base64,)
                const base64Data = file.data.includes('base64,') ? file.data.split('base64,')[1] : file.data;

                geminiParts.push({
                    type: "image_url", // OpenRouter/Gemini format
                    image_url: {
                        url: `data:${file.type};base64,${base64Data}`
                    }
                })

                // Also append text part
                geminiParts.push({ type: "text", text: finalMessage })

            } else if (file.type === 'application/pdf') {
                // PDF: Parse text on server
                try {
                    const { createRequire } = await import('module')
                    const require = createRequire(import.meta.url)
                    const pdfParse = require('pdf-parse')

                    const buffer = Buffer.from(file.data.includes('base64,') ? file.data.split('base64,')[1] : file.data, 'base64')
                    const data = await pdfParse(buffer)

                    const pdfText = data.text.trim()
                    if (pdfText) {
                        // Add to context
                        userContextAddition = `\n\n[USER ATTACHED PDF: ${file.name}]\nCONTENT START:\n${pdfText.substring(0, 10000)}\nCONTENT END\n`
                        finalMessage += `\n(I have attached a PDF file: ${file.name}. Please analyze its content provided in the system context.)`
                        geminiParts.push({ type: "text", text: finalMessage })
                    } else {
                        finalMessage += "\n(Attached PDF was empty or unreadable)."
                        geminiParts.push({ type: "text", text: finalMessage })
                    }
                } catch (e) {
                    console.error('PDF Parse Error in Chat:', e)
                    finalMessage += "\n(Failed to parse attached PDF file)."
                    geminiParts.push({ type: "text", text: finalMessage })
                }
            } else {
                geminiParts.push({ type: "text", text: finalMessage })
            }
        } else {
            // Text only
            geminiParts.push({ type: "text", text: finalMessage })
        }


        // Fetch recent history
        let history: any[] = []
        if (supabase && currentConversationId) {
            const { data: dbHistory } = await supabase
                .from('ai_chat_history')
                .select('role, content')
                .eq('conversation_id', currentConversationId)
                .order('created_at', { ascending: false }) // NEWEST FIRST
                .limit(10)

            if (dbHistory) {
                history = dbHistory.reverse().map(h => ({ role: h.role, content: h.content }))
            }
        }

        // Get Subject Context & Materials
        let pdfContext = ""
        let subjectName = "General"

        if (supabase) {
            // If subjectId is present, fetch subject specific materials
            if (subjectId) {
                // Get subject name
                const { data: subject } = await supabase.from('subjects').select('name').eq('id', subjectId).single()
                if (subject) subjectName = subject.name

                // Fetch subject PDFs
                const { data: pdfs } = await supabase
                    .from('uploaded_pdfs')
                    .select('id, title, type, year, text_content')
                    .eq('subject_id', subjectId)
                    .eq('is_active', true)
                    .limit(5) // Limit to 5 for subject context

                if (pdfs && pdfs.length > 0) {
                    const pdfsWithContent = pdfs.filter(p => p.text_content)
                    if (pdfsWithContent.length > 0) {
                        pdfContext = pdfsWithContent.map(p => `[MATERIAL: ${p.title} (${p.type})]\n${p.text_content?.substring(0, 1500)}`).join('\n\n')
                    }
                }
            } else {
                // General context (existing logic)
                const { data: pdfs } = await supabase
                    .from('uploaded_pdfs')
                    .select('id, title, type, year, text_content')
                    .eq('is_active', true)
                    .limit(3)

                if (pdfs && pdfs.length > 0) {
                    const pdfsWithContent = pdfs.filter(p => p.text_content)
                    if (pdfsWithContent.length > 0) {
                        pdfContext = pdfsWithContent.map(p => `[DB PDF: ${p.title}]\n${p.text_content?.substring(0, 1000)}`).join('\n\n')
                    }
                }
            }
        }

        const systemPrompt = `You are ExamForge AI Tutor.
IDENTITY:
- Creator: Danish
- Purpose: Help students prepare for exams
- Subject Context: ${subjectName}
- Tone: Helpful, intelligent, encouraging

CONTEXT:
${pdfContext ? `LIBRARY MATERIALS:\n${pdfContext}` : ''}
${userContextAddition || systemContextAddition}

INSTRUCTIONS:
1. Answer ANY question.
2. If an Image is provided, analyze it (Math problem, Diagram, Text).
3. If a PDF is provided in context, answer questions based on it.
4. Use markdown.
`
        // Construct Messages for OpenRouter
        // If Image -> User message is array of parts? OpenRouter supports this for 'google/gemini...'
        // OpenAI format: content: [ {type: text, text: ...}, {type: image_url, ...} ]

        let userContent: any = finalMessage
        if (file && file.type.startsWith('image/')) {
            // Use OpenAI Multimodal format which OpenRouter maps to Gemini
            const base64Data = file.data.includes('base64,') ? file.data.split('base64,')[1] : file.data;
            userContent = [
                { type: "text", text: finalMessage },
                { type: "image_url", image_url: { url: `data:${file.type};base64,${base64Data}` } }
            ]
        }

        const openRouterMessages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userContent }
        ]

        // Call OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'ExamForge AI Tutor'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: openRouterMessages,
                max_tokens: 1000,
                temperature: 0.7
            })
        })

        if (!response.ok) {
            console.error('OpenRouter error:', await response.text())
            // Return safe error
            return NextResponse.json({ response: "I'm having trouble. Please try again." })
        }

        const data = await response.json()
        let aiResponse = data.choices?.[0]?.message?.content || "I couldn't generate a response."

        // Append PDF info if relevant
        // if (pdfInfo && message.toLowerCase().includes('material')) {
        //     aiResponse += pdfInfo
        // }

        // Save messages
        if (supabase && currentConversationId) {
            // If file attached, save a placeholder for the file content
            let savedUserMessage = message || ""
            if (file) {
                savedUserMessage = `[Attached ${file.type.startsWith('image/') ? 'Image' : 'PDF'}: ${file.name}]\n${savedUserMessage}`
            }

            await saveMessage(supabase, user.id, currentConversationId, 'user', savedUserMessage)
            await saveMessage(supabase, user.id, currentConversationId, 'assistant', aiResponse)

            // Update conversation preview and updated_at
            await supabase.from('ai_conversations')
                .update({
                    preview: aiResponse.substring(0, 50) + '...',
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentConversationId)
        }

        return NextResponse.json({
            response: aiResponse,
            conversationId: currentConversationId
        })

    } catch (error) {
        console.error('AI Chat error:', error)
        return NextResponse.json({ response: "Something went wrong. Please try again." })
    }
}

// GET messages for a conversation
export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        const { searchParams } = new URL(req.url)
        const conversationId = searchParams.get('conversationId')

        const supabase = createClient()
        if (!supabase) return NextResponse.json({ messages: [] })

        if (conversationId) {
            const { data } = await supabase
                .from('ai_chat_history')
                .select('role, content, created_at')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            return NextResponse.json({ messages: data || [] })
        }

        return NextResponse.json({ messages: [] })
    } catch {
        return NextResponse.json({ messages: [] })
    }
}

// Helper to save message row
async function saveMessage(supabase: any, userId: string, conversationId: string, role: string, content: string) {
    try {
        await supabase.from('ai_chat_history').insert({
            user_id: userId,
            conversation_id: conversationId,
            role,
            content
        })
    } catch (e) {
        console.error('Failed to save message:', e)
    }
}
