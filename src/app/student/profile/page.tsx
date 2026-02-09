'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Mail, Building2, GraduationCap,
    Save, LogOut, Home, Bell, FileText, User, Camera
} from 'lucide-react'
import Loader from '@/components/Loader'

interface UserProfile {
    id: string
    email: string
    name: string
    role: string
    student_id?: string
    department?: { name: string; code: string }
    year?: { name: string; code: string }
    profile_picture?: string
    bio?: string
}

export default function ProfilePage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({ full_name: '', bio: '' })

    const { data: user, isLoading } = useQuery<UserProfile>({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await fetch('/api/user/profile')
            if (!res.ok) { router.push('/login'); throw new Error('Unauthorized') }
            const data = await res.json()
            setFormData({ full_name: data.name || '', bio: data.bio || '' })
            return data
        }
    })

    const updateMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            setIsEditing(false)
        }
    })

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/login')
        }
    }

    if (isLoading) {
        return <Loader text="Loading profile..." />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 pb-24 md:pb-8">
            <div className="max-w-2xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/student/dashboard" className="glass-card p-3 rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <h1 className="font-ritafurey text-xl font-bold text-slate-900">Profile</h1>
                    <button onClick={handleLogout} className="glass-card p-3 rounded-xl text-red-500">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-3xl p-8 text-center mb-6"
                >
                    <div className="relative inline-block mb-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-4xl text-white shadow-lg">
                            {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-200">
                            <Camera className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>

                    {isEditing ? (
                        <div className="space-y-4 text-left">
                            <div>
                                <label className="text-slate-500 text-sm mb-1 block">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="glass-input w-full"
                                />
                            </div>
                            <div>
                                <label className="text-slate-500 text-sm mb-1 block">Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    rows={3}
                                    placeholder="Tell us about yourself..."
                                    className="glass-input w-full resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1">Cancel</button>
                                <button onClick={() => updateMutation.mutate(formData)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" /> Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-slate-900 text-2xl font-bold mb-1">{user?.name}</h2>
                            {user?.bio && <p className="text-slate-500 text-sm mb-4">{user.bio}</p>}
                            <button onClick={() => setIsEditing(true)} className="btn-secondary px-6">Edit Profile</button>
                        </>
                    )}
                </motion.div>

                {/* Info Cards - Only email, department, year */}
                <div className="space-y-3">
                    <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">Email</p>
                            <p className="text-slate-900">{user?.email}</p>
                        </div>
                    </div>

                    {user?.department && (
                        <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs">Department</p>
                                <p className="text-slate-900">{user.department.name}</p>
                            </div>
                        </div>
                    )}

                    {user?.year && (
                        <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs">Year</p>
                                <p className="text-slate-900">{user.year.name}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Navigation with backdrop blur */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-200/50 md:hidden z-50">
                <div className="flex justify-around items-center py-2">
                    <Link href="/student/dashboard" className="flex flex-col items-center p-2 text-slate-500">
                        <Home className="w-6 h-6" />
                        <span className="text-xs mt-1">Home</span>
                    </Link>
                    <Link href="/student/pyqs" className="flex flex-col items-center p-2 text-slate-500">
                        <FileText className="w-6 h-6" />
                        <span className="text-xs mt-1">PYQs</span>
                    </Link>
                    <Link href="/student/notices" className="flex flex-col items-center p-2 text-slate-500">
                        <Bell className="w-6 h-6" />
                        <span className="text-xs mt-1">Notices</span>
                    </Link>
                    <Link href="/student/profile" className="flex flex-col items-center p-2 text-orange-500">
                        <User className="w-6 h-6" />
                        <span className="text-xs mt-1">Profile</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}
