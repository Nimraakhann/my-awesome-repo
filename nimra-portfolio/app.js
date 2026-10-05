import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/UnrealBloomPass.js';

const canvas = document.querySelector('#world');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;
const sections = [...document.querySelectorAll('.chapter')];
const navButtons = [...document.querySelectorAll('[data-chapter]')].filter(el=>el.matches('button'));
const label = document.querySelector('#chapterLabel');
const progressBar = document.querySelector('#progress span');
const boot = document.querySelector('#boot');
const bootBar = document.querySelector('#bootBar');
const bootCopy = document.querySelector('#bootCopy');
const panel = document.querySelector('#panel');
const panelInner = document.querySelector('#panelInner');
const resume = document.querySelector('#resume');
const cursor = document.querySelector('#cursor');

if (!isTouch) document.body.classList.add('has-pointer');

const CHAPTERS = [
  {name:'Origin', pos:[0,1.2,10.8], look:[0,0,-4]},
  {name:'Foundation', pos:[0,1.4,-15], look:[0,0,-27]},
  {name:'QA Lab', pos:[9,2.1,-43], look:[0,0,-55]},
  {name:'Vision', pos:[-10,2.6,-73], look:[0,-1,-87]},
  {name:'Builds', pos:[0,2.5,-108], look:[0,0,-122]},
  {name:'Contact', pos:[0,3,-145], look:[0,0,-158]}
];

const panels = {
  education:{kicker:'FOUNDATION',title:'Software Engineering',body:'A strong engineering foundation shaped how I approach everything else: define the system, understand constraints, build deliberately, then test what was actually built.',bullets:['BS Software Engineering · COMSATS University Islamabad, Wah Campus','CGPA 3.89','Strong overlap across software, databases, web, AI and product work']},
  fyp:{kicker:'FINAL YEAR PROJECT',title:'Retail Vista',body:'A smart-retail computer-vision platform designed to turn live store activity into useful operational signals.',bullets:['Shoplifting detection using YOLOv8-seg','People counting with YOLOv11','Age/gender estimation','Promotions, alerts, map and recent activity modules']},
  award:{kicker:'MILESTONE',title:'2nd Place — Open House',body:'Retail Vista placed second at the university Open House, validating both the engineering work and the clarity of the product idea.',bullets:['Built as a two-person FYP team','End-to-end platform rather than a single ML demo','Combined model inference with a usable product interface']},
  qa:{kicker:'QA CASE FILE',title:'Quality as investigation',body:'The strongest QA work happens beyond the visible UI. I trace flows, compare expected and actual behavior, document reproducible evidence and keep regression risk in view.',bullets:['Mobile + web functional testing','Regression, smoke, sanity and UI/UX checks','Accessibility checks using WCAG-oriented review','Playwright exposure for browser automation','Clear defect reporting with steps, evidence and expected vs actual results']},
  retail:{kicker:'COMPUTER VISION',title:'Retail Vista',body:'The project combined multiple models and product modules into a single retail-monitoring experience. The shoplifting detector used segmentation and temporal alert logic to reduce noisy one-frame decisions.',bullets:['YOLOv8-seg shoplifting model','Precision 0.863 · Recall 0.840','mAP@50 0.896 · mAP@50–95 0.837','Dynamic alert buffering and cooldown logic','React/Vite frontend + Django/MySQL backend']}
};

