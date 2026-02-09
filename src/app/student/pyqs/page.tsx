'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Home, User, Bell, Download, Calendar } from 'lucide-react'
import Loader from '@/components/Loader'

interface PYQ {
    id: string
    title: string
    year?: number
    exam_type?: string
    file_url?: string
    subject?: { name: string; code: string }
}

export default function PYQsPage() {
    const router = useRouter()

    const { data: pyqs, isLoading } = useQuery<PYQ[]>({
        queryKey: ['pyqs'],
        queryFn: async () => {
            const res = await fetch('/api/pyqs')
            if (!res.ok) {
                if (res.status === 401) router.push('/login')
                return []
            }
            return res.json()
        }
    })

    const getDownloadUrl = (fileUrl?: string, id?: string) => {
        if (!fileUrl || !id) return '#'
        if (fileUrl.startsWith('telegram://') || fileUrl.startsWith('local://')) {
            return `/api/files/${id}`
        }
        return fileUrl
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 pb-24 md:pb-8">
            <div className="max-w-2xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/student/dashboard" className="glass-card p-3 rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="font-ritafurey text-2xl font-bold text-slate-900">Previous Year Papers</h1>
                        <p className="text-slate-500 text-sm">Download past exam papers</p>
                    </div>
                </div>

                {/* PYQs List */}
                {isLoading ? (
                    <Loader text="Loading papers..." fullScreen={false} />
                ) : pyqs && pyqs.length > 0 ? (
                    <div className="space-y-3">
                        {pyqs.map(pyq => (
                            <div key={pyq.id} className="glass-card p-4 rounded-2xl">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-slate-900 font-medium">{pyq.title}</h3>
                                            <div className="flex items-center gap-3 mt-1 text-slate-400 text-xs">
                                                {pyq.year && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> {pyq.year}
                                                    </span>
                                                )}
                                                {pyq.exam_type && (
                                                    <span className="px-2 py-0.5 bg-slate-100 rounded">{pyq.exam_type}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {pyq.file_url && (
                                        <a
                                            href={getDownloadUrl(pyq.file_url, pyq.id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-orange-100 text-orange-500 rounded-lg hover:bg-orange-200 transition-colors"
                                        >
                                            <Download className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-12 rounded-2xl text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">No papers available yet</p>
                        <p className="text-slate-400 text-sm mt-1">Check back later for uploads</p>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-200/50 md:hidden z-50">
                <div className="flex justify-around items-center py-2">
                    <Link href="/student/dashboard" className="flex flex-col items-center p-2 text-slate-500">
                        <Home className="w-6 h-6" />
                        <span className="text-xs mt-1">Home</span>
                    </Link>
                    <Link href="/student/pyqs" className="flex flex-col items-center p-2 text-orange-500">
                        <FileText className="w-6 h-6" />
                        <span className="text-xs mt-1">PYQs</span>
                    </Link>
                    <Link href="/student/notices" className="flex flex-col items-center p-2 text-slate-500">
                        <Bell className="w-6 h-6" />
                        <span className="text-xs mt-1">Notices</span>
                    </Link>
                    <Link href="/student/profile" className="flex flex-col items-center p-2 text-slate-500">
                        <User className="w-6 h-6" />
                        <span className="text-xs mt-1">Profile</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}
