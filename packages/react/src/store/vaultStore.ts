import { create } from 'zustand';
import { VaultConfig, StorageTier } from '../types';
import { saveVaultToStorage, loadVaultFromStorage, clearVaultFromStorage } from '../utils/storage';
import { encryptData, decryptData } from '../utils/encryption';

interface VaultState extends VaultConfig {
    setProvider: (providerId: string) => void;
    setModel: (modelId: string) => void;
    setStorageTier: (tier: StorageTier) => void;
    setCredential: (key: string, value: string) => void;
    clearCredentials: () => void;
    setIsConfigured: (status: boolean) => void;
    saveVault: (passphrase?: string) => Promise<void>;
    loadFromStorage: (passphrase?: string) => Promise<void>;
    disconnect: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
    providerId: null,
    modelId: null,
    storageTier: 'session',
    credentials: {},
    isConfigured: false,

    setProvider: (providerId) => set({ providerId, modelId: null, credentials: {}, isConfigured: false }),
    setModel: (modelId) => set({ modelId }),
    setStorageTier: (tier) => set({ storageTier: tier }),
    setCredential: (key, value) =>
        set((state) => ({ credentials: { ...state.credentials, [key]: value } })),
    clearCredentials: () => set({ credentials: {}, isConfigured: false }),
    setIsConfigured: (status) => set({ isConfigured: status }),

    saveVault: async (passphrase?: string) => {
        const { providerId, modelId, storageTier, credentials } = get();
        if (!providerId) return;

        if (storageTier === 'session') {
            return;
        }

        if (storageTier === 'local') {
            saveVaultToStorage({
                providerId,
                modelId,
                storageTier: 'local',
                credentials,
            });
        } else if (storageTier === 'passphrase' && passphrase) {
            const encrypted = await encryptData(passphrase, JSON.stringify(credentials));
            saveVaultToStorage({
                providerId,
                modelId,
                storageTier: 'passphrase',
                credentials_encrypted: encrypted,
            });
        }
    },

    loadFromStorage: async (passphrase?: string) => {
        const stored = loadVaultFromStorage();
        if (!stored) return;

        if (stored.storageTier === 'local' && stored.credentials) {
            set({
                providerId: stored.providerId,
                modelId: stored.modelId,
                storageTier: 'local',
                credentials: stored.credentials,
                isConfigured: true,
            });
        } else if (stored.storageTier === 'passphrase' && stored.credentials_encrypted) {
            if (!passphrase) return;
            try {
                const decrypted = await decryptData(passphrase, stored.credentials_encrypted);
                const credentials = JSON.parse(decrypted);
                set({
                    providerId: stored.providerId,
                    modelId: stored.modelId,
                    storageTier: 'passphrase',
                    credentials,
                    isConfigured: true,
                });
            } catch (e) {
                console.error('[Aether-Key] Failed to decrypt vault:', e);
                clearVaultFromStorage();
            }
        }
    },

    disconnect: () => {
        clearVaultFromStorage();
        set({
            providerId: null,
            modelId: null,
            storageTier: 'session',
            credentials: {},
            isConfigured: false,
        });
    },
}));
