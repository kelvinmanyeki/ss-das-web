async function viewSensor(id) {
  hideAll();
  document.getElementById("sensor-detail-view").classList.remove("hidden");

  const data = await apiGet(`/data/sensor/${id}`);
  window.currentReading = data.readings[0];

  document.getElementById("sensor-json").textContent =
    JSON.stringify(window.currentReading, null, 2);
}

document.getElementById("decrypt-btn").onclick = async () => {
  const key = await loadE2EEKey(); // placeholder for now
  const r = window.currentReading;

  const plaintext = await decryptAESGCM(r.ciphertext, r.nonce, key);
  document.getElementById("plaintext-output").textContent = plaintext;
};

document.getElementById("back-btn").onclick = () => {
  showDashboard();
};
