const SUPABASE_URL = "https://komjwvwxeaqfnxfphxou.supabase.co";
const SUPABASE_KEY = "sb_publishable_1atUPorr5mJZO09jVcvkXw_v_dM7qPN";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function register() {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  const message =
    document.getElementById("message");

  const { data, error } =
    await supabaseClient.auth.signUp({
      email,
      password
    });

  if (error) {
    message.innerText = error.message;
    return;
  }

  // 创建 free 用户资料
  await supabaseClient
    .from("user_profiles")
    .insert([
      {
        user_id: data.user.id,
        email: email,
        role: "free",
        daily_limit: 20
      }
    ]);

  message.style.color = "#4ade80";
  message.innerText = "Register success!";

  setTimeout(() => {
    window.location.href =
      "https://chat.hippo1996.top";
  }, 1000);
}

async function login() {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  const message =
    document.getElementById("message");

  const { error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    message.innerText = error.message;
    return;
  }

  window.location.href =
    "https://chat.hippo1996.top";
}