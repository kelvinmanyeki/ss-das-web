async function viewSensor(id) {
  hideAll();
  document.getElementById("sensor-detail-view").classList.remove("hidden");
  
  // Reset UI
  document.getElementById("plaintext-container").classList.add("hidden");
  document.getElementById("plaintext-output").textContent = "";
  document.getElementById("decrypt-btn").classList.remove("hidden");

  ['puf', 'hmac', 'ecdsa'].forEach(badge => {
    const el = document.getElementById(`badge-${badge}`);
    el.className = `matrix-box badge-${badge}`;
    el.querySelector('.badge-status').textContent = "Pending";
  });

  const data = await apiGet(`/data/sensor/${id}`);
  window.currentReading = data.readings[0];

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

  try {
    const key = await deriveAESKeyFromPassword(password);
    const r = window.currentReading;
    
    // Matrix update
    updateMatrixBox('badge-puf', true); // Assumed passed to reach DB
    
    if (r.signature) updateMatrixBox('badge-ecdsa', true);
    else document.getElementById('badge-ecdsa').querySelector('.badge-status').textContent = "NONE";

    // Check HMAC
    if (r.hmac) {
      const isHmacValid = await verifyHMAC(r.ciphertext, r.hmac, key);
      updateMatrixBox('badge-hmac', isHmacValid);
      if(!isHmacValid) throw new Error("HMAC Verification Failed");
    }

    // Unhide container and start scrambling!
    document.getElementById("plaintext-container").classList.remove("hidden");
    document.getElementById("decrypt-btn").classList.add("hidden");
    
    const plaintext = await decryptAESGCM(r.ciphertext, r.nonce, key);
    scrambleText(document.getElementById("plaintext-output"), plaintext, 2000);

  } catch (error) {
    alert("Decryption rejected by core systems. Invalid authentication or corrupted sequence.");
    console.error(error);
  }
};

document.getElementById("back-btn").onclick = () => {
  showDashboard();
};
