'use client'

import { motion } from 'framer-motion'

const quotes = [
    "Knowledge is power ✨",
    "Small steps, big gains 🚀",
    "Focus wins 💪",
    "You've got this! 🌟",
    "Learn, grow, repeat 📚",
    "Stay curious 🦊",
    "Progress over perfection",
    "One topic at a time",
    "Every expert was once a beginner",
    "The best time to start is now"
]

export default function Loader({ text, fullScreen = true }: { text?: string; fullScreen?: boolean }) {
    const quote = quotes[Math.floor(Math.random() * quotes.length)]

    if (!fullScreen) {
        return (
            <div className="flex items-center justify-center py-12">
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-slate-400 text-sm italic"
                >
                    {text || quote}
                </motion.p>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-cream-100">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <p className="text-slate-400 text-lg italic">{quote}</p>
            </motion.div>
        </div>
    )
}
