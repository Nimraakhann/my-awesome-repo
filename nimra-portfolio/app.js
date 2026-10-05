import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/+esm';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/EffectComposer.js/+esm';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/RenderPass.js/+esm';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/UnrealBloomPass.js/+esm';

const canvas=document.querySelector('#world');
const sections=[...document.querySelectorAll('.chapter')];
const navButtons=[...document.querySelectorAll('.hud__dot')];
const label=document.querySelector('#chapterLabel');
const progressBar=document.querySelector('#progress span');
const boot=document.querySelector('#boot');
const bootBar=document.querySelector('#bootBar');
const bootCopy=document.querySelector('#bootCopy');
const panel=document.querySelector('#panel');
const panelInner=document.querySelector('#panelInner');
const resume=document.querySelector('#resume');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch=matchMedia('(pointer: coarse)').matches;
const cursor=document.querySelector('#cursor');
if(!isTouch)document.body.classList.add('has-pointer');

const CHAPTERS=[
{name:'Origin',pos:[0,1.5,11],look:[0,0,-2]},
{name:'Foundation',pos:[0,2,-17],look:[0,0,-29]},
{name:'ML / CV',pos:[8,2,-48],look:[0,0,-61]},
{name:'Retail Vista',pos:[-8,3,-82],look:[0,0,-96]},
{name:'QA',pos:[9,2,-118],look:[0,0,-132]},
{name:'Builds',pos:[-8,2,-153],look:[0,0,-167]},
{name:'Contact',pos:[0,2,-190],look:[0,0,-203]}
];

const panels={
education:{kicker:'FOUNDATION',title:'BS Software Engineering',body:'My degree gave me the engineering base behind everything else: programming, databases, web systems, software design and the ability to reason about a system as a whole.',bullets:['COMSATS University Islamabad · Wah Campus','CGPA 3.89','Graduated with a strong software engineering foundation','Built across frontend, backend, databases and AI-oriented coursework']},
ml:{kicker:'ML / COMPUTER VISION',title:'Learning to make software see',body:'Before moving into QA, I was already working with computer vision. My ML internship and later project work focused on object detection, OpenCV, YOLO pipelines and model evaluation.',bullets:['ML Intern · Codic Solution','YOLOv8m detection work with mAP@50 around 94.4% on internship project','Python + OpenCV for image/video processing','Worked with dataset preparation, labels, training, inference and metrics','Built the foundation that later became Retail Vista']},
retail:{kicker:'FULL CASE STUDY',title:'Retail Vista · Smart Retail CV Platform',body:'Retail Vista is an end-to-end smart-retail platform, not just a model demo. It combines multiple computer-vision modules with a web application, alert logic, analytics and store-facing workflows.',bullets:['Shoplifting detection: YOLOv8-seg trained on a custom Roboflow instance-segmentation dataset','Final shoplifting metrics: Precision 0.863 · Recall 0.840 · mAP@50 0.896 · mAP@50–95 0.837','People counting: YOLOv11','Age & gender: custom CNN + Caffe age model','Frontend: React + Vite + Tailwind','Backend: Django + MySQL on Oracle VM','Inference used RunPod A40 GPU','Alert system used buffering + cooldown logic instead of firing from one frame','Dynamic buffer roughly 3–10s with multiple threshold paths / early alerts','Included map, promotions and recent-activity modules','Placed 2nd at the university Open House']},
qa:{kicker:'QA ENGINEERING',title:'Production quality across mobile + web',body:'At CitrusBits I shifted closer to product quality. The work was about real user flows and real regressions: reproduce issues, isolate conditions, record evidence, communicate clearly and verify fixes across platforms.',bullets:['QA Engineer after internship-to-full-time progression','Tested iOS, Android and web experiences','Functional, regression, smoke, sanity and UI/UX testing','Accessibility checks using a WCAG-oriented checklist','Documented defects with reproducible steps, expected vs actual behavior and evidence','Worked on client product flows including Rubio’s','Used Playwright exposure for browser automation and test exploration','Learned to think beyond the visible UI and follow state, permissions and saved data']},
builds:{kicker:'CURRENT BUILDS',title:'Coderaxo + freelance delivery',body:'My newer work combines engineering, product thinking and client delivery. The common thread is taking a business need, shaping the solution, building it and getting it live.',bullets:['Coderaxo · technical lead / product and delivery work','Web builds for local and international clients','Technical + on-page SEO implementations','AI support/chatbot integration','Data-analysis work including real-estate dashboards and macroeconomic modeling','Website redesigns, deployment and client communication','Strong focus on shipping practical outcomes, not just prototypes']}
};

