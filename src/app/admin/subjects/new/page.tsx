'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, BookOpen } from 'lucide-react'

interface Department { id: string; name: string; code: string }
interface Year { id: string; name: string; code: string }
interface Semester { id: string; name: string; code: string }

export default function NewSubjectPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        department_id: '',
        year_id: '',
        semester_id: ''
    })
    const [error, setError] = useState('')

    // Fetch departments
    const { data: departments } = useQuery<Department[]>({
        queryKey: ['departments'],
        queryFn: async () => {
            const res = await fetch('/api/admin/departments')
            if (!res.ok) return []
            return res.json()
        }
    })

    // Fetch years for selected department
    const { data: yearsData } = useQuery<{ years: Year[] }>({
        queryKey: ['years', formData.department_id],
        queryFn: async () => {
            const res = await fetch(`/api/admin/semesters?departmentId=${formData.department_id}`)
            if (!res.ok) return { years: [] }
            return res.json()
        },
        enabled: !!formData.department_id
    })

    // Fetch semesters for selected year
    const { data: semestersData } = useQuery<{ semesters: Semester[] }>({
        queryKey: ['semesters', formData.year_id],
        queryFn: async () => {
            const res = await fetch(`/api/admin/semesters?yearId=${formData.year_id}`)
            if (!res.ok) return { semesters: [] }
            return res.json()
        },
        enabled: !!formData.year_id
    })

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    code: data.code,
                    description: data.description,
                    semesterId: data.semester_id // API expects semesterId
                })
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to create subject')
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] })
            router.push('/admin/dashboard')
        },
        onError: (err: Error) => {
            setError(err.message)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.name.trim() || !formData.code.trim()) {
            setError('Name and code are required')
            return
        }

        if (!formData.semester_id) {
            setError('Please select department, year and semester')
            return
        }

        createMutation.mutate(formData)
    }

    const selectedDept = departments?.find(d => d.id === formData.department_id)
    const selectedYear = yearsData?.years?.find((y: Year) => y.id === formData.year_id)

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50"
            >
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2 hover:bg-slate-100 rounded-xl">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-ritafurey text-xl font-bold text-slate-900">
                                Add New Subject
                            </span>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Form */}
            <main className="max-w-2xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-3xl p-8"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Department Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">
                                Department *
                            </label>
                            <select
                                value={formData.department_id}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    department_id: e.target.value,
                                    year_id: '',
                                    semester_id: ''
                                })}
                                className="glass-input w-full px-4 py-3 rounded-xl"
                                required
                            >
                                <option value="">Select Department</option>
                                {departments?.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name} ({dept.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Year Selection */}
                        {formData.department_id && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2"
                            >
                                <label className="block text-sm font-medium text-slate-700">
                                    Year *
                                </label>
                                <select
                                    value={formData.year_id}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        year_id: e.target.value,
                                        semester_id: ''
                                    })}
                                    className="glass-input w-full px-4 py-3 rounded-xl"
                                    required
                                >
                                    <option value="">Select Year</option>
                                    {yearsData?.years?.map((year: Year) => (
                                        <option key={year.id} value={year.id}>
                                            {year.name} ({year.code}{selectedDept?.code})
                                        </option>
                                    ))}
                                </select>
                            </motion.div>
                        )}

                        {/* Semester Selection */}
                        {formData.year_id && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2"
                            >
                                <label className="block text-sm font-medium text-slate-700">
                                    Semester *
                                </label>
                                <select
                                    value={formData.semester_id}
                                    onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
                                    className="glass-input w-full px-4 py-3 rounded-xl"
                                    required
                                >
                                    <option value="">Select Semester</option>
                                    {semestersData?.semesters?.map((sem: Semester) => (
                                        <option key={sem.id} value={sem.id}>
                                            {sem.name} ({selectedYear?.code}{selectedDept?.code} - {sem.code})
                                        </option>
                                    ))}
                                </select>
                            </motion.div>
                        )}

                        {/* Subject Details */}
                        {formData.semester_id && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-6 pt-4 border-t border-slate-200"
                            >
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Subject Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Data Structures & Algorithms"
                                        className="glass-input w-full px-4 py-3 rounded-xl"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Subject Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., CS201"
                                        className="glass-input w-full px-4 py-3 rounded-xl uppercase"
                                        required
                                    />
                                    <p className="text-xs text-slate-500">This must be unique</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of the subject..."
                                        rows={3}
                                        className="glass-input w-full px-4 py-3 rounded-xl resize-none"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Preview Badge */}
                        {formData.semester_id && formData.code && (
                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                                <p className="text-slate-600 text-sm mb-2">Subject will be created as:</p>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg font-medium">
                                        {formData.code}
                                    </span>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-slate-700">{selectedYear?.code}{selectedDept?.code}</span>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-slate-600 text-sm">
                                        {semestersData?.semesters?.find((s: Semester) => s.id === formData.semester_id)?.name}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <Link
                                href="/admin/dashboard"
                                className="btn-secondary flex-1 text-center"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || !formData.semester_id}
                                className="btn-primary flex-1"
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create Subject'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </main>
        </div>
    )
}
