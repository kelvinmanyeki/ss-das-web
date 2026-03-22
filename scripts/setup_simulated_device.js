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

db.serialize(() => {
  // Clear existing if any
  db.run(`DELETE FROM devices WHERE device_id = ?`, [DEVICE_ID]);
  
  // Insert newly provisioned device
  db.run(
    `INSERT INTO devices (device_id, public_key, puf_secret) VALUES (?, ?, ?)`,
    [DEVICE_ID, publicKey, PUF_SECRET],
    (err) => {
      if (err) console.error("Error provisioning device:", err);
      else console.log("\n✅ Device successfully provisioned in the database.");
    }
  );
});
