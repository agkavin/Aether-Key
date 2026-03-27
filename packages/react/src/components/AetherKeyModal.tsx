import React, { useEffect, useRef } from 'react';
import { ProviderSearch } from './ProviderSearch';
import { KeyVault } from './KeyVault';
import { OllamaScanner } from './OllamaScanner';
import { useAetherKeyContext } from './AetherKeyProvider';
import { useVaultStore } from '../store/vaultStore';

interface AetherKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AetherKeyModal({ isOpen, onClose }: AetherKeyModalProps) {
    const { proxyUrl } = useAetherKeyContext();
    const { isConfigured, providerId } = useVaultStore();
    const prevConfigured = useRef(isConfigured);

    // Auto-close only when isConfigured transitions from false → true
    useEffect(() => {
        if (isConfigured && !prevConfigured.current && isOpen) {
            const timer = setTimeout(onClose, 600);
            return () => clearTimeout(timer);
        }
        prevConfigured.current = isConfigured;
    }, [isConfigured, isOpen, onClose]);

    // Reset the tracker when modal opens so re-opening works
    useEffect(() => {
        if (isOpen) {
            prevConfigured.current = isConfigured;
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const showCredentials = providerId && providerId !== 'ollama';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-card w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="p-6 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">Connect AI</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">Local models or bring your own key</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                {/* Content — scrollable */}
                <div className="px-6 pb-24 flex-1 overflow-y-auto space-y-8">
                    <OllamaScanner />

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-card px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">or</span>
                        </div>
                    </div>

                    <ProviderSearch proxyBaseUrl={proxyUrl} />

                    {showCredentials && <KeyVault />}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        Zero-knowledge &bull; Keys never touch server
                    </div>
                </div>
            </div>
        </div>
    );
}
