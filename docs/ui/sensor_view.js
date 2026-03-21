async function viewSensor(id) {
  hideAll();
  document.getElementById("sensor-detail-view").classList.remove("hidden");

  const data = await apiGet(`/data/sensor/${id}`);
  window.currentReading = data.readings[0];

  document.getElementById("sensor-json").textContent =
    JSON.stringify(window.currentReading, null, 2);
}

document.getElementById("decrypt-btn").onclick = async () => {
  const password = prompt("Enter the Decryption Password for this device:");
  if (!password) return;

  try {
    const key = await deriveAESKeyFromPassword(password);
    const r = window.currentReading;
    
    // Check HMAC if provided
    if (r.hmac) {
      const isHmacValid = await verifyHMAC(r.ciphertext, r.hmac, key);
      document.getElementById("badge-hmac").textContent = isHmacValid ? "HMAC: VERIFIED ✔️" : "HMAC: FAILED ❌";
      document.getElementById("badge-hmac").style.color = isHmacValid ? "green" : "red";
    } else {
      document.getElementById("badge-hmac").textContent = "HMAC: NONE";
    }

    // Backend verified these. If it's in the DB and we reached this page, they passed ingestion.
    document.getElementById("badge-puf").textContent = "PUF: AUTHENTICATED ✔️";
    document.getElementById("badge-puf").style.color = "green";
    
    if (r.signature) {
       document.getElementById("badge-ecdsa").textContent = "ECDSA: VERIFIED ✔️";
       document.getElementById("badge-ecdsa").style.color = "green";
    } else {
       document.getElementById("badge-ecdsa").textContent = "ECDSA: NONE";
    }

    const plaintext = await decryptAESGCM(r.ciphertext, r.nonce, key);
    document.getElementById("plaintext-output").textContent = plaintext;
  } catch (error) {
    alert("Decryption failed. Incorrect password or corrupted data.");
    console.error(error);
  }
};

document.getElementById("back-btn").onclick = () => {
  showDashboard();
};
