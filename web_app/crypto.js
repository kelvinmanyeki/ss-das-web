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
