const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = process.env.API_BASE || 'https://ss-das-web.onrender.com';
const DEVICE_ID = 'SIM_ATTACK_02';
const SENSOR_ID = 'TEMP_02';
const PUF_SECRET = 'SUPER_SECRET_PUF_KEY_123';
const DATA_PASSWORD = 'my_secure_password'; // as used in crypto.js comment or user's mind

// Crypto setup for ECDSA
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1', // Node uses prime256v1 for secp256r1
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Helper: Derive AES key from password (matching browser PBKDF2)
function deriveAESKey(password) {
  const salt = Buffer.from("SS-DAS-SALT-1234", "utf-8");
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

const aesKey = deriveAESKey(DATA_PASSWORD);

async function registerDevice() {
  try {
    const res = await axios.post(`${BASE_URL}/devices/register`, {
      device_id: DEVICE_ID,
      public_key: publicKey,
      puf_secret: PUF_SECRET
    });
    console.log('[+] Device registered:', res.data);
  } catch (error) {
    if (error.response && error.response.data.error === "Device already registered or DB error") {
      console.log('[-] Device already registered (ignoring).');
    } else {
      console.error('[-] Error registering device:', error.message);
    }
  }
}

async function registerSensor() {
  try {
    const res = await axios.post(`${BASE_URL}/sensors/register`, {
      sensor_id: SENSOR_ID,
      device_id: DEVICE_ID,
      sensor_type: "temperature"
    });
    console.log('[+] Sensor registered:', res.data);
  } catch (error) {
    if (error.response && error.response.data.error === "Sensor already registered or DB error") {
      console.log('[-] Sensor already registered (ignoring).');
    } else {
      console.error('[-] Error registering sensor:', error.message);
    }
  }
}

async function getChallenge() {
  try {
    const res = await axios.get(`${BASE_URL}/auth/challenge`, {
      params: { device_id: DEVICE_ID }
    });
    return res.data.challenge;
  } catch (error) {
    console.error('[-] Error getting challenge:', error.message);
    return null;
  }
}

function solveChallenge(challenge, secret) {
  return crypto.createHmac("sha256", secret).update(challenge).digest("hex");
}

function encryptData(plaintext) {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, nonce);
  
  let ciphertext = cipher.update(plaintext, 'utf8');
  ciphertext = Buffer.concat([ciphertext, cipher.final(), cipher.getAuthTag()]);
  
  return {
    ciphertextB64: ciphertext.toString('base64'),
    nonceB64: nonce.toString('base64')
  };
}

function generateHMAC(ciphertextB64) {
  return crypto.createHmac("sha256", aesKey).update(ciphertextB64).digest("hex");
}

function signData(dataToSign) {
  const sign = crypto.createSign('SHA256');
  sign.update(dataToSign);
  sign.end();
  return sign.sign(privateKey, 'base64');
}

async function sendPayload(attackType = null) {
  const timestamp = Date.now();
  
  // 1. Get Challenge
  let challenge = await getChallenge();
  if (!challenge) {
    // Retry finding a challenge or create one for the simulation loop
    console.log('[!] Failed to get challenge, aborting payload send');
    return;
  }
  
  let pufResponse = solveChallenge(challenge, PUF_SECRET);
  if (attackType === 'PUF') {
    pufResponse = solveChallenge(challenge, "WRONG_SECRET");
    console.log(`[ATTACK] Sending invalid PUF response`);
  }

  // 2. Encrypt Payload
  const temp = (20 + Math.random() * 5).toFixed(1); // Normal temperature ~20-25
  let payloadStr = JSON.stringify({ temperature: parseFloat(temp) });
  
  let { ciphertextB64, nonceB64 } = encryptData(payloadStr);

  // 3. Generate HMAC
  let originalHmac = generateHMAC(ciphertextB64);

  // 4. Generate Signature
  const dataToSign = `${DEVICE_ID}|${SENSOR_ID}|${ciphertextB64}|${nonceB64}|${timestamp}`;
  let signatureB64 = signData(dataToSign);

  let finalCipher = ciphertextB64;
  let finalHmac = originalHmac;

  if (attackType === 'AES') {
    finalCipher = crypto.randomBytes(32).toString('base64'); // completely corrupted
    console.log(`[ATTACK] [EXPOSED KEY] MitM altering AES ciphertext in transit`);
  }

  if (attackType === 'HMAC') {
    finalHmac = generateHMAC("tampered_data");
    console.log(`[ATTACK] [CHANGED HASH] MitM altering HMAC in transit`);
  }

  if (attackType === 'ECDSA') {
    signatureB64 = signData("wrong_data_string");
    console.log(`[ATTACK] MitM forging invalid ECDSA signature`);
  }

  // 5. Send POST
  try {
    const payload = {
      device_id: DEVICE_ID,
      sensor_id: SENSOR_ID,
      ciphertext: finalCipher,
      nonce: nonceB64,
      timestamp: timestamp,
      puf_response: pufResponse,
      hmac: finalHmac,
      signature: signatureB64
    };
    
    await axios.post(`${BASE_URL}/data/ingest`, payload);
    console.log(`[SUCCESS] Data ingested (${attackType || 'NORMAL'})`);
  } catch (error) {
    if (error.response) {
      console.log(`[REJECTED] Server rejected data (${attackType || 'NORMAL'}):`, error.response.data.error);
    } else {
      console.log(`[ERROR] Transmission failed:`, error.message);
    }
  }
}

async function startSimulation() {
  await registerDevice();
  await registerSensor();

  let tick = 0;
  const attacks = ['PUF', 'ECDSA', 'AES', 'HMAC'];
  
  setInterval(() => {
    tick++;
    if (tick % 5 === 0) {
      // Every 5 seconds (5 * 1s), do an attack
      // Choose attack sequentially
      const attackType = attacks[Math.floor((tick / 5) - 1) % attacks.length];
      sendPayload(attackType);
    } else {
      // Normal payload
      sendPayload(null);
    }
  }, 1000);
  
  // Initial normal payload
  sendPayload(null);
}

startSimulation();
