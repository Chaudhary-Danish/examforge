'use client'

import { useState, useRef, useEffect, use, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, FileText, BookOpen, MessageSquare, Download, Square, Menu, X, Plus, Trash2, Paperclip } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Loader from '@/components/Loader'

interface SubjectDetail {
    id: string
    name: string
    code: string
    description?: string
    pyqs: { id: string; title: string; year: number; exam_type: string; file_url: string }[]
    books: { id: string; title: string; author: string; file_url: string }[]
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    isTyping?: boolean
}

interface Conversation {
    id: string
    title: string
    preview: string
    created_at: string
}

// Typewriter hook
function useTypewriter(text: string, speed: number = 12, onUpdate?: () => void) {
    const [displayedText, setDisplayedText] = useState('')
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        setDisplayedText('')
        setIsComplete(false)
        if (!text) return

        let index = 0
        const timer = setInterval(() => {
            if (index < text.length) {
                setDisplayedText(text.substring(0, index + 1))
                index++
                if (index % 5 === 0 && onUpdate) onUpdate()
            } else {
                setIsComplete(true)
                clearInterval(timer)
                if (onUpdate) onUpdate()
            }
        }, speed)

        return () => clearInterval(timer)
    }, [text, speed, onUpdate])

    return { displayedText, isComplete }
}

// Markdown renderer
function MarkdownContent({ content, isTyping, onUpdate }: { content: string; isTyping?: boolean; onUpdate?: () => void }) {
    const { displayedText, isComplete } = useTypewriter(isTyping ? content : '', 10, onUpdate)
    const textToRender = isTyping ? displayedText : content

    return (
        <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-p:text-slate-700 prose-p:my-1.5 prose-p:text-sm prose-code:bg-orange-50 prose-code:text-orange-700 prose-code:px-1.5 prose-code:rounded prose-code:text-xs prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-lg prose-pre:p-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{textToRender}</ReactMarkdown>
            {isTyping && !isComplete && <span className="inline-block w-1.5 h-4 bg-orange-500 animate-pulse ml-0.5" />}
        </div>
    )
}

