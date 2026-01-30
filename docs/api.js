const API_BASE = "https://ss-das-web.onrender.com";

async function apiGet(path) {
    const token = localStorage.getItem("token");
    const res = await fetch(API_BASE + path, {
        headers: { "Authorization": "Bearer " + token }
    });
    return res.json();
}

async function apiPost(path, body) {
    const token = localStorage.getItem("token");
    const res = await fetch(API_BASE + path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? "Bearer " + token : ""
        },
        body: JSON.stringify(body)
    });
    return res.json();
}
