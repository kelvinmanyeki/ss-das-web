const crypto = require("crypto");

const API_BASE = "https://ss-das-web.onrender.com";

// Device Secrets (Spoofed / Rogue)
const DEVICE_ID = "SIM_01";
const SENSOR_ID = "DHT_SIM";
// ROGUE DEVICE DOES NOT HAVE THE MATCHING SECRET BURNED INTO ITS SILICON!
const PUF_SECRET = "HACKER_FORGED_SECRET_KEY";

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg2UrxXvQvKPa5FzVR
uHQU+sUC1wg1OVC7yLT3PWRUdG2hRANCAASgWYH3P7tS3A0fyAXrNJklaAQa9ADW
YlcLsnUzMSvE4OYvYE6EXHWK0onPQSWc2tODcK4Ub+d2pVUESbq/i2/c
-----END PRIVATE KEY-----`;

const PASSWORD = "my_secure_password";
const SALT = "SS-DAS-SALT-1234";

async function simulateRogue() {
  console.log("Starting Malicious Hardware Clone Simulation...\n");

  console.log("1. Requesting PUF Challenge from backend...");
  let challenge;
  try {
    const res = await fetch(`${API_BASE}/auth/challenge?device_id=${DEVICE_ID}`);
    const data = await res.json();
    challenge = data.challenge;
  } catch (err) { return; }

  const pufResponse = crypto.createHmac("sha256", PUF_SECRET).update(challenge).digest("hex");
  console.log("   Spoofed PUF Response computed.");

  const keyMaterial = crypto.pbkdf2Sync(PASSWORD, SALT, 100000, 32, "sha256");
  const plaintext = JSON.stringify({ temperature: '999.99', attack: 'true' });
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyMaterial, nonce);
  const ciphertextB64 = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final(), cipher.getAuthTag()]).toString("base64");
  
  const hmac = crypto.createHmac("sha256", keyMaterial).update(ciphertextB64).digest("hex");
  const timestamp = Date.now();
  
  const sign = crypto.createSign('SHA256');
  sign.update(`${DEVICE_ID}|${SENSOR_ID}|${ciphertextB64}|${nonce.toString("base64")}|${timestamp}`);
  sign.end();
  const signature = sign.sign(PRIVATE_KEY).toString('base64');

  const payload = {
    device_id: DEVICE_ID,
    sensor_id: SENSOR_ID,
    ciphertext: ciphertextB64,
    nonce: nonce.toString('base64'),
    timestamp: timestamp,
    puf_response: pufResponse,
    hmac: hmac,
    signature: signature
  };

  try {
    const res = await fetch(`${API_BASE}/data/ingest`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    console.log("   Backend Firewall Response:", await res.json());
  } catch (err) {}
}

simulateRogue();
