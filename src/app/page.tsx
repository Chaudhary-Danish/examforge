'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

// Random motivational quotes
const QUOTES = [
    "Believe you can and you're halfway there.",
    "The only way to do great work is to love what you do.",
    "Success is not final, failure is not fatal.",
    "Your limitation—it's only your imagination.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn’t just find you. You have to go out and get it."
]

export default function Onboarding() {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2>(1)
    const [quote, setQuote] = useState('')
    const [greeting, setGreeting] = useState('')
    const [checkingAuth, setCheckingAuth] = useState(true)

    // Check if user is already logged in — skip onboarding if so
    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/user/me')
                if (res.ok) {
                    const data = await res.json()
                    if (data.user?.role === 'admin') {
                        router.replace('/admin/dashboard')
                        return
                    } else if (data.user?.role === 'student') {
                        router.replace('/student/dashboard')
                        return
                    }
                }
            } catch {
                // Not logged in, show onboarding
            }
            setCheckingAuth(false)
        }
        checkAuth()
    }, [router])

    useEffect(() => {
        // Set random quote
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])

        // Set greeting based on time
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good Morning')
        else if (hour < 18) setGreeting('Good Afternoon')
        else setGreeting('Good Evening')
    }, [])

    useEffect(() => {
        if (step === 2) {
            const timer = setTimeout(() => {
                router.push('/login')
            }, 3500) // Show quote for 3.5 seconds
            return () => clearTimeout(timer)
        }
    }, [step, router])

    // Show nothing while checking auth to avoid flash of onboarding
    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-cream-100">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center animate-pulse">
                    <span className="text-3xl">🦊</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-cream-50 via-white to-cream-100 overflow-hidden relative">

            {/* Background Decorations */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-200/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px]" />

            <div className="w-full max-w-lg z-10 text-center">
                <AnimatePresence mode="wait">

                    {/* SCREEN 1: Greeting & Mascot */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center"
                        >
                            {/* Animated Mascot */}
                            <div className="relative mb-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                                    className="w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl shadow-xl flex items-center justify-center z-10 relative"
                                >
                                    <span className="text-6xl filter drop-shadow-md">🦊</span>
                                </motion.div>

                                {/* Waving Hand Animation */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20, rotate: -20 }}
                                    animate={{
                                        opacity: 1,
                                        x: 60,
                                        y: -20,
                                        rotate: [0, 20, -20, 20, 0]
                                    }}
                                    transition={{
                                        delay: 0.8,
                                        rotate: { repeat: Infinity, duration: 2, repeatDelay: 1 }
                                    }}
                                    className="absolute top-0 right-0 text-5xl origin-bottom-left"
                                    style={{ transformOrigin: 'bottom left' }}
                                >
                                    👋
                                </motion.div>

                                {/* Decorative Rings */}
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="absolute inset-0 bg-orange-400 rounded-3xl -z-10 blur-xl opacity-50"
                                />
                            </div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="font-ritafurey text-4xl font-bold text-slate-900 mb-2"
                            >
                                {greeting}!
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="text-slate-500 text-lg mb-10"
                            >
                                How's it going today?
                            </motion.p>

                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ delay: 0.8 }}
                                onClick={() => setStep(2)}
                                className="group relative px-8 py-4 bg-slate-900 text-white rounded-2xl font-semibold shadow-lg shadow-slate-900/20 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* SCREEN 2: Quote */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col items-center justify-center max-w-md mx-auto"
                        >
                            <div className="mb-6 opacity-20">
                                <span className="text-6xl text-slate-900 font-serif">"</span>
                            </div>

                            <h2 className="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed font-serif italic mb-6">
                                {quote}
                            </h2>

                            <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full" />

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="mt-8 text-sm text-slate-400 font-medium tracking-widest uppercase"
                            >
                                Loading ExamForge...
                            </motion.p>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    )
}
