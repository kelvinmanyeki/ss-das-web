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
      <td>${r.sensor_id}</td>
      <td>${r.sensor_type}</td>
      <td>${r.device_id}</td>
      <td>${r.ciphertext.substring(0, 12)}...</td>
      <td>${new Date(r.timestamp * 1000).toLocaleString()}</td>
      <td><button onclick="viewSensor('${r.sensor_id}')">View</button></td>
    `;

    tbody.appendChild(row);
  });
}
