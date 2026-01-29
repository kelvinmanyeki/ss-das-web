function hideAll() {
  document.querySelectorAll(".card").forEach(v => v.classList.add("hidden"));
}

function showLogin() {
  hideAll();
  document.getElementById("login-view").classList.remove("hidden");
}

function showDashboard() {
  hideAll();
  document.getElementById("dashboard-view").classList.remove("hidden");
  loadDashboard();
}

document.addEventListener("DOMContentLoaded", () => {
  attachLoginHandlers();

  const username = localStorage.getItem("username");
  const label = document.getElementById("user-label");
  const logoutBtn = document.getElementById("logout-btn");

  if (username) {
    label.textContent = username;
    label.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
  }

  if (localStorage.getItem("token")) showDashboard();
  else showLogin();
});
