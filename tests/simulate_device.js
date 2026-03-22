const crypto = require("crypto");

const API_BASE = process.env.SEEDING === "true" ? `http://localhost:${process.env.PORT || 3000}` : "https://ss-das-web.onrender.com";

// Device Secrets
const DEVICE_ID = "SIM_01";
const SENSOR_ID = "DHT_SIM";
const PUF_SECRET = "MY_PUF_SECRET_KEY";

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg2UrxXvQvKPa5FzVR
uHQU+sUC1wg1OVC7yLT3PWRUdG2hRANCAASgWYH3P7tS3A0fyAXrNJklaAQa9ADW
YlcLsnUzMSvE4OYvYE6EXHWK0onPQSWc2tODcK4Ub+d2pVUESbq/i2/c
-----END PRIVATE KEY-----`;

// User E2EE Password (for payload encryption)
const PASSWORD = "my_secure_password";
const SALT = "SS-DAS-SALT-1234";

async function simulateDevice() {
  console.log("Starting Advanced Security Device Simulation...\n");

  // --- 1. PUF Challenge-Response Protocol (CRA) ---
  console.log("1. Requesting PUF Challenge from backend...");
  let challenge;
  try {
    const res = await fetch(`${API_BASE}/auth/challenge?device_id=${DEVICE_ID}`);
    const data = await res.json();
    challenge = data.challenge;
    console.log("   Received Challenge:", challenge);
  } catch (err) {
    console.error("Failed to fetch challenge:", err.message);
    return;
  }

  // Compute PUF Response using Simulated PUF "Circuit" (HMAC)
  const pufResponse = crypto.createHmac("sha256", PUF_SECRET)
                            .update(challenge)
                            .digest("hex");
  console.log("   Computed PUF Response:", pufResponse);

  // --- 2. AES-GCM Encryption ---
  console.log("\n2. Encrypting Telemetry Payload...");
  const keyMaterial = crypto.pbkdf2Sync(PASSWORD, SALT, 100000, 32, "sha256");
  
  const sensorData = {
    temperature: (20 + Math.random() * 10).toFixed(2),
    humidity: (40 + Math.random() * 20).toFixed(2),
  };
  const plaintext = JSON.stringify(sensorData);
  
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyMaterial, nonce);
  let ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final(), cipher.getAuthTag()]);
  
  const ciphertextB64 = ciphertext.toString("base64");
  const nonceB64 = nonce.toString("base64");
  console.log("   Ciphertext generated.");

  // --- 3. HMAC for Data Integrity (Frontend validation) ---
  console.log("\n3. Generating HMAC for Data Integrity...");
  const hmac = crypto.createHmac("sha256", keyMaterial) // Using E2EE key for HMAC
                     .update(ciphertextB64)
                     .digest("hex");
                     
  // --- 4. ECDSA Signature for Non-Repudiation (Backend validation) ---
  console.log("\n4. Generating ECDSA Signature...");
  const timestamp = Date.now();
  const dataToSign = `${DEVICE_ID}|${SENSOR_ID}|${ciphertextB64}|${nonceB64}|${timestamp}`;
  const sign = crypto.createSign('SHA256');
  sign.update(dataToSign);
  sign.end();
  const signature = sign.sign(PRIVATE_KEY).toString('base64');
  console.log("   Signature attached.");

  // --- 5. Send Full Payload ---
  console.log("\n5. Sending Telemetry to Backend...");
  const payload = {
    device_id: DEVICE_ID,
    sensor_id: SENSOR_ID,
    ciphertext: ciphertextB64,
    nonce: nonceB64,
    timestamp: timestamp,
    puf_response: pufResponse,
    hmac: hmac,
    signature: signature
  };

  try {
    const res = await fetch(`${API_BASE}/data/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    console.log("   Backend Response:", result);
  } catch (err) {
    console.error("   Failed to reach backend:", err.message);
  }
}

simulateDevice();
