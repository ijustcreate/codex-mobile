let cleanup = () => {};
const enemies = [
  { name: "Slime", color: "#74e68a" }, { name: "Bat", color: "#b895ff" }, { name: "Wisp", color: "#8ee9ff" },
  { name: "Knight", color: "#ffb16a" }, { name: "Void", color: "#ff6c91" }
];

export function render() {
  queueMicrotask(start);
  return `<section class="mini-app mmo-app">
    <div class="game-toolbar"><div><b>ONE PIXEL MMO</b><small id="mmo-status">Choose your hero</small></div><div><b id="mmo-level">LV 1</b><small id="mmo-xp">0 / 5 XP</small></div></div>
    <div class="game-stage"><canvas id="mmo-canvas"></canvas>
      <div class="creator" id="creator"><p class="eyebrow">Character creation</p><h2>Choose a class</h2><div class="class-grid">
        <button data-class="warrior"><i>◆</i><b>Warrior</b><small>Strong attack</small></button>
        <button data-class="rogue"><i>▲</i><b>Rogue</b><small>Fast movement</small></button>
        <button data-class="wizard"><i>●</i><b>Wizard</b><small>Long range</small></button>
      </div></div>
      <div class="mobile-controls"><div class="dpad"><button data-move="up">↑</button><button data-move="left">←</button><button data-move="down">↓</button><button data-move="right">→</button></div><button class="action-orb" id="attack">ATK</button></div>
    </div>
  </section>`;
}

function start() {
  cleanup();
  const canvas = document.querySelector("#mmo-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const player = { x: 0, y: 0, className: "", level: 1, xp: 0, hp: 5 };
  let others = [], foes = [], running = true, lastSync = 0;

  function resize() { canvas.width = canvas.clientWidth * devicePixelRatio; canvas.height = canvas.clientHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
  function spawn() { foes = Array.from({ length: Math.min(3 + player.level, 12) }, (_, i) => ({ ...enemies[i % enemies.length], x: Math.random() * 700 - 350, y: Math.random() * 700 - 350, hp: 1 + Math.floor(player.level / 3) })); }
  function move(dx, dy) { const speed = player.className === "rogue" ? 16 : 11; player.x += dx * speed; player.y += dy * speed; }
  function attack() {
    const range = player.className === "wizard" ? 100 : 62;
    const target = foes.find(foe => Math.hypot(foe.x - player.x, foe.y - player.y) < range);
    if (!target) return;
    target.hp -= player.className === "warrior" ? 2 : 1;
    if (target.hp <= 0) { foes.splice(foes.indexOf(target), 1); player.xp++; if (player.xp >= player.level * 5) { player.level++; player.xp = 0; spawn(); } updateHud(); }
  }
  function updateHud() { document.querySelector("#mmo-level").textContent = player.level > 10 ? `ENDLESS ${player.level}` : `LV ${player.level}`; document.querySelector("#mmo-xp").textContent = `${player.xp} / ${player.level * 5} XP`; }
  async function sync() {
    try {
      await fetch("/api/mmo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...player, name: "Player" }) });
      const data = await fetch("/api/mmo").then(r => r.json()); others = data.players.filter(item => item.className && (item.x !== player.x || item.y !== player.y));
      document.querySelector("#mmo-status").textContent = `${data.players.length} adventurer${data.players.length === 1 ? "" : "s"} online`;
    } catch {}
  }
  function draw(time) {
    if (!running) return;
    const w = canvas.clientWidth, h = canvas.clientHeight, cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#0a1218"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#142631"; ctx.lineWidth = 1;
    for (let x = ((-player.x % 32) + 32) % 32; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = ((-player.y % 32) + 32) % 32; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    foes.forEach(foe => { ctx.fillStyle = foe.color; ctx.fillRect(cx + foe.x - player.x - 5, cy + foe.y - player.y - 5, 10, 10); });
    others.forEach(other => { ctx.fillStyle = "#fff"; ctx.fillRect(cx + other.x - player.x - 4, cy + other.y - player.y - 4, 8, 8); ctx.fillStyle="#9aa"; ctx.font="10px sans-serif"; ctx.fillText(`${other.className} · ${other.level}`, cx + other.x-player.x-18, cy+other.y-player.y-10); });
    ctx.fillStyle = player.className === "warrior" ? "#ffb36b" : player.className === "rogue" ? "#9cff9c" : "#ae9cff"; ctx.fillRect(cx - 6, cy - 6, 12, 12);
    if (time - lastSync > 900 && player.className) { lastSync = time; sync(); }
    requestAnimationFrame(draw);
  }
  const key = event => { if (event.key === "ArrowUp" || event.key === "w") move(0,-1); if (event.key === "ArrowDown" || event.key === "s") move(0,1); if (event.key === "ArrowLeft" || event.key === "a") move(-1,0); if (event.key === "ArrowRight" || event.key === "d") move(1,0); if (event.code === "Space") attack(); };
  document.querySelectorAll("[data-class]").forEach(button => button.onclick = () => { player.className = button.dataset.class; document.querySelector("#creator").remove(); spawn(); updateHud(); });
  document.querySelectorAll("[data-move]").forEach(button => button.onclick = () => move(button.dataset.move === "left" ? -1 : button.dataset.move === "right" ? 1 : 0, button.dataset.move === "up" ? -1 : button.dataset.move === "down" ? 1 : 0));
  document.querySelector("#attack").onclick = attack; addEventListener("keydown", key); addEventListener("resize", resize); resize(); requestAnimationFrame(draw);
  cleanup = () => { running = false; removeEventListener("keydown", key); removeEventListener("resize", resize); };
}
