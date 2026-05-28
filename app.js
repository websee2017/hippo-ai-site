// =====================
// Supabase 初始化
// =====================
const SUPABASE_URL = "https://komjwvwxeaqfnxfphxou.supabase.co";
const SUPABASE_KEY = "sb_publishable_1atUPorr5mJZO09jVcvkXw_v_dM7qPN";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// =====================
// 注册
// =====================
async function register() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  if (!email || !password) {
    message.innerText = "Please enter email and password";
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    message.innerText = error.message;
    return;
  }

  const user = data.user;

  if (!user) {
    message.innerText = "User not created (check email confirmation)";
    return;
  }

  // =====================
  // 写入 user_profiles（关键）
  // =====================
  const { error: insertError } = await supabaseClient
    .from("user_profiles")
    .insert([
      {
        user_id: user.id,
        email: email,
        role: "free",
        daily_limit: 20
      }
    ]);

  if (insertError) {
    console.log(insertError);
    message.innerText = "Profile create failed: " + insertError.message;
    return;
  }

  message.style.color = "#4ade80";
  message.innerText = "Register success! Redirecting...";

  setTimeout(() => {
    window.location.href = "https://chat.hippo1996.top";
  }, 1000);
}

// =====================
// 登录
// =====================
async function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message.innerText = error.message;
    return;
  }

  message.style.color = "#4ade80";
  message.innerText = "Login success! Redirecting...";

  setTimeout(() => {
    window.location.href = "https://chat.hippo1996.top";
  }, 800);
}