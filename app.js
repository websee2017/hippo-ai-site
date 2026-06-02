/* =========================
   Supabase
========================= */
const supabaseUrl = "https://komjwvwxeaqfnxfphxou.supabase.co";
const supabaseKey = "sb_publishable_1atUPorr5mJZO09jVcvkXw_v_dM7qPN";

const client = supabase.createClient(
    supabaseUrl,
    supabaseKey
);

/* =========================
   Worker
========================= */
const WORKER_URL =
    "https://hippo-ai.hippo1996.top";

/* =========================
   登录检查
========================= */
let currentUser = null;

async function checkLogin() {

    const { data } =
        await client.auth.getUser();

    if (!data.user) {

        window.location.href =
            "index.html";

        return;
    }

    currentUser = data.user;

    console.log(
        "Logged in:",
        currentUser.email
    );
}

checkLogin();

/* =========================
   本地聊天记录
========================= */

let messages =
    JSON.parse(
        localStorage.getItem(
            "chat_history"
        )
    ) || [];

/* =========================
   状态控制
========================= */

let isSending = false;

/* =========================
   渲染消息
========================= */

function render() {

    const box =
        document.getElementById(
            "messages"
        );

    box.innerHTML = "";

    messages.forEach(msg => {

        const div =
            document.createElement("div");

        div.classList.add("msg");

        if (
            msg.role === "user"
        ) {
            div.classList.add("user");
        } else {
            div.classList.add("ai");
        }

        if (msg.thinking) {
            div.classList.add("thinking");
        }

        div.textContent =
            msg.content;

        box.appendChild(div);
    });

    box.scrollTop =
        box.scrollHeight;
}

render();

/* =========================
   保存聊天记录
========================= */

function save() {

    localStorage.setItem(
        "chat_history",
        JSON.stringify(messages)
    );
}

/* =========================
   超时 Fetch
========================= */

async function fetchWithTimeout(
    url,
    options = {},
    timeout = 60000
) {

    const controller =
        new AbortController();

    const timer =
        setTimeout(() => {
            controller.abort();
        }, timeout);

    try {

        const response =
            await fetch(url, {
                ...options,
                signal:
                    controller.signal
            });

        clearTimeout(timer);

        return response;

    } catch (err) {

        clearTimeout(timer);

        throw err;
    }
}

/* =========================
   发送消息
========================= */

async function sendMessage() {

    if (isSending) return;

    const input =
        document.getElementById(
            "input"
        );

    const sendBtn =
        document.querySelector(
            ".input-area button"
        );

    const text =
        input.value.trim();

    if (!text) return;

    isSending = true;

    sendBtn.disabled = true;

    input.value = "";

    /* 用户消息 */

    messages.push({
        role: "user",
        content: text
    });

    render();
    save();

    /* Thinking */

    messages.push({
        role: "assistant",
        content: "Thinking...",
        thinking: true
    });

    render();

    try {

        const contextMessages =
            messages
                .filter(
                    m => !m.thinking
                )
                .slice(-40);

        const response =
            await fetchWithTimeout(
                WORKER_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            messages:
                                contextMessages
                        })
                },
                60000
            );

        if (!response.ok) {

            throw new Error(
                `Server Error ${response.status}`
            );
        }

        const data =
            await response.json();

        const reply =
            data.reply ||
            "No response.";

        /* 删除Thinking */

        messages.pop();

        /* 添加AI回复 */

        messages.push({
            role: "assistant",
            content: reply
        });

    } catch (err) {

        messages.pop();

        if (
            err.name ===
            "AbortError"
        ) {

            messages.push({
                role: "assistant",
                content:
                    "⏱ Request timed out. Please try again."
            });

        } else {

            messages.push({
                role: "assistant",
                content:
                    "❌ " +
                    err.message
            });
        }
    }

    /* 保留最近20轮 */

    if (
        messages.length > 40
    ) {

        messages =
            messages.slice(-40);
    }

    save();
    render();

    sendBtn.disabled = false;

    isSending = false;

    input.focus();
}

/* =========================
   新聊天
========================= */

function newChat() {

    const ok = confirm(
        "Start a new conversation?"
    );

    if (!ok) return;

    messages = [];

    save();

    render();
}

/* =========================
   登出
========================= */

async function logout() {

    await client.auth.signOut();

    window.location.href =
        "index.html";
}

/* =========================
   修改密码
========================= */

async function changePassword() {

    const password =
        prompt(
            "Enter your new password:"
        );

    if (!password) return;

    if (
        password.length < 6
    ) {

        alert(
            "Password must be at least 6 characters."
        );

        return;
    }

    const { error } =
        await client.auth.updateUser({
            password
        });

    if (error) {

        alert(
            "Error: " +
            error.message
        );

    } else {

        alert(
            "✅ Password updated successfully!"
        );
    }
}