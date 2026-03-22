import React, { useState } from 'react';
import { useProviderFields } from '../hooks/useProviderMetadata';
import { useVaultStore } from '../store/vaultStore';
import { useAetherKeyContext } from './AetherKeyProvider';
import { StorageTier } from '../types';

export function KeyVault() {
    const { proxyUrl } = useAetherKeyContext();
    const { providerId, credentials, setCredential, storageTier, setStorageTier, setIsConfigured, saveVault } = useVaultStore();
    const { data: fields, isLoading } = useProviderFields(proxyUrl, providerId);
    const [passphrase, setPassphrase] = useState('');
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    if (!providerId || providerId === 'ollama') return null;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                <svg className="ak-spinner h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                <span className="text-xs">Loading fields...</span>
            </div>
        );
    }

    const requiredFields = fields?.required_params || [];

    const handleTestConnection = async () => {
        setIsValidating(true);
        setValidationError(null);
        try {
            const headers: Record<string, string> = { 'X-Provider': providerId };
            requiredFields.forEach(field => {
                const headerName = `X-${field.replace(/_/g, '-')}`;
                headers[headerName] = credentials[field] || '';
                if (field.endsWith('_API_KEY') && !field.startsWith('AZURE_')) {
                    headers['X-API-Key'] = credentials[field] || '';
                }
            });

            const res = await fetch(`${proxyUrl}/v1/validate`, { method: 'POST', headers });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.detail || 'Validation failed. Check your credentials.');
            }

            await saveVault(storageTier === 'passphrase' ? passphrase : undefined);
            setIsConfigured(true); // triggers auto-close in modal
        } catch (err: any) {
            setValidationError(err.message);
        } finally {
            setIsValidating(false);
        }
    };

    const allFieldsFilled = requiredFields.every(f => credentials[f]?.trim());

    return (
        <div className="rounded-2xl border-2 border-border overflow-hidden animate-slide-up mt-6">
            <div className="p-6 space-y-6">
                {/* Credential fields */}
                <div className="space-y-2">
                    {requiredFields.map(field => (
                        <div key={field}>
                            <label className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                                {field.replace(/_/g, ' ').replace(/api/i, 'API')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showKey[field] ? 'text' : 'password'}
                                    className="w-full pr-10 pl-4 py-3 text-base border-2 rounded-xl bg-background focus:ring-0 focus:border-primary outline-none font-mono transition-all placeholder:font-sans placeholder:text-muted-foreground/50"
                                    placeholder={`Enter ${field.replace(/_/g, ' ').toLowerCase()}`}
                                    value={credentials[field] || ''}
                                    onChange={(e) => setCredential(field, e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(prev => ({ ...prev, [field]: !prev[field] }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                >
                                    {showKey[field] ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Storage tier — compact row */}
                <div className="flex gap-2">
                    {([
                        { id: 'session' as StorageTier, label: 'Session' },
                        { id: 'local' as StorageTier, label: 'Remember' },
                        { id: 'passphrase' as StorageTier, label: 'Encrypted' },
                    ]).map(tier => (
                        <button
                            key={tier.id}
                            onClick={() => setStorageTier(tier.id)}
                            className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all ${storageTier === tier.id
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                    : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:border-border/50'
                                }`}
                        >
                            {tier.label}
                        </button>
                    ))}
                </div>

                {/* Passphrase */}
                {storageTier === 'passphrase' && (
                    <div className="animate-slide-up pt-2">
                        <label className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                            Passphrase
                        </label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 text-base border-2 rounded-xl bg-background focus:ring-0 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
                            placeholder="Encryption passphrase"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                        />
                    </div>
                )}

                {/* Error */}
                {validationError && (
                    <div className="p-4 text-sm bg-destructive/5 border border-destructive/20 rounded-xl text-destructive animate-slide-up font-medium">
                        {validationError}
                    </div>
                )}

                {/* Connect button */}
                <button
                    onClick={handleTestConnection}
                    disabled={isValidating || !allFieldsFilled}
                    className="w-full py-4 mt-2 rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isValidating ? (
                        <span className="inline-flex items-center gap-2">
                            <svg className="ak-spinner h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            Validating...
                        </span>
                    ) : (
                        'Connect'
                    )}
                </button>
            </div>
        </div>
    );
}
