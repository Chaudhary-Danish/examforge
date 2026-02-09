'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="mb-8 relative"
                >
                    <div className="absolute inset-0 bg-orange-200 blur-3xl opacity-30 rounded-full" />
                    <h1 className="font-ritafurey text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 relative z-10">
                        404
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="font-ritafurey text-3xl font-bold text-slate-900 mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                        Oops! The page you're looking for seems to have vanished into the digital void.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Go Back
                        </button>
                        <Link
                            href="/"
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-colors shadow-lg shadow-orange-500/20"
                        >
                            <Home className="w-5 h-5" />
                            Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
