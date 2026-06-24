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

/* =========================
   初始化登录
========================= */
checkLogin();

/* =========================
   会话系统
========================= */

let sessions = JSON.parse(localStorage.getItem("chat_sessions")) || [];
let currentSessionId = localStorage.getItem("current_session");

/* 初始化会话 */
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

/* =========================
   保存
========================= */
function saveSessions() {
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
    localStorage.setItem("current_session", currentSessionId);
}

/* =========================
   当前会话
========================= */
function getCurrentSession() {
    return sessions.find(s => s.id === currentSessionId);
}

function getMessages() {
    const session = getCurrentSession();
    return session ? session.messages : [];
}

function setMessages(arr) {
    const session = getCurrentSession();
    if (!session) return;

    session.messages = arr;
    saveSessions();
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
            <button class="delete-chat"
                onclick="event.stopPropagation(); deleteSession('${session.id}')">
                🗑
            </button>
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

    if (!confirm("Delete this chat?")) return;

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
   渲染消息
========================= */

function render() {

    const messages = getMessages();
    const box = document.getElementById("messages");

    box.innerHTML = "";

    messages.forEach(msg => {

        const div = document.createElement("div");
        div.classList.add("msg");

        if (msg.role === "user") div.classList.add("user");
        else div.classList.add("ai");

        if (msg.thinking) div.classList.add("thinking");

        div.textContent = msg.content;
        box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
}

/* =========================
   timeout fetch
========================= */

async function fetchWithTimeout(url, options = {}, timeout = 60000) {

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const res = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(timer);
        return res;

    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

/* =========================
   发送消息（核心）
========================= */

let isSending = false;

async function sendMessage() {

    if (isSending) return;

    const input = document.getElementById("input");
    const sendBtn = document.querySelector(".input-area button");

    const text = input.value.trim();

    if (!text) return;

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
        content: text
    });

    render();

    messages.push({
        role: "assistant",
        content: "Thinking...",
        thinking: true
    });

    render();

    try {

        const contextMessages = messages
            .filter(m => !m.thinking)
            .slice(-40);

        const response = await fetchWithTimeout(
            `${API_BASE}/api/chat`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    messages: contextMessages
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "AI error");
        }

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

    setMessages(messages);

    saveSessions();
    render();
    renderSidebar();

    sendBtn.disabled = false;
    isSending = false;
    input.focus();
}

/* =========================
   新聊天
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

/* =========================
   上传（保留）
========================= */

let uploadedImage = null;

/* =========================
   logout
========================= */

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

/* =========================
   password
========================= */

function changePassword() {
    alert("Coming soon");
}

/* =========================
   init
========================= */

document.addEventListener("DOMContentLoaded", () => {
    renderSidebar();
    render();
});