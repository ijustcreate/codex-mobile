const CODEX_CLOUD_CONFIG = {
  url: "https://livyedmscrkbnoxfpsoy.supabase.co",
  publishableKey: "sb_publishable_2ybz6mA59wsfU7e0pSS6Zw_nEL7Ol8n"
};

window.CodexCloud = (() => {
  let client = null;
  function getClient() {
    if (client) return client;
    if (!window.supabase?.createClient) return null;
    client = window.supabase.createClient(CODEX_CLOUD_CONFIG.url, CODEX_CLOUD_CONFIG.publishableKey);
    return client;
  }
  function getClientKey() {
    const key = localStorage.getItem("codex-mobile-client-key") || crypto.randomUUID();
    localStorage.setItem("codex-mobile-client-key", key);
    return key;
  }
  function profileToUser(profile) {
    return { id: profile.id, name: profile.display_name || profile.username || "Guest", username: profile.username || "guest", guest: Boolean(profile.guest) };
  }
  async function listUsers() {
    const supabase = getClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from("codex_mobile_profiles").select("id,username,display_name,guest").eq("guest", false).order("display_name");
    if (error) throw error;
    return data.map(profileToUser);
  }
  async function register(username) {
    const supabase = getClient();
    if (!supabase) return null;
    const clean = String(username || "player").trim();
    const { data, error } = await supabase.from("codex_mobile_profiles").insert({ username: clean.toLowerCase(), display_name: clean, guest: false, client_key: getClientKey() }).select("id,username,display_name,guest").single();
    if (error) throw error;
    return profileToUser(data);
  }
  async function login(username) {
    const supabase = getClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from("codex_mobile_profiles").select("id,username,display_name,guest").eq("username", String(username).toLowerCase()).eq("guest", false).single();
    if (error) throw error;
    return profileToUser(data);
  }
  async function guest() {
    const supabase = getClient();
    if (!supabase) return null;
    const clientKey = getClientKey();
    const { data, error } = await supabase.from("codex_mobile_profiles").upsert({ username: `guest-${clientKey.slice(0, 8)}`, display_name: "Guest", guest: true, client_key: clientKey }, { onConflict: "client_key" }).select("id,username,display_name,guest").single();
    if (error) throw error;
    return profileToUser({ ...data, username: "guest", display_name: "Guest", guest: true });
  }
  async function loadRecords(type) {
    const supabase = getClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from("codex_mobile_records").select("payload").eq("record_type", type).order("created_at");
    if (error) throw error;
    return data.map(row => row.payload);
  }
  async function saveRecord(type, payload) {
    const supabase = getClient();
    if (!supabase) return null;
    const { error } = await supabase.from("codex_mobile_records").insert({ record_type: type, owner_key: getClientKey(), payload });
    if (error) throw error;
  }
  return { getClient, listUsers, register, login, guest, loadRecords, saveRecord };
})();
