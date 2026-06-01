/* =========================
   Supabase
========================= */
const supabaseUrl = "https://komjwvwxeaqfnxfphxou.supabase.co";
const supabaseKey = "sb_publishable_1atUPorr5mJZO09jVcvkXw_v_dM7qPN";

const client = supabase.createClient(supabaseUrl, supabaseKey);

/* =========================
   登录检查
========================= */
let currentUser = null;

async function checkLogin() {
    const { data } = await client.auth.getUser();

    if (!data.user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = data.user;
}
checkLogin();

/* =========================
   localStorage
========================= */
let messages = JSON.parse(localStorage.getItem("chat_history")) || [];

/* =========================
   渲染消息
========================= */
function render() {
    const box = document.getElementById("messages");
    box.innerHTML = "";

    messages.forEach(m => {
        const div = document.createElement("div");
        div.className = "msg " + (m.role === "user" ? "user" : "ai");
        div.innerText = m.content;
        box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
}
render();

/* =========================
   发送消息
========================= */
async function sendMessage() {

    const input = document.getElementById("input");
    const text = input.value.trim();
    if (!text) return;

    input.value = "";

    // 用户消息
    messages.push({ role: "user", content: text });

    render();
    save();

    // 调 Worker
    const res = await fetch("YOUR_WORKER_URL", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
    });

    const data = await res.json();

    const reply = data.reply || "No response";

    messages.push({ role: "assistant", content: reply });

    // 保留最近20轮（40条）
    if (messages.length > 40) {
        messages = messages.slice(-40);
    }

    render();
    save();
}

/* =========================
   保存
========================= */
function save() {
    localStorage.setItem("chat_history", JSON.stringify(messages));
}

/* =========================
   新聊天
========================= */
function newChat() {
    messages = [];
    save();
    render();
}

/* =========================
   登出
========================= */
async function logout() {
    await client.auth.signOut();
    window.location.href = "index.html";
}

/* =========================
   修改密码
========================= */
async function changePassword() {

    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;

    const { error } = await client.auth.updateUser({
        password: newPassword
    });

    if (error) {
        alert(error.message);
    } else {
        alert("Password updated successfully!");
    }
}