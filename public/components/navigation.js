export function navigation(routes, activePath, user) {
  const links = Object.entries(routes).map(([path, route]) => `
    <a class="nav-link ${path === activePath ? "active" : ""}" href="${path}" data-link>${route.label}</a>
  `).join("");

  return `<nav class="nav-shell"><a class="brand" href="/" data-link>CODEX</a><div class="nav-links">${links}</div><button class="user-button" id="logout" title="Sign out">${user.name.split(" ")[0]}</button></nav>`;
}
