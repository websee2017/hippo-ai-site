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
// 👤 当前用户
// =========================
let currentUser = null;

// =========================
// 🧑 当前角色
// =========================
let currentRole = "free";

// =========================
// 📊 当前使用次数
// =========================
let currentUsage = 0;

// =========================
// 👤 获取当前登录用户
// =========================
async function getUser() {

  const { data } = await supabaseClient.auth.getUser();

  currentUser = data.user;

  console.log("Current User:", currentUser);

  if (currentUser) {

    await getUserRole();

    await getUsage();

    updateStatusUI();
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

  console.log("ROLE:", currentRole);
}

// =========================
// 📊 获取使用次数
// =========================
async function getUsage() {

  if (!currentUser) return;

  const today = new Date().toISOString().split("T")[0];

  let { data, error } = await supabaseClient
    .from("message_usage")
    .select("*")
    .eq("user_id", currentUser.id)
    .single();

  // 如果不存在 → 自动创建
  if (error || !data) {

    const { error: insertError } = await supabaseClient
      .from("message_usage")
      .insert([
        {
          user_id: currentUser.id,
          count: 0,
          last_reset: today
        }
      ]);

    if (insertError) {
      console.error(insertError);
      return;
    }

    currentUsage = 0;

    return;
  }

  // 日期变化 → 自动重置
  if (data.last_reset !== today) {

    await supabaseClient
      .from("message_usage")
      .update({
        count: 0,
        last_reset: today
      })
      .eq("user_id", currentUser.id);

    currentUsage = 0;

  } else {

    currentUsage = data.count;
  }

  console.log("USAGE:", currentUsage);
}

// =========================
// 📈 增加使用次数
// =========================
async function increaseUsage() {

  if (!currentUser) return;

  currentUsage++;

  await supabaseClient
    .from("message_usage")
    .update({
      count: currentUsage
    })
    .eq("user_id", currentUser.id);

  updateStatusUI();
}

// =========================
// 🧠 获取限制次数
// =========================
function getLimitByRole() {

  if (currentRole === "super") {
    return Infinity;
  }

  if (currentRole === "pro") {
    return 50;
  }

  return 20;
}

// =========================
// 🤖 根据角色切模型
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
// 📋 更新状态UI
// =========================
function updateStatusUI() {

  const limit = getLimitByRole();

  let limitText = limit === Infinity
    ? "∞"
    : limit;

  document.getElementById("status").innerText =
    `Logged in: ${currentUser.email} | ${currentRole} | ${currentUsage}/${limitText}`;
}

// 页面加载自动检测
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
// 🚀 发送消息
// =========================
async function sendMessage() {

  // 未登录
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  // 检查次数限制
  const limit = getLimitByRole();

  if (currentUsage >= limit) {

    alert("Daily message limit reached.");

    return;
  }

  const chatBox = document.getElementById("chat-box");

  const userMessage = input.value.trim();

  if (!userMessage) return;

  // 用户消息
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

  // AI消息
  const aiDiv = document.createElement("div");

  aiDiv.className = "message ai-message";

  const bubble = document.createElement("div");

  bubble.className = "bubble";

  bubble.innerHTML = "Thinking...";

  aiDiv.appendChild(bubble);

  chatBox.appendChild(aiDiv);

  scrollToBottom();

  try {

    const model = getModelByRole();

    console.log("MODEL:", model);

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

    console.log(raw);

    let data;

    try {
      data = JSON.parse(raw);
    } catch (e) {
      bubble.innerHTML = "JSON parse error";
      return;
    }

    const text =
      data?.text ||
      data?.choices?.[0]?.message?.content ||
      "";

    if (!text) {
      bubble.innerHTML = "Empty response";
      return;
    }

    // 增加使用次数
    await increaseUsage();

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

    const user = data.user;

    if (user) {

      // 创建 profile
      await supabaseClient
        .from("user_profiles")
        .insert([
          {
            user_id: user.id,
            role: "free"
          }
        ]);

      console.log("Profile created!");
    }
  }
};

// =========================
// 🔐 登录
// =========================
window.handleLogin = async function () {

  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {

    document.getElementById("status").innerText = error.message;

  } else {

    document.getElementById("status").innerText = "登录成功！";

    await getUser();
  }
};