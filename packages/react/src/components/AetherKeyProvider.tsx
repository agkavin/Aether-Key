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
    const isWin = typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Windows');
    const DEFAULT_OLLAMA_URL = isWin ? 'http://127.0.0.1:11434' : 'http://localhost:11434';

    return (
        <AetherKeyContext.Provider value={{ proxyUrl, ollamaUrl: ollamaUrl ?? DEFAULT_OLLAMA_URL }}>
            <QueryClientProvider client={queryClient ?? defaultQueryClient}>
                {children}
            </QueryClientProvider>
        </AetherKeyContext.Provider>
    );
}
