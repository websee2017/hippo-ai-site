const API_BASE = "https://auth.hippo1996.top";

/* =========================
   登录检查
========================= */
let currentUser = null;

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
    console.log("Logged in:", currentUser.email);
}

checkLogin();

/* =========================
   会话系统
========================= */

let sessions = JSON.parse(localStorage.getItem("chat_sessions")) || [];
let currentSessionId = localStorage.getItem("current_session");

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
   Sidebar
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
    }

    if (currentSessionId === id) {
        currentSessionId = sessions[0].id;
    }

    saveSessions();
    renderSidebar();
    render();
}

/* =========================
   UI渲染
========================= */

function render() {

    const box = document.getElementById("messages");
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
   图片上传（核心新增）
========================= */

let uploadedImage = null;

document.addEventListener("DOMContentLoaded", () => {

    const fileInput = document.getElementById("fileInput");

    if (fileInput) {
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

    renderSidebar();
    render();
});

/* =========================
   AI发送
========================= */

let isSending = false;

async function sendMessage() {

    if (isSending) return;

    const input = document.getElementById("input");
    const sendBtn = document.querySelector(".input-area button");

    const text = input.value.trim();

    if (!text && !uploadedImage) return;

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Not logged in");
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

        const response = await fetch(`${API_BASE}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                messages: messages.filter(m => m.content !== "Thinking...")
            })
        });

        const data = await response.json();

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

    /* 清理上传状态 */
    uploadedImage = null;

    const fileInfo = document.getElementById("fileInfo");
    if (fileInfo) fileInfo.innerText = "No file selected";

    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";

    sessions = sessions.map(s => {
        if (s.id === currentSessionId) {
            s.messages = messages;
        }
        return s;
    });

    saveSessions();
    render();
    renderSidebar();

    sendBtn.disabled = false;
    isSending = false;
}

/* =========================
   其他功能
========================= */

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

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

function changePassword() {
    alert("Coming soon");
}