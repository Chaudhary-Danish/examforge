import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { ClientWrapper } from '@/components/ClientWrapper'

export const metadata: Metadata = {
    title: 'ExamForge - AI-Powered Exam Preparation',
    description: 'Ace your exams with AI-powered study materials, previous year questions, and intelligent tutoring.',
    keywords: ['exam preparation', 'AI tutor', 'study materials', 'PYQ', 'education'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased">
                <Providers>
                    <ClientWrapper>
                        {children}
                    </ClientWrapper>
                </Providers>
            </body>
        </html>
    )
}
