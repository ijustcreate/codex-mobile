export function authScreen(mode = "login", message = "", users = []) {
  const registering = mode === "register";
  const options = users.map(user => `<option value="${user.username}">${user.name || user.username}</option>`).join("");
  return `<section class="auth-page"><div class="auth-card">
    <p class="eyebrow">Private workspace</p>
    <h1>${registering ? "Create user." : "Welcome back."}</h1>
    <p class="auth-copy">${registering ? "Choose a display name. No password needed right now." : "Pick a user, or continue instantly as Guest."}</p>
    <form id="auth-form" data-mode="${mode}">
      ${registering ? '<label>New user name<input name="username" autocomplete="username" required></label>' : `<label>Registered user<select name="username" required>${options || '<option value="">No users yet</option>'}</select></label>`}
      <p class="form-message">${message}</p>
      <button class="primary-button" type="submit">${registering ? "Create user" : "Sign in"}</button>
    </form>
    <button class="guest-button" id="guest-login">Continue as guest</button>
    <button class="text-button" id="switch-auth">${registering ? "Back to user list" : "Create a new user"}</button>
  </div></section>`;
}