function openPanel(key){
  const p=panels[key]; if(!p) return;
  panelInner.innerHTML=`<div class="kicker">${p.kicker}</div><h3>${p.title}</h3><p>${p.body}</p><ul>${p.bullets.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  panel.showModal();
}

document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.panel)));
document.querySelector('#panelClose').addEventListener('click',()=>panel.close());
document.querySelectorAll('[data-open="resume"]').forEach(b=>b.addEventListener('click',()=>resume.showModal()));
document.querySelector('#resumeClose').addEventListener('click',()=>resume.close());

const projectMap={retail:'retail',qa:'qa',web:'education'};
document.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>openPanel(projectMap[b.dataset.project])));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>sections[Number(b.dataset.go)]?.scrollIntoView({behavior:reduced?'auto':'smooth'})));
navButtons.forEach(b=>b.addEventListener('click',()=>sections[Number(b.dataset.chapter)]?.scrollIntoView({behavior:reduced?'auto':'smooth'})));

let scene,camera,renderer,composer,clock,raycaster,mouse,worldRoot,interactive=[];
let currentChapter=0, scrollT=0, targetScrollT=0, pointerX=0,pointerY=0,dragX=0,dragY=0;
let ambientOn=false,audioCtx=null,osc=null,gain=null;

function mat(color,opts={}){return new THREE.MeshStandardMaterial({color,metalness:opts.metalness??.35,roughness:opts.roughness??.5,transparent:opts.transparent??false,opacity:opts.opacity??1,emissive:opts.emissive??0x000000,emissiveIntensity:opts.emissiveIntensity??0});}
function lineMat(color,opacity=.5){return new THREE.LineBasicMaterial({color,transparent:true,opacity});}
function addBox(parent,size,pos,color,opts={}){const g=new THREE.BoxGeometry(...size);const m=mat(color,opts);const mesh=new THREE.Mesh(g,m);mesh.position.set(...pos);parent.add(mesh);return mesh;}
function textPlane(parent,label,pos,scale=.7,color='#f4f1ea'){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.font='600 88px Inter, sans-serif';x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';x.fillText(label,c.width/2,c.height/2);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false});const p=new THREE.Mesh(new THREE.PlaneGeometry(5.8,1.45),m);p.position.set(...pos);p.scale.setScalar(scale);parent.add(p);return p;
}
function frame(parent,w,h,pos,color=0xd8ff62){
  const pts=[new THREE.Vector3(-w/2,-h/2,0),new THREE.Vector3(w/2,-h/2,0),new THREE.Vector3(w/2,h/2,0),new THREE.Vector3(-w/2,h/2,0),new THREE.Vector3(-w/2,-h/2,0)];
  const geo=new THREE.BufferGeometry().setFromPoints(pts);const l=new THREE.Line(geo,lineMat(color,.8));l.position.set(...pos);parent.add(l);return l;
}

function makeOrigin(){
  const g=new THREE.Group();g.position.z=-3;worldRoot.add(g);
  const torus=new THREE.Mesh(new THREE.TorusKnotGeometry(2.35,.12,160,18,2,5),mat(0x9f8cff,{metalness:.85,roughness:.18,emissive:0x160d30,emissiveIntensity:1.5}));g.add(torus);torus.userData.spin=.12;
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.15,2),mat(0x10131b,{metalness:.8,roughness:.22,emissive:0xd8ff62,emissiveIntensity:.12}));g.add(core);core.userData.spin=-.08;
  for(let i=0;i<28;i++){const a=i/28*Math.PI*2;const r=4.8+(i%3)*.42;addBox(g,[.035,.035,.7],[Math.cos(a)*r,Math.sin(a)*r*.55,Math.sin(a)*1.2],0x6e6b76,{emissive:0x201f28,emissiveIntensity:.6}).rotation.z=a;}
  textPlane(g,'NIMRA KHAN',[0,-4.1,.3],.95);
}
function makeFoundation(){
  const g=new THREE.Group();g.position.z=-28;worldRoot.add(g);
  const floor=new THREE.GridHelper(34,34,0x353844,0x171a20);floor.rotation.x=0;floor.position.y=-3;g.add(floor);
  for(let i=0;i<18;i++){
    const x=(i%6-2.5)*2.1,y=Math.floor(i/6)*1.9-1.4,z=-Math.floor(i/6)*1.6;
    const b=addBox(g,[1.25,1.25,1.25],[x,y,z],i%3===0?0x2c3140:0x151820,{metalness:.6,roughness:.3});b.rotation.set(.12*i,.08*i,.04*i);b.userData.float=.2+i*.03;
  }
  const pillar=addBox(g,[.2,9,.2],[0,1,-6],0xd8ff62,{emissive:0xd8ff62,emissiveIntensity:1.8});pillar.userData.pulse=true;
  textPlane(g,'ENGINEERING → SYSTEMS → AI',[0,5,-5],.58,'#d8ff62');
}
function makeQALab(){
  const g=new THREE.Group();g.position.set(0,0,-56);worldRoot.add(g);
  const floor=new THREE.GridHelper(34,24,0x253142,0x111820);floor.position.y=-3;g.add(floor);
  for(let i=0;i<5;i++){
    const x=(i-2)*3.4;const screen=addBox(g,[2.45,1.5,.12],[x,1.2,-2+(i%2)*.6],0x111722,{metalness:.2,roughness:.25,emissive:i===2?0x8de8ff:0x171d28,emissiveIntensity:i===2?1.6:.4});
    frame(g,2.12,1.16,[x,1.2,-1.92+(i%2)*.6],i===2?0x8de8ff:0x5b6170);
    const stem=addBox(g,[.12,1.6,.12],[x,-.15,-2+(i%2)*.6],0x353b47);stem.rotation.z=0;
  }
  for(let i=0;i<42;i++){
    const z=-9+i*.42;const side=i%2?1:-1;const dot=addBox(g,[.05,.05,.05],[side*(5+Math.sin(i)*1.7),-1+Math.cos(i*.6)*2,z],i%7===0?0xff6f88:0x6f7c8d,{emissive:i%7===0?0xff173f:0x1c2734,emissiveIntensity:1.1});dot.userData.drift=.2+i*.005;
  }
  textPlane(g,'REPRODUCE · ISOLATE · VERIFY',[0,5,-7],.5,'#8de8ff');
}
function makeVision(){
  const g=new THREE.Group();g.position.set(0,0,-88);worldRoot.add(g);
  const floor=new THREE.GridHelper(40,26,0x3a2740,0x16121a);floor.position.y=-3;g.add(floor);
  const silhouettes=[];
  for(let i=0;i<8;i++){
    const x=(i%4-1.5)*3.8,y=-.8,z=-Math.floor(i/4)*6+(i%2)*1.1;
    const person=new THREE.Group();person.position.set(x,y,z);g.add(person);silhouettes.push(person);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.55,20,20),mat(0x20232a,{roughness:.75}));head.position.y=2.25;person.add(head);
    addBox(person,[1.05,2.45,.7],[0,.6,0],0x171a21,{roughness:.7});
    frame(person,2.2,4.1,[0,.9,.48],i===3?0xff6f88:0xd8ff62);
  }
  for(let i=0;i<12;i++){const p=frame(g,1.6+(i%3)*.5,1.2+(i%2)*.7,[(i%4-1.5)*4.2,3+(i%3)*1.2,-4-Math.floor(i/4)*2.5],i%4===0?0xff6f88:0xd8ff62);p.userData.scan=.3+i*.05;}
  const scan=new THREE.Mesh(new THREE.PlaneGeometry(22,.04),new THREE.MeshBasicMaterial({color:0xd8ff62,transparent:true,opacity:.7,side:THREE.DoubleSide}));scan.position.set(0,4,2);g.add(scan);scan.userData.scanPlane=true;
  textPlane(g,'COMPUTER VISION',[0,7,-5],.72,'#d8ff62');
}
function makeBuilds(){
  const g=new THREE.Group();g.position.set(0,0,-122);worldRoot.add(g);
  const names=['RETAIL VISTA','QA SYSTEMS','CLIENT BUILDS'];
  const colors=[0xd8ff62,0x8de8ff,0x9f8cff];
  names.forEach((n,i)=>{
    const a=i/3*Math.PI*2-.2;const p=new THREE.Group();p.position.set(Math.cos(a)*6,Math.sin(a)*2.2,Math.sin(a)*5);g.add(p);
    const orb=new THREE.Mesh(new THREE.SphereGeometry(1.35,32,32),mat(colors[i],{metalness:.6,roughness:.25,emissive:colors[i],emissiveIntensity:.22}));p.add(orb);orb.userData.project=['retail','qa','web'][i];interactive.push(orb);p.userData.orbit=a;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.1,.035,8,90),new THREE.MeshBasicMaterial({color:colors[i],transparent:true,opacity:.5}));ring.rotation.x=Math.PI/2.4;p.add(ring);
    textPlane(p,n,[0,-2.5,0],.34,'#f4f1ea');
  });
  const starGeo=new THREE.BufferGeometry();const pts=[];for(let i=0;i<450;i++)pts.push((Math.random()-.5)*30,(Math.random()-.5)*18,(Math.random()-.5)*26);starGeo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xb7b3c5,size:.035,transparent:true,opacity:.65}));g.add(stars);
}
function makeContact(){
  const g=new THREE.Group();g.position.set(0,0,-158);worldRoot.add(g);
  for(let i=0;i<9;i++){const y=(i-4)*1.1;const l=addBox(g,[16,.02,.02],[0,y,-4-i*.35],i===4?0xd8ff62:0x3a3c45,{emissive:i===4?0xd8ff62:0x000000,emissiveIntensity:i===4?1.6:0});l.rotation.z=(i-4)*.025;}
  const portal=new THREE.Mesh(new THREE.TorusGeometry(4.2,.08,12,120),mat(0xd8ff62,{emissive:0xd8ff62,emissiveIntensity:1.4,metalness:.5,roughness:.2}));portal.rotation.x=Math.PI/2;portal.position.z=-6;g.add(portal);portal.userData.spin=.08;
  textPlane(g,'NEXT CHAPTER?',[0,0,-9],.78,'#d8ff62');
}
function makeTunnel(){
  const group=new THREE.Group();worldRoot.add(group);
  for(let i=0;i<75;i++){
    const z=8-i*2.35;const s=8+(i%7)*.08;const ring=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s,s*.64,.02)),lineMat(i%9===0?0x50556a:0x232632,i%9===0?.33:.18));ring.position.z=z;ring.rotation.z=(i%2?1:-1)*.015*i;group.add(ring);
  }
}

function init(){
  bootBar.style.width='18%';bootCopy.textContent='Constructing spatial story…';
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x06070b,.018);
  camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,240);camera.position.set(...CHAPTERS[0].pos);
  renderer=new THREE.WebGLRenderer({canvas,antialias:!isTouch,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.3:1.75));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  scene.add(new THREE.HemisphereLight(0x9fb9ff,0x0b0910,1.35));
  const key=new THREE.PointLight(0xd8ff62,16,32,2);key.position.set(4,6,2);scene.add(key);
  const fill=new THREE.PointLight(0x9f8cff,18,45,2);fill.position.set(-8,5,-55);scene.add(fill);
  const blue=new THREE.PointLight(0x8de8ff,15,40,2);blue.position.set(9,5,-96);scene.add(blue);
  worldRoot=new THREE.Group();scene.add(worldRoot);
  bootBar.style.width='42%';bootCopy.textContent='Building environments…';
  makeTunnel();makeOrigin();makeFoundation();makeQALab();makeVision();makeBuilds();makeContact();
  composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));if(!isTouch&&!reduced){const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.46,.45,.92);composer.addPass(bloom);}
  raycaster=new THREE.Raycaster();mouse=new THREE.Vector2();clock=new THREE.Clock();
  bind3D();
  bootBar.style.width='82%';bootCopy.textContent='Calibrating interaction…';
  setTimeout(()=>{bootBar.style.width='100%';bootCopy.textContent='Ready.';setTimeout(()=>boot.classList.add('is-done'),280)},220);
  animate();
}

function bind3D(){
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight)});
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('pointermove',e=>{pointerX=(e.clientX/innerWidth-.5)*2;pointerY=(e.clientY/innerHeight-.5)*2;mouse.set(pointerX,-pointerY);if(cursor){cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'};raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(interactive,false)[0];document.body.classList.toggle('cursor-active',!!hit);canvas.style.cursor=hit?'pointer':'default';},{passive:true});
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture?.(e.pointerId);canvas.dataset.px=e.clientX;canvas.dataset.py=e.clientY});
  canvas.addEventListener('pointermove',e=>{if(!canvas.hasPointerCapture?.(e.pointerId))return;const dx=e.clientX-Number(canvas.dataset.px||e.clientX),dy=e.clientY-Number(canvas.dataset.py||e.clientY);dragX=Math.max(-1,Math.min(1,dragX+dx*.002));dragY=Math.max(-.55,Math.min(.55,dragY+dy*.002));canvas.dataset.px=e.clientX;canvas.dataset.py=e.clientY;});
  canvas.addEventListener('pointerup',e=>{if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(interactive,false)[0];if(hit?.object?.userData.project) openPanel(projectMap[hit.object.userData.project]);});
  onScroll();
}

function onScroll(){
  const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);targetScrollT=scrollY/max;
  progressBar.style.width=(targetScrollT*100)+'%';
  let best=0,bestDist=Infinity;sections.forEach((s,i)=>{const r=s.getBoundingClientRect();const d=Math.abs(r.top-innerHeight*.22);if(d<bestDist){best=i;bestDist=d}});if(best!==currentChapter){currentChapter=best;updateChapterUI();}
}
function updateChapterUI(){
  navButtons.forEach((b,i)=>b.classList.toggle('is-active',i===currentChapter));
  label.innerHTML=`<span>0${currentChapter+1}</span><b>${CHAPTERS[currentChapter].name}</b>`;
}
function getCameraState(t){
  const n=CHAPTERS.length-1;const scaled=Math.min(n-1e-5,Math.max(0,t*n));const i=Math.floor(scaled);const f=scaled-i;const smooth=f*f*(3-2*f);const a=CHAPTERS[i],b=CHAPTERS[Math.min(n,i+1)];
  const pos=new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos),smooth);const look=new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look),smooth);return{pos,look};
}
function animate(){
  requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);scrollT+= (targetScrollT-scrollT)*(reduced?1:Math.min(1,dt*4.2));
  const state=getCameraState(scrollT);camera.position.lerp(state.pos,.08);const parallaxX=(pointerX+dragX)*(isTouch?.14:.38),parallaxY=(pointerY+dragY)*(isTouch?.08:.22);camera.position.x+=parallaxX;camera.position.y-=parallaxY;
  const look=state.look.clone();look.x+=parallaxX*.7;look.y-=parallaxY*.45;camera.lookAt(look);
  const t=performance.now()*.001;
  scene.traverse(o=>{if(o.userData.spin)o.rotation.y+=o.userData.spin*dt;if(o.userData.float)o.position.y+=Math.sin(t*1.5+o.id)*o.userData.float*.002;if(o.userData.pulse&&o.material)o.material.emissiveIntensity=1.3+Math.sin(t*3)*.55;if(o.userData.drift)o.rotation.z+=o.userData.drift*dt*.05;if(o.userData.scan)o.position.x+=Math.sin(t*1.2+o.id)*.002;if(o.userData.scanPlane){o.position.y=-1+((t*1.6)%7);o.material.opacity=.25+.45*Math.sin((t%1)*Math.PI)}});
  composer.render();
}

function toggleAmbient(){
  ambientOn=!ambientOn;const btn=document.querySelector('#soundToggle');btn.setAttribute('aria-pressed',String(ambientOn));btn.textContent=ambientOn?'●':'◌';
  if(ambientOn){audioCtx??=new (window.AudioContext||window.webkitAudioContext)();osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.type='sine';osc.frequency.value=54;gain.gain.value=.015;osc.connect(gain).connect(audioCtx.destination);osc.start();}else if(osc){gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.18);osc.stop(audioCtx.currentTime+.2);osc=null;}
}
document.querySelector('#soundToggle').addEventListener('click',toggleAmbient);

try{init()}catch(err){console.error(err);boot.classList.add('is-done');document.querySelector('#fallback').hidden=false;canvas.style.display='none';}
