export function navigation(routes, activePath) {
  const links = Object.entries(routes).map(([path, route]) => `
    <a class="nav-link ${path === activePath ? "active" : ""}" href="${path}" data-link>${route.label}</a>
  `).join("");

  return `<nav class="nav-shell"><a class="brand" href="/" data-link>CODEX</a><div class="nav-links">${links}</div></nav>`;
}
