* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #0f172a;
    color: #e5e7eb;
}

.app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background: #020617;
    border-bottom: 1px solid #1f2937;
}

.logo {
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #38bdf8;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-label {
    font-size: 0.9rem;
    color: #9ca3af;
}

.app-main {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 32px 16px;
}

.view {
    max-width: 900px;
    width: 100%;
}

.card {
    background: #020617;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.9);
    border: 1px solid #1f2937;
}

h2 {
    margin-top: 0;
    margin-bottom: 8px;
}

.subtitle {
    margin-top: 0;
    margin-bottom: 20px;
    color: #9ca3af;
    font-size: 0.95rem;
}

.form-group {
    margin-bottom: 16px;
}

label {
    display: block;
    margin-bottom: 4px;
    font-size: 0.9rem;
    color: #cbd5f5;
}

input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #374151;
    background: #020617;
    color: #e5e7eb;
}

input:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 0 1px #38bdf8;
}

.btn {
    border: none;
    border-radius: 999px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 0.95rem;
}

.btn.primary {
    background: linear-gradient(135deg, #38bdf8, #0ea5e9);
    color: #0b1120;
    font-weight: 600;
}

.btn.secondary {
    background: #111827;
    color: #e5e7eb;
    border: 1px solid #374151;
}

.btn.full-width {
    width: 100%;
    margin-top: 8px;
}

.btn:hover {
    opacity: 0.9;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 0.9rem;
}

th, td {
    padding: 8px 10px;
    border-bottom: 1px solid #1f2937;
}

th {
    text-align: left;
    color: #9ca3af;
    font-weight: 500;
}

tbody tr:hover {
    background: #020617;
}

.code-block {
    background: #020617;
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #1f2937;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 0.85rem;
    max-height: 260px;
    overflow: auto;
    margin-bottom: 12px;
}

.muted {
    color: #6b7280;
    font-size: 0.9rem;
}

.error-msg {
    color: #f97373;
    margin-top: 8px;
    font-size: 0.9rem;
}

.hidden {
    display: none;
}
