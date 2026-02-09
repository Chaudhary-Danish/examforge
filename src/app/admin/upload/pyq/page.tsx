'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, FileText, Upload, CheckCircle, AlertCircle
} from 'lucide-react'

interface Subject {
    id: string
    name: string
    code: string
}

export default function UploadPYQPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        title: '',
        subject_id: '',
        year: new Date().getFullYear() - 1,
        exam_type: 'End Semester'
    })
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const { data: subjects } = useQuery<Subject[]>({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await fetch('/api/subjects')
            if (!res.ok) throw new Error('Failed')
            return res.json()
        }
    })

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error('Please select a file')
            if (!formData.title) throw new Error('Please enter a title')
            if (!formData.subject_id) throw new Error('Please select a subject')

            const form = new FormData()
            form.append('file', file)
            form.append('title', formData.title)
            form.append('subject_id', formData.subject_id)
            form.append('year', formData.year.toString())
            form.append('exam_type', formData.exam_type)
            form.append('type', 'pyq')

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: form
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Upload failed')
            }

            return res.json()
        },
        onSuccess: () => {
            // Invalidate caches for instant updates
            queryClient.invalidateQueries({ queryKey: ['subjects'] })
            queryClient.invalidateQueries({ queryKey: ['subject'] })
            setSuccess(true)
            setTimeout(() => router.push('/admin/dashboard'), 2000)
        },
        onError: (err: Error) => setError(err.message)
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
            <div className="max-w-2xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="glass-card p-3 rounded-xl hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="font-ritafurey text-2xl font-bold text-slate-900">Upload PYQ</h1>
                        <p className="text-slate-500 text-sm">Add previous year question papers</p>
                    </div>
                </div>

                {success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-12 rounded-2xl text-center"
                    >
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Upload Successful!</h2>
                        <p className="text-slate-500">Redirecting to dashboard...</p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-2xl p-8"
                    >
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-6 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* File Upload */}
                            <div>
                                <label className="text-slate-700 font-medium mb-2 block">PDF File</label>
                                <label className="cursor-pointer">
                                    <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-orange-300'
                                        }`}>
                                        {file ? (
                                            <div className="text-green-600">
                                                <CheckCircle className="w-10 h-10 mx-auto mb-2" />
                                                <p className="font-medium">{file.name}</p>
                                                <p className="text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                                                <p className="text-slate-500">Click to select PDF file</p>
                                                <p className="text-slate-400 text-sm">Max 10MB</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="text-slate-700 font-medium mb-2 block">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Data Structures End Sem 2024"
                                    className="glass-input w-full"
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="text-slate-700 font-medium mb-2 block">Subject</label>
                                <select
                                    value={formData.subject_id}
                                    onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                                    className="glass-input w-full"
                                >
                                    <option value="">Select Subject</option>
                                    {subjects?.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Year */}
                                <div>
                                    <label className="text-slate-700 font-medium mb-2 block">Year</label>
                                    <select
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        className="glass-input w-full"
                                    >
                                        {[...Array(10)].map((_, i) => {
                                            const y = new Date().getFullYear() - i
                                            return <option key={y} value={y}>{y}</option>
                                        })}
                                    </select>
                                </div>

                                {/* Exam Type */}
                                <div>
                                    <label className="text-slate-700 font-medium mb-2 block">Exam Type</label>
                                    <select
                                        value={formData.exam_type}
                                        onChange={e => setFormData({ ...formData, exam_type: e.target.value })}
                                        className="glass-input w-full"
                                    >
                                        <option value="End Semester">End Semester</option>
                                        <option value="Mid Semester">Mid Semester</option>
                                        <option value="Unit Test">Unit Test</option>
                                        <option value="Practical">Practical</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={() => uploadMutation.mutate()}
                                disabled={uploadMutation.isPending}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                {uploadMutation.isPending ? 'Uploading...' : 'Upload PYQ'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
