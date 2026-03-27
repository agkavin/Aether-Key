import React, { useState, useMemo } from 'react';
import { useProviderMetadata } from '../hooks/useProviderMetadata';
import { useVaultStore } from '../store/vaultStore';

interface ProviderSearchProps {
    proxyBaseUrl: string;
}

export function ProviderSearch({ proxyBaseUrl }: ProviderSearchProps) {
    const { data: providers, isLoading, error } = useProviderMetadata(proxyBaseUrl);
    const { providerId, setProvider, modelId, setModel } = useVaultStore();
    const [providerSearch, setProviderSearch] = useState('');
    const [modelSearch, setModelSearch] = useState('');
    const [providerOpen, setProviderOpen] = useState(false);
    const [modelOpen, setModelOpen] = useState(false);

    const filteredProviders = useMemo(() => {
        if (!providers) return [];
        if (!providerSearch) return providers;
        const q = providerSearch.toLowerCase();
        return providers.filter(p => p.name.toLowerCase().includes(q));
    }, [providers, providerSearch]);

    const selectedProvider = useMemo(() => {
        return providers?.find(p => p.id === providerId);
    }, [providers, providerId]);

    const filteredModels = useMemo(() => {
        if (!selectedProvider) return [];
        if (!modelSearch) return selectedProvider.models;
        const q = modelSearch.toLowerCase();
        return selectedProvider.models.filter(m => m.name.toLowerCase().includes(q));
    }, [selectedProvider, modelSearch]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                <svg className="ak-spinner h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                <span className="text-sm">Loading providers...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-center">
                <p className="text-sm text-destructive font-medium">Failed to load providers</p>
                <p className="text-xs text-destructive/70 mt-1">Is the proxy running?</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Provider Select */}
            <div>
                <label className="block text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                    Provider
                </label>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => { setProviderOpen(!providerOpen); setModelOpen(false); }}
                        className="w-full flex items-center justify-between px-4 py-3 text-base border-2 rounded-xl bg-background hover:border-border/80 transition-colors text-left focus:border-primary/50 outline-none"
                    >
                        <span className={providerId ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                            {selectedProvider?.name || 'Select a provider'}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m6 9 6 6 6-6" /></svg>
                    </button>

                    {providerOpen && (
                        <div className="relative mt-2 mb-4 bg-muted/20 border-2 rounded-xl overflow-hidden animate-scale-in">
                            <div className="p-2 border-b">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search providers..."
                                    className="w-full px-3 py-2 text-sm bg-muted/50 rounded-lg outline-none placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={providerSearch}
                                    onChange={(e) => setProviderSearch(e.target.value)}
                                />
                            </div>
                            <div className="max-h-[160px] overflow-y-auto p-1">
                                {filteredProviders.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            setProvider(p.id);
                                            // Auto-select the first model if available
                                            if (p.models && p.models.length > 0) {
                                                setModel(p.models[0].id);
                                            } else {
                                                setModel('');
                                            }
                                            setProviderOpen(false);
                                            setProviderSearch('');
                                        }}
                                        className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors ${providerId === p.id
                                            ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                                            : 'hover:bg-muted text-foreground'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{p.name}</span>
                                            <span className={`text-xs ${providerId === p.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{p.models.length} {p.models.length === 1 ? 'model' : 'models'}</span>
                                        </div>
                                    </button>
                                ))}
                                {filteredProviders.length === 0 && (
                                    <p className="py-3 text-center text-xs text-muted-foreground">No providers found</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Model Select — only show after provider is selected */}
            {selectedProvider && (
                <div className="animate-slide-up pt-4">
                    <label className="block text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                        Model
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => { setModelOpen(!modelOpen); setProviderOpen(false); }}
                            className="w-full flex items-center justify-between px-4 py-3 text-base border-2 rounded-xl bg-background hover:border-border/80 transition-colors text-left focus:border-primary/50 outline-none"
                        >
                            <span className={modelId ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                                {modelId || 'Select a model'}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m6 9 6 6 6-6" /></svg>
                        </button>

                        {modelOpen && (
                            <div className="relative mt-2 mb-4 bg-muted/20 border-2 rounded-xl overflow-hidden animate-scale-in">
                                <div className="p-2 border-b">
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Search models..."
                                        className="w-full px-3 py-2 text-sm bg-muted/50 rounded-lg outline-none placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                                        value={modelSearch}
                                        onChange={(e) => setModelSearch(e.target.value)}
                                    />
                                </div>
                                <div className="max-h-[200px] overflow-y-auto p-1">
                                    {filteredModels.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                setModel(m.id);
                                                setModelOpen(false);
                                                setModelSearch('');
                                            }}
                                            className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors ${modelId === m.id
                                                ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                                                : 'hover:bg-muted text-foreground'
                                                }`}
                                        >
                                            {m.name}
                                        </button>
                                    ))}
                                    {filteredModels.length === 0 && (
                                        <p className="py-3 text-center text-xs text-muted-foreground">No models found</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
