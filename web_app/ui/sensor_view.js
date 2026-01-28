async function viewSensor(sensorId) {
    hideAllViews();
    document.getElementById("sensor-detail-view").classList.remove("hidden");

    const data = await apiGet(`/data/sensor/${sensorId}`);
    window.currentReading = data.readings[0];

    document.getElementById("sensor-json").textContent =
        JSON.stringify(window.currentReading, null, 2);
}

document.getElementById("decrypt-btn").onclick = async () => {
    const key = await loadE2EEKey(); // from IndexedDB
    const reading = window.currentReading;

    const plaintext = await decryptAESGCM(
        reading.ciphertext,
        reading.nonce,
        key
    );

    document.getElementById("plaintext-output").textContent = plaintext;
};
