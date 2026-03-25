import React, { useState, useEffect } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { useAetherKeyContext } from './AetherKeyProvider';

export function useOllamaScanner(ollamaUrl?: string) {
    const url = ollamaUrl ?? 'http://127.0.0.1:11434';
    const [isScanning, setIsScanning] = useState(false);
    const [models, setModels] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const scanLocalhost = async () => {
        setIsScanning(true);
        setError(null);
        try {
            const res = await fetch(`${url}/api/tags`);
            if (!res.ok) throw new Error('Ollama API returned error');
            const data = await res.json();
            setModels(data.models || []);
        } catch (err: any) {
            setError(err.message || 'Failed to connect. Is Ollama running?');
            setModels([]);
        } finally {
            setIsScanning(false);
        }
    };

    return { scanLocalhost, isScanning, models, error };
}

export function OllamaScanner() {
    const { ollamaUrl } = useAetherKeyContext();
    const { scanLocalhost, isScanning, models, error } = useOllamaScanner(ollamaUrl);
    const { setProvider, setModel, providerId, modelId, setIsConfigured } = useVaultStore();

    const isOllamaSelected = providerId === 'ollama';

    // Auto-connect when model is selected
    const handleModelSelect = (name: string) => {
        setProvider('ollama');
        setModel(name);
        setIsConfigured(true);
    };

    return (
        <div className={`rounded-2xl border-2 transition-all duration-200 ${isOllamaSelected && models.length > 0
                ? 'border-primary/50 bg-primary/[0.02] shadow-sm'
                : 'border-border'
            }`}>
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${isOllamaSelected && models.length > 0 ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isOllamaSelected && models.length > 0 ? 'text-primary' : 'text-muted-foreground'}>
                            <rect x="2" y="6" width="20" height="12" rx="2" />
                            <path d="M12 12h.01" />
                            <path d="M17 12h.01" />
                            <path d="M7 12h.01" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-lg font-semibold">Ollama</span>
                        <p className="text-sm text-muted-foreground">Automatically scan local network</p>
                        {isOllamaSelected && models.length > 0 && (
                            <span className="hidden ml-1.5 items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                {models.length}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => {
                        setProvider('ollama');
                        scanLocalhost();
                    }}
                    disabled={isScanning}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                    {isScanning ? (
                        <svg className="ak-spinner h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    )}
                    {isScanning ? 'Scanning' : 'Scan'}
                </button>
            </div>

            {/* Error */}
            {error && isOllamaSelected && (
                <div className="mx-5 mb-5 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                    <p className="text-sm text-destructive font-semibold">Connection failed</p>
                    <code className="block text-xs font-mono bg-background mt-2 p-3 rounded-lg border border-border select-all text-muted-foreground whitespace-pre-wrap">
                        OLLAMA_ORIGINS="*" ollama serve
                    </code>
                </div>
            )}

            {/* Models inline — appears like a tag list */}
            {models.length > 0 && isOllamaSelected && (
                <div className="px-5 pb-5 animate-slide-up">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Available Models</p>
                    <div className="flex flex-wrap gap-2">
                        {models.map(m => (
                            <button
                                key={m.name}
                                onClick={() => handleModelSelect(m.name)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-100 ${modelId === m.name
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-muted/70 text-foreground hover:bg-muted hover:shadow-sm border'
                                    }`}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
