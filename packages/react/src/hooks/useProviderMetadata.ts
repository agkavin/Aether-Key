import { useQuery } from '@tanstack/react-query';
import { Provider, ProviderFields } from '../types';

export function useProviderMetadata(proxyBaseUrl: string) {
    return useQuery<Provider[]>({
        queryKey: ['providers', proxyBaseUrl],
        queryFn: async () => {
            const res = await fetch(`${proxyBaseUrl}/v1/metadata`);
            if (!res.ok) throw new Error('Failed to fetch metadata');
            const data = await res.json();
            return data.providers;
        },
        staleTime: 1000 * 60 * 60, // 1 hour caching
    });
}

export function useProviderFields(proxyBaseUrl: string, providerId: string | null) {
    return useQuery<ProviderFields>({
        queryKey: ['provider-fields', proxyBaseUrl, providerId],
        queryFn: async () => {
            if (!providerId) return { required_params: [] };
            const res = await fetch(`${proxyBaseUrl}/v1/metadata/${providerId}/fields`);
            if (!res.ok) throw new Error('Failed to fetch provider fields');
            return res.json();
        },
        enabled: !!providerId && providerId !== 'ollama',
        staleTime: 1000 * 60 * 60, // 1 hour caching
    });
}
