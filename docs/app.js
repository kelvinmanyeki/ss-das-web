document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("token")) {
        showDashboard();
    } else {
        showLogin();
    }
});
