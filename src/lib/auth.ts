import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-change-in-production'

export interface JWTPayload {
    id: string
    role: 'student' | 'admin'
    email: string
    name: string
    studentId?: string
    adminId?: string
}

export async function verifyAuth(req: NextRequest): Promise<JWTPayload> {
    const token = req.cookies.get('token')?.value

    if (!token) {
        throw new Error('Unauthorized')
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
        return decoded
    } catch (error) {
        throw new Error('Unauthorized')
    }
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function generateStudentId(count: number): string {
    const year = new Date().getFullYear()
    const sequence = String(count + 1).padStart(3, '0')
    return `STU-${year}-${sequence}`
}
