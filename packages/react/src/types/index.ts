export type StorageTier = 'session' | 'local' | 'passphrase';

export interface ProviderModel {
    id: string;
    name: string;
}

export interface Provider {
    id: string;
    name: string;
    models: ProviderModel[];
}

export interface ProviderFields {
    required_params: string[];
}

export interface VaultConfig {
    providerId: string | null;
    modelId: string | null;
    storageTier: StorageTier;
    credentials: Record<string, string>; // e.g., { OPENAI_API_KEY: 'sk-...', AZURE_API_BASE: '...' }
    isConfigured: boolean;
}

export interface ProxyConfig {
    baseUrl: string;
}
