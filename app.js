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

function saveSessions() {

    localStorage.setItem(
        "chat_sessions",
        JSON.stringify(
            sessions
        )
    );

    localStorage.setItem(
        "current_session",
        currentSessionId
    );
}

function getCurrentSession() {

    return sessions.find(
        s =>
            s.id ===
            currentSessionId
    );
}

function getMessages() {

    const session =
        getCurrentSession();

    return session
        ? session.messages
        : [];
}

function setMessages(arr) {

    const session =
        getCurrentSession();

    if (!session) return;

    session.messages = arr;

    saveSessions();
}

/* =========================
   Sidebar
========================= */

function renderSidebar() {

    const chatList =
        document.getElementById(
            "chatList"
        );

    if (!chatList) return;

    chatList.innerHTML = "";

    sessions.forEach(
        session => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "chat-item";

            if (
                session.id ===
                currentSessionId
            ) {

                item.classList.add(
                    "active"
                );
            }

            item.innerHTML = `

                <div class="chat-title">
                    ${session.title}
                </div>

                <button
                    class="delete-chat"
                    onclick="event.stopPropagation(); deleteSession('${session.id}')">

                    🗑

                </button>
            `;

            item.onclick =
                () =>
                    switchSession(
                        session.id
                    );

            chatList.appendChild(
                item
            );
        }
    );
}

function switchSession(
    sessionId
) {

    currentSessionId =
        sessionId;

    saveSessions();

    renderSidebar();

    render();
}

function deleteSession(
    sessionId
) {

    if (
        !confirm(
            "Delete this chat?"
        )
    ) {
        return;
    }

    sessions =
        sessions.filter(
            s =>
                s.id !==
                sessionId
        );

    if (
        sessions.length === 0
    ) {

        const first = {

            id:
                Date.now()
                    .toString(),

            title:
                "New Chat",

            messages: []
        };

        sessions.push(
            first
        );

        currentSessionId =
            first.id;
    }

    if (
        currentSessionId ===
        sessionId
    ) {

        currentSessionId =
            sessions[0].id;
    }

    saveSessions();

    renderSidebar();

    render();
}

/* =========================
   多会话系统
========================= */

let sessions =
    JSON.parse(
        localStorage.getItem(
            "chat_sessions"
        )
    ) || [];

let currentSessionId =
    localStorage.getItem(
        "current_session"
    );

/* =========================
   初始化
========================= */

if (sessions.length === 0) {

    const firstSession = {

        id: Date.now().toString(),

        title: "New Chat",

        messages: []
    };

    sessions.push(
        firstSession
    );

    currentSessionId =
        firstSession.id;

    saveSessions();
}

/* =========================
   初始化页面
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderSidebar();

        render();
    }
);

/* =========================
   状态控制
========================= */

let isSending = false;

/* =========================
   图片上传
========================= */

let uploadedImage = null;

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const fileInput =
            document.getElementById(
                "fileInput"
            );

        const fileInfo =
            document.getElementById(
                "fileInfo"
            );

        if (!fileInput) return;

        fileInput.addEventListener(
            "change",
            (e) => {

                const file =
                    e.target.files[0];

                if (!file) return;

                // 1MB限制

                if (
                    file.size >
                    1024 * 1024
                ) {

                    alert(
                        "File size cannot exceed 1MB."
                    );

                    fileInput.value = "";

                    fileInfo.textContent =
                        "No file selected";

                    uploadedImage = null;

                    return;
                }

                // PDF暂不支持

                if (
                    file.type ===
                    "application/pdf"
                ) {

                    alert(
                        "PDF support coming soon."
                    );

                    fileInput.value = "";

                    fileInfo.textContent =
                        "No file selected";

                    uploadedImage = null;

                    return;
                }

                const reader =
                    new FileReader();

                reader.onload =
                    function () {

                        uploadedImage = {
                            type:
                                file.type,
                            data:
                                reader.result
                        };

                        fileInfo.textContent =
                            file.name;
                    };

                reader.readAsDataURL(
                    file
                );
            }
        );
    }
);

/* =========================
   渲染消息
========================= */

function render() {

    const messages =
        getMessages();

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


/* =========================
   保存聊天记录
========================= */

function save() {

    saveSessions();
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

    let messages =
        getMessages();

    console.log(
        "messages =",
        messages,
        Array.isArray(messages)
    );

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

    if (
    !text &&
    !uploadedImage
) {
    return;
}

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

        let contextMessages =
    messages
        .filter(
            m => !m.thinking
        )
        .slice(-40);

if (uploadedImage) {

    contextMessages = [

        ...contextMessages,

        {
            role: "user",

            content: [

                {
                    type: "text",
                    text:
                        text ||
                        "Analyze this image."
                },

                {
                    type: "image_url",

                    image_url: {
                        url:
                            uploadedImage.data
                    }
                }
            ]
        }
    ];
}

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
            uploadedImage = null;

const fileInput =
    document.getElementById(
        "fileInput"
    );

const fileInfo =
    document.getElementById(
        "fileInfo"
    );

if (fileInput)
    fileInput.value = "";

if (fileInfo)
    fileInfo.textContent =
        "No file selected";

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

        const trimmed =
            messages.slice(-40);

        setMessages(
            trimmed
        );

    } else {

        setMessages(
            messages
        );
    }
    
    save();

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

        id:
            Date.now()
                .toString(),

        title:
            "New Chat",

        messages: []
    };

    sessions.unshift(
        session
    );

    if (
        sessions.length > 20
    ) {

        sessions =
            sessions.slice(
                0,
                20
            );
    }

    currentSessionId =
        session.id;

    saveSessions();

    renderSidebar();

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