function openPanel(key){
 const p=panels[key]; if(!p)return;
 panelInner.innerHTML=`<div class="kicker">${p.kicker}</div><h3>${p.title}</h3><p>${p.body}</p><ul>${p.bullets.map(x=>`<li>${x}</li>`).join('')}</ul>`;
 panel.showModal();
}
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.panel)));
document.querySelector('#panelClose').addEventListener('click',()=>panel.close());
document.querySelectorAll('[data-open="resume"]').forEach(b=>b.addEventListener('click',()=>resume.showModal()));
document.querySelector('#resumeClose').addEventListener('click',()=>resume.close());
const projectMap={retail:'retail',qa:'qa',builds:'builds',ml:'ml'};
document.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>openPanel(projectMap[b.dataset.project])));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>sections[Number(b.dataset.go)]?.scrollIntoView({behavior:reduced?'auto':'smooth'})));
navButtons.forEach(b=>b.addEventListener('click',()=>sections[Number(b.dataset.chapter)]?.scrollIntoView({behavior:reduced?'auto':'smooth'})));

let scene,camera,renderer,composer,clock,raycaster,mouse,root;
let interactive=[],currentChapter=0,targetScrollT=0,scrollT=0,pointerX=0,pointerY=0,dragX=0,dragY=0;

function std(c,o={}){return new THREE.MeshStandardMaterial({color:c,metalness:o.metalness??.35,roughness:o.roughness??.5,emissive:o.emissive??0x000000,emissiveIntensity:o.emissiveIntensity??0,transparent:o.transparent??false,opacity:o.opacity??1});}
function addBox(p,s,pos,c,o={}){const m=new THREE.Mesh(new THREE.BoxGeometry(...s),std(c,o));m.position.set(...pos);p.add(m);return m;}
function addLabel(p,text,pos,scale=.55,color='#f4f1ea'){
 const c=document.createElement('canvas');c.width=1024;c.height=220;const x=c.getContext('2d');x.font='600 72px Inter';x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';x.fillText(text,512,110);
 const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(6,1.3),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false}));
 mesh.position.set(...pos);mesh.scale.setScalar(scale);p.add(mesh);return mesh;
}
function frame(p,w,h,pos,color=0xd8ff62){
 const pts=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2],[-w/2,-h/2]].map(([x,y])=>new THREE.Vector3(x,y,0));
 const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity:.85}));l.position.set(...pos);p.add(l);return l;
}
function node(p,pos,color,label,key){
 const m=new THREE.Mesh(new THREE.SphereGeometry(.58,24,24),std(color,{emissive:color,emissiveIntensity:.35,metalness:.6,roughness:.25}));
 m.position.set(...pos);m.userData.panel=key;interactive.push(m);p.add(m);addLabel(p,label,[pos[0],pos[1]-1.05,pos[2]],.24);return m;
}
function lineBetween(p,a,b,color=0x697080){
 const pts=[new THREE.Vector3(...a),new THREE.Vector3(...b)];p.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity:.55})));
}

function origin(){
 const g=new THREE.Group();g.position.z=-3;root.add(g);
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.4,2),std(0x141821,{metalness:.8,roughness:.18,emissive:0x9f8cff,emissiveIntensity:.2}));g.add(core);core.userData.spin=.1;
 const ring=new THREE.Mesh(new THREE.TorusGeometry(3.2,.07,10,120),std(0xd8ff62,{emissive:0xd8ff62,emissiveIntensity:1.1}));ring.rotation.x=Math.PI/2.3;g.add(ring);ring.userData.spin=-.08;
 addLabel(g,'SOFTWARE · QA · AI',[0,-3.6,0],.55,'#d8ff62');
}

function foundation(){
 const g=new THREE.Group();g.position.z=-30;root.add(g);
 const floor=new THREE.GridHelper(30,30,0x303642,0x141820);floor.position.y=-3;g.add(floor);
 const layers=[
  {y:-1.8,label:'CODE',c:0x202734},
  {y:-.1,label:'DATA',c:0x242d3c},
  {y:1.6,label:'SYSTEMS',c:0x293446}
 ];
 layers.forEach((L,li)=>{for(let i=0;i<5;i++){const b=addBox(g,[2.1,.65,2.1],[(i-2)*2.6,L.y,-li*2.6],L.c,{metalness:.55,roughness:.3});b.userData.float=.05+i*.01;}addLabel(g,L.label,[-8,L.y,-li*2.6],.28,'#d8ff62');});
 lineBetween(g,[-5,-1.8,0],[5,1.6,-5.2],0xd8ff62);
 node(g,[0,3.7,-4.5],0xd8ff62,'DEGREE','education');
}

