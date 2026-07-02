let stopTabOne = () => {};

const baseEntities = [
  { id: "player", name: "Player Sprite", category: "character", color: "#9be7ff", size: 18, hp: 24, description: "The editable hero sprite used by the player." },
  { id: "slime", name: "Lake Slime", category: "enemy", color: "#65d98f", size: 16, hp: 6, damage: 1, description: "Slow enemy. Bumps the player for light damage." },
  { id: "bat", name: "Purple Bat", category: "enemy", color: "#b895ff", size: 14, hp: 4, damage: 1, description: "Does 1 damage about once per second when touching you." },
  { id: "apple", name: "Apple Drop", category: "drop", color: "#ff5d6c", size: 10, description: "Collect to heal a little." },
  { id: "armor", name: "Soft Armor", category: "drop", color: "#b8c4d8", size: 12, description: "A future defensive drop." },
  { id: "tree", name: "Big Tree", category: "doodad", color: "#42b85e", size: 42, description: "Leaves are visual; only the trunk blocks movement." },
  { id: "bush", name: "Bush", category: "doodad", color: "#65c46b", size: 20, description: "Decorative ground cover." },
  { id: "castle", name: "Castle", category: "structure", color: "#252b36", size: 120, description: "Editable dark-walled castle with a door." }
];

export function render() {
  queueMicrotask(start);
  return `<section class="mini-app tab-one-app">
    <div class="game-toolbar">
      <div><b>ONE PIXEL MMO LAB</b><small id="mmo-status">Safe zone · choose a class</small><span class="health-track"><i id="player-health"></i></span></div>
      <div><b id="mmo-level">LV 1</b><small id="wet-status">DRY</small></div>
    </div>
    <div class="quest-strip">Build, edit, and test the world live. Water slows you when wet.</div>
    <div class="panel-buttons"><button id="guide-open">GUIDE</button><button id="editor-open">ENTITY EDITOR</button><button id="paint-open">PIXEL ART</button></div>
    <div class="game-stage"><canvas id="mmo-canvas"></canvas>
      <div class="creator" id="creator"><h2>Choose a class</h2><div class="class-grid"><button data-class="warrior"><b>Warrior</b><small>Sword</small></button><button data-class="rogue"><b>Rogue</b><small>Dagger</small></button><button data-class="wizard"><b>Wizard</b><small>Staff</small></button><button data-class="pilot"><b>Space Pilot</b><small>Blaster</small></button></div></div>
      <div class="field-guide" id="guide"><button data-close="guide">Close</button><h2>Guide</h2><div class="guide-grid" id="guide-grid"></div></div>
      <div class="editor-modal" id="entity-editor"><header><b>Entity Editor</b><button data-close="entity-editor">Close</button></header><form id="entity-form"><input name="name" placeholder="Name" required><select name="category"><option>enemy</option><option>drop</option><option>doodad</option><option>character</option><option>structure</option></select><input name="color" type="color" value="#ff9b6b"><input name="size" type="number" min="4" max="96" value="16"><textarea name="description" placeholder="What does it do?"></textarea><button>Save entity to server</button></form><div id="entity-list"></div></div>
      <div class="editor-modal" id="paint-editor"><header><b>Pixel Art</b><button data-close="paint-editor">Close</button></header><div class="paint-tools"><input id="paint-name" placeholder="Sprite name"><input id="paint-color" type="color" value="#9be7ff"><input id="paint-size" type="number" min="8" max="32" value="16"><button id="paint-clear">Clear</button><button id="paint-save">Save PNG data</button></div><canvas id="paint-canvas" width="256" height="256"></canvas></div>
      <div class="mobile-controls"><div class="dpad"><button data-move="up">UP</button><button data-move="left">LEFT</button><button data-move="down">DOWN</button><button data-move="right">RIGHT</button></div><button class="action-orb" id="attack">ATK</button></div>
    </div>
  </section>`;
}

