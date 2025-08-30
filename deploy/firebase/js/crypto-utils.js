/**
 * Crypto Utilities for Secure Credential Storage
 * Uses Web Crypto API for encryption/decryption
 */

class CryptoUtils {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.saltLength = 16;
        this.ivLength = 12;
        this.tagLength = 128;
        this.iterations = 100000;
    }

    /**
     * Generate a cryptographic key from a password
     */
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            {
                name: this.algorithm,
                length: this.keyLength
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypt data with AES-GCM
     */
    async encrypt(data, password) {
        try {
            const encoder = new TextEncoder();
            const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
            const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
            const key = await this.deriveKey(password, salt);

            const encrypted = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv,
                    tagLength: this.tagLength
                },
                key,
                encoder.encode(JSON.stringify(data))
            );

            // Combine salt + iv + encrypted data
            const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(new Uint8Array(encrypted), salt.length + iv.length);

            // Convert to base64 for storage
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Decrypt data with AES-GCM
     */
    async decrypt(encryptedData, password) {
        try {
            // Convert from base64
            const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

            // Extract components
            const salt = combined.slice(0, this.saltLength);
            const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
            const encrypted = combined.slice(this.saltLength + this.ivLength);

            const key = await this.deriveKey(password, salt);

            const decrypted = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv,
                    tagLength: this.tagLength
                },
                key,
                encrypted
            );

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    /**
     * Generate a unique device ID for encryption key
     */
    async generateDeviceId() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 50;
        
        // Create a unique canvas fingerprint
        ctx.textBaseline = 'top';
        ctx.font = '14px "Arial"';
        ctx.fillText('Claude Usage Monitor PWA', 2, 2);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillRect(100, 5, 80, 30);

        const dataURL = canvas.toDataURL();
        const hash = await this.hashString(dataURL + navigator.userAgent);
        
        return hash;
    }

    /**
     * Hash a string using SHA-256
     */
    async hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Validate API key format
     */
    validateApiKey(apiKey) {
        // Anthropic API keys start with 'sk-ant-'
        return apiKey && apiKey.startsWith('sk-ant-') && apiKey.length > 20;
    }

    /**
     * Mask sensitive data for display
     */
    maskApiKey(apiKey) {
        if (!apiKey || apiKey.length < 12) return '***';
        return apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);
    }

    /**
     * Generate a secure random token
     */
    generateToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

// Export for use in other modules
window.CryptoUtils = new CryptoUtils();