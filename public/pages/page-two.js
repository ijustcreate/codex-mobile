let stopCamera = () => {};
export function render() {
  queueMicrotask(start);
  return `<section class="mini-app studio-app"><div class="game-toolbar"><div><b>STOP MOTION STUDIO</b><small>Camera frames stay on this device</small></div><b id="frame-count">0 FRAMES</b></div>
    <div class="studio-options"><label>Video layer<input id="video-file" type="file" accept="video/*" hidden></label><button data-grid="">No grid</button><button data-grid="thirds">Thirds</button><button data-grid="center">Center</button><button id="save-local">Save local</button><button id="load-local">Load local</button></div>
    <div class="studio-view"><video id="reference" class="video-layer" playsinline loop muted></video><video id="camera" autoplay playsinline muted></video><canvas id="onion"></canvas><div class="grid-overlay" id="grid"></div><div class="camera-message" id="camera-message">Tap start camera</div></div>
    <div class="studio-controls"><button id="camera-start">Start camera</button><button id="capture" class="primary-button">Capture frame</button><button id="onion-back">Onion back</button><button id="onion-forward">Onion forward</button><button id="play">Play</button><button id="clear">Clear</button></div>
    <div class="timeline" id="timeline"></div></section>`;
}
function start() {
  stopCamera();
  const video = document.querySelector("#camera"), onion = document.querySelector("#onion"), timeline = document.querySelector("#timeline");
  if (!video) return;
  let stream, frames = [], timer;
  const update = () => { document.querySelector("#frame-count").textContent = `${frames.length} FRAME${frames.length === 1 ? "" : "S"}`; timeline.innerHTML = frames.map((src,i)=>`<img src="${src}" alt="Frame ${i+1}">`).join(""); };
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
  document.querySelectorAll("[data-grid]").forEach(b=>b.onclick=()=>document.querySelector("#grid").className=`grid-overlay ${b.dataset.grid}`);
  document.querySelector("#video-file").onchange=e=>{const v=document.querySelector("#reference");v.src=URL.createObjectURL(e.target.files[0]);v.play()};
  let onionIndex=-1;const showOnion=step=>{if(!frames.length)return;onionIndex=Math.max(0,Math.min(frames.length-1,onionIndex<0?frames.length-1:onionIndex+step));const image=new Image();image.onload=()=>{onion.width=image.width;onion.height=image.height;onion.getContext("2d").drawImage(image,0,0);onion.style.opacity=".3"};image.src=frames[onionIndex]};
  document.querySelector("#onion-back").onclick=()=>showOnion(-1);document.querySelector("#onion-forward").onclick=()=>showOnion(1);
  stopCamera=()=>{ clearInterval(timer); stream?.getTracks().forEach(track=>track.stop()); };
}
