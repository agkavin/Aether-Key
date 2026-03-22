import { VaultConfig, StorageTier } from '../types';

const VAULT_KEY = 'aether-key-vault';

export interface StoredVault {
    providerId: string;
    modelId: string | null;
    storageTier: StorageTier;
    credentials?: Record<string, string>;
    credentials_encrypted?: string;
}

export function saveVaultToStorage(data: StoredVault): void {
    try {
        localStorage.setItem(VAULT_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('[Aether-Key] Failed to save vault to localStorage:', e);
    }
}

export function loadVaultFromStorage(): StoredVault | null {
    try {
        const raw = localStorage.getItem(VAULT_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as StoredVault;
    } catch (e) {
        console.error('[Aether-Key] Failed to load vault from localStorage:', e);
        return null;
    }
}

export function clearVaultFromStorage(): void {
    try {
        localStorage.removeItem(VAULT_KEY);
    } catch (e) {
        console.error('[Aether-Key] Failed to clear vault from localStorage:', e);
    }
}
