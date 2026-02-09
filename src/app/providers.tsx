'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// Create a global query client that can be accessed for invalidation
let globalQueryClient: QueryClient | null = null

export function getQueryClient() {
    return globalQueryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () => {
            const client = new QueryClient({
                defaultOptions: {
                    queries: {
                        // FIX: Set staleTime to 0 to ensure data is always fresh
                        // Previous 5 minutes was causing "delay" in updates
                        staleTime: 0,
                        gcTime: 5 * 60 * 1000,
                        refetchOnWindowFocus: true, // Refetch when user comes back to tab
                        refetchOnMount: true, // Refetch when component mounts
                        refetchOnReconnect: true,
                        retry: 1,
                    },
                },
            })
            globalQueryClient = client
            return client
        }
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
