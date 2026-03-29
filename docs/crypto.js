async function decryptAESGCM(ciphertextB64, nonceB64, key) {
    const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
    const nonce = Uint8Array.from(atob(nonceB64), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: nonce },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

// Derive a 256-bit AES-GCM key from a user password using PBKDF2
async function deriveAESKeyFromPassword(password) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    
    // In a production system, salt should be unique per device and passed from the backend
    const salt = enc.encode("SS-DAS-SALT-1234");
    
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

// Verify HMAC-SHA256 of the ciphertext to ensure Data Integrity
async function verifyHMAC(ciphertextB64, expectedHmacHex, key) {
    if (!expectedHmacHex) return false;
    
    // We'll use the same AES key for the HMAC, or derive an auth key in higher security
    const enc = new TextEncoder();
    const data = enc.encode(ciphertextB64);
    
    // Import the AES key as an HMAC key
    const rawKey = await crypto.subtle.exportKey("raw", key);
    const hmacKey = await crypto.subtle.importKey(
        "raw",
        rawKey,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    );
    
    // Convert hex string to Uint8Array
    const signature = new Uint8Array(expectedHmacHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    return await crypto.subtle.verify("HMAC", hmacKey, signature, data);
}
