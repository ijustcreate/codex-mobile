import { navigation } from "./components/navigation.js";
import { authScreen } from "./components/auth.js";
import { render as home } from "./pages/home.js";
import { render as pageOne } from "./pages/page-one.js";
import { render as pageTwo } from "./pages/page-two.js";
import { render as pageThree } from "./pages/page-three.js";

const routes = {
  "/": { label: "Home", render: home }, "/page-one": { label: "One", render: pageOne },
  "/page-two": { label: "Two", render: pageTwo }, "/page-three": { label: "Three", render: pageThree }
};
let currentUser = null;
let authMode = "login";

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error);
  return body;
}

function showPage(path = window.location.pathname) {
  if (!currentUser) {
    document.querySelector("#navigation").innerHTML = "";
    document.querySelector("#app").innerHTML = authScreen(authMode);
    return;
  }
  const route = routes[path] || routes["/"];
  document.querySelector("#navigation").innerHTML = navigation(routes, path, currentUser);
  document.querySelector("#app").innerHTML = route.render();
  window.scrollTo(0, 0);
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
