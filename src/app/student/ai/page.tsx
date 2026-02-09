'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Send, User as UserIcon, Menu, X, Plus,
    Home, Bell, FileText, User, Square, Trash2, MessageSquare, Clock
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Loader from '@/components/Loader'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    isTyping?: boolean
}

interface Conversation {
    id: string
    title: string
    created_at: string
    preview: string
}

// Typewriter hook with scroll callback
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

// Markdown renderer with typewriter
function MarkdownContent({ content, isTyping, onUpdate }: { content: string; isTyping?: boolean; onUpdate?: () => void }) {
    const { displayedText, isComplete } = useTypewriter(isTyping ? content : '', 10, onUpdate)
    const textToRender = isTyping ? displayedText : content

    return (
        <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-p:text-slate-700 prose-p:my-1.5 prose-p:text-sm prose-strong:text-slate-900 prose-ul:my-1 prose-li:text-sm prose-code:bg-orange-50 prose-code:text-orange-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{textToRender}</ReactMarkdown>
            {isTyping && !isComplete && <span className="inline-block w-1.5 h-4 bg-orange-500 animate-pulse ml-0.5" />}
        </div>
    )
}

export default function AITutorPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [abortController, setAbortController] = useState<AbortController | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    const { data: user, isLoading } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const res = await fetch('/api/user/me')
            if (!res.ok) { router.push('/login'); throw new Error('Unauthorized') }
            return res.json()
        }
    })

    // Fetch conversation history list
    const { data: conversations } = useQuery<Conversation[]>({
        queryKey: ['ai-conversations'],
        queryFn: async () => {
            const res = await fetch('/api/ai/conversations')
            if (!res.ok) return []
            return res.json()
        },
        enabled: !!user
    })

    // Load specific conversation
    const loadConversation = async (conversationId: string) => {
        try {
            const res = await fetch(`/api/ai/conversations/${conversationId}`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data.messages?.map((m: { role: string; content: string }, i: number) => ({
                    ...m,
                    id: `msg-${i}`,
                    isTyping: false
                })) || [])
                setCurrentConversationId(conversationId)
                setSidebarOpen(false)
            }
        } catch (error) {
            console.error('Failed to load conversation:', error)
        }
    }

    // Start new conversation
    const startNewConversation = () => {
        setMessages([])
        setCurrentConversationId(null)
        setSidebarOpen(false)
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 5 * 1024 * 1024) {
                alert('File too large (Max 5MB)')
                return
            }
            setSelectedFile(file)
        }
    }

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || loading) return

        const userMessage = input.trim()
        const fileToSend = selectedFile

        setInput('')
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''

        const userMsgId = Date.now().toString()
        const displayContent = fileToSend
            ? `[Attached ${fileToSend.name}]\n${userMessage}`
            : userMessage

        setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: displayContent }])
        setLoading(true)

        const controller = new AbortController()
        setAbortController(controller)

        try {
            // Read file as base64 if exists
            let fileData = null
            if (fileToSend) {
                const reader = new FileReader()
                fileData = await new Promise((resolve) => {
                    reader.onload = (e) => resolve({
                        name: fileToSend.name,
                        type: fileToSend.type,
                        data: e.target?.result
                    })
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
                    history: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
                }),
                signal: controller.signal
            })

            if (!res.ok) throw new Error('Failed')

            const data = await res.json()
            const aiMsgId = (Date.now() + 1).toString()

            if (data.conversationId && !currentConversationId) {
                setCurrentConversationId(data.conversationId)
            }

            setMessages(prev => [...prev, {
                id: aiMsgId,
                role: 'assistant',
                content: data.response,
                isTyping: true
            }])

            // Invalidate conversations to update sidebar
            queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })

            // ... inside handleSend
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isTyping: false } : m))
                setLoading(false)
                setAbortController(null)
            }, (data.response?.length || 0) * 12 + 500)
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: "⏹️ Response stopped." }])
            } else {
                setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: "Sorry, something went wrong." }])
            }
            setLoading(false)
            setAbortController(null)
        }
    }

    const handleStop = () => {
        if (abortController) {
            abortController.abort()
        }
        setMessages(prev => prev.map(m => ({ ...m, isTyping: false })))
        setLoading(false)
        setAbortController(null)
    }

    const deleteConversation = async (id: string) => {
        try {
            await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' })
            queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
            if (currentConversationId === id) {
                startNewConversation()
            }
        } catch (error) {
            console.error('Delete failed:', error)
        }
    }

    if (isLoading) return <Loader text="Loading AI Tutor..." />

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 flex">
            {/* Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/30 z-40 md:hidden"
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
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-900">Chat History</h2>
                            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>

                        {/* New Chat Button */}
                        <div className="p-3">
                            <button
                                onClick={startNewConversation}
                                className="w-full flex items-center gap-2 px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                New Chat
                            </button>
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {conversations?.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    No conversations yet
                                </div>
                            ) : (
                                conversations?.map(conv => (
                                    <div
                                        key={conv.id}
                                        className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer ${currentConversationId === conv.id
                                            ? 'bg-orange-50 text-orange-700'
                                            : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <button
                                            onClick={() => loadConversation(conv.id)}
                                            className="flex-1 text-left min-w-0"
                                        >
                                            <p className="text-sm font-medium truncate">{conv.title || 'New Chat'}</p>
                                            <p className="text-xs text-slate-400 truncate">{conv.preview}</p>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (confirm('Delete this conversation?')) {
                                                    deleteConversation(conv.id)
                                                }
                                            }}
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

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 px-4 py-3 sticky top-0 z-30">
                    <div className="max-w-2xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 hover:bg-slate-100 rounded-xl"
                            >
                                <Menu className="w-5 h-5 text-slate-600" />
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                                    <span className="text-lg">🦊</span>
                                </div>
                                <div>
                                    <h1 className="font-semibold text-slate-900 text-sm">AI Tutor</h1>
                                    <p className="text-slate-500 text-xs">ExamForge AI</p>
                                </div>
                            </div>
                        </div>
                        <Link href="/student/dashboard" className="p-2 hover:bg-slate-100 rounded-xl">
                            <Home className="w-5 h-5 text-slate-600" />
                        </Link>
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 pb-40">
                    <div className="max-w-2xl mx-auto space-y-4">
                        {messages.length === 0 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                                    <span className="text-3xl">🦊</span>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 mb-2">Hey {user?.name?.split(' ')[0] || 'there'}! 👋</h2>
                                <p className="text-slate-500 text-sm mb-6">Ask me anything about your subjects!</p>
                                <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                                    {["Explain OOP concepts", "DBMS normalization?", "Who built you?", "Help with exams"].map(q => (
                                        <button key={q} onClick={() => setInput(q)} className="glass-card p-3 rounded-xl text-left text-xs text-slate-600 hover:bg-orange-50">
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {messages.map((msg) => (
                            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-xs">🦊</span>
                                    </div>
                                )}
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-orange-500 text-white' : 'glass-card text-slate-700'}`}>
                                    {msg.role === 'user' ? <p className="whitespace-pre-wrap">{msg.content}</p> : <MarkdownContent content={msg.content} isTyping={msg.isTyping} onUpdate={scrollToBottom} />}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                        <UserIcon className="w-4 h-4 text-slate-600" />
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {loading && (
                            <div className="flex gap-2">
                                <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                                    <span className="text-xs">🦊</span>
                                </div>
                                <div className="glass-card p-3 rounded-2xl">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-200/50 px-4 py-3 z-30">
                    <div className="max-w-2xl mx-auto space-y-2">
                        {/* File Preview */}
                        <AnimatePresence>
                            {selectedFile && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg w-fit"
                                >
                                    <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                                        {selectedFile.type.startsWith('image/') ? (
                                            <span className="text-xs">🖼️</span>
                                        ) : (
                                            <span className="text-xs">📄</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-600 max-w-[150px] truncate">
                                        {selectedFile.name}
                                    </div>
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        className="ml-2 text-slate-400 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-2 items-end">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,application/pdf"
                                onChange={handleFileSelect}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                                title="Attach Image or PDF"
                            >
                                <Plus className="w-5 h-5" />
                            </button>

                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSend()
                                    }
                                }}
                                placeholder="Ask me anything..."
                                rows={1}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none max-h-32"
                                disabled={loading}
                            />
                            {loading ? (
                                <button onClick={handleStop} className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600" title="Stop">
                                    <Square className="w-4 h-4" />
                                </button>
                            ) : (
                                <button onClick={handleSend} disabled={!input.trim() && !selectedFile} className="btn-primary px-4 py-3 h-full">
                                    <Send className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-200/50 md:hidden z-50">
                    <div className="flex justify-around items-center py-2">
                        <Link href="/student/dashboard" className="flex flex-col items-center p-2 text-slate-500">
                            <Home className="w-5 h-5" />
                            <span className="text-xs mt-0.5">Home</span>
                        </Link>
                        <Link href="/student/pyqs" className="flex flex-col items-center p-2 text-slate-500">
                            <FileText className="w-5 h-5" />
                            <span className="text-xs mt-0.5">PYQs</span>
                        </Link>
                        <Link href="/student/notices" className="flex flex-col items-center p-2 text-slate-500 relative">
                            <Bell className="w-5 h-5" />
                            <span className="text-xs mt-0.5">Notices</span>
                        </Link>
                        <Link href="/student/profile" className="flex flex-col items-center p-2 text-slate-500">
                            <User className="w-5 h-5" />
                            <span className="text-xs mt-0.5">Profile</span>
                        </Link>
                    </div>
                </nav>
            </div>
        </div>
    )
}
