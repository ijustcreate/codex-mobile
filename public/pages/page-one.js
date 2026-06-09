let cleanup = () => {};
const enemies = [
  { name: "Octorok", color: "#f27b64", ai:"wander" }, { name: "Keese", color: "#b895ff", ai:"chase" }, { name: "Wisp", color: "#8ee9ff", ai:"flee" },
  { name: "Moblin", color: "#ffb16a", ai:"patrol" }, { name: "Snake", color: "#c8eb72", ai:"snake" }
];

export function render() {
  queueMicrotask(start);
  return `<section class="mini-app mmo-app">
    <div class="game-toolbar"><div><b>ONE PIXEL MMO</b><small id="mmo-status">Choose your hero</small></div><div><b id="mmo-level">LV 1</b><small id="mmo-xp">0 / 5 XP</small></div></div>
    <div class="quest-strip" id="quest">OBJECTIVE · Find the key</div><button class="guide-button" id="guide-open">GUIDE</button><div class="game-stage"><canvas id="mmo-canvas"></canvas><div class="field-guide" id="guide"><button id="guide-close">Close</button><h2>Field guide</h2><p><b>Octorok</b> wanders and attacks nearby heroes.</p><p><b>Keese</b> chases quickly.</p><p><b>Wisp</b> is passive and flees.</p><p><b>Moblin</b> patrols and attacks.</p><p><b>Snake</b> slithers and bites.</p><p><b>Key</b> unlocks the castle objective.</p><p><b>XP orbs</b> glow blue and level you up.</p><p><b>Trees</b> block movement at the trunk.</p></div>
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
  const player = { x: 350, y: 600, className: "", level: 1, xp: 0, hp: 20, mana: 10, dir:{x:0,y:-1}, key:false, kills:0 };
  let others = [], foes = [], running = true, lastSync = 0, orbs=[], shots=[], lastHurt=0;const trees=Array.from({length:24},(_,i)=>({x:35+(i*137)%730,y:35+(i*211)%620}));

  function resize() { canvas.width = canvas.clientWidth * devicePixelRatio; canvas.height = canvas.clientHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
  function spawn() { foes = Array.from({ length: Math.min(8 + player.level, 18) }, (_, i) => ({ ...enemies[i % enemies.length], x: 40+Math.random()*720, y:40+Math.random()*620, hp: 2 + Math.floor(player.level / 3), maxHp:2+Math.floor(player.level/3), phase:Math.random()*6 })); }
  function move(dx, dy) { const speed = player.className === "rogue" ? 16 : 11,nx=Math.max(18,Math.min(782,player.x+dx*speed)),ny=Math.max(18,Math.min(682,player.y+dy*speed));player.dir={x:dx,y:dy};if(!trees.some(t=>Math.hypot(nx-t.x,ny-t.y)<16)){player.x=nx;player.y=ny} }
  function attack() {
    if(player.className==="wizard"){if(player.mana<2)return;player.mana-=2;shots.push({x:player.x,y:player.y,vx:player.dir.x*8,vy:player.dir.y*8,life:60});return}if(player.className==="rogue"){player.x+=player.dir.x*28;player.y+=player.dir.y*28}
    const range = player.className === "rogue" ? 50 : 72;
    const target = foes.find(foe => Math.hypot(foe.x - player.x, foe.y - player.y) < range);
    if (!target) return;
    target.hp -= player.className === "warrior" ? 2 : 1;
    if (target.hp <= 0) { orbs.push({x:target.x,y:target.y});foes.splice(foes.indexOf(target), 1);player.kills++; updateHud(); }
  }
  function updateHud() { document.querySelector("#mmo-level").textContent = player.level > 10 ? `ENDLESS ${player.level}` : `LV ${player.level}`; document.querySelector("#mmo-xp").textContent = `${player.xp} / ${player.level * 5} XP`;document.querySelector("#mmo-status").textContent=`HP ${Math.ceil(player.hp)}/20 · MANA ${Math.floor(player.mana)}/10`; }
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
    player.mana=Math.min(10,player.mana+.025);foes.forEach((f,i)=>{f.phase+=.08;let d=Math.hypot(player.x-f.x,player.y-f.y),dx=0,dy=0;if(f.ai==="chase"&&d<220){dx=(player.x-f.x)/d;dy=(player.y-f.y)/d}if(f.ai==="flee"&&d<100){dx=(f.x-player.x)/d;dy=(f.y-player.y)/d}if(f.ai==="wander"||f.ai==="patrol"){dx=Math.cos(f.phase+i);dy=Math.sin(f.phase+i)}if(f.ai==="snake"){dx=Math.cos(f.phase*2);dy=Math.sin(f.phase)}f.x+=dx;f.y+=dy;if(f.ai!=="flee"&&d<15&&time-lastHurt>700){lastHurt=time;player.hp=Math.max(0,player.hp-2)}});shots.forEach(s=>{s.x+=s.vx;s.y+=s.vy;s.life--;foes.forEach(f=>{if(Math.hypot(s.x-f.x,s.y-f.y)<12){f.hp-=2;s.life=0}})});shots=shots.filter(s=>s.life>0);orbs.forEach(o=>{if(Math.hypot(player.x-o.x,player.y-o.y)<24){o.dead=true;player.xp++;if(player.xp>=player.level*5){player.level++;player.xp=0}updateHud()}});orbs=orbs.filter(o=>!o.dead);if(!player.key&&Math.hypot(player.x-90,player.y-600)<25)player.key=true;document.querySelector("#quest").textContent=!player.key?"OBJECTIVE · Find the key":player.kills<5?`OBJECTIVE · Defeat guardians ${player.kills}/5`:"OBJECTIVE · Enter the castle";updateHud();
    ctx.clearRect(0, 0, w, h);ctx.fillStyle="#000";ctx.fillRect(0,0,w,h); const day=(Math.sin(time/14000)+1)/2;ctx.fillStyle=`rgb(${25+day*35},${55+day*55},${35+day*35})`;ctx.fillRect(cx-player.x,cy-player.y,800,700);
    ctx.strokeStyle = "#142631"; ctx.lineWidth = 1;ctx.strokeStyle="#d1be83";ctx.lineWidth=8;ctx.strokeRect(cx-player.x,cy-player.y,800,700);
    for (let x = ((-player.x % 32) + 32) % 32; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = ((-player.y % 32) + 32) % 32; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    trees.forEach(t=>{ctx.fillStyle="#6e4b2f";ctx.fillRect(cx+t.x-player.x-4,cy+t.y-player.y-5,8,16)});ctx.fillStyle="#56606b";ctx.fillRect(cx+650-player.x,cy+30-player.y,130,110);ctx.fillStyle=player.key?"#777":"#ffe56b";ctx.fillRect(cx+90-player.x,cy+600-player.y,14,5);foes.forEach(foe => {const x=cx+foe.x-player.x,y=cy+foe.y-player.y,s=1+Math.sin(foe.phase*4)*.15;ctx.fillStyle="rgba(0,0,0,.3)";ctx.fillRect(x-7,y+7,14,4);ctx.fillStyle=foe.color;ctx.fillRect(x-5*s,y-5/s,10*s,10/s);if(foe.hp<foe.maxHp){ctx.fillStyle="#190d12";ctx.fillRect(x-12,y-17,24,5);ctx.fillStyle="#ff5e78";ctx.fillRect(x-11,y-16,22*foe.hp/foe.maxHp,3)} });orbs.forEach(o=>{ctx.fillStyle="#bff";ctx.shadowColor="#bff";ctx.shadowBlur=10;ctx.fillRect(cx+o.x-player.x-3,cy+o.y-player.y-3,6,6);ctx.shadowBlur=0});shots.forEach(s=>{ctx.fillStyle="#ff9b5f";ctx.fillRect(cx+s.x-player.x-3,cy+s.y-player.y-3,6,6)});
    others.forEach(other => { ctx.fillStyle = "#fff"; ctx.fillRect(cx + other.x - player.x - 4, cy + other.y - player.y - 4, 8, 8); ctx.fillStyle="#9aa"; ctx.font="10px sans-serif"; ctx.fillText(`${other.className} · ${other.level}`, cx + other.x-player.x-18, cy+other.y-player.y-10); });
    ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(cx-8,cy+7,16,5);ctx.fillStyle = player.className === "warrior" ? "#ffb36b" : player.className === "rogue" ? "#9cff9c" : "#ae9cff"; ctx.fillRect(cx - 6, cy - 6, 12, 12);trees.forEach(t=>{const x=cx+t.x-player.x,y=cy+t.y-player.y,under=Math.hypot(t.x-player.x,t.y-player.y)<30;ctx.globalAlpha=under?.35:1;ctx.fillStyle="#255f39";ctx.fillRect(x-18,y-28,36,28);ctx.globalAlpha=1});ctx.fillStyle=`rgba(6,10,28,${.68-day*.68})`;ctx.fillRect(0,0,w,h);
    if (time - lastSync > 900 && player.className) { lastSync = time; sync(); }
    requestAnimationFrame(draw);
  }
  const key = event => { if (event.key === "ArrowUp" || event.key === "w") move(0,-1); if (event.key === "ArrowDown" || event.key === "s") move(0,1); if (event.key === "ArrowLeft" || event.key === "a") move(-1,0); if (event.key === "ArrowRight" || event.key === "d") move(1,0); if (event.code === "Space") attack(); };
  document.querySelectorAll("[data-class]").forEach(button => button.onclick = () => { player.className = button.dataset.class; document.querySelector("#creator").remove(); spawn(); updateHud(); });
  document.querySelectorAll("[data-move]").forEach(button => button.onclick = () => move(button.dataset.move === "left" ? -1 : button.dataset.move === "right" ? 1 : 0, button.dataset.move === "up" ? -1 : button.dataset.move === "down" ? 1 : 0));
  document.querySelector("#guide-open").onclick=()=>document.querySelector("#guide").classList.add("show");document.querySelector("#guide-close").onclick=()=>document.querySelector("#guide").classList.remove("show");document.querySelector("#attack").onclick = attack; addEventListener("keydown", key); addEventListener("resize", resize); resize(); requestAnimationFrame(draw);
  cleanup = () => { running = false; removeEventListener("keydown", key); removeEventListener("resize", resize); };
}
