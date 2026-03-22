const crypto = require("crypto");
const { execSync } = require("child_process");

const API_BASE = process.env.SEEDING === "true" ? `http://localhost:${process.env.PORT || 3000}` : "https://ss-das-web.onrender.com";
const DEVICE_ID = "SIM_01";
const PUF_SECRET = "MY_PUF_SECRET_KEY";

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg2UrxXvQvKPa5FzVR
uHQU+sUC1wg1OVC7yLT3PWRUdG2hRANCAASgWYH3P7tS3A0fyAXrNJklaAQa9ADW
YlcLsnUzMSvE4OYvYE6EXHWK0onPQSWc2tODcK4Ub+d2pVUESbq/i2/c
-----END PRIVATE KEY-----`;

// Deduce the exact public key that matches the simulator's hardcoded private key
const privateKeyObj = crypto.createPrivateKey({ key: PRIVATE_KEY, format: 'pem' });
const publicKeyObj = crypto.createPublicKey(privateKeyObj);
const publicKey = publicKeyObj.export({ type: 'spki', format: 'pem' });

async function run() {
  console.log("1. Provisioning SIM_01 on live server...");
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
    console.log("Provision Response:", await res.json());

    const res2 = await fetch(`${API_BASE}/sensors/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sensor_id: "DHT_SIM",
        device_id: DEVICE_ID,
        sensor_type: "DHT22 Simulated Temp & Hum"
      })
    });
    console.log("Sensor Provision Response:", await res2.json());

    console.log("\n2. Injecting 3 encrypted payloads...");
    const path = require("path");
    const simulatorPath = path.join(__dirname, "..", "tests", "simulate_device.js");
    
    for(let i=1; i<=3; i++) {
        console.log(`\n--- Payload ${i} ---`);
        execSync(`node "${simulatorPath}"`, { stdio: 'inherit', env: process.env });
        execSync("node -e \"Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000)\"");
    }
    
    
    console.log("\n3. Injecting a malicious hardware clone attack...");
    const roguePath = path.join(__dirname, "..", "tests", "simulate_rogue.js");
    execSync(`node "${roguePath}"`, { stdio: 'inherit', env: process.env });

    console.log("\n✅ All data successfully generated on Production Dashboard!");

  } catch (err) {
    console.error("Critical error:", err);
  }
}

run();
