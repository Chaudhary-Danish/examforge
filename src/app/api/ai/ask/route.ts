import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuth } from '@/lib/auth'

const AI_NAME = "ExamForge AI Tutor"
const AI_CREATOR = "Dude:)"

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        const { subjectId, question } = await req.json()

        if (!subjectId || !question) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const openRouterApiKey = process.env.OPENROUTER_API_KEY

        // Check for identity questions
        const lowerQuestion = question.toLowerCase()
        if (lowerQuestion.includes('who built you') ||
            lowerQuestion.includes('who made you') ||
            lowerQuestion.includes('who created you') ||
            lowerQuestion.includes('your name') ||
            lowerQuestion.includes('who are you')) {
            return NextResponse.json({
                answer: `I'm built for a specific Exam purpose and the Name is ExamForge, built truly by ${AI_CREATOR}. 🦊\n\nI help students prepare for exams using uploaded study materials and PYQs.`,
                sources: [],
                confidence: 1.0
            })
        }

        if (!openRouterApiKey) {
            return NextResponse.json({
                answer: `## 🔧 API Not Configured\n\nI'm the **${AI_NAME}**, built by **${AI_CREATOR}**.\n\nTo enable AI responses, please add your OpenRouter API key to the \`.env\` file.`,
                sources: []
            })
        }

        const supabase = createClient()
        let subjectName = 'this subject'
        let uploadedContent = ''
        let materialsList: string[] = []

        if (supabase) {
            // Get subject details
            const { data: subject } = await supabase
                .from('subjects')
                .select('name')
                .eq('id', subjectId)
                .single()

            if (subject) subjectName = subject.name

            // Get uploaded PDFs content - using correct column name 'text_content'
            const { data: pdfs } = await supabase
                .from('uploaded_pdfs')
                .select('id, title, text_content, type, year')
                .eq('subject_id', subjectId)
                .eq('is_active', true)

            if (pdfs && pdfs.length > 0) {
                materialsList = pdfs.map(p => `${p.title} (${p.type}, ${p.year || 'N/A'})`)

                // Include text content if available
                const pdfsWithContent = pdfs.filter(p => p.text_content)
                if (pdfsWithContent.length > 0) {
                    uploadedContent = pdfsWithContent
                        .map(p => `### ${p.title} (${p.type})\n${p.text_content}`)
                        .join('\n\n---\n\n')
                }
            }
        }

        // Build system prompt
        const systemPrompt = `You are "${AI_NAME}", an AI tutor built by ${AI_CREATOR} for ExamForge.

## Your Identity
- Name: ${AI_NAME}
- Creator: ${AI_CREATOR}
- Purpose: Help students prepare for exams using uploaded materials
- If asked "who built you", respond: "I'm built for a specific Exam purpose and the Name is ExamForge.🦊"

## Subject: ${subjectName}

${materialsList.length > 0 ? `## Available Materials (${materialsList.length} files)
${materialsList.map(m => '- ' + m).join('\n')}` : '## No materials uploaded yet'}

${uploadedContent ? `## Study Material Content
${uploadedContent.substring(0, 12000)}` : ''}

## Response Guidelines
1. Be helpful, friendly, and encouraging
2. Use markdown formatting (headers, bullets, bold)
3. Keep responses under 500 words
4. If materials are available, reference them
5. For non-educational questions, politely redirect to study topics
6. Be honest if information isn't in the materials`

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'ExamForge AI Tutor'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: question }
                ],
                max_tokens: 1024,
                temperature: 0.7
            })
        })

        if (!response.ok) {
            console.error('OpenRouter error:', await response.text())
            return NextResponse.json({
                answer: "I'm having trouble responding. Please try again.",
                sources: []
            })
        }

        const data = await response.json()
        const answer = data.choices?.[0]?.message?.content || 'I could not generate a response.'

        return NextResponse.json({
            answer,
            sources: [],
            confidence: uploadedContent ? 0.8 : 0.5
        })

    } catch (error: unknown) {
        console.error('AI ask error:', error)
        const message = error instanceof Error ? error.message : 'AI request failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    return NextResponse.json({ success: true })
}
