export function authScreen(mode = "login", message = "") {
  const registering = mode === "register";
  return `<section class="auth-page"><div class="auth-card">
    <p class="eyebrow">Private workspace</p>
    <h1>${registering ? "Create account." : "Welcome back."}</h1>
    <p class="auth-copy">${registering ? "Create your personal space on this machine." : "Sign in to open your personal workspace."}</p>
    <form id="auth-form" data-mode="${mode}">
      ${registering ? '<label>Name<input name="name" autocomplete="name" required minlength="2"></label>' : ""}
      <label>Email<input name="email" type="email" autocomplete="email" required></label>
      <label>Password<input name="password" type="password" autocomplete="${registering ? "new-password" : "current-password"}" required minlength="8"></label>
      <p class="form-message">${message}</p>
      <button class="primary-button" type="submit">${registering ? "Create account" : "Sign in"}</button>
    </form>
    <button class="text-button" id="switch-auth">${registering ? "Already have an account? Sign in" : "New here? Create an account"}</button>
  </div></section>`;
}
