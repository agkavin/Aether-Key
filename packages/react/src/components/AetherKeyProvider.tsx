import React, { createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface AetherKeyContextValue {
    proxyUrl: string;
    ollamaUrl: string;
}

const AetherKeyContext = createContext<AetherKeyContextValue | null>(null);

export function useAetherKeyContext(): AetherKeyContextValue {
    const ctx = useContext(AetherKeyContext);
    if (!ctx) {
        throw new Error('useAetherKeyContext must be used within an <AetherKeyProvider>. Wrap your app with <AetherKeyProvider proxyUrl="...">.');
    }
    return ctx;
}

const defaultQueryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

interface AetherKeyProviderProps {
    proxyUrl: string;
    ollamaUrl?: string;
    queryClient?: QueryClient;
    children: React.ReactNode;
}

export function AetherKeyProvider({ proxyUrl, ollamaUrl, queryClient, children }: AetherKeyProviderProps) {
    return (
        <AetherKeyContext.Provider value={{ proxyUrl, ollamaUrl: ollamaUrl ?? 'http://localhost:11434' }}>
            <QueryClientProvider client={queryClient ?? defaultQueryClient}>
                {children}
            </QueryClientProvider>
        </AetherKeyContext.Provider>
    );
}