function mlcv(){
 const g=new THREE.Group();g.position.z=-62;root.add(g);
 const floor=new THREE.GridHelper(34,28,0x263145,0x111720);floor.position.y=-3;g.add(floor);
 addLabel(g,'DATA → TRAIN → EVALUATE → INFER',[0,6,-5],.55,'#8de8ff');
 const xs=[-8,-3,2,7],labs=['DATASET','TRAIN','METRICS','INFERENCE'];
 xs.forEach((x,i)=>{const box=addBox(g,[3.8,2.7,.35],[x,1,-4],i===2?0x243242:0x161c27,{emissive:i===2?0x8de8ff:0x000000,emissiveIntensity:i===2?.18:0});frame(g,3.3,2.2,[x,1,-3.78],i===2?0x8de8ff:0x586474);addLabel(g,labs[i],[x,-1,-3.5],.26,i===2?'#8de8ff':'#f4f1ea');if(i<3)lineBetween(g,[x+2,1,-4],[xs[i+1]-2,1,-4],0x8de8ff);});
 for(let i=0;i<14;i++){const x=-9+(i%7)*.65,y=2.6-Math.floor(i/7)*.7;frame(g,.45,.35,[x,y,-3.5],i%4===0?0xff6f88:0xd8ff62);}
 const curve=new THREE.Line(new THREE.BufferGeometry().setFromPoints([...Array(24)].map((_,i)=>new THREE.Vector3(1+i*.26,-.4+Math.log1p(i)*.6,-3.4))),new THREE.LineBasicMaterial({color:0xd8ff62}));g.add(curve);
 node(g,[7,4,-5],0x8de8ff,'OPEN CASE','ml');
}

function retail(){
 const g=new THREE.Group();g.position.z=-97;root.add(g);
 const floor=new THREE.GridHelper(40,30,0x36293a,0x15121a);floor.position.y=-3;g.add(floor);
 addLabel(g,'SMART RETAIL · LIVE STORE MODEL',[0,7,-8],.6,'#d8ff62');
 for(let aisle=0;aisle<3;aisle++){
   for(let s=0;s<4;s++){addBox(g,[1.3,2.8,4.4],[(aisle-1)*6,-1.55,-4-s*5],0x20232a,{roughness:.7});}
 }
 for(let i=0;i<7;i++){
   const x=(i%4-1.5)*4.3,y=-1,z=-2-Math.floor(i/4)*8;
   const person=new THREE.Group();person.position.set(x,y,z);g.add(person);
   const head=new THREE.Mesh(new THREE.SphereGeometry(.45,18,18),std(0x252831));head.position.y=2.2;person.add(head);
   addBox(person,[.95,2.5,.65],[0,.55,0],0x191c22,{roughness:.7});
   frame(person,1.9,4,[0,.9,.42],i===2?0xff6f88:0xd8ff62);
 }
 for(let i=0;i<4;i++){const cam=addBox(g,[.7,.5,.9],[-8+i*5.3,5,-1],0x30343d,{metalness:.8});cam.rotation.x=.25;lineBetween(g,[cam.position.x,4.7,-1],[cam.position.x-1,0,-8-i*2],0x8de8ff);}
 const alert=addBox(g,[5,2,.2],[7,3,-13],0x210f16,{emissive:0xff1744,emissiveIntensity:.35});frame(g,4.5,1.5,[7,3,-12.85],0xff6f88);addLabel(g,'ALERT BUFFER + COOLDOWN',[7,3,-12.6],.26,'#ff9aac');
 node(g,[0,5,-17],0xd8ff62,'FULL CASE','retail');
}