export default function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [activeTab, setActiveTab] = useState<'chat' | 'pyqs' | 'books'>('chat')
    const router = useRouter()

    const { data: subject, isLoading } = useQuery<SubjectDetail>({
        queryKey: ['subject', id],
        queryFn: async () => {
            const res = await fetch(`/api/subjects/${id}`)
            if (!res.ok) {
                if (res.status === 401) router.push('/login')
                throw new Error('Failed')
            }
            return res.json()
        }
    })

    if (isLoading) return <Loader text="Loading subject..." />

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
            {/* Header */}
            <header className="bg-white/70 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                <span className="text-lg">🦊</span>
                            </div>
                            <div>
                                <h1 className="font-semibold text-slate-900 text-sm">{subject?.name}</h1>
                                <span className="text-xs text-slate-500">{subject?.code}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-4xl mx-auto px-4 py-3">
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    {[
                        { key: 'chat', icon: MessageSquare, label: 'AI Chat' },
                        { key: 'pyqs', icon: FileText, label: `PYQs (${subject?.pyqs.length || 0})` },
                        { key: 'books', icon: BookOpen, label: `Books (${subject?.books.length || 0})` }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as 'chat' | 'pyqs' | 'books')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.key ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 pb-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'chat' && (
                        <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ChatInterface subjectId={id} subjectName={subject?.name || ''} pyqCount={subject?.pyqs.length || 0} />
                        </motion.div>
                    )}
                    {activeTab === 'pyqs' && (
                        <motion.div key="pyqs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <MaterialsList items={subject?.pyqs || []} type="pyq" />
                        </motion.div>
                    )}
                    {activeTab === 'books' && (
                        <motion.div key="books" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <MaterialsList items={subject?.books || []} type="book" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

// Chat Interface with Hamburger History
function ChatInterface({ subjectId, subjectName, pyqCount }: { subjectId: string; subjectName: string; pyqCount: number }) {
    const queryClient = useQueryClient()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [abortController, setAbortController] = useState<AbortController | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Fetch conversations
    const { data: conversations } = useQuery<Conversation[]>({
        queryKey: ['subject-conversations', subjectId],
        queryFn: async () => {
            const res = await fetch(`/api/ai/subject/${subjectId}/conversations`)
            if (!res.ok) return []
            return res.json()
        }
    })

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

    const startNewConversation = async () => {
        setMessages([])
        setCurrentConversationId(null)
        setSidebarOpen(false)
    }

    const loadConversation = async (convId: string) => {
        try {
            const res = await fetch(`/api/ai/subject/${subjectId}/conversations/${convId}`)
            const data = await res.json()
            setMessages(data.messages?.map((m: { id: string; role: string; content: string }) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content
            })) || [])
            setCurrentConversationId(convId)
            setSidebarOpen(false)
        } catch { /* ignore */ }
    }

    const deleteConversation = async (convId: string) => {
        await fetch(`/api/ai/subject/${subjectId}/conversations/${convId}`, { method: 'DELETE' })
        queryClient.invalidateQueries({ queryKey: ['subject-conversations', subjectId] })
        if (currentConversationId === convId) startNewConversation()
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
        }
    }

    const removeFile = () => {
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((!input.trim() && !selectedFile) || loading) return

        const userMessage = input.trim()
        const fileToSend = selectedFile

        setInput('')
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''

        const userMsgId = Date.now().toString()
        const displayContent = fileToSend
            ? `[Attached ${fileToSend.type.startsWith('image/') ? 'Image' : 'PDF'}: ${fileToSend.name}]\n${userMessage}`
            : userMessage

        setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: displayContent }])
        setLoading(true)

        const controller = new AbortController()
        setAbortController(controller)

        try {
            // Read file as Base64 if exists
            let fileData = null
            if (fileToSend) {
                fileData = await new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve({
                        name: fileToSend.name,
                        type: fileToSend.type,
                        data: reader.result
                    })
                    reader.onerror = reject
                    reader.readAsDataURL(fileToSend)
                })
            }

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    file: fileData,
                    conversationId: currentConversationId,
                    subjectId
                }),
                signal: controller.signal
            })

            const data = await res.json()

            if (data.conversationId) {
                setCurrentConversationId(data.conversationId)
                queryClient.invalidateQueries({ queryKey: ['subject-conversations', subjectId] })
            }

            const aiContent = data.response || data.error || 'Sorry, something went wrong.'
            const aiMsgId = (Date.now() + 1).toString()

            setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: aiContent, isTyping: true }])

            // Note: Messages are saved by the API now

            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isTyping: false } : m))
                setLoading(false)
                setAbortController(null)
            }, (aiContent.length || 0) * 10 + 500)
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '⏹️ Response stopped.' }])
            } else {
                setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Error occurred.' }])
            }
            setLoading(false)
            setAbortController(null)
        }
    }

    const handleStop = () => {
        if (abortController) {
            abortController.abort()
        }
        // Force stop typing immediately
        setMessages(prev => prev.map(m => ({ ...m, isTyping: false })))
        setLoading(false)
        setAbortController(null)
    }

    return (
        <>
            {/* Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/30 z-40"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 z-50 flex flex-col"
                    >
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-900">Chat History</h2>
                            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                        <div className="p-3">
                            <button onClick={startNewConversation} className="w-full flex items-center gap-2 px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl font-medium text-sm">
                                <Plus className="w-4 h-4" /> New Chat
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {conversations?.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    No conversations yet
                                </div>
                            ) : (
                                conversations?.map(conv => (
                                    <div key={conv.id} className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer ${currentConversationId === conv.id ? 'bg-orange-50 text-orange-700' : 'hover:bg-slate-50'}`}>
                                        <button onClick={() => loadConversation(conv.id)} className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-medium truncate">{conv.title || 'New Chat'}</p>
                                            <p className="text-xs text-slate-400 truncate">{conv.preview}</p>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteConversation(conv.id) }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Chat Container */}
            <div className="glass-card rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
                <div className="h-full flex flex-col">
                    {/* Chat Header with Hamburger */}
                    <div className="px-3 py-2 border-b border-slate-200/50 flex items-center gap-2">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg">
                            <Menu className="w-5 h-5 text-slate-600" />
                        </button>
                        <span className="text-sm text-slate-600">
                            {currentConversationId ? 'Chat History' : 'New Chat'}
                        </span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                                        <span className="text-2xl">🦊</span>
                                    </div>
                                    <h3 className="font-semibold text-slate-900 mb-1">AI Tutor for {subjectName}</h3>
                                    <p className="text-slate-500 text-sm mb-3">
                                        {pyqCount > 0 ? `I have access to ${pyqCount} materials` : 'Ask me anything about this subject'}
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                                        {['Explain key concepts', 'Help with exam prep'].map(q => (
                                            <button key={q} onClick={() => setInput(q)} className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs hover:bg-orange-100">
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-xs">🦊</span>
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-white/80 text-slate-700 border border-slate-200/50'}`}>
                                        {msg.role === 'user' ? (
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        ) : (
                                            <MarkdownContent content={msg.content} isTyping={msg.isTyping} onUpdate={scrollToBottom} />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && (
                            <div className="flex gap-2">
                                <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                                    <span className="text-xs">🦊</span>
                                </div>
                                <div className="bg-white/80 border border-slate-200/50 p-3 rounded-2xl">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-slate-200/50 bg-white/50">
                        {selectedFile && (
                            <div className="mb-2 flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg max-w-max">
                                <span className="text-xl">{selectedFile.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                                <div className="text-xs">
                                    <p className="font-medium text-slate-700 max-w-[150px] truncate">{selectedFile.name}</p>
                                    <p className="text-slate-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                                </div>
                                <button type="button" onClick={removeFile} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*,application/pdf"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                                title="Attach Image or PDF"
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask about this subject..."
                                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                disabled={loading}
                            />
                            {loading ? (
                                <button type="button" onClick={handleStop} className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl">
                                    <Square className="w-4 h-4" />
                                </button>
                            ) : (
                                <button type="submit" disabled={!input.trim()} className="btn-primary px-4">
                                    <Send className="w-4 h-4" />
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

// Materials List
function MaterialsList({ items, type }: { items: { id: string; title: string; year?: number; exam_type?: string; author?: string; file_url: string }[]; type: 'pyq' | 'book' }) {
    if (items.length === 0) {
        return (
            <div className="text-center py-16 glass-card rounded-2xl">
                <div className="text-5xl mb-3">{type === 'pyq' ? '📄' : '📚'}</div>
                <h3 className="font-semibold text-slate-900 mb-1">No {type === 'pyq' ? 'past papers' : 'books'} yet</h3>
                <p className="text-slate-500 text-sm">Your admin will upload materials soon</p>
            </div>
        )
    }

    const getDownloadUrl = (fileUrl: string, id: string) => {
        if (!fileUrl) return '#'
        if (fileUrl.startsWith('telegram://') || fileUrl.startsWith('local://')) {
            return `/api/files/${id}`
        }
        return fileUrl
    }

    return (
        <div className="space-y-2">
            {items.map((item, index) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card rounded-xl p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            {type === 'pyq' ? <FileText className="w-5 h-5 text-orange-600" /> : <BookOpen className="w-5 h-5 text-orange-600" />}
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-900 text-sm">{item.title}</h4>
                            <p className="text-slate-500 text-xs">{type === 'pyq' ? `${item.year} • ${item.exam_type}` : `by ${item.author}`}</p>
                        </div>
                    </div>
                    <a
                        href={getDownloadUrl(item.file_url, item.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Download"
                    >
                        <Download className="w-5 h-5" />
                    </a>
                </motion.div>
            ))}
        </div>
    )
}
