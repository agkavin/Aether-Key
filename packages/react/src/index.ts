// Components
export { AetherKeyProvider, useAetherKeyContext } from './components/AetherKeyProvider';
export { AetherKeyModal } from './components/AetherKeyModal';
export { ConnectionStatus } from './components/ConnectionStatus';
export { KeyVault } from './components/KeyVault';
export { OllamaScanner } from './components/OllamaScanner';
export { ProviderSearch } from './components/ProviderSearch';

// Hooks
export { useBYOK } from './hooks/useBYOK';
export type { UseBYOKResult } from './hooks/useBYOK';
export { useProviderMetadata, useProviderFields } from './hooks/useProviderMetadata';

// Store
export { useVaultStore } from './store/vaultStore';

// Types
export type { StorageTier, ProviderModel, Provider, ProviderFields, VaultConfig, ProxyConfig } from './types';

// Utils
export { encryptData, decryptData } from './utils/encryption';
