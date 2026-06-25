const API_BASE = "https://auth.hippo1996.top";

/* =========================
   全局状态
========================= */
let currentUser = null;
let sessions = [];
let currentSessionId = null;
let uploadedImage = null;
let isSending = false;

/* =========================
   初始化入口（统一控制）
========================= */
document.addEventListener("DOMContentLoaded", async () => {

    await checkLogin();

    initSessions();

    bindFileInput();

    renderSidebar();
    render();
});

/* =========================
   登录检查
========================= */
async function checkLogin() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    const res = await fetch(`${API_BASE}/api/me`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        }
    });

    if (!res.ok) {
        localStorage.removeItem("token");
        window.location.href = "index.html";
        return;
    }

    currentUser = await res.json();
}

/* =========================
   session 初始化
========================= */
function initSessions() {

    sessions = JSON.parse(localStorage.getItem("chat_sessions")) || [];
    currentSessionId = localStorage.getItem("current_session");

    if (sessions.length === 0) {
        const first = {
            id: Date.now().toString(),
            title: "New Chat",
            messages: []
        };

        sessions.push(first);
        currentSessionId = first.id;
        saveSessions();
    }

    if (!currentSessionId) {
        currentSessionId = sessions[0].id;
    }
}

/* =========================
   storage
========================= */
function saveSessions() {
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
    localStorage.setItem("current_session", currentSessionId);
}

function getCurrentSession() {
    return sessions.find(s => s.id === currentSessionId);
}

function getMessages() {
    return getCurrentSession()?.messages || [];
}

/* =========================
   sidebar
========================= */
function renderSidebar() {

    const chatList = document.getElementById("chatList");
    if (!chatList) return;

    chatList.innerHTML = "";

    sessions.forEach(session => {

        const item = document.createElement("div");
        item.className = "chat-item";

        if (session.id === currentSessionId) {
            item.classList.add("active");
        }

        item.innerHTML = `
            <div class="chat-title">${session.title}</div>
            <button onclick="event.stopPropagation(); deleteSession('${session.id}')">🗑</button>
        `;

        item.onclick = () => switchSession(session.id);

        chatList.appendChild(item);
    });
}

/* =========================
   session control
========================= */
function switchSession(id) {
    currentSessionId = id;
    saveSessions();
    renderSidebar();
    render();
}

function deleteSession(id) {

    sessions = sessions.filter(s => s.id !== id);

    if (sessions.length === 0) {
        const first = {
            id: Date.now().toString(),
            title: "New Chat",
            messages: []
        };
        sessions.push(first);
        currentSessionId = first.id;
    } else {
        currentSessionId = sessions[0].id;
    }

    saveSessions();
    renderSidebar();
    render();
}

function newChat() {

    const session = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: []
    };

    sessions.unshift(session);
    currentSessionId = session.id;

    saveSessions();
    renderSidebar();
    render();
}

/* =========================
   render
========================= */
function render() {

    const box = document.getElementById("messages");
    if (!box) return;

    const messages = getMessages();

    box.innerHTML = "";

    messages.forEach(msg => {

        const div = document.createElement("div");
        div.className = "msg " + (msg.role === "user" ? "user" : "ai");
        div.textContent = msg.content;

        box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
}

/* =========================
   file upload（稳定版）
========================= */
function bindFileInput() {

    const fileInput = document.getElementById("fileInput");
    if (!fileInput) return;

    fileInput.addEventListener("change", (e) => {

        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1 * 1024 * 1024) {
            alert("File too large (max 1MB)");
            fileInput.value = "";
            return;
        }

        uploadedImage = file;

        const fileInfo = document.getElementById("fileInfo");
        if (fileInfo) fileInfo.innerText = file.name;
    });
}

/* =========================
   send message
========================= */
async function sendMessage() {

    if (isSending) return;

    const input = document.getElementById("input");
    const sendBtn = document.querySelector(".input-area button");

    const text = input.value.trim();

    if (!text && !uploadedImage) return;

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    isSending = true;
    sendBtn.disabled = true;

    input.value = "";

    let messages = getMessages();

    messages.push({
        role: "user",
        content: uploadedImage
            ? `${text}\n[Image: ${uploadedImage.name}]`
            : text
    });

    render();

    messages.push({
        role: "assistant",
        content: "Thinking..."
    });

    render();

    try {

        const res = await fetch(`${API_BASE}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                messages: messages.filter(m => m.content !== "Thinking..."),
                image: uploadedImage ? await toBase64(uploadedImage) : null
            })
        });

        const data = await res.json();

        messages.pop();

        messages.push({
            role: "assistant",
            content: data.reply || "No response"
        });

    } catch (err) {

        messages.pop();

        messages.push({
            role: "assistant",
            content: "❌ " + err.message
        });
    }

    /* 清理上传 */
    uploadedImage = null;

    const fileInfo = document.getElementById("fileInfo");
    if (fileInfo) fileInfo.innerText = "No file selected";

    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";

    sessions = sessions.map(s => {
        if (s.id === currentSessionId) {
            return { ...s, messages };
        }
        return s;
    });

    saveSessions();
    renderSidebar();
    render();

    sendBtn.disabled = false;
    isSending = false;
}

/* =========================
   logout
========================= */
function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

function changePassword() {

    const oldPassword = prompt("Enter old password:");
    if (!oldPassword) return;

    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;

    const token = localStorage.getItem("token");

    fetch("https://auth.hippo1996.top/api/change-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
            oldPassword,
            newPassword
        })
    })
    .then(res => res.json())
    .then(data => {

        if (data.error) {
            alert("❌ " + data.error);
        } else {
            alert("✅ Password changed successfully");
        }

    })
    .catch(err => {
        alert("❌ Network error");
    });
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}