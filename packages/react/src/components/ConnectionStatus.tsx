import React from 'react';
import { useVaultStore } from '../store/vaultStore';

export function ConnectionStatus() {
    const { isConfigured, providerId, modelId } = useVaultStore();

    if (!isConfigured) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 text-[11px] text-muted-foreground font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                Disconnected
            </span>
        );
    }

    const displayName = modelId
        ? modelId.length > 25
            ? modelId.slice(0, 25) + '...'
            : modelId
        : providerId;

    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {displayName}
        </span>
    );
}
