'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
    ArrowLeft, Building2, Plus, X,
    GraduationCap, Trash2
} from 'lucide-react'

interface Year {
    id: string
    name: string
    code: string
    order_index: number
}

interface Department {
    id: string
    name: string
    code: string
    description?: string
    years: Year[]
}

export default function DepartmentsPage() {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [newDept, setNewDept] = useState({ name: '', code: '', description: '' })
    const [error, setError] = useState('')

    const { data: departments, isLoading } = useQuery<Department[]>({
        queryKey: ['departments'],
        queryFn: async () => {
            const res = await fetch('/api/admin/departments')
            if (!res.ok) throw new Error('Failed')
            return res.json()
        }
    })

    const createMutation = useMutation({
        mutationFn: async (data: typeof newDept) => {
            const res = await fetch('/api/admin/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error)
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] })
            setShowModal(false)
            setNewDept({ name: '', code: '', description: '' })
            setError('')
        },
        onError: (err: Error) => setError(err.message)
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/departments?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] })
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="glass-card p-3 rounded-xl shrink-0">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <div>
                            <h1 className="font-ritafurey text-2xl font-bold text-slate-900">Departments</h1>
                            <p className="text-slate-500 text-sm">Manage departments, years & semesters</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5" /> Add Department
                    </button>
                </div>

                {/* Departments List */}
                {isLoading ? (
                    <div className="text-center text-slate-600 py-12">Loading...</div>
                ) : departments && departments.length > 0 ? (
                    <div className="space-y-4">
                        {departments.map(dept => (
                            <motion.div
                                key={dept.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card rounded-2xl p-6 relative"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3 pr-8">
                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shrink-0">
                                            <Building2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-slate-900 font-semibold text-lg leading-tight">{dept.name}</h3>
                                            <p className="text-slate-500 text-sm">{dept.code}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Are you sure? This will PERMANENTLY DELETE:\n- ${dept.name}\n- All Students in this dept\n- All Subjects & PDFs\nThis cannot be undone.`)) {
                                                deleteMutation.mutate(dept.id)
                                            }
                                        }}
                                        className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Department"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                {dept.description && (
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{dept.description}</p>
                                )}

                                {/* Years */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {dept.years.map(year => (
                                        <div
                                            key={year.id}
                                            className="bg-slate-50 rounded-xl p-3 border border-slate-200"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <GraduationCap className="w-4 h-4 text-orange-500" />
                                                <span className="text-slate-900 font-medium text-sm">{year.code}{dept.code}</span>
                                            </div>
                                            <p className="text-slate-500 text-xs">{year.name}</p>
                                            <div className="flex gap-1 mt-2">
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded">SEM1</span>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded">SEM2</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-12 rounded-2xl text-center">
                        <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 mb-4">No departments yet</p>
                        <button onClick={() => setShowModal(true)} className="btn-primary w-full sm:w-auto">
                            Create First Department
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900">New Department</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-4">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label className="text-slate-700 text-sm font-medium mb-2 block">Department Name</label>
                                    <input
                                        type="text"
                                        value={newDept.name}
                                        onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                                        placeholder="Information Technology"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-700 text-sm font-medium mb-2 block">Department Code</label>
                                    <input
                                        type="text"
                                        value={newDept.code}
                                        onChange={e => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                                        placeholder="IT"
                                        maxLength={6}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all uppercase font-mono tracking-wider"
                                    />
                                    <p className="text-xs text-slate-500 mt-1.5">Short code like IT, CS, AI (max 6 chars)</p>
                                </div>
                                <div>
                                    <label className="text-slate-700 text-sm font-medium mb-2 block">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
                                    <textarea
                                        value={newDept.description}
                                        onChange={e => setNewDept({ ...newDept, description: e.target.value })}
                                        placeholder="Brief description of the department..."
                                        rows={3}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all resize-none"
                                    />
                                </div>

                                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100">
                                    <p className="text-slate-600 text-sm font-medium mb-3">🎓 Auto-creates:</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1.5 bg-white text-orange-600 text-sm font-medium rounded-xl border border-orange-200 shadow-sm">FY{newDept.code || 'XX'}</span>
                                        <span className="px-3 py-1.5 bg-white text-orange-600 text-sm font-medium rounded-xl border border-orange-200 shadow-sm">SY{newDept.code || 'XX'}</span>
                                        <span className="px-3 py-1.5 bg-white text-orange-600 text-sm font-medium rounded-xl border border-orange-200 shadow-sm">TY{newDept.code || 'XX'}</span>
                                    </div>
                                    <p className="text-slate-500 text-xs mt-2">Each year includes SEM1 & SEM2</p>
                                </div>

                                <button
                                    onClick={() => createMutation.mutate(newDept)}
                                    disabled={!newDept.name || !newDept.code || createMutation.isPending}
                                    className="btn-primary w-full py-4 text-base"
                                >
                                    {createMutation.isPending ? 'Creating...' : 'Create Department'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