function qaLab(){
 const g=new THREE.Group();g.position.z=-133;root.add(g);
 const floor=new THREE.GridHelper(34,26,0x243044,0x11161f);floor.position.y=-3;g.add(floor);
 addLabel(g,'TEST → REPRODUCE → REPORT → VERIFY',[0,6,-5],.55,'#8de8ff');
 const devices=[[-6,'iOS',1.8,3.2],[-1.8,'Android',1.8,3.2],[2.6,'Web',4.5,2.7]];
 devices.forEach(([x,name,w,h],i)=>{const body=addBox(g,[w,h,.25],[x,.7,-4],0x121720,{metalness:.3,roughness:.25,emissive:i===2?0x142533:0x000000,emissiveIntensity:.4});frame(g,w-.3,h-.3,[x,.7,-3.82],i===0?0x9f8cff:i===1?0xd8ff62:0x8de8ff);addLabel(g,name,[x,-1.55,-3.6],.25);});
 const bugSteps=[[-7,-1,-10],[-3.5,-1,-10],[0,-1,-10],[3.5,-1,-10],[7,-1,-10]];
 const bugLabels=['FLOW','BUG','EVIDENCE','FIX','REGRESSION'];
 bugSteps.forEach((p,i)=>{const n=node(g,p,i===1?0xff6f88:0x8de8ff,bugLabels[i],i===1?'qa':null);if(i<4)lineBetween(g,p,bugSteps[i+1],0x8de8ff);if(!n.userData.panel)interactive.splice(interactive.indexOf(n),1);});
 addBox(g,[9,.12,2],[0,-2.7,-14],0x222832);addLabel(g,'WCAG · FUNCTIONAL · REGRESSION · PLAYWRIGHT',[0,-1.8,-14],.33,'#8de8ff');
 node(g,[0,4.2,-14],0x8de8ff,'QA CASE','qa');
}

function builds(){
 const g=new THREE.Group();g.position.z=-168;root.add(g);
 const floor=new THREE.GridHelper(36,28,0x322b3f,0x15121c);floor.position.y=-3;g.add(floor);
 addLabel(g,'IDEA → BUILD → DEPLOY → IMPROVE',[0,6,-5],.55,'#9f8cff');
 const stations=[
  {x:-7,l:'WEB',c:0x9f8cff},
  {x:-2.3,l:'SEO',c:0xd8ff62},
  {x:2.3,l:'AI',c:0x8de8ff},
  {x:7,l:'DATA',c:0xffa66b}
 ];
 stations.forEach((s,i)=>{addBox(g,[3.4,2.2,.3],[s.x,1,-4],0x161a23,{emissive:s.c,emissiveIntensity:.08});frame(g,3,1.8,[s.x,1,-3.8],s.c);addLabel(g,s.l,[s.x,-.8,-3.6],.26,'#f4f1ea');if(i<stations.length-1)lineBetween(g,[s.x+1.8,1,-4],[stations[i+1].x-1.8,1,-4],0x9f8cff);});
 const deploy=addBox(g,[5.5,3,.25],[0,1,-12],0x151921,{emissive:0xd8ff62,emissiveIntensity:.12});frame(g,5,2.5,[0,1,-11.82],0xd8ff62);addLabel(g,'LIVE / DELIVERED',[0,1,-11.6],.3,'#d8ff62');
 node(g,[0,4.2,-12],0x9f8cff,'CURRENT WORK','builds');
}

function contact(){
 const g=new THREE.Group();g.position.z=-203;root.add(g);
 const portal=new THREE.Mesh(new THREE.TorusGeometry(4.5,.1,12,120),std(0xd8ff62,{emissive:0xd8ff62,emissiveIntensity:1.1,metalness:.6,roughness:.2}));portal.rotation.x=Math.PI/2;portal.position.z=-5;g.add(portal);portal.userData.spin=.08;
 for(let i=0;i<7;i++)lineBetween(g,[-8+i*2.6,-3,-2],[-6+i*2,3,-9],i===3?0xd8ff62:0x454955);
 addLabel(g,'NEXT ROLE / NEXT BUILD',[0,0,-8],.62,'#d8ff62');
}

function tunnel(){
 const g=new THREE.Group();root.add(g);
 for(let i=0;i<95;i++){const z=10-i*2.3;const s=8.2;const e=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s,s*.62,.02)),new THREE.LineBasicMaterial({color:i%10===0?0x4d5262:0x242731,transparent:true,opacity:i%10===0?.3:.12}));e.position.z=z;e.rotation.z=(i%2?1:-1)*i*.009;g.add(e);}
}

