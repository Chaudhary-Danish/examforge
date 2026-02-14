'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LogoutModal from '@/components/LogoutModal'

interface User {
    id: string
    name: string
    email: string
    role: string
}

interface Subject {
    id: string
    name: string
    code: string
    pyqCount: number
    bookCount: number
    chatCount: number
    semester?: {
        year?: {
            department?: {
                code: string
                name: string
            }
        }
    }
}

export default function AdminDashboard() {
    const router = useRouter()
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const { data: user, isError: userError } = useQuery<User>({
        queryKey: ['user'],
        queryFn: async () => {
            const res = await fetch('/api/user/me')
            if (!res.ok) throw new Error('Unauthorized')
            const data = await res.json()
            if (data.role !== 'admin') throw new Error('Not an admin')
            return data
        },
        retry: false
    })

    // Redirect on auth failure
    useEffect(() => {
        if (userError) router.push('/login')
    }, [userError, router])

    const { data: subjects } = useQuery<Subject[]>({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await fetch('/api/subjects')
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
        enabled: !!user
    })

    const handleLogout = async () => {
        setIsLoggingOut(true)
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    const stats = {
        subjects: subjects?.length || 0,
        totalPyqs: subjects?.reduce((acc, s) => acc + s.pyqCount, 0) || 0,
        totalBooks: subjects?.reduce((acc, s) => acc + s.bookCount, 0) || 0,
        totalChats: subjects?.reduce((acc, s) => acc + s.chatCount, 0) || 0
    }

    return (
        <div className="min-h-screen bg-cream-50">
            {/* Glass Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 sticky top-0 z-50"
            >
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-xl shadow-md">
                                👑
                            </div>
                            <div>
                                <span className="font-ritafurey text-xl font-bold text-black">
                                    ExamForge
                                </span>
                                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                    Admin
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-black-muted hidden sm:block">
                                {user?.name}
                            </span>
                            <button
                                onClick={() => setShowLogoutModal(true)}
                                className="text-sm text-black-muted hover:text-primary transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Welcome */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mb-12"
                >
                    <h1 className="font-ritafurey text-4xl font-bold text-black mb-2">
                        Admin Dashboard 👑
                    </h1>
                    <p className="text-black-muted">
                        Manage subjects, upload materials, and monitor usage
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
                >
                    <StatCard icon="📚" label="Subjects" value={stats.subjects} color="bg-blue-50" />
                    <StatCard icon="📄" label="Past Papers" value={stats.totalPyqs} color="bg-green-50" />
                    <StatCard icon="📖" label="Reference Books" value={stats.totalBooks} color="bg-purple-50" />
                    <StatCard icon="💬" label="AI Conversations" value={stats.totalChats} color="bg-orange-50" />
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mb-12"
                >
                    <h2 className="font-ritafurey text-2xl font-bold text-black mb-6">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ActionCard
                            icon="👥"
                            title="Manage Students"
                            description="Add students & assign departments"
                            href="/admin/students"
                        />
                        <ActionCard
                            icon="🏛️"
                            title="Departments"
                            description="Create departments, years & semesters"
                            href="/admin/departments"
                        />
                        <ActionCard
                            icon="➕"
                            title="Add Subject"
                            description="Create a new subject for students"
                            href="/admin/subjects/new"
                        />
                        <ActionCard
                            icon="📤"
                            title="Upload PYQ"
                            description="Add past year question papers"
                            href="/admin/upload/pyq"
                        />
                        <ActionCard
                            icon="📚"
                            title="Upload Book"
                            description="Add reference materials for AI"
                            href="/admin/upload/book"
                        />
                        <ActionCard
                            icon="📢"
                            title="Send Notices"
                            description="Broadcast to all students"
                            href="/admin/notices"
                        />
                    </div>
                </motion.div>

                {/* Subjects Overview (Grouped by Dept) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-ritafurey text-2xl font-bold text-black">
                            Subjects
                        </h2>
                        <Link
                            href="/admin/subjects/new"
                            className="btn-primary text-sm"
                        >
                            + Add Subject
                        </Link>
                    </div>

                    {subjects?.length === 0 ? (
                        <div className="text-center py-12 glass-card rounded-3xl">
                            <div className="text-5xl mb-4">📚</div>
                            <p className="text-black-muted">No subjects yet. Create your first subject!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Group subjects by department code */}
                            {Object.entries(
                                subjects?.reduce((acc, subject) => {
                                    const deptCode = subject.semester?.year?.department?.code || 'General'
                                    if (!acc[deptCode]) acc[deptCode] = []
                                    acc[deptCode].push(subject)
                                    return acc
                                }, {} as Record<string, Subject[]>) || {}
                            ).map(([deptCode, deptSubjects]) => (
                                <div key={deptCode} className="glass-card rounded-3xl overflow-hidden p-6">
                                    <div className="flex items-center gap-3 mb-4 border-b border-glass-border pb-2">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                                            {deptCode}
                                        </div>
                                        <h3 className="font-ritafurey text-xl font-bold text-slate-800">
                                            {deptCode === 'General' ? 'General Subjects' : `${deptSubjects[0]?.semester?.year?.department?.name || deptCode} Department`}
                                        </h3>
                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                            {deptSubjects.length} Subjects
                                        </span>
                                    </div>

                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-glass-border">
                                                <th className="text-left py-3 text-sm font-semibold text-black pl-2">Subject</th>
                                                <th className="text-right py-3 text-sm font-semibold text-black pr-2">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deptSubjects.map((subject) => (
                                                <tr key={subject.id} className="border-b border-glass-border last:border-0 hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-3 pl-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs">
                                                                {subject.code.substring(0, 2)}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-black block">{subject.name}</span>
                                                                <span className="text-xs text-slate-500">{subject.code}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-right py-3 pr-2">
                                                        <Link
                                                            href={`/admin/subjects/${subject.id}`}
                                                            className="text-orange-500 text-sm font-medium hover:text-orange-600 transition-colors"
                                                        >
                                                            Manage →
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Logout Modal */}
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
                isLoading={isLoggingOut}
            />
        </div>
    )
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
    return (
        <div className="glass-card rounded-2xl p-6">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                {icon}
            </div>
            <div className="text-3xl font-bold text-black mb-1">{value}</div>
            <div className="text-sm text-black-muted">{label}</div>
        </div>
    )
}

function ActionCard({ icon, title, description, href }: { icon: string; title: string; description: string; href: string }) {
    return (
        <Link href={href}>
            <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="glass-card rounded-2xl p-6 cursor-pointer border border-glass-border hover:border-primary/20 transition-colors"
            >
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-semibold text-black mb-1">{title}</h3>
                <p className="text-sm text-black-muted">{description}</p>
            </motion.div>
        </Link>
    )
}
