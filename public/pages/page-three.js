let stopRoom = () => {};
export function render() {
  queueMicrotask(start);
  return `<section class="mini-app room-app"><div class="game-toolbar"><div><b>THREE ROOM</b><small>Explore · collect · shoot</small></div><b id="coin-count">0 / 12</b></div>
    <div class="game-stage room-stage"><canvas id="room-canvas"></canvas><div class="room-controls"><div class="joystick" id="joystick"><i></i></div><div class="three-buttons"><button id="jump">JUMP</button><button id="run">RUN</button><button id="shoot">SHOOT</button></div></div></div></section>`;
}
function start() {
  stopRoom();
  const canvas=document.querySelector("#room-canvas"); if(!canvas)return; const ctx=canvas.getContext("2d");
  let running=true, keys={}, joy={x:0,y:0}, hero={x:150,y:320,z:0,vz:0,coins:0}, shots=[], particles=[];
  const coins=Array.from({length:12},(_,i)=>({x:80+(i%4)*170,y:120+Math.floor(i/4)*170,taken:false}));
  function resize(){canvas.width=canvas.clientWidth*devicePixelRatio;canvas.height=canvas.clientHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
  function shoot(){shots.push({x:hero.x,y:hero.y,life:45});for(let i=0;i<8;i++)particles.push({x:hero.x,y:hero.y,vx:Math.random()*4-2,vy:Math.random()*4-2,life:20})}
  function frame(){if(!running)return;const w=canvas.clientWidth,h=canvas.clientHeight,speed=(keys.Shift||keys.run)?5:2.6;hero.x+=(joy.x+(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0))*speed;hero.y+=(joy.y+(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0))*speed;hero.x=Math.max(20,Math.min(660,hero.x));hero.y=Math.max(20,Math.min(480,hero.y));hero.vz-=.45;hero.z=Math.max(0,hero.z+hero.vz);if(hero.z===0)hero.vz=0;
    coins.forEach(c=>{if(!c.taken&&Math.hypot(c.x-hero.x,c.y-hero.y)<22){c.taken=true;hero.coins++;document.querySelector("#coin-count").textContent=`${hero.coins} / 12`;for(let i=0;i<12;i++)particles.push({x:c.x,y:c.y,vx:Math.random()*5-2.5,vy:Math.random()*5-2.5,life:30})}});
    shots.forEach(s=>{s.x+=9;s.life--});shots=shots.filter(s=>s.life>0);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life--});particles=particles.filter(p=>p.life>0);
    ctx.clearRect(0,0,w,h);let g=ctx.createRadialGradient(w/2,h/2,20,w/2,h/2,w);g.addColorStop(0,"#24333b");g.addColorStop(1,"#080b0e");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);const scale=Math.min(w/720,h/520),ox=(w-720*scale)/2,oy=(h-520*scale)/2;ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
    ctx.fillStyle="#172129";ctx.fillRect(20,20,660,480);ctx.strokeStyle="#38505d";ctx.lineWidth=8;ctx.strokeRect(20,20,660,480);ctx.beginPath();ctx.moveTo(240,20);ctx.lineTo(240,220);ctx.moveTo(460,300);ctx.lineTo(460,500);ctx.stroke();
    coins.forEach(c=>{if(!c.taken){ctx.fillStyle="#ffd76b";ctx.beginPath();ctx.arc(c.x,c.y,7,0,7);ctx.fill();ctx.shadowColor="#ffd76b";ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0}});
    shots.forEach(s=>{ctx.fillStyle="#8cecff";ctx.fillRect(s.x,s.y-2,12,4)});particles.forEach(p=>{ctx.fillStyle=`rgba(140,236,255,${p.life/30})`;ctx.fillRect(p.x,p.y,3,3)});
    ctx.fillStyle="rgba(0,0,0,.45)";ctx.beginPath();ctx.ellipse(hero.x,hero.y+8,15,7,0,0,7);ctx.fill();ctx.fillStyle="#9be7ff";ctx.fillRect(hero.x-8,hero.y-18-hero.z,16,25);ctx.fillStyle="#e5fbff";ctx.fillRect(hero.x-5,hero.y-25-hero.z,10,8);ctx.restore();requestAnimationFrame(frame)}
  const joystick=document.querySelector("#joystick"),nub=joystick.querySelector("i");function point(e){const r=joystick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,m=Math.min(35,Math.hypot(x,y)),a=Math.atan2(y,x);joy={x:Math.cos(a)*m/35,y:Math.sin(a)*m/35};nub.style.transform=`translate(${joy.x*28}px,${joy.y*28}px)`}joystick.onpointerdown=e=>{joystick.setPointerCapture(e.pointerId);point(e)};joystick.onpointermove=e=>{if(joystick.hasPointerCapture(e.pointerId))point(e)};joystick.onpointerup=()=>{joy={x:0,y:0};nub.style.transform=""};
  document.querySelector("#jump").onclick=()=>{if(hero.z===0)hero.vz=8};document.querySelector("#run").onpointerdown=()=>keys.run=true;document.querySelector("#run").onpointerup=()=>keys.run=false;document.querySelector("#shoot").onclick=shoot;const kd=e=>keys[e.key]=true,ku=e=>keys[e.key]=false;addEventListener("keydown",kd);addEventListener("keyup",ku);addEventListener("resize",resize);resize();requestAnimationFrame(frame);stopRoom=()=>{running=false;removeEventListener("keydown",kd);removeEventListener("keyup",ku);removeEventListener("resize",resize)};
}
