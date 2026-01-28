async function showDashboard() {
    hideAllViews();
    document.getElementById("dashboard-view").classList.remove("hidden");

    const sensors = await apiGet("/sensors");
    const data = await apiGet("/data/sensors");

    const tbody = document.querySelector("#sensor-table tbody");
    tbody.innerHTML = "";

    data.forEach(reading => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${reading.sensor_id}</td>
            <td>${reading.sensor_type}</td>
            <td>${reading.device_id}</td>
            <td>${reading.ciphertext.substring(0, 12)}...</td>
            <td>${new Date(reading.timestamp * 1000).toLocaleString()}</td>
            <td><button onclick="viewSensor('${reading.sensor_id}')">View</button></td>
        `;

        tbody.appendChild(row);
    });
}
