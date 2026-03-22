// Simple Web Crypto API wrappers for AES-GCM encryption
// Used for the "passphrase" tier of the vault.

const getDerivationParams = (salt: Uint8Array) => ({
    name: "PBKDF2",
    salt: salt,
    iterations: 100000,
    hash: "SHA-256",
});

const getKeyMaterial = async (password: string) => {
    const enc = new TextEncoder();
    return window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
};

export const encryptData = async (password: string, plaintext: string): Promise<string> => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await getKeyMaterial(password);
    const key = await window.crypto.subtle.deriveKey(
        getDerivationParams(salt),
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );

    const enc = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(plaintext)
    );

    // Combine salt, iv, and ciphertext into a single base64 string
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // btoa expects a binary string
    const binary = Array.from(combined).map(b => String.fromCharCode(b)).join('');
    return btoa(binary);
};

export const decryptData = async (password: string, base64Data: string): Promise<string> => {
    const binary = atob(base64Data);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        combined[i] = binary.charCodeAt(i);
    }

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    const keyMaterial = await getKeyMaterial(password);
    const key = await window.crypto.subtle.deriveKey(
        getDerivationParams(salt),
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
};
