'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    BookOpen, LogOut, Bell, User, FileText,
    MessageSquare, Sparkles, ChevronRight
} from 'lucide-react'
import Loader from '@/components/Loader'
import MobileNav from '@/components/MobileNav'
import LogoutModal from '@/components/LogoutModal'

interface UserData {
    id: string
    name: string
    email: string
    role: string
}

const motivationalPhrases = [
    "Ready to conquer? 🚀",
    "What's the plan today? 📚",
    "Time to level up! ⚡",
    "Let's crush some goals! 💪",
    "Knowledge awaits! ✨"
]

function getTimeGreeting(): string {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return "Good Morning"
    if (hour >= 12 && hour < 17) return "Good Afternoon"
    if (hour >= 17 && hour < 21) return "Good Evening"
    return "Good Night"
}

function getTimeEmoji(): string {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return "🌅"
    if (hour >= 12 && hour < 17) return "☀️"
    if (hour >= 17 && hour < 21) return "🌆"
    return "🌙"
}

export default function StudentDashboard() {
    const router = useRouter()
    const [displayedName, setDisplayedName] = useState('')
    const [showContent, setShowContent] = useState(false)
    const [currentPhrase, setCurrentPhrase] = useState(0)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const { data: user, isLoading } = useQuery<UserData>({
        queryKey: ['user'],
        queryFn: async () => {
            const res = await fetch('/api/user/me')
            if (!res.ok) {
                router.push('/login')
                throw new Error('Unauthorized')
            }
            return res.json()
        },
        staleTime: 0, // Always refetch
        refetchOnMount: 'always' // Force fresh data on every mount
    })

    const { data: subjects } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await fetch('/api/subjects')
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        enabled: !!user
    })

    // Typewriter effect
    useEffect(() => {
        if (!user?.name) return

        const name = user.name
        let i = 0
        const timer = setInterval(() => {
            if (i <= name.length) {
                setDisplayedName(name.slice(0, i))
                i++
            } else {
                clearInterval(timer)
                setTimeout(() => setShowContent(true), 300)
            }
        }, 80)

        return () => clearInterval(timer)
    }, [user?.name])

    // Rotate motivational phrases
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentPhrase(p => (p + 1) % motivationalPhrases.length)
        }, 4000)
        return () => clearInterval(timer)
    }, [])

    const handleLogout = async () => {
        setIsLoggingOut(true)
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    if (isLoading) {
        return <Loader text="Loading dashboard..." />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Header with logout */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-2xl">🦊</span>
                        </div>
                        <span className="font-ritafurey text-xl font-bold text-slate-900">ExamForge</span>
                    </div>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="glass-card p-3 rounded-xl hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Time-based greeting */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2"
                >
                    <span className="text-slate-500 text-lg">
                        {getTimeEmoji()} {getTimeGreeting()}
                    </span>
                </motion.div>

                {/* Typewriter welcome */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4"
                >
                    <h1 className="font-ritafurey text-3xl md:text-4xl font-bold text-slate-900">
                        Welcome Back,{' '}
                        <span className="text-orange-500 inline-block">
                            {displayedName}
                            <span className="animate-pulse">|</span>
                        </span>
                    </h1>
                </motion.div>

                {/* Motivational phrase */}
                <motion.div
                    key={currentPhrase}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="mb-8"
                >
                    <p className="text-slate-500 text-lg">{motivationalPhrases[currentPhrase]}</p>
                </motion.div>

                {/* Quick Actions */}
                {showContent && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    >
                        <Link href="/student/ai" className="glass-card p-4 rounded-2xl text-center group hover:bg-orange-50 transition-colors">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-orange-500 group-hover:scale-110 transition-transform" />
                            <span className="text-slate-900 text-sm font-medium">AI Tutor</span>
                        </Link>
                        <Link href="/student/pyqs" className="glass-card p-4 rounded-2xl text-center group hover:bg-blue-50 transition-colors">
                            <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-slate-900 text-sm font-medium">PYQs</span>
                        </Link>
                        <Link href="/student/notices" className="glass-card p-4 rounded-2xl text-center group hover:bg-green-50 transition-colors relative">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-green-500 group-hover:scale-110 transition-transform" />
                            <span className="text-slate-900 text-sm font-medium">Notices</span>
                        </Link>
                        <Link href="/student/profile" className="glass-card p-4 rounded-2xl text-center group hover:bg-purple-50 transition-colors">
                            <User className="w-8 h-8 mx-auto mb-2 text-purple-500 group-hover:scale-110 transition-transform" />
                            <span className="text-slate-900 text-sm font-medium">Profile</span>
                        </Link>
                    </motion.div>
                )}

                {/* Subjects */}
                {showContent && subjects && subjects.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-slate-900 font-semibold text-lg flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-orange-500" />
                                Your Subjects
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {subjects.map((subject: { id: string; name: string; code: string }) => (
                                <Link
                                    key={subject.id}
                                    href={`/student/subject/${subject.id}`}
                                    className="glass-card block p-4 rounded-2xl group hover:bg-orange-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-slate-900 font-medium">{subject.name}</h3>
                                            <p className="text-slate-500 text-sm">{subject.code}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}

                {showContent && (!subjects || subjects.length === 0) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card p-8 rounded-2xl text-center"
                    >
                        <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500">No subjects assigned yet.</p>
                        <p className="text-slate-400 text-sm">Contact your admin to get started.</p>
                    </motion.div>
                )}
            </div>

            {/* Mobile Bottom Navigation with Notice Badge */}
            <MobileNav />

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
