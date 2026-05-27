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

// =========================
// 🧑 当前用户角色
// =========================
let currentRole = "free";

// =========================
// 👤 获取当前登录用户
// =========================
async function getUser() {

  const { data } = await supabaseClient.auth.getUser();

  currentUser = data.user;

  console.log("Current User:", currentUser);

  // 如果已经登录
  if (currentUser) {

    // 显示当前用户
    document.getElementById("status").innerText =
      "Logged in: " + currentUser.email;

    // 获取角色
    await getUserRole();
  }
}

// =========================
// 🧑‍💻 获取用户角色
// =========================
async function getUserRole() {

  if (!currentUser) return;

  const { data, error } = await supabaseClient
    .from("user_profiles")
    .select("role")
    .eq("user_id", currentUser.id)
    .single();

  if (error) {
    console.error("Role Error:", error);
    return;
  }

  currentRole = data.role;

  console.log("USER ROLE:", currentRole);

  document.getElementById("status").innerText =
    `Logged in: ${currentUser.email} (${currentRole})`;
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
// 🤖 根据角色切换模型
// =========================
function getModelByRole() {

  // super
  if (currentRole === "super") {
    return "openai/gpt-4.1";
  }

  // pro
  if (currentRole === "pro") {
    return "deepseek/deepseek-chat-v3-0324";
  }

  // free
  return "deepseek/deepseek-chat-v3-0324:free";
}

// =========================
// 🚀 发送消息（核心AI逻辑）
// =========================
async function sendMessage() {

  // 未登录禁止聊天
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

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

    // 根据角色自动切模型
    const model = getModelByRole();

    console.log("Using model:", model);

    const response = await fetch("https://api.hippo1996.top", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
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
window.handleSignup = async function () {

  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {

    document.getElementById("status").innerText = error.message;

    console.error(error);

  } else {

    document.getElementById("status").innerText = "注册成功！";

    console.log(data);

    // 获取用户
    const user = data.user;

    if (user) {

      // 自动创建 profile
      const { error: profileError } = await supabaseClient
        .from("user_profiles")
        .insert([
          {
            user_id: user.id,
            role: "free"
          }
        ]);

      if (profileError) {

        console.error("Profile Error:", profileError);

      } else {

        console.log("Profile created!");
      }
    }
  }
};

// =========================
// 🔐 登录
// =========================
window.handleLogin = async function () {

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

    // 获取当前用户
    await getUser();
  }
};