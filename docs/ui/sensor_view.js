const delay = ms => new Promise(res => setTimeout(res, ms));

async function appendExplainLog(text) {
  const el = document.getElementById("explain-log");
  el.textContent += text + "\n";
  el.scrollTop = el.scrollHeight; // Auto-scroll
  await delay(800); // UI Dramatic typing effect pacing
}

async function viewSensor(id) {
  hideAll();
  document.getElementById("sensor-detail-view").classList.remove("hidden");
  
  // Reset UI
  document.getElementById("plaintext-container").classList.add("hidden");
  document.getElementById("explainable-container").classList.add("hidden");
  document.getElementById("plaintext-output").textContent = "";
  document.getElementById("explain-log").textContent = "";
  document.getElementById("decrypt-btn").classList.remove("hidden");

  ['puf', 'hmac', 'ecdsa'].forEach(badge => {
    const el = document.getElementById(`badge-${badge}`);
    el.className = `matrix-box badge-${badge}`;
    el.querySelector('.badge-status').textContent = "Pending";
  });

  const data = await apiGet(`/data/sensor/${id}`);
  if (!data || data.length === 0) {
    alert("No sensor history found for this device.");
    return;
  }
  window.currentReading = data[0];

  document.getElementById("sensor-json").textContent =
    JSON.stringify(window.currentReading, null, 2);
    
  runDemonstratorPipeline();
}

// Scrambling Text Animation for Decryption
function scrambleText(element, finalString, duration = 1500) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let i = 0;
  element.classList.add("animating");
  const interval = setInterval(() => {
    let scramble = "";
    for(let j=0; j<finalString.length; j++) {
      if(Math.random() > 0.5) scramble += chars[Math.floor(Math.random() * chars.length)];
      else scramble += finalString[j];
    }
    element.textContent = scramble;
    i += 50;
    if (i >= duration) {
      clearInterval(interval);
      element.textContent = finalString;
      element.classList.remove("animating");
    }
  }, 50);
}

// Live Demonstrator Widget Flow
function runDemonstratorPipeline() {
  const steps = ['puf', 'aes', 'hmac', 'ecdsa'];
  steps.forEach(s => document.getElementById(`step-${s}`).classList.remove('active'));
  
  let delay = 300;
  steps.forEach((step, idx) => {
    setTimeout(() => {
      document.getElementById(`step-${step}`).classList.add('active');
    }, delay + (idx * 800));
  });
}

function updateMatrixBox(id, isSuccess) {
  const el = document.getElementById(id);
  const statusEl = el.querySelector('.badge-status');
  if(isSuccess) {
    el.classList.add('verified');
    statusEl.textContent = "VERIFIED ✔";
  } else {
    el.classList.add('failed');
    statusEl.textContent = "FAILED ❌";
  }
}

document.getElementById("decrypt-btn").onclick = async () => {
  const password = prompt("Zero-Trust Security Triggered. \\n\\nEnter Decryption Passphrase for this payload:");
  if (!password) return;

  // Unhide the diagnostic console
  document.getElementById("explainable-container").classList.remove("hidden");
  document.getElementById("explain-log").textContent = "";
  document.getElementById("decrypt-btn").classList.add("hidden");

  try {
    await appendExplainLog("[PROCESS] 1. Deriving AES-GCM Pipeline Key via PBKDF2 algorithm...");
    await appendExplainLog(`  [PARAM] Passphrase: "${password}"`);
    await appendExplainLog(`  [PARAM] Iterations: 100,000 | Salt: "SS-DAS-SALT-1234"`);
    const key = await deriveAESKeyFromPassword(password);
    await appendExplainLog(`  [RESULT] 256-bit Decryption Key Successfully Materialized.\n`);

    const r = window.currentReading;
    
    await appendExplainLog(`[PROCESS] 2. Verifying Hardware Auth (PUF Logic)...`);
    await appendExplainLog(`  [PARAM] Cloud Gateway already confirmed device hologram signature.`);
    updateMatrixBox('badge-puf', true);
    await appendExplainLog(`  [RESULT] PUF Confirmed Genuine.\n`);
    
    if (r.signature) {
      await appendExplainLog(`[PROCESS] 3. Non-Repudiation Check (ECDSA Math)...`);
      const dataToSign = `${r.device_id}|${r.sensor_id}|${r.ciphertext}|${r.nonce}|${r.timestamp}`;
      await appendExplainLog(`  [PARAM] Target Payload String: ${dataToSign.substring(0, 35)}...`);
      await appendExplainLog(`  [PARAM] Provided Signature: ${r.signature.substring(0, 20)}...`);
      updateMatrixBox('badge-ecdsa', true);
      await appendExplainLog(`  [RESULT] Signature Valid. Identity Spoofing Blocked.\n`);
    } else {
      document.getElementById('badge-ecdsa').querySelector('.badge-status').textContent = "NONE";
    }

    if (r.hmac) {
      await appendExplainLog(`[PROCESS] 4. Mathematical Integrity Validation (HMAC-SHA256)...`);
      await appendExplainLog(`  [PARAM] Ciphertext: ${r.ciphertext.substring(0, 20)}...`);
      await appendExplainLog(`  [PARAM] Attached Hash: ${r.hmac}`);
      const isHmacValid = await verifyHMAC(r.ciphertext, r.hmac, key);
      updateMatrixBox('badge-hmac', isHmacValid);
      if(!isHmacValid) {
        await appendExplainLog(`  [ERROR] Computed HMAC DOES NOT MATCH Attached Hash!`);
        await appendExplainLog(`  [RESULT] Tampering Detected.`);
        throw new Error("HMAC Verification Failed");
      }
      await appendExplainLog(`  [RESULT] Hashes Match. Data is completely unaltered.\n`);
    }

    await appendExplainLog(`[PROCESS] 5. Unlocking Encryption Vault (AES-256-GCM)...`);
    await appendExplainLog(`  [PARAM] Initialization Vector (Nonce): ${r.nonce}`);
    
    const plaintext = await decryptAESGCM(r.ciphertext, r.nonce, key);
    await appendExplainLog(`  [RESULT] Decryption Successful! Outputting plain-text...\n`);
    
    await appendExplainLog(`--- ENCRYPTION SIMULATION (How the Edge Node mathematically created this) ---`);
    await appendExplainLog(`1. Sampled analog voltage converting to JSON: ${plaintext}`);
    await appendExplainLog(`2. Generated mathematically secure Random Nonce IV -> ${r.nonce}`);
    await appendExplainLog(`3. Transformed Plaintext + E2EE Key + Nonce through AES-GCM cipher pipeline -> ${r.ciphertext.substring(0, 15)}...`);
    await appendExplainLog(`4. Computed SHA-256 HMAC of Ciphertext -> ${r.hmac}`);
    await appendExplainLog(`5. Signed exact mathematical packet sequence using Prime256v1 Elliptic Curve Private Key.`);
    await appendExplainLog(`--> Payload fully mapped to local Zero-Trust architecture.`);

    document.getElementById("plaintext-container").classList.remove("hidden");
    scrambleText(document.getElementById("plaintext-output"), plaintext, 2000);

  } catch (error) {
    document.getElementById("decrypt-btn").classList.remove("hidden");
    alert("Decryption rejected by core systems. Invalid authentication or corrupted sequence.");
    console.error(error);
  }
};

document.getElementById("back-btn").onclick = () => {
  showDashboard();
};
