async function loadDashboard() {
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

  document.getElementById("threat-feed-view").classList.remove("hidden");
  const threats = await apiGet("/data/threats");
  const threatBody = document.querySelector("#threat-table tbody");
  threatBody.innerHTML = "";

  if (!threats || threats.length === 0) {
    document.getElementById("no-threats").classList.remove("hidden");
  } else {
    document.getElementById("no-threats").classList.add("hidden");
    threats.forEach(t => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="fira-code">${new Date(t.timestamp).toLocaleString()}</td>
        <td><strong>${t.device_id}</strong></td>
        <td><span class="badge-threat">${t.event_type}</span></td>
        <td>${t.reason}</td>
      `;
      threatBody.appendChild(row);
    });
  }

  if (window.dashboardTimer) clearTimeout(window.dashboardTimer);
  if (!document.getElementById("dashboard-view").classList.contains("hidden")) {
    window.dashboardTimer = setTimeout(loadDashboard, 2000);
  }
}
