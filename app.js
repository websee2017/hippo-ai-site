// =========================
// 🧠 Supabase 初始化
// =========================
const SUPABASE_URL = "https://komjwvwxeaqfnxfphxou.supabase.co";

const SUPABASE_KEY = "sb_publishable_1atUPorr5mJZO09jVcvkXw_v_dM7qPN";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// =========================
// 👤 当前用户状态
// =========================
let currentUser = null;

// 获取当前登录用户
async function getUser() {
  const { data } = await supabaseClient.auth.getUser();
  currentUser = data.user;
  console.log("Current User:", currentUser);
}

// 页面加载时自动检测登录状态
getUser();

// =========================
// 💬 AI对话历史
// =========================
let conversationHistory = [
  {
    role: "system",
    content: `
You are Hippo AI, a helpful assistant.

Rules:
- Be clear and concise
- Support English and Chinese
- No strange symbols
`
  }
];

// =========================
// ⌨️ 输入监听
// =========================
const input = document.getElementById("user-input");

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// =========================
// 🚀 发送消息（核心AI逻辑）
// =========================
async function sendMessage() {
  const chatBox = document.getElementById("chat-box");
  const userMessage = input.value.trim();

  if (!userMessage) return;

  // 显示用户消息
  chatBox.innerHTML += `
    <div class="message user-message">
      <div class="bubble">${userMessage}</div>
    </div>
  `;

  input.value = "";
  scrollToBottom();

  conversationHistory.push({
    role: "user",
    content: userMessage
  });

  // AI UI
  const aiDiv = document.createElement("div");
  aiDiv.className = "message ai-message";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = "Thinking...";

  aiDiv.appendChild(bubble);
  chatBox.appendChild(aiDiv);

  scrollToBottom();

  try {
    const response = await fetch("https://api.hippo1996.top", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324",
        messages: conversationHistory
      })
    });

    const raw = await response.text();
    console.log("RAW RESPONSE:", raw);

    if (!raw) {
      bubble.innerHTML = "Error: Empty response from server";
      return;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      bubble.innerHTML = "JSON parse error. Check console.";
      console.error("Parse error:", raw);
      return;
    }

    const text =
      data?.text ||
      data?.choices?.[0]?.message?.content ||
      "";

    if (!text) {
      bubble.innerHTML = "No response (empty text)";
      console.error("Bad response:", data);
      return;
    }

    // 打字效果
    bubble.innerHTML = "";

    let i = 0;
    const speed = 12;

    function typeWriter() {
      if (i < text.length) {
        bubble.innerHTML += text.charAt(i);
        i++;
        scrollToBottom();
        setTimeout(typeWriter, speed);
      } else {
        conversationHistory.push({
          role: "assistant",
          content: text
        });
      }
    }

    typeWriter();

  } catch (error) {
    bubble.innerHTML = "Error: " + error.message;
    console.error(error);
  }
}

// =========================
// 📜 滚动到底部
// =========================
function scrollToBottom() {
  const chatBox = document.getElementById("chat-box");
  chatBox.scrollTop = chatBox.scrollHeight;
}

// =========================
// 🧾 注册
// =========================
async function handleSignup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    document.getElementById("status").innerText = error.message;
  } else {
    document.getElementById("status").innerText = "注册成功！";
    console.log(data);
  }
}

// =========================
// 🔐 登录
// =========================
async function handleLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    document.getElementById("status").innerText = error.message;
  } else {
    document.getElementById("status").innerText = "登录成功！";
    console.log(data);

    // 获取用户信息（关键）
    getUser();
  }
}