function init(){
 bootBar.style.width='20%';bootCopy.textContent='Building narrative environments…';
 scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x06070b,.016);
 camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,260);camera.position.set(...CHAPTERS[0].pos);
 renderer=new THREE.WebGLRenderer({canvas,antialias:!isTouch,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.25:1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 scene.add(new THREE.HemisphereLight(0xaec5ff,0x09070d,1.25));
 [['#d8ff62',[4,6,-5]],['#8de8ff',[8,5,-92]],['#9f8cff',[-8,5,-160]]].forEach(([c,p])=>{const l=new THREE.PointLight(c,18,48,2);l.position.set(...p);scene.add(l);});
 root=new THREE.Group();scene.add(root);tunnel();origin();foundation();mlcv();retail();qaLab();builds();contact();
 composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));if(!isTouch&&!reduced)composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.42,.45,.93));
 raycaster=new THREE.Raycaster();mouse=new THREE.Vector2();clock=new THREE.Clock();
 bind();bootBar.style.width='100%';bootCopy.textContent='Ready.';setTimeout(()=>boot.classList.add('is-done'),300);animate();
}
function bind(){
 addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight)});
 addEventListener('scroll',onScroll,{passive:true});
 addEventListener('pointermove',e=>{pointerX=(e.clientX/innerWidth-.5)*2;pointerY=(e.clientY/innerHeight-.5)*2;mouse.set(pointerX,-pointerY);if(cursor){cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'}raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(interactive,false).find(h=>h.object.userData.panel);document.body.classList.toggle('cursor-active',!!hit);canvas.style.cursor=hit?'pointer':'default';},{passive:true});
 canvas.addEventListener('click',()=>{raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(interactive,false).find(h=>h.object.userData.panel);if(hit)openPanel(hit.object.userData.panel);});
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture?.(e.pointerId);canvas.dataset.px=e.clientX;canvas.dataset.py=e.clientY});
 canvas.addEventListener('pointermove',e=>{if(!canvas.hasPointerCapture?.(e.pointerId))return;const dx=e.clientX-Number(canvas.dataset.px||e.clientX),dy=e.clientY-Number(canvas.dataset.py||e.clientY);dragX=Math.max(-1,Math.min(1,dragX+dx*.002));dragY=Math.max(-.55,Math.min(.55,dragY+dy*.002));canvas.dataset.px=e.clientX;canvas.dataset.py=e.clientY;});
 canvas.addEventListener('pointerup',e=>{if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId)});
 onScroll();
}
function onScroll(){
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);targetScrollT=scrollY/max;progressBar.style.width=(targetScrollT*100)+'%';
 let best=0,d=Infinity;sections.forEach((s,i)=>{const q=Math.abs(s.getBoundingClientRect().top-innerHeight*.22);if(q<d){d=q;best=i}});if(best!==currentChapter){currentChapter=best;navButtons.forEach((b,i)=>b.classList.toggle('is-active',i===best));label.innerHTML=`<span>0${best+1}</span><b>${CHAPTERS[best].name}</b>`;}
}
function camState(t){
 const n=CHAPTERS.length-1,scaled=Math.min(n-1e-5,Math.max(0,t*n)),i=Math.floor(scaled),f=scaled-i,s=f*f*(3-2*f),a=CHAPTERS[i],b=CHAPTERS[Math.min(n,i+1)];
 return{pos:new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos),s),look:new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look),s)};
}
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);scrollT+=(targetScrollT-scrollT)*(reduced?1:Math.min(1,dt*4.2));const st=camState(scrollT);camera.position.lerp(st.pos,.085);
 const px=(pointerX+dragX)*(isTouch?.12:.34),py=(pointerY+dragY)*(isTouch?.06:.18);camera.position.x+=px;camera.position.y-=py;const look=st.look.clone();look.x+=px*.55;look.y-=py*.35;camera.lookAt(look);
 const t=performance.now()*.001;scene.traverse(o=>{if(o.userData.spin)o.rotation.y+=o.userData.spin*dt;if(o.userData.float)o.position.y+=Math.sin(t*1.5+o.id)*o.userData.float*.002;});composer.render();
}
let audioCtx,osc,gain,ambient=false;
document.querySelector('#soundToggle').addEventListener('click',()=>{ambient=!ambient;const b=document.querySelector('#soundToggle');b.textContent=ambient?'●':'◌';b.setAttribute('aria-pressed',String(ambient));if(ambient){audioCtx??=new(window.AudioContext||window.webkitAudioContext)();osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.frequency.value=52;gain.gain.value=.012;osc.connect(gain).connect(audioCtx.destination);osc.start();}else if(osc){gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.15);osc.stop(audioCtx.currentTime+.18);osc=null;}});
try{init()}catch(err){console.error(err);boot.classList.add('is-done');document.querySelector('#fallback').hidden=false;canvas.style.display='none';}
