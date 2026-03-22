import { useEffect, useState } from 'react';
import { useVaultStore } from '../store/vaultStore';

export interface UseBYOKResult {
    headers: Record<string, string>;
    isConfigured: boolean;
    provider: string | null;
    model: string | null;
    isInitializing: boolean;
}

export function useBYOK(): UseBYOKResult {
    const { providerId, modelId, credentials, isConfigured, loadFromStorage } = useVaultStore();
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        loadFromStorage();
        setIsInitializing(false);
    }, [loadFromStorage]);

    const getHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = {};

        if (providerId) {
            headers['X-Provider'] = providerId;
        }

        Object.keys(credentials).forEach((key) => {
            const headerName = `X-${key.replace(/_/g, '-')}`;
            headers[headerName] = credentials[key];

            if (key.endsWith('_API_KEY') && !key.startsWith('AZURE_')) {
                headers['X-API-Key'] = credentials[key];
            }
        });

        return headers;
    };

    return {
        headers: getHeaders(),
        isConfigured,
        provider: providerId,
        model: modelId,
        isInitializing,
    };
}
