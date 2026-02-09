'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, AlertCircle, Calendar, X, Download, Home, FileText, User } from 'lucide-react'
import Loader from '@/components/Loader'

interface Notice {
    id: string
    title: string
    content?: string
    file_url?: string
    file_name?: string
    is_urgent: boolean
    is_read?: boolean
    created_at: string
}

export default function NoticesPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

    const { data: notices, isLoading } = useQuery<Notice[]>({
        queryKey: ['notices'],
        queryFn: async () => {
            const res = await fetch('/api/notices')
            if (!res.ok) { router.push('/login'); throw new Error('Failed') }
            return res.json()
        }
    })

    const markReadMutation = useMutation({
        mutationFn: async (noticeId: string) => {
            await fetch('/api/notices/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notice_id: noticeId })
            })
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notices'] })
    })

    const handleOpenNotice = (notice: Notice) => {
        setSelectedNotice(notice)
        if (!notice.is_read) markReadMutation.mutate(notice.id)
    }

    const unreadCount = notices?.filter(n => !n.is_read).length || 0

    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    })

    if (isLoading) return <Loader text="Loading notices..." />

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 pb-24 md:pb-8">
            <div className="max-w-2xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/student/dashboard" className="glass-card p-3 rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="font-ritafurey text-2xl font-bold text-slate-900 flex items-center gap-2">
                            Notices
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500 text-sm">Important announcements</p>
                    </div>
                </div>

                {/* Notices List */}
                {notices && notices.length > 0 ? (
                    <div className="space-y-3">
                        {notices.map(notice => (
                            <motion.button
                                key={notice.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => handleOpenNotice(notice)}
                                className={`glass-card w-full p-4 rounded-2xl text-left ${!notice.is_read ? 'border-l-4 border-l-orange-500' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notice.is_urgent ? 'bg-red-100' : 'bg-blue-100'}`}>
                                        {notice.is_urgent ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Bell className="w-5 h-5 text-blue-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-slate-900 truncate">{notice.title}</h3>
                                        <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(notice.created_at)}
                                        </p>
                                    </div>
                                    {!notice.is_read && <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 glass-card rounded-2xl">
                        <Bell className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <h3 className="font-semibold text-slate-900 mb-1">No notices yet</h3>
                        <p className="text-slate-500 text-sm">You'll see announcements here</p>
                    </div>
                )}
            </div>

            {/* Notice Modal */}
            <AnimatePresence>
                {selectedNotice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        onClick={() => setSelectedNotice(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedNotice.is_urgent ? 'bg-red-100' : 'bg-blue-100'}`}>
                                            {selectedNotice.is_urgent ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Bell className="w-5 h-5 text-blue-500" />}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-slate-900">{selectedNotice.title}</h2>
                                            <p className="text-xs text-slate-500">{formatDate(selectedNotice.created_at)}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedNotice(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                {selectedNotice.content && (
                                    <p className="text-slate-600 leading-relaxed mb-4">{selectedNotice.content}</p>
                                )}

                                {selectedNotice.file_url && (
                                    <a
                                        href={selectedNotice.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-orange-600 hover:bg-orange-50"
                                    >
                                        <Download className="w-5 h-5" />
                                        <span className="text-sm font-medium">Download Attachment</span>
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-lg border-t border-slate-200/50 md:hidden z-40">
                <div className="flex justify-around items-center py-2">
                    <Link href="/student/dashboard" className="flex flex-col items-center p-2 text-slate-500">
                        <Home className="w-5 h-5" />
                        <span className="text-xs mt-0.5">Home</span>
                    </Link>
                    <Link href="/student/pyqs" className="flex flex-col items-center p-2 text-slate-500">
                        <FileText className="w-5 h-5" />
                        <span className="text-xs mt-0.5">PYQs</span>
                    </Link>
                    <Link href="/student/notices" className="flex flex-col items-center p-2 text-orange-500">
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
    )
}