function start() {
  stopTabOne();
  const canvas = document.querySelector("#mmo-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const world = { w: 1200, h: 850, safe: { x: 90, y: 650, r: 85 }, castle: { x: 860, y: 95, w: 230, h: 170, doorX: 970 } };
  const player = { x: 90, y: 650, hp: 24, maxHp: 24, wet: 0, className: "", dir: { x: 1, y: 0 }, attackTime: 0 };
  const water = [{ x: 360, y: 470, r: 95 }, { x: 0, y: 350, w: 1200, h: 42 }];
  const trees = Array.from({ length: 22 }, (_, i) => ({ x: 170 + (i * 173) % 930, y: 115 + (i * 127) % 650 }));
  const bushes = Array.from({ length: 18 }, (_, i) => ({ x: 140 + (i * 211) % 940, y: 140 + (i * 89) % 620 }));
  const enemies = [
    { type: "slime", x: 520, y: 555, hp: 6, size: 16, color: "#65d98f", damage: 1, lastHit: 0 },
    { type: "bat", x: 680, y: 390, hp: 4, size: 14, color: "#b895ff", damage: 1, lastHit: 0 }
  ];
  const drops = [];
  let customEntities = [], assets = [], running = true;

  function resize() { canvas.width = canvas.clientWidth * devicePixelRatio; canvas.height = canvas.clientHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
  function inWater(x, y) { return water.some(w => w.r ? Math.hypot(x - w.x, y - w.y) < w.r : x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h); }
  function trunkBlocked(x, y) { return trees.some(t => Math.abs(x - t.x) < 8 && y > t.y + 5 && y < t.y + 28); }
  function castleBlocked(x, y) {
    const c = world.castle, inside = x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h;
    const door = x > c.doorX - 20 && x < c.doorX + 20 && y > c.y + c.h - 18;
    return inside && !door;
  }
  function blocked(x, y) { return x < 12 || x > world.w - 12 || y < 12 || y > world.h - 12 || trunkBlocked(x, y) || castleBlocked(x, y); }
  function separate(a, b, min) {
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (!d || d >= min) return;
    const push = (min - d) / 2, ux = (a.x - b.x) / d, uy = (a.y - b.y) / d;
    if (!blocked(a.x + ux * push, a.y + uy * push)) { a.x += ux * push; a.y += uy * push; }
    b.x -= ux * push; b.y -= uy * push;
  }
  function move(dx, dy) {
    if (!player.className) return;
    player.dir = { x: dx, y: dy };
    const speed = player.wet > 0 ? 4 : 7, nx = player.x + dx * speed, ny = player.y + dy * speed;
    if (!blocked(nx, ny)) { player.x = nx; player.y = ny; }
  }
  function attack() {
    if (!player.className) return;
    player.attackTime = 12;
    enemies.forEach(e => { if (Math.hypot(e.x - player.x, e.y - player.y) < 45) { e.hp -= player.className === "warrior" ? 3 : 2; if (e.hp <= 0) drops.push({ x: e.x, y: e.y, type: "apple" }); } });
  }
  function update() {
    if (!player.className) return;
    player.wet = inWater(player.x, player.y) ? 90 : Math.max(0, player.wet - 1);
    if (player.attackTime) player.attackTime--;
    enemies.forEach(e => {
      if (e.hp <= 0) return;
      const d = Math.hypot(player.x - e.x, player.y - e.y);
      if (d < 230 && Math.hypot(player.x - world.safe.x, player.y - world.safe.y) > world.safe.r) { e.x += (player.x - e.x) / d * 0.7; e.y += (player.y - e.y) / d * 0.7; }
      separate(player, e, 26);
      if (d < 28 && performance.now() - e.lastHit > 1000 && Math.hypot(player.x - world.safe.x, player.y - world.safe.y) > world.safe.r) { player.hp = Math.max(0, player.hp - e.damage); e.lastHit = performance.now(); }
    });
    drops.forEach(d => { if (!d.dead && Math.hypot(d.x - player.x, d.y - player.y) < 22) { d.dead = true; player.hp = Math.min(player.maxHp, player.hp + 4); } });
    document.querySelector("#player-health").style.width = `${player.hp / player.maxHp * 100}%`;
    document.querySelector("#mmo-status").textContent = `HP ${player.hp}/${player.maxHp}`;
    document.querySelector("#wet-status").textContent = player.wet ? "WET · SLOWED" : "DRY";
  }
  function drawEntity(e) { ctx.fillStyle = e.color; ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size); ctx.fillStyle = "#111"; ctx.fillRect(e.x + 3, e.y - 3, 3, 3); }
  function draw() {
    if (!running) return;
    update();
    const w = canvas.clientWidth, h = canvas.clientHeight, ox = w / 2 - player.x, oy = h / 2 - player.y;
    ctx.fillStyle = "#05080b"; ctx.fillRect(0, 0, w, h); ctx.save(); ctx.translate(ox, oy);
    ctx.fillStyle = "#548b48"; ctx.fillRect(0, 0, world.w, world.h);
    for (let x = 0; x < world.w; x += 18) for (let y = 0; y < world.h; y += 18) { ctx.fillStyle = "#6dae5c"; ctx.fillRect(x, y, 2, 2); }
    ctx.fillStyle = "#2c6f9f"; water.forEach(a => a.r ? (ctx.beginPath(), ctx.arc(a.x, a.y, a.r, 0, 7), ctx.fill()) : ctx.fillRect(a.x, a.y, a.w, a.h));
    ctx.fillStyle = "rgba(155,231,255,.12)"; ctx.beginPath(); ctx.arc(world.safe.x, world.safe.y, world.safe.r, 0, 7); ctx.fill();
    bushes.forEach(b => { ctx.fillStyle = "#3fa65a"; ctx.fillRect(b.x - 10, b.y - 7, 20, 14); });
    trees.forEach(t => { ctx.fillStyle = "#70472c"; ctx.fillRect(t.x - 5, t.y + 7, 10, 24); ctx.fillStyle = "#43bd61"; ctx.fillRect(t.x - 24, t.y - 28, 48, 42); });
    const c = world.castle; ctx.fillStyle = "#202632"; ctx.fillRect(c.x, c.y, c.w, c.h); ctx.strokeStyle = "#080a10"; ctx.lineWidth = 12; ctx.strokeRect(c.x, c.y, c.w, c.h); ctx.fillStyle = "#6f4a2e"; ctx.fillRect(c.doorX - 20, c.y + c.h - 28, 40, 28);
    enemies.filter(e => e.hp > 0).forEach(drawEntity);
    drops.filter(d => !d.dead).forEach(d => { ctx.fillStyle = "#ff5d6c"; ctx.fillRect(d.x - 5, d.y - 5, 10, 10); });
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(player.x - 12, player.y + 11, 24, 5); ctx.fillStyle = "#9be7ff"; ctx.fillRect(player.x - 9, player.y - 8, 18, 18); ctx.fillStyle = "#f2c49b"; ctx.fillRect(player.x - 6, player.y - 18, 12, 10); ctx.fillStyle = "#111"; ctx.fillRect(player.x + player.dir.x * 6 - 1, player.y - 14 + player.dir.y * 4, 3, 3);
    if (player.attackTime) { ctx.fillStyle = player.className === "wizard" ? "#ae9cff" : player.className === "pilot" ? "#ffe06b" : "#eee"; ctx.fillRect(player.x + player.dir.x * 22 - 4, player.y + player.dir.y * 22 - 4, 8, 8); }
    ctx.restore(); requestAnimationFrame(draw);
  }
  async function loadCreations() { const data = await tabOneLoad(); customEntities = data.entities; assets = data.assets; renderEditorLists(); }
  function renderEditorLists() {
    const all = [...baseEntities, ...customEntities];
    document.querySelector("#guide-grid").innerHTML = ["character", "enemy", "drop", "doodad", "structure"].map(cat => `<article><b>${cat.toUpperCase()}</b><small>${all.filter(e => e.category === cat).map(e => `<span style="color:${e.color}">${e.name}</span>: ${e.description || "Custom item"}`).join("<br>")}</small></article>`).join("");
    document.querySelector("#entity-list").innerHTML = all.map(e => `<p><b style="color:${e.color}">${e.name}</b> · ${e.category} · size ${e.size}</p>`).join("");
  }
  function setupPaint() {
    const pc = document.querySelector("#paint-canvas"), px = pc.getContext("2d"); let size = 16, color = "#9be7ff";
    function grid() { size = Number(document.querySelector("#paint-size").value) || 16; color = document.querySelector("#paint-color").value; px.imageSmoothingEnabled = false; px.fillStyle = "#fff"; px.fillRect(0, 0, 256, 256); px.strokeStyle = "#ddd"; for (let i = 0; i <= size; i++) { const v = i * 256 / size; px.beginPath(); px.moveTo(v, 0); px.lineTo(v, 256); px.moveTo(0, v); px.lineTo(256, v); px.stroke(); } }
    pc.onclick = e => { const r = pc.getBoundingClientRect(), cell = 256 / size, x = Math.floor((e.clientX - r.left) / r.width * size), y = Math.floor((e.clientY - r.top) / r.height * size); px.fillStyle = color; px.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2); };
    document.querySelector("#paint-clear").onclick = grid;
    document.querySelector("#paint-size").onchange = grid; document.querySelector("#paint-color").onchange = () => color = document.querySelector("#paint-color").value;
    document.querySelector("#paint-save").onclick = async () => { await tabOneSave("assets", { name: document.querySelector("#paint-name").value || "sprite", size, image: pc.toDataURL("image/png") }); loadCreations(); };
    grid();
  }
  document.querySelectorAll("[data-class]").forEach(b => b.onclick = () => { player.className = b.dataset.class; document.querySelector("#creator").remove(); });
  document.querySelectorAll("[data-move]").forEach(b => b.onclick = () => move(b.dataset.move === "left" ? -1 : b.dataset.move === "right" ? 1 : 0, b.dataset.move === "up" ? -1 : b.dataset.move === "down" ? 1 : 0));
  document.querySelector("#attack").onclick = attack; document.querySelector("#guide-open").onclick = () => document.querySelector("#guide").classList.add("show"); document.querySelector("#editor-open").onclick = () => document.querySelector("#entity-editor").classList.add("show"); document.querySelector("#paint-open").onclick = () => document.querySelector("#paint-editor").classList.add("show");
  document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => document.querySelector(`#${b.dataset.close}`).classList.remove("show"));
  document.querySelector("#entity-form").onsubmit = async e => { e.preventDefault(); const body = Object.fromEntries(new FormData(e.target)); body.size = Number(body.size); await tabOneSave("entities", body); e.target.reset(); loadCreations(); };
  const key = e => { if (["ArrowUp", "w"].includes(e.key)) move(0, -1); if (["ArrowDown", "s"].includes(e.key)) move(0, 1); if (["ArrowLeft", "a"].includes(e.key)) move(-1, 0); if (["ArrowRight", "d"].includes(e.key)) move(1, 0); if (e.code === "Space") attack(); };
  addEventListener("keydown", key); addEventListener("resize", resize); resize(); setupPaint(); loadCreations(); draw(); stopTabOne = () => { running = false; removeEventListener("keydown", key); removeEventListener("resize", resize); };
}

async function tabOneLoad() {
  if (location.hostname.endsWith("github.io")) return {
    entities: await cloudRecords("tab_one_entity", "tab-one-entities"),
    assets: await cloudRecords("tab_one_asset", "tab-one-assets")
  };
  return fetch("/api/tab-one").then(r => r.json());
}

async function tabOneSave(kind, body) {
  if (location.hostname.endsWith("github.io")) {
    try { await window.CodexCloud?.saveRecord(kind === "entities" ? "tab_one_entity" : "tab_one_asset", body); } catch (error) { console.warn("Cloud save unavailable", error); }
    const key = `tab-one-${kind}`, items = JSON.parse(localStorage.getItem(key) || "[]");
    items.push({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...body });
    localStorage.setItem(key, JSON.stringify(items));
    return;
  }
  return fetch(`/api/tab-one/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

async function cloudRecords(type, fallbackKey) {
  try {
    const records = await window.CodexCloud?.loadRecords(type);
    if (records) return records;
  } catch (error) {
    console.warn("Cloud records unavailable", error);
  }
  return JSON.parse(localStorage.getItem(fallbackKey) || "[]");
}
