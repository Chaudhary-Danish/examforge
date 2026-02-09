'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Users, Plus, X, Trash2, Mail, Copy, Check } from 'lucide-react'

interface Department { id: string; name: string; code: string }
interface Year { id: string; name: string; code: string }
interface Semester { id: string; name: string; code: string }

interface Student {
    id: string
    email: string
    full_name: string
    student_id: string
    is_active: boolean
    created_at: string
    departments: Department | null
    years: Year | null
    semesters: Semester | null
}

export default function StudentsPage() {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [showCredentials, setShowCredentials] = useState<{ studentId: string; password: string } | null>(null)
    const [copied, setCopied] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        department_id: '',
        year_id: '',
        semester_id: ''
    })
    const [error, setError] = useState('')

    // Fetch students
    const { data: students, isLoading } = useQuery<Student[]>({
        queryKey: ['admin-students'],
        queryFn: async () => {
            const res = await fetch('/api/admin/students')
            if (!res.ok) throw new Error('Failed')
            return res.json()
        }
    })

    // Fetch departments
    const { data: departments } = useQuery<Department[]>({
        queryKey: ['departments'],
        queryFn: async () => {
            const res = await fetch('/api/admin/departments')
            if (!res.ok) throw new Error('Failed')
            return res.json()
        }
    })

    // Fetch years for selected department
    const { data: years } = useQuery<Year[]>({
        queryKey: ['years', formData.department_id],
        queryFn: async () => {
            const res = await fetch(`/api/admin/semesters?departmentId=${formData.department_id}`)
            if (!res.ok) return []
            const data = await res.json()
            return data.years || []
        },
        enabled: !!formData.department_id
    })

    // Fetch semesters for selected year
    const { data: semesters } = useQuery<Semester[]>({
        queryKey: ['semesters', formData.year_id],
        queryFn: async () => {
            const res = await fetch(`/api/admin/semesters?yearId=${formData.year_id}`)
            if (!res.ok) return []
            const data = await res.json()
            return data.semesters || []
        },
        enabled: !!formData.year_id
    })

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await fetch('/api/admin/students', {
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
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-students'] })
            setShowModal(false)
            setFormData({ email: '', full_name: '', department_id: '', year_id: '', semester_id: '' })
            setError('')
            // Show credentials modal
            if (data.credentials) {
                setShowCredentials(data.credentials)
            }
        },
        onError: (err: Error) => setError(err.message)
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/students?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-students'] })
    })

    const copyCredentials = () => {
        if (showCredentials) {
            navigator.clipboard.writeText(`Student ID: ${showCredentials.studentId}\nPassword: ${showCredentials.password}`)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="glass-card p-3 rounded-xl">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <div>
                            <h1 className="font-ritafurey text-2xl font-bold text-slate-900">Students</h1>
                            <p className="text-slate-500 text-sm">Manage student accounts</p>
                        </div>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Add Student
                    </button>
                </div>

                {/* Students List */}
                {isLoading ? (
                    <div className="text-center text-slate-600 py-12">Loading...</div>
                ) : students && students.length > 0 ? (
                    <div className="glass-card rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-slate-600 text-sm font-medium">Student</th>
                                    <th className="text-left px-6 py-4 text-slate-600 text-sm font-medium">ID</th>
                                    <th className="text-left px-6 py-4 text-slate-600 text-sm font-medium">Department</th>
                                    <th className="text-left px-6 py-4 text-slate-600 text-sm font-medium">Year</th>
                                    <th className="text-right px-6 py-4 text-slate-600 text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, idx) => (
                                    <motion.tr
                                        key={student.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="border-b border-slate-100 last:border-0"
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-slate-900 font-medium">{student.full_name}</p>
                                                <p className="text-slate-500 text-sm">{student.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">{student.student_id}</code>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">
                                            {student.departments?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">
                                            {student.years?.code}{student.departments?.code || ''} - {student.semesters?.code || ''}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    if (confirm('Delete this student?')) {
                                                        deleteMutation.mutate(student.id)
                                                    }
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="glass-card p-12 rounded-2xl text-center">
                        <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 mb-4">No students yet</p>
                        <button onClick={() => setShowModal(true)} className="btn-primary">
                            Add First Student
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Add New Student</h2>
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
                                    <label className="text-slate-700 text-sm font-medium mb-2 block">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="Enter student's full name"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-700 text-sm font-medium mb-2 block">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="student@example.com"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-700 text-sm font-medium mb-2 block">Department</label>
                                    <div className="relative">
                                        <select
                                            value={formData.department_id}
                                            onChange={e => setFormData({ ...formData, department_id: e.target.value, year_id: '', semester_id: '' })}
                                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Department</option>
                                            {departments?.map(d => (
                                                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                {formData.department_id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                    >
                                        <label className="text-slate-700 text-sm font-medium mb-2 block">Year</label>
                                        <div className="relative">
                                            <select
                                                value={formData.year_id}
                                                onChange={e => setFormData({ ...formData, year_id: e.target.value, semester_id: '' })}
                                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Year</option>
                                                {years?.map((y: Year) => (
                                                    <option key={y.id} value={y.id}>{y.name} ({y.code})</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                {formData.year_id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                    >
                                        <label className="text-slate-700 text-sm font-medium mb-2 block">Semester</label>
                                        <div className="relative">
                                            <select
                                                value={formData.semester_id}
                                                onChange={e => setFormData({ ...formData, semester_id: e.target.value })}
                                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Semester</option>
                                                {semesters?.map((s: Semester) => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                                    <div className="flex items-center gap-3 text-blue-700">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <Mail className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Credentials will be emailed</p>
                                            <p className="text-blue-600/70 text-xs">Student will receive login details automatically</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => createMutation.mutate(formData)}
                                    disabled={!formData.full_name || !formData.email || !formData.department_id || !formData.year_id || !formData.semester_id || createMutation.isPending}
                                    className="btn-primary w-full py-4 text-base"
                                >
                                    {createMutation.isPending ? 'Creating...' : 'Create Student Account'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Credentials Modal */}
            <AnimatePresence>
                {showCredentials && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowCredentials(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-xl text-center"
                        >
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Student Created!</h2>
                            <p className="text-slate-500 text-sm mb-6">Credentials have been sent to the student's email</p>

                            <div className="bg-slate-50 rounded-xl p-4 text-left mb-6">
                                <p className="text-slate-600 text-sm mb-2"><strong>Student ID:</strong></p>
                                <code className="block px-3 py-2 bg-white rounded-lg text-slate-900 border border-slate-200 mb-3">
                                    {showCredentials.studentId}
                                </code>
                                <p className="text-slate-600 text-sm mb-2"><strong>Password:</strong></p>
                                <code className="block px-3 py-2 bg-orange-50 rounded-lg text-orange-700 border border-orange-200">
                                    {showCredentials.password}
                                </code>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={copyCredentials}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                    onClick={() => setShowCredentials(null)}
                                    className="flex-1 btn-primary"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
