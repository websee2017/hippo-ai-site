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

const input = document.getElementById("user-input");

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

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

    // =========================
    // 🚨 强制读取原始文本（避免json炸）
    // =========================
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

    // =========================
    // 🚨 兼容所有返回结构
    // =========================
    const text =
      data?.text ||
      data?.choices?.[0]?.message?.content ||
      "";

    if (!text) {
      bubble.innerHTML = "No response (empty text)";
      console.error("Bad response:", data);
      return;
    }

    // =========================
    // 🟢 ChatGPT打字效果（稳定版）
    // =========================
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

function scrollToBottom() {
  const chatBox = document.getElementById("chat-box");
  chatBox.scrollTop = chatBox.scrollHeight;
}