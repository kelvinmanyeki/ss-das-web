function attachLoginHandlers() {
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const errorEl = document.getElementById("login-error");

    if (loginBtn) {
        loginBtn.onclick = async () => {
            errorEl.classList.add("hidden");
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;

            if (!username || !password) {
                errorEl.textContent = "Please enter username and password.";
                errorEl.classList.remove("hidden");
                return;
            }

            try {
                const res = await apiPost("/auth/login", { username, password });

                if (!res.token) {
                    errorEl.textContent = res.error || "Login failed.";
                    errorEl.classList.remove("hidden");
                    return;
                }

                localStorage.setItem("token", res.token);
                localStorage.setItem("username", username);

                const label = document.getElementById("user-label");
                label.textContent = username;
                label.classList.remove("hidden");
                logoutBtn.classList.remove("hidden");

                showDashboard();
            } catch (e) {
                errorEl.textContent = "Network or server error.";
                errorEl.classList.remove("hidden");
            }
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            document.getElementById("user-label").classList.add("hidden");
            logoutBtn.classList.add("hidden");
            showLogin();
        };
    }
}
