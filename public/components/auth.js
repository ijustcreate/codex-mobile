export function authScreen(mode = "login", message = "") {
  const registering = mode === "register";
  return `<section class="auth-page"><div class="auth-card">
    <p class="eyebrow">Private workspace</p>
    <h1>${registering ? "Create account." : "Welcome back."}</h1>
    <p class="auth-copy">${registering ? "Choose any username and password." : "Sign in, or continue instantly as a guest."}</p>
    <form id="auth-form" data-mode="${mode}">
      <label>Username<input name="username" autocomplete="username" required></label>
      <label>Password<input name="password" type="password" autocomplete="${registering ? "new-password" : "current-password"}"></label>
      <p class="form-message">${message}</p>
      <button class="primary-button" type="submit">${registering ? "Create account" : "Sign in"}</button>
    </form>
    <button class="guest-button" id="guest-login">Continue as guest</button>
    <button class="text-button" id="switch-auth">${registering ? "Already have an account? Sign in" : "New here? Create an account"}</button>
  </div></section>`;
}
