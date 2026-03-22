const crypto = require("crypto");

const DEVICE_ID = "SIM_01";
const PUF_SECRET = "MY_PUF_SECRET_KEY";

// Generate ECDSA Key Pair (prime256v1 / secp256r1 is standard for IoT)
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

console.log("=== DEVICE PROVISIONING ===");
console.log("Device ID:", DEVICE_ID);
console.log("PUF Secret:", PUF_SECRET);
console.log("\nPrivate Key (Save this for simulate_device.js):\n" + privateKey);
console.log("\nPublic Key (Saving to DB):\n" + publicKey);

const API_BASE = "https://ss-das-web.onrender.com";

async function provision() {
  try {
    const res = await fetch(`${API_BASE}/devices/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: DEVICE_ID,
        public_key: publicKey,
        puf_secret: PUF_SECRET
      })
    });
    const result = await res.json();
    console.log("\nBackend Response:", result);
  } catch (err) {
    console.error("\nFailed to provision via API:", err);
  }
}

provision();
