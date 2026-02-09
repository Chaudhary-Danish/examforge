'use client'

import { useState, use } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, Download, BookOpen, FileText } from 'lucide-react'

interface SubjectDetail {
    id: string
    name: string
    code: string
    description?: string
    pyqs: { id: string; title: string; year: number; exam_type: string; file_url: string }[]
    books: { id: string; title: string; author: string; file_url: string }[]
}

export default function AdminSubjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<'overview' | 'pyqs' | 'books'>('overview')

    const { data: subject, isLoading } = useQuery<SubjectDetail>({
        queryKey: ['subject', id],
        queryFn: async () => {
            const res = await fetch(`/api/subjects/${id}`)
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] })
            router.push('/admin/dashboard')
        }
    })

    const deleteFileMutation = useMutation({
        mutationFn: async (fileId: string) => {
            const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete file')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subject', id] })
        }
    })

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this subject? This will also delete all PYQs and reference books.')) {
            deleteMutation.mutate()
        }
    }

    const handleFileDelete = (fileId: string, title: string) => {
        if (confirm(`Are you sure you want to delete "${title}"?`)) {
            deleteFileMutation.mutate(fileId)
        }
    }

    const getDownloadUrl = (fileUrl?: string, id?: string) => {
        if (!fileUrl || !id) return '#'
        if (fileUrl.startsWith('telegram://') || fileUrl.startsWith('local://')) {
            return `/api/files/${id}`
        }
        return fileUrl
    }

    if (isLoading) {
        return <LoadingSkeleton />
    }

    return (
        <div className="min-h-screen bg-cream-50">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-header sticky top-0 z-50"
            >
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="glass-card p-2 hover:bg-slate-100 transition-colors rounded-xl flex items-center gap-2 text-black-muted hover:text-black"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <div>
                                <h1 className="font-ritafurey text-xl font-bold text-black">
                                    {subject?.name}
                                </h1>
                                <span className="text-xs text-black-muted">{subject?.code}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Subject
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="glass-card rounded-2xl p-1 inline-flex gap-1">
                    {(['overview', 'pyqs', 'books'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-primary text-white shadow-md'
                                : 'text-black-muted hover:text-black'
                                }`}
                        >
                            {tab === 'overview' ? '📊 Overview' : tab === 'pyqs' ? '📄 PYQs' : '📚 Books'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 pb-12">
                {activeTab === 'overview' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-card rounded-2xl p-6">
                                <div className="text-3xl font-bold text-black">{subject?.pyqs.length || 0}</div>
                                <div className="text-sm text-black-muted">Past Papers</div>
                            </div>
                            <div className="glass-card rounded-2xl p-6">
                                <div className="text-3xl font-bold text-black">{subject?.books.length || 0}</div>
                                <div className="text-sm text-black-muted">Reference Books</div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="glass-card rounded-3xl p-6">
                            <h3 className="font-semibold text-black mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Link
                                    href={`/admin/upload/pyq?subject=${id}`}
                                    className="btn-primary text-center flex items-center justify-center gap-2"
                                >
                                    <FileText className="w-4 h-4" /> Upload PYQ
                                </Link>
                                <Link
                                    href={`/admin/upload/book?subject=${id}`}
                                    className="btn-secondary text-center flex items-center justify-center gap-2"
                                >
                                    <BookOpen className="w-4 h-4" /> Upload Reference Book
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'pyqs' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-ritafurey text-2xl font-bold text-black">Past Papers</h2>
                            <Link
                                href={`/admin/upload/pyq?subject=${id}`}
                                className="btn-primary text-sm flex items-center gap-2"
                            >
                                <PlusIcon /> Upload PYQ
                            </Link>
                        </div>

                        {subject?.pyqs.length === 0 ? (
                            <div className="text-center py-12 glass-card rounded-3xl">
                                <div className="text-5xl mb-4">📄</div>
                                <p className="text-black-muted">No past papers uploaded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {subject?.pyqs.map((pyq) => (
                                    <div key={pyq.id} className="glass-card rounded-2xl p-4 flex justify-between items-center group">
                                        <div className="flex-1">
                                            <div className="font-medium text-black">{pyq.title}</div>
                                            <div className="text-sm text-black-muted">{pyq.year} • {pyq.exam_type}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <a
                                                href={getDownloadUrl(pyq.file_url, pyq.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary text-sm hover:underline flex items-center gap-1"
                                            >
                                                <Download className="w-4 h-4" /> View
                                            </a>
                                            <button
                                                onClick={() => handleFileDelete(pyq.id, pyq.title)}
                                                className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete File"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'books' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-ritafurey text-2xl font-bold text-black">Reference Books</h2>
                            <Link
                                href={`/admin/upload/book?subject=${id}`}
                                className="btn-primary text-sm flex items-center gap-2"
                            >
                                <PlusIcon /> Upload Book
                            </Link>
                        </div>

                        {subject?.books.length === 0 ? (
                            <div className="text-center py-12 glass-card rounded-3xl">
                                <div className="text-5xl mb-4">📚</div>
                                <p className="text-black-muted">No reference books uploaded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {subject?.books.map((book) => (
                                    <div key={book.id} className="glass-card rounded-2xl p-4 flex justify-between items-center group">
                                        <div className="flex-1">
                                            <div className="font-medium text-black">{book.title}</div>
                                            <div className="text-sm text-black-muted">by {book.author}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <a
                                                href={getDownloadUrl(book.file_url, book.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary text-sm hover:underline flex items-center gap-1"
                                            >
                                                <Download className="w-4 h-4" /> View
                                            </a>
                                            <button
                                                onClick={() => handleFileDelete(book.id, book.title)}
                                                className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete File"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </main>
        </div>
    )
}

function PlusIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
}

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-cream-50">
            <header className="glass-header h-16" />
            <div className="max-w-7xl mx-auto px-6 py-12 animate-pulse">
                <div className="h-8 bg-cream-200 rounded w-64 mb-8" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card rounded-2xl h-24" />
                    <div className="glass-card rounded-2xl h-24" />
                </div>
            </div>
        </div>
    )
}
