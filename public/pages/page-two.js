let stopCamera = () => {};
export function render() {
  queueMicrotask(start);
  return `<section class="mini-app studio-app"><div class="game-toolbar"><div><b>STOP MOTION STUDIO</b><small>Camera frames stay on this device</small></div><b id="frame-count">0 FRAMES</b></div>
    <div class="studio-options"><label>Video layer<input id="video-file" type="file" accept="video/*" hidden></label><button data-grid="">No grid</button><button data-grid="thirds">Thirds</button><button data-grid="center">Center</button><button id="save-local">Save local</button><button id="load-local">Load local</button></div>
    <div class="studio-view"><video id="reference" class="video-layer" playsinline loop muted></video><video id="camera" autoplay playsinline muted></video><canvas id="onion"></canvas><div class="grid-overlay" id="grid"></div><div class="camera-message" id="camera-message">Tap start camera</div></div>
    <div class="studio-controls"><button id="camera-start">Start camera</button><button id="capture" class="primary-button">Capture frame</button><button id="onion-back">Onion back</button><button id="onion-forward">Onion forward</button><button id="play">Play</button><button id="save-site">Save website</button><button id="load-site">Load website</button><button id="insert">Duplicate selected</button><button id="delete-frame">Delete selected</button><button id="draw-frame">Draw on selected</button><button id="clear">Clear</button></div>
    <div class="timeline" id="timeline"></div></section>`;
}
function start() {
  stopCamera();
  const video = document.querySelector("#camera"), onion = document.querySelector("#onion"), timeline = document.querySelector("#timeline");
  if (!video) return;
  let stream, frames = [], timer,selected=0;
  const update = () => { document.querySelector("#frame-count").textContent = `${frames.length} FRAME${frames.length === 1 ? "" : "S"}`; timeline.innerHTML = frames.map((src,i)=>`<img class="${i===selected?"selected":""}" data-frame="${i}" src="${src}" alt="Frame ${i+1}">`).join("");timeline.querySelectorAll("img").forEach(img=>img.onclick=()=>{selected=Number(img.dataset.frame);update()}); };
  document.querySelector("#camera-start").onclick = async () => {
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }); video.srcObject = stream; document.querySelector("#camera-message").remove(); }
    catch { document.querySelector("#camera-message").textContent = "Camera permission is needed."; }
  };
  document.querySelector("#capture").onclick = () => {
    if (!video.videoWidth) return;
    const c = document.createElement("canvas"); c.width = video.videoWidth; c.height = video.videoHeight; c.getContext("2d").drawImage(video,0,0); frames.push(c.toDataURL("image/jpeg",.72));
    onion.width=c.width; onion.height=c.height; onion.getContext("2d").drawImage(c,0,0); onion.style.opacity=".3"; update();
  };
  document.querySelector("#play").onclick = () => { if (!frames.length) return; clearInterval(timer); onion.style.opacity="1"; let i=0; timer=setInterval(()=>{ const image=new Image(); image.onload=()=>{ onion.width=image.width; onion.height=image.height; onion.getContext("2d").drawImage(image,0,0); }; image.src=frames[i++%frames.length]; },180); };
  document.querySelector("#clear").onclick = () => { clearInterval(timer); frames=[]; onion.getContext("2d").clearRect(0,0,onion.width,onion.height); update(); };
  document.querySelector("#save-local").onclick=()=>{localStorage.setItem("stop-motion-frames",JSON.stringify(frames));};
  document.querySelector("#load-local").onclick=()=>{frames=JSON.parse(localStorage.getItem("stop-motion-frames")||"[]");update();};
  document.querySelector("#save-site").onclick=()=>{if(location.hostname.endsWith("github.io"))localStorage.setItem("stop-motion-site-frames",JSON.stringify(frames));else fetch("/api/stop-motion",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({frames})})};
  document.querySelector("#load-site").onclick=async()=>{frames=location.hostname.endsWith("github.io")?JSON.parse(localStorage.getItem("stop-motion-site-frames")||"[]"):(await fetch("/api/stop-motion").then(r=>r.json())).frames;update()};
  document.querySelector("#delete-frame").onclick=()=>{frames.splice(selected,1);selected=Math.max(0,selected-1);update()};
  document.querySelector("#insert").onclick=()=>{if(frames[selected])frames.splice(selected,0,frames[selected]);update()};
  document.querySelector("#draw-frame").onclick=()=>{if(!frames[selected])return;const image=new Image();image.onload=()=>{const c=document.createElement("canvas");c.width=image.width;c.height=image.height;const x=c.getContext("2d");x.drawImage(image,0,0);x.strokeStyle="#ff4f80";x.lineWidth=Math.max(4,c.width/100);x.beginPath();x.arc(c.width/2,c.height/2,Math.min(c.width,c.height)/5,0,7);x.stroke();frames[selected]=c.toDataURL("image/jpeg",.8);update()};image.src=frames[selected]};
  document.querySelectorAll("[data-grid]").forEach(b=>b.onclick=()=>document.querySelector("#grid").className=`grid-overlay ${b.dataset.grid}`);
  document.querySelector("#video-file").onchange=e=>{const v=document.querySelector("#reference");v.src=URL.createObjectURL(e.target.files[0]);v.play()};
  let onionIndex=-1;const showOnion=step=>{if(!frames.length)return;onionIndex=Math.max(0,Math.min(frames.length-1,onionIndex<0?frames.length-1:onionIndex+step));const image=new Image();image.onload=()=>{onion.width=image.width;onion.height=image.height;onion.getContext("2d").drawImage(image,0,0);onion.style.opacity=".3"};image.src=frames[onionIndex]};
  document.querySelector("#onion-back").onclick=()=>showOnion(-1);document.querySelector("#onion-forward").onclick=()=>showOnion(1);
  stopCamera=()=>{ clearInterval(timer); stream?.getTracks().forEach(track=>track.stop()); };
}
