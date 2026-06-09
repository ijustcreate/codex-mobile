import { navigation } from "./components/navigation.js";
import { render as home } from "./pages/home.js";
import { render as pageOne } from "./pages/page-one.js";
import { render as pageTwo } from "./pages/page-two.js";
import { render as pageThree } from "./pages/page-three.js";

// Registering pages here keeps navigation simple and each mini project separate.
const routes = {
  "/": { label: "Home", render: home },
  "/page-one": { label: "One", render: pageOne },
  "/page-two": { label: "Two", render: pageTwo },
  "/page-three": { label: "Three", render: pageThree }
};

function showPage(path = window.location.pathname) {
  const route = routes[path] || routes["/"];
  document.querySelector("#navigation").innerHTML = navigation(routes, path);
  document.querySelector("#app").innerHTML = route.render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-link]");
  if (!link) return;
  event.preventDefault();
  history.pushState({}, "", link.href);
  showPage();
});

window.addEventListener("popstate", () => showPage());
showPage();
