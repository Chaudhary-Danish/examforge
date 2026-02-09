'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, ArrowLeft, Building2, GraduationCap, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const [role, setRole] = useState<'student' | 'admin' | null>(null)

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-cream-50 via-white to-cream-100">
            <div className="relative w-full max-w-md z-10">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg">
                        <span className="text-4xl">🦊</span>
                    </div>
                    <h1 className="font-ritafurey text-4xl font-bold text-slate-900 mb-2">
                        ExamForge
                    </h1>
                    <p className="text-slate-500">
                        AI-powered exam preparation
                    </p>
                </motion.div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-3xl p-8 shadow-xl"
                >
                    <AnimatePresence mode="wait">
                        {!role ? (
                            <RoleSelection key="role" onSelect={setRole} />
                        ) : role === 'student' ? (
                            <StudentAuth key="student" onBack={() => setRole(null)} />
                        ) : (
                            <AdminLogin key="admin" onBack={() => setRole(null)} />
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    )
}

function RoleSelection({ onSelect }: { onSelect: (role: 'student' | 'admin') => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
        >
            <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Choose your role</h2>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => onSelect('student')}
                    className="glass-card p-6 rounded-2xl text-center group hover:bg-orange-50 transition-all hover:shadow-lg"
                >
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-400 group-hover:text-orange-500 group-hover:scale-110 transition-all" />
                    <span className="font-semibold text-slate-900 block">Student</span>
                </button>
                <button
                    onClick={() => onSelect('admin')}
                    className="glass-card p-6 rounded-2xl text-center group hover:bg-orange-50 transition-all hover:shadow-lg"
                >
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-400 group-hover:text-orange-500 group-hover:scale-110 transition-all" />
                    <span className="font-semibold text-slate-900 block">Admin</span>
                </button>
            </div>
        </motion.div>
    )
}

function StudentAuth({ onBack }: { onBack: () => void }) {
    const [mode, setMode] = useState<'choice' | 'login' | 'signup'>('choice')

    if (mode === 'choice') {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
            >
                <button onClick={onBack} className="text-slate-500 text-sm mb-4 hover:text-slate-700 flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <h2 className="text-xl font-bold text-slate-900 mb-2">Student Portal</h2>
                <p className="text-slate-500 text-sm mb-6">Login or create a new account</p>

                <div className="space-y-3">
                    <button
                        onClick={() => setMode('login')}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <Lock className="w-5 h-5" /> Login
                    </button>
                    <button
                        onClick={() => setMode('signup')}
                        className="btn-secondary w-full flex items-center justify-center gap-2"
                    >
                        <User className="w-5 h-5" /> Sign Up
                    </button>
                </div>
            </motion.div>
        )
    }

    if (mode === 'login') {
        return <StudentLogin onBack={() => setMode('choice')} />
    }

    return <StudentSignup onBack={() => setMode('choice')} />
}

function StudentLogin({ onBack }: { onBack: () => void }) {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async () => {
        if (!email || !password) return setError('Email and password required')
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/student-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            router.push('/student/dashboard')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            <button onClick={onBack} className="text-slate-500 text-sm mb-4 hover:text-slate-700 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-2">Student Login</h2>
            <p className="text-slate-500 text-sm mb-6">Use your permanent password</p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-4">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        className="w-full pl-14 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="btn-primary w-full py-4 text-lg"
                >
                    {loading ? 'Signing in...' : 'Login'}
                </button>
            </div>
        </motion.div>
    )
}

function StudentSignup({ onBack }: { onBack: () => void }) {
    const [step, setStep] = useState<'form' | 'success'>('form')
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [departmentId, setDepartmentId] = useState('')
    const [yearId, setYearId] = useState('')
    const [semesterId, setSemesterId] = useState('') // Added state
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [generatedPassword, setGeneratedPassword] = useState('')

    const [departments, setDepartments] = useState<Array<{ id: string; name: string; code: string; years?: Array<{ id: string; name: string; code: string }> }>>([])
    const [semesters, setSemesters] = useState<Array<{ id: string; name: string }>>([]) // Added semesters

    useEffect(() => {
        fetch('/api/admin/departments')
            .then(r => r.json())
            .then(data => setDepartments(data || []))
            .catch(() => { })
    }, [])

    // Fetch semesters when year changes
    useEffect(() => {
        if (!yearId) {
            setSemesters([])
            return
        }
        fetch(`/api/admin/semesters?yearId=${yearId}`)
            .then(r => r.json())
            .then(data => setSemesters(data.semesters || []))
            .catch(() => setSemesters([]))
    }, [yearId])

    const selectedDept = departments.find(d => d.id === departmentId)

    const handleSignup = async () => {
        if (!email || !fullName || !departmentId || !yearId || !semesterId) {
            return setError('All fields are required')
        }
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/student-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, fullName, departmentId, yearId, semesterId })
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            setGeneratedPassword(data.password)
            setStep('success')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Signup failed')
        } finally {
            setLoading(false)
        }
    }

    if (step === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Account Created!</h2>
                <p className="text-slate-500 text-sm mb-6">Your permanent password has been sent to your email</p>

                <div className="glass-card p-4 rounded-xl mb-6 bg-orange-50">
                    <p className="text-slate-500 text-xs mb-1">Your Password</p>
                    <p className="text-slate-900 text-xl font-mono font-bold tracking-wider">{generatedPassword}</p>
                </div>

                <button
                    onClick={onBack}
                    className="btn-primary w-full"
                >
                    Go to Login
                </button>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            <button onClick={onBack} className="text-slate-500 text-sm mb-4 hover:text-slate-700 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-500 text-sm mb-6">A permanent password will be sent to your email</p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-4">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                </div>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                </div>

                <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <select
                        value={departmentId}
                        onChange={(e) => { setDepartmentId(e.target.value); setYearId(''); setSemesterId('') }}
                        className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                        ))}
                    </select>
                </div>

                {selectedDept?.years && selectedDept.years.length > 0 && (
                    <div className="relative">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                        <select
                            value={yearId}
                            onChange={(e) => { setYearId(e.target.value); setSemesterId('') }}
                            className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select Year</option>
                            {selectedDept.years.map(year => (
                                <option key={year.id} value={year.id}>{year.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {yearId && semesters.length > 0 && (
                    <div className="relative">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                        <select
                            value={semesterId}
                            onChange={(e) => setSemesterId(e.target.value)}
                            className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select Semester</option>
                            {semesters.map(sem => (
                                <option key={sem.id} value={sem.id}>{sem.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <button
                    onClick={handleSignup}
                    disabled={loading}
                    className="btn-primary w-full py-4 text-lg"
                >
                    {loading ? 'Creating...' : 'Create Account'}
                </button>
            </div>
        </motion.div>
    )
}

function AdminLogin({ onBack }: { onBack: () => void }) {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async () => {
        if (!email || !password) return setError('Email and password required')
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            router.push('/admin/dashboard')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            <button onClick={onBack} className="text-slate-500 text-sm mb-4 hover:text-slate-700 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-6">Admin Login</h2>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-4">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@examforge.app"
                        className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full pl-14 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="btn-primary w-full py-4 text-lg"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </div>
        </motion.div>
    )
}
