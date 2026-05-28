const SUPABASE_URL = "https://komjwvwxeaqfnxfphxou.supabase.co";
const SUPABASE_KEY = "sb_publishable_1atUPorr5mJZO09jVcvkXw_v_dM7qPN";

const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let userProfile = null;

// =====================
// 初始化
// =====================
async function init() {

  // 1. 获取登录用户
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "https://hippo1996.top";
    return;
  }

  currentUser = user;

  // 2. 获取 profile
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  userProfile = data;

  // 3. 显示用户信息
  document.getElementById("userInfo").innerText =
    `Role: ${data.role} | Limit: ${data.daily_limit}`;

}

init();

// =====================
// 发送消息（先模拟）
// =====================
async function sendMessage() {

  const input = document.getElementById("input");
  const text = input.value;
  input.value = "";

  if (!text) return;

  addMessage("You", text);

  // 🔥 先做模拟AI回复（后面接Worker）
  setTimeout(() => {
    addMessage("AI", "This is a placeholder response.");
  }, 500);
}

// =====================
// 显示消息
// =====================
function addMessage(role, text) {

  const box = document.getElementById("chatBox");

  const div = document.createElement("div");
  div.innerText = `${role}: ${text}`;
  div.style.margin = "10px 0";

  box.appendChild(div);

  box.scrollTop = box.scrollHeight;
}