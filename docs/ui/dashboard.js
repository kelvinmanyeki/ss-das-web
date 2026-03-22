async function loadDashboard() {
  const sensors = await apiGet("/sensors");
  const data = await apiGet("/data/sensors");

  const tbody = document.querySelector("#sensor-table tbody");
  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    document.getElementById("no-sensors").classList.remove("hidden");
    return;
  }

  document.getElementById("no-sensors").classList.add("hidden");

  data.forEach(r => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><strong>${r.device_id}</strong></td>
      <td>${r.sensor_id}</td>
      <td class="fira-code muted">${r.ciphertext.substring(0, 16)}...</td>
      <td>${new Date(r.timestamp).toLocaleString()}</td>
      <td><button class="action-btn" onclick="viewSensor('${r.sensor_id}')">Analyze Payload</button></td>
    `;

    tbody.appendChild(row);
  });
}
