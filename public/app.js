import { navigation } from "./components/navigation.js";
import { authScreen } from "./components/auth.js";
import { render as home } from "./pages/home.js";
import { render as pageOne } from "./pages/page-one.js";
import { render as pageTwo } from "./pages/page-two.js";
import { render as pageThree } from "./pages/page-three.js";
import { render as pageFour } from "./pages/page-four.js";

const routes = {
  "/": { label: "Home", render: home }, "/page-one": { label: "One", render: pageOne },
  "/page-two": { label: "Two", render: pageTwo }, "/page-three": { label: "Three", render: pageThree }, "/page-four": { label: "Four", render: pageFour }
};
let currentUser = null;
let authMode = "login";

async function api(path, options = {}) {
  if (location.protocol === "file:" || location.hostname.endsWith("github.io")) return staticApi(path, options);
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error);
  return body;
}

async function staticApi(path, options = {}) {
  const users = JSON.parse(localStorage.getItem("static-users") || "{}");
  if (path === "/api/me") {
    const user = JSON.parse(localStorage.getItem("static-current-user") || "null");
    if (!user) throw new Error("Not signed in.");
    return { user };
  }
  if (path === "/api/guest") {
    const user = { id: "guest", name: "Guest", username: "guest", guest: true };
    localStorage.setItem("static-current-user", JSON.stringify(user));
    return { user };
  }
  if (path === "/api/register") {
    const data = JSON.parse(options.body || "{}"), username = data.username || "player";
    const user = { id: username, name: username, username, guest: false };
    users[username] = { user, password: data.password || "" };
    localStorage.setItem("static-users", JSON.stringify(users));
    localStorage.setItem("static-current-user", JSON.stringify(user));
    return { user };
  }
  if (path === "/api/login") {
    const data = JSON.parse(options.body || "{}"), record = users[data.username];
    if (!record || record.password !== (data.password || "")) throw new Error("Username or password is incorrect.");
    localStorage.setItem("static-current-user", JSON.stringify(record.user));
    return { user: record.user };
  }
  if (path === "/api/logout") {
    localStorage.removeItem("static-current-user");
    return { ok: true };
  }
  throw new Error("Static mode does not support this API.");
}

function showPage(path = window.location.pathname) {
  try {
  if (!currentUser) {
    document.querySelector("#navigation").innerHTML = "";
    document.querySelector("#app").innerHTML = authScreen(authMode);
    return;
  }
  const route = routes[path] || routes["/"];
  document.querySelector("#navigation").innerHTML = navigation(routes, path, currentUser);
  document.querySelector("#app").innerHTML = route.render();
  window.scrollTo(0, 0);
  } catch (error) {
    console.error(error);
    document.querySelector("#app").innerHTML = `<section class="auth-page"><div class="auth-card"><h1>Loading issue.</h1><button class="primary-button" onclick="location.reload()">Refresh</button></div></section>`;
  }
}

document.addEventListener("submit", async event => {
  if (event.target.id !== "auth-form") return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  try {
    const result = await api(`/api/${event.target.dataset.mode}`, { method: "POST", body: JSON.stringify(data) });
    currentUser = result.user;
    showPage();
  } catch (error) {
    document.querySelector(".form-message").textContent = error.message;
  }
});

document.addEventListener("click", async event => {
  if (event.target.closest("#switch-auth")) { authMode = authMode === "login" ? "register" : "login"; showPage(); return; }
  if (event.target.closest("#guest-login")) { const result = await api("/api/guest", { method: "POST" }); currentUser = result.user; showPage(); return; }
  if (event.target.closest("#logout")) { await api("/api/logout", { method: "POST" }); currentUser = null; showPage(); return; }
  const link = event.target.closest("[data-link]");
  if (!link) return;
  event.preventDefault(); history.pushState({}, "", link.href); showPage();
});

window.addEventListener("popstate", () => showPage());
api("/api/me").then(result => { currentUser = result.user; showPage(); }).catch(() => showPage());
