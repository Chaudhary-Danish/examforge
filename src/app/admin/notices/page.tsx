'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Bell, Trash2, CheckCircle } from 'lucide-react'
import Loader from '@/components/Loader'

interface Notice {
    id: string
    title: string
    content: string
    priority: 'low' | 'medium' | 'high'
    created_at: string
}

export default function AdminNoticesPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState<{ title: string; content: string; priority: 'low' | 'medium' | 'high' }>({ title: '', content: '', priority: 'medium' })
    const [success, setSuccess] = useState(false)

    const { data: user, isLoading: userLoading, isError: userError } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const res = await fetch('/api/user/me')
            if (!res.ok) throw new Error('Unauthorized')
            const data = await res.json()
            if (data.role !== 'admin') throw new Error('Not admin')
            return data
        },
        retry: false
    })

    useEffect(() => {
        if (userError) router.push('/login')
    }, [userError, router])

    const { data: notices, isLoading: noticesLoading } = useQuery<Notice[]>({
        queryKey: ['admin-notices'],
        queryFn: async () => {
            const res = await fetch('/api/notices')
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
        enabled: !!user
    })

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await fetch('/api/notices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Failed to create notice')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notices'] })
            queryClient.invalidateQueries({ queryKey: ['notices'] })
            setFormData({ title: '', content: '', priority: 'medium' })
            setShowForm(false)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/notices?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notices'] })
            queryClient.invalidateQueries({ queryKey: ['notices'] })
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title || !formData.content) return
        createMutation.mutate(formData)
    }

    if (userLoading || noticesLoading) {
        return <Loader text="Loading notices..." />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/admin/dashboard" className="p-2 hover:bg-slate-100 rounded-xl">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                    <Bell className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="font-semibold text-slate-900 text-sm">Send Notices</h1>
                                    <span className="text-xs text-slate-500">Broadcast to all students</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="btn-primary text-sm flex items-center gap-1"
                        >
                            <Send className="w-4 h-4" />
                            New Notice
                        </button>
                    </div>
                </div>
            </header>

            {/* Success Message */}
            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="max-w-4xl mx-auto px-4 mt-4"
                >
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Notice sent successfully!</span>
                    </div>
                </motion.div>
            )}

            {/* Create Form */}
            {showForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="max-w-4xl mx-auto px-4 mt-4"
                >
                    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Notice title..."
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                            <textarea
                                value={formData.content}
                                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="Write your notice here..."
                                rows={4}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                            <div className="flex gap-2">
                                {(['low', 'medium', 'high'] as const).map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${formData.priority === p
                                            ? p === 'high' ? 'bg-red-500 text-white'
                                                : p === 'medium' ? 'bg-orange-500 text-white'
                                                    : 'bg-green-500 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="flex-1 btn-primary"
                            >
                                {createMutation.isPending ? 'Sending...' : 'Send Notice'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Notices List */}
            <main className="max-w-4xl mx-auto px-4 py-6">
                <h2 className="text-sm font-semibold text-slate-500 mb-3">Sent Notices ({notices?.length || 0})</h2>

                {notices?.length === 0 ? (
                    <div className="text-center py-16 glass-card rounded-2xl">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <h3 className="font-semibold text-slate-900 mb-1">No notices yet</h3>
                        <p className="text-slate-500 text-sm">Click "New Notice" to send your first announcement</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notices?.map((notice, index) => (
                            <motion.div
                                key={notice.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card rounded-xl p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${notice.priority === 'high' ? 'bg-red-500'
                                                : notice.priority === 'medium' ? 'bg-orange-500'
                                                    : 'bg-green-500'
                                                }`} />
                                            <h3 className="font-medium text-slate-900 text-sm truncate">{notice.title}</h3>
                                        </div>
                                        <p className="text-slate-600 text-xs line-clamp-2">{notice.content}</p>
                                        <p className="text-slate-400 text-xs mt-1">
                                            {new Date(notice.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this notice?')) {
                                                deleteMutation.mutate(notice.id)
                                            }
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
