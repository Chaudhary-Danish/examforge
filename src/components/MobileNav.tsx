'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Bell, User, MessageSquare } from 'lucide-react'

interface NavItem {
    href: string
    icon: typeof Home
    label: string
}

const navItems: NavItem[] = [
    { href: '/student/dashboard', icon: Home, label: 'Home' },
    { href: '/student/ai', icon: MessageSquare, label: 'AI' },
    { href: '/student/notices', icon: Bell, label: 'Notices' },
    { href: '/student/profile', icon: User, label: 'Profile' }
]

export default function MobileNav() {
    const pathname = usePathname()

    // Fetch unread notice count
    const { data: notices } = useQuery<{ is_read?: boolean }[]>({
        queryKey: ['notices'],
        queryFn: async () => {
            const res = await fetch('/api/notices')
            if (!res.ok) return []
            return res.json()
        },
        staleTime: 60000, // 1 minute
    })

    const unreadCount = notices?.filter(n => !n.is_read).length || 0

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-lg border-t border-slate-200/50 md:hidden z-50">
            <div className="flex justify-around items-center py-2">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href || pathname?.startsWith(href + '/')
                    const isNotices = label === 'Notices'

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center p-2 relative ${isActive ? 'text-orange-500' : 'text-slate-500'
                                }`}
                        >
                            <div className="relative">
                                <Icon className="w-5 h-5" />
                                {isNotices && unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs mt-0.5">{label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
