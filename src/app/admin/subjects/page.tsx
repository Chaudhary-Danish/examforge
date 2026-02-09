'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, BookOpen, Trash2, X } from 'lucide-react'
import Loader from '@/components/Loader'

interface Subject {
    id: string
    name: string
    code: string
    description?: string
    semester_id?: string
}

export default function AdminSubjectsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [showAddModal, setShowAddModal] = useState(false)
    const [formData, setFormData] = useState({ name: '', code: '', description: '' })
    const [error, setError] = useState('')
    const [lastCreatedSubjectId, setLastCreatedSubjectId] = useState<string | null>(null)

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const res = await fetch('/api/user/me')
            if (!res.ok) { router.push('/login'); throw new Error('Unauthorized') }
            const data = await res.json()
            if (data.role !== 'admin') { router.push('/login'); throw new Error('Not admin') }
            return data
        }
    })

    const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await fetch('/api/subjects')
            if (!res.ok) return []
            return res.json()
        },
        enabled: !!user
    })

    const addMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to add subject')
            }
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] })
            setShowAddModal(false)
            setFormData({ name: '', code: '', description: '' })
            setError('')
            setLastCreatedSubjectId(data.id)
            setTimeout(() => setLastCreatedSubjectId(null), 5000) // Clear after 5s
        },
        onError: (err: Error) => {
            setError(err.message)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/subjects?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] })
        }
    })

    const handleAdd = () => {
        if (!formData.name || !formData.code) {
            setError('Name and code are required')
            return
        }
        addMutation.mutate(formData)
    }

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Delete subject "${name}"?`)) {
            deleteMutation.mutate(id)
        }
    }

    if (userLoading || subjectsLoading) {
        return <Loader text="Loading subjects..." />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
            {/* Header with backdrop blur */}
            <div className="bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 px-6 py-4 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <div>
                            <h1 className="font-ritafurey text-xl font-bold text-slate-900">Manage Subjects</h1>
                            <p className="text-slate-500 text-sm">{subjects?.length || 0} subjects</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Add Subject
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Subjects Grid */}
                {subjects && subjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjects.map(subject => (
                            <motion.div
                                key={subject.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`glass-card p-5 rounded-2xl relative overflow-hidden ${subject.id === lastCreatedSubjectId ? 'ring-2 ring-orange-400 bg-orange-50/50' : ''}`}
                            >
                                {subject.id === lastCreatedSubjectId && (
                                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">
                                        NEW
                                    </div>
                                )}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <button
                                        onClick={() => handleDelete(subject.id, subject.name)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-1">{subject.name}</h3>
                                <p className="text-slate-500 text-sm font-mono">{subject.code}</p>
                                {subject.description && (
                                    <p className="text-slate-400 text-sm mt-2 line-clamp-2">{subject.description}</p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-12 rounded-2xl text-center">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 mb-2">No subjects yet</p>
                        <p className="text-slate-400 text-sm">Click "Add Subject" to create one</p>
                    </div>
                )}
            </div>

            {/* Success Card Bottom Sheet */}
            <AnimatePresence>
                {lastCreatedSubjectId && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl p-4 border border-orange-100 flex items-center gap-4 max-w-sm">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-xl">✅</span>
                            </div>
                            <div>
                                <p className="text-green-700 font-bold text-sm">Subject Created!</p>
                                <p className="text-slate-600 text-xs">It has been added to the list.</p>
                            </div>
                            <button onClick={() => setLastCreatedSubjectId(null)} className="ml-2 text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Subject Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Add New Subject</h2>
                            <button onClick={() => { setShowAddModal(false); setError('') }} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-4">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="text-slate-600 text-sm mb-1 block">Subject Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Data Structures"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <div>
                                <label className="text-slate-600 text-sm mb-1 block">Subject Code *</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g., CS201"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-slate-600 text-sm mb-1 block">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the subject"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setShowAddModal(false); setError('') }}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdd}
                                    disabled={addMutation.isPending}
                                    className="btn-primary flex-1"
                                >
                                    {addMutation.isPending ? 'Adding...' : 'Add Subject'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
