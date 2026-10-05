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
{name:'Intro',pos:[0,1.6,12],look:[0,0,-4]},
{name:'Foundation',pos:[-3,2.2,-18],look:[0,0,-31]},
{name:'ML',pos:[6,2.3,-52],look:[0,0,-66]},
{name:'Retail Vista',pos:[-7,3.2,-90],look:[0,0,-104]},
{name:'Cybercom',pos:[6,2.4,-126],look:[0,0,-140]},
{name:'QA',pos:[-6,2.4,-161],look:[0,0,-176]},
{name:'Freelance',pos:[6,2.4,-198],look:[0,0,-212]},
{name:'Contact',pos:[0,2.6,-234],look:[0,0,-247]}
];

const panels={
education:{kicker:'EDUCATION',title:'BS Software Engineering',body:'COMSATS University Islamabad · Sep 2021 – Jul 2025 · CGPA 3.89 / 4.00 · Gold Medalist.',bullets:['Languages: Python, JavaScript, HTML, CSS, SQL','Frontend: React.js, responsive web interfaces, Figma','Backend & databases: Django, MySQL','Tools & practices: Git, GitHub, Jira, Postman, Power BI, OOP, Agile Scrum']},
ml:{kicker:'MACHINE LEARNING INTERN · CODIC SOLUTION',title:'YOLOv8m Object Detection',body:'Implemented object detection in Python, annotated data, trained and tuned the model, then evaluated performance using mAP.',bullets:['mAP@50: 94.4%','mAP@50–95: 76.1%','Python-based training workflow','Data annotation + model tuning']},
retail:{kicker:'PROJECT · RETAIL VISTA',title:'Smart Retail Analytics Platform',body:'An end-to-end retail platform combining computer vision, React frontend work and Django/MySQL integration.',bullets:['Frontend features for shoplifting detection, people counting, demographic analysis, promotions and MappedIn store maps','Connected frontend workflows to Django + MySQL so analytics views could consume model outputs','Collected and labelled training data','Worked with YOLOv8m, YOLOv11, OpenCV, PyTorch and TensorFlow/Keras','Shoplifting detector: mAP@50 89.6% · precision 86.3% · recall 84.0%','Demographic CNN: ~93% accuracy']},
cybercom:{kicker:'SOFTWARE ENGINEERING INTERN · CYBERCOM',title:'Frontend + Delivery Work',body:'Worked on responsive product interfaces and delivery-oriented engineering tasks.',bullets:['Developed responsive, user-friendly frontend interfaces','Designed UI layouts in Figma for visual consistency','Built Power BI dashboards for reporting','Prepared technical and functional documentation on delivery timelines']},
qa:{kicker:'QA ENGINEER · CITRUSBITS',title:'Product Quality Across Platforms',body:'Current QA work focuses on application behavior, APIs, defects and close collaboration with developers.',bullets:['Test web, mobile and desktop behavior through structured manual checks','Validate APIs with Postman','Track defects in Jira','Partner with developers to reproduce issues and verify fixes','Work within Agile Scrum sprints']},
freelance:{kicker:'ADDITIONAL EXPERIENCE',title:'Freelance · Fiverr + Pure Oxygen Therapy UK',body:'International client work covering forms, website tasks, operations and data entry.',bullets:['Designed interactive Jotform forms','100% positive feedback noted on CV','Managed website and operational tasks','Completed data-entry projects for international clients']}
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
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>sections[Number(b.dataset.go)]?.scrollIntoView({behavior:reduced?'auto':'smooth'})));
navButtons.forEach(b=>b.addEventListener('click',()=>sections[Number(b.dataset.chapter)]?.scrollIntoView({behavior:reduced?'auto':'smooth'})));

let scene,camera,renderer,composer,clock,raycaster,mouse,root;
let interactive=[],currentChapter=0,targetScrollT=0,scrollT=0,pointerX=0,pointerY=0,dragX=0,dragY=0;

const ivory=0xe9e1d0, steel=0x87929d, smoke=0x161719, glass=0x23262a, dark=0x0c0d0f;

function material(c,o={}){return new THREE.MeshStandardMaterial({color:c,metalness:o.metalness??.45,roughness:o.roughness??.42,transparent:o.transparent??false,opacity:o.opacity??1,emissive:o.emissive??0x000000,emissiveIntensity:o.emissiveIntensity??0});}
function box(p,s,pos,c,o={}){const m=new THREE.Mesh(new THREE.BoxGeometry(...s),material(c,o));m.position.set(...pos);p.add(m);return m;}
function plane(p,w,h,pos,c,o={}){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material(c,o));m.position.set(...pos);p.add(m);return m;}
function label3D(p,text,pos,scale=.45,color='#e9e1d0'){
 const c=document.createElement('canvas');c.width=1400;c.height=240;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.font='500 68px Inter';x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';x.fillText(text,700,120);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(7.2,1.25),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));m.position.set(...pos);m.scale.setScalar(scale);p.add(m);return m;
}
function line(p,a,b,c=steel,opacity=.45){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);p.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:c,transparent:true,opacity})));}
function frame(p,w,h,pos,c=ivory,opacity=.7){const pts=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2],[-w/2,-h/2]].map(([x,y])=>new THREE.Vector3(x,y,0));const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:c,transparent:true,opacity}));l.position.set(...pos);p.add(l);return l;}
function hotspot(p,pos,key,label){
 const m=new THREE.Mesh(new THREE.CircleGeometry(.34,32),new THREE.MeshBasicMaterial({color:ivory,transparent:true,opacity:.95,side:THREE.DoubleSide}));
 m.position.set(...pos);m.userData.panel=key;interactive.push(m);p.add(m);label3D(p,label,[pos[0],pos[1]-.72,pos[2]],.18,'#d9d0bf');return m;
}
function polishedFloor(p,z=0,w=34,d=24){
 const floor=box(p,[w,.08,d],[0,-3,z],0x0a0b0d,{metalness:.8,roughness:.18});return floor;
}

function makeIntro(){
 const g=new THREE.Group();g.position.z=-4;root.add(g);
 polishedFloor(g,-3,28,20);
 const wall=box(g,[16,8,.4],[0,1,-4],0x111214,{metalness:.2,roughness:.55});
 const slit=box(g,[.08,5,.05],[-5.5,1,-3.76],ivory,{emissive:ivory,emissiveIntensity:1.1,roughness:.2});
 label3D(g,'NIMRA KHAN',[1.3,1.1,-3.72],.66,'#f1ece4');
 label3D(g,'SOFTWARE ENGINEER / SOFTWARE DEVELOPER',[1.6,-.2,-3.72],.23,'#9ea5ad');
 const ceiling=box(g,[16,.08,9],[0,5,-4],0x121315,{metalness:.5,roughness:.3});
}

function makeFoundation(){
 const g=new THREE.Group();g.position.z=-32;root.add(g);polishedFloor(g,-3,36,25);
 const slabs=[
  {x:-6,h:8,label:'LANGUAGES'},
  {x:0,h:10,label:'SYSTEMS'},
  {x:6,h:7,label:'TOOLS'}
 ];
 slabs.forEach((s,i)=>{box(g,[3.4,s.h,.5],[s.x,-3+s.h/2,-5],i===1?0x1c1f22:0x141618,{metalness:.62,roughness:.28});label3D(g,s.label,[s.x,2.3,-4.72],.22,'#c9c1b1');});
 line(g,[-8,-2.7,-1],[8,-2.7,-1],ivory,.8);
 const marker=box(g,[.04,3,.04],[0,-1.2,-1],ivory,{emissive:ivory,emissiveIntensity:.9});
 hotspot(g,[0,4,-4.68],'education','VIEW EDUCATION');
}

function makeML(){
 const g=new THREE.Group();g.position.z=-67;root.add(g);polishedFloor(g,-4,38,26);
 label3D(g,'MODEL DEVELOPMENT',[0,6,-8],.36,'#d6cec0');
 const wall=box(g,[22,8,.4],[0,1,-9],0x101214,{metalness:.2,roughness:.5});
 // Dataset contact sheet
 for(let r=0;r<3;r++)for(let c=0;c<7;c++){frame(g,1.25,.86,[-7.7+c*2.55,2.8-r*1.7,-8.72],0x78838e,.35);if((r+c)%4===0)frame(g,.5,.34,[-7.95+c*2.55,2.95-r*1.7,-8.69],ivory,.8);}
 // Training curve
 const pts=[];for(let i=0;i<38;i++){const x=-7.6+i*.41,y=-1.2+Math.log1p(i)*.65,z=-8.65;pts.push(new THREE.Vector3(x,y,z));}
 g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:ivory,transparent:true,opacity:.9})));
 line(g,[-7.8,-1.4,-8.65],[7.8,-1.4,-8.65],steel,.35);line(g,[-7.8,-1.4,-8.65],[-7.8,1.6,-8.65],steel,.35);
 box(g,[5,.12,.12],[0,-2.2,-4],steel,{metalness:.75,roughness:.2});
 hotspot(g,[7.4,4.6,-8.7],'ml','INTERNSHIP DETAILS');
}

function makeRetail(){
 const g=new THREE.Group();g.position.z=-105;root.add(g);polishedFloor(g,-5,42,34);
 label3D(g,'RETAIL VISTA / SMART RETAIL ANALYTICS',[0,7,-12],.42,'#e5ddcf');
 // premium store architecture
 for(let a=0;a<3;a++){
  const x=(a-1)*7.5;
  for(let j=0;j<3;j++){
   const shelf=box(g,[4.2,2.7,1.1],[x,-1.55,-3-j*6],0x17191b,{metalness:.45,roughness:.32});
   box(g,[4.0,.08,1.0],[x,-.75,-3-j*6],0x2b2f33,{metalness:.75,roughness:.18});
  }
 }
 // people silhouettes and detection overlays
 const people=[[-5,-.9,-2],[2,-.9,-5],[6,-.9,-9],[-1,-.9,-13]];
 people.forEach((p,i)=>{
   const grp=new THREE.Group();grp.position.set(...p);g.add(grp);
   const head=new THREE.Mesh(new THREE.SphereGeometry(.34,18,18),material(0x24272b,{roughness:.8}));head.position.y=2;grp.add(head);
   box(grp,[.72,2.3,.45],[0,.65,0],0x1b1d20,{roughness:.7});
   frame(grp,1.45,3.5,[0,.95,.3],i===2?0xb38f8f:ivory,i===2?.9:.55);
 });
 // ceiling cameras + rays
 const cams=[[-8,5,-1],[0,5,-7],[8,5,-13]];
 cams.forEach((p,i)=>{const c=box(g,[.9,.55,1.2],p,0x2b2e32,{metalness:.8,roughness:.18});c.rotation.x=.18;line(g,[p[0],p[1]-.3,p[2]],[people[Math.min(i,people.length-1)][0],0,people[Math.min(i,people.length-1)][2]],steel,.22);});
 // dashboard wall
 const dash=box(g,[9,5,.35],[0,1,-21],0x0f1113,{metalness:.35,roughness:.25});
 frame(g,8.4,4.4,[0,1,-20.78],ivory,.45);
 label3D(g,'SHOPLIFTING · COUNTING · DEMOGRAPHICS · MAPS',[0,1.8,-20.72],.22,'#c9c1b3');
 label3D(g,'mAP@50 89.6%   ·   P 86.3%   ·   R 84.0%',[0,.3,-20.72],.24,'#9ea5ad');
 hotspot(g,[4,5,-20.7],'retail','FULL CASE STUDY');
}

function makeCybercom(){
 const g=new THREE.Group();g.position.z=-141;root.add(g);polishedFloor(g,-5,36,28);
 label3D(g,'CYBERCOM / PRODUCT DELIVERY',[0,6,-9],.38,'#ded6c8');
 // editorial studio wall
 const panels=[
  {x:-7,w:4.8,h:6,l:'RESPONSIVE UI'},
  {x:0,w:4.8,h:6,l:'FIGMA'},
  {x:7,w:4.8,h:6,l:'POWER BI'}
 ];
 panels.forEach((p,i)=>{box(g,[p.w,p.h,.3],[p.x,1,-8],0x121416,{metalness:.35,roughness:.3});frame(g,p.w-.45,p.h-.45,[p.x,1,-7.8],i===1?ivory:steel,.52);label3D(g,p.l,[p.x,-2.3,-7.72],.22,'#c8c0b2');});
 // documentation plinth
 for(let i=0;i<5;i++)box(g,[5,.08,3],[0,-2.6+i*.12,-2.5+i*.08],i%2?0x24272b:0x191b1e,{metalness:.25,roughness:.55});
 hotspot(g,[7,4.8,-7.75],'cybercom','VIEW EXPERIENCE');
}

function makeQA(){
 const g=new THREE.Group();g.position.z=-177;root.add(g);polishedFloor(g,-6,40,30);
 label3D(g,'QUALITY ENGINEERING',[0,6.5,-10],.42,'#e2dacd');
 // aligned device lab — glassy but restrained
 const devices=[
  {x:-7,w:2.3,h:4.3,l:'MOBILE'},
  {x:-2.7,w:2.3,h:4.3,l:'MOBILE'},
  {x:3.7,w:7.5,h:4.5,l:'WEB / DESKTOP'}
 ];
 devices.forEach((d,i)=>{box(g,[d.w,d.h,.22],[d.x,.8,-7],0x0d0f11,{metalness:.55,roughness:.2});frame(g,d.w-.28,d.h-.28,[d.x,.8,-6.84],i===2?ivory:steel,.55);label3D(g,d.l,[d.x,-1.9,-6.78],.19,'#b8b1a5');});
 // defect workflow on the floor
 const steps=[['CHECK',-8],['REPRO',-4],['LOG',0],['VERIFY',4],['REGRESSION',8]];
 steps.forEach((s,i)=>{box(g,[2.6,.06,1.4],[s[1],-2.85,-14],i===2?0x24201c:0x16181b,{metalness:.7,roughness:.18});label3D(g,s[0],[s[1],-2.45,-13.9],.15,i===2?'#e9e1d0':'#8e949c');if(i<steps.length-1)line(g,[s[1]+1.35,-2.8,-14],[steps[i+1][1]-1.35,-2.8,-14],steel,.35);});
 label3D(g,'POSTMAN · JIRA · AGILE SCRUM',[0,4.6,-13],.26,'#aab0b5');
 hotspot(g,[7.8,4.8,-6.8],'qa','QA EXPERIENCE');
}

function makeFreelance(){
 const g=new THREE.Group();g.position.z=-213;root.add(g);polishedFloor(g,-6,36,26);
 label3D(g,'CLIENT DELIVERY',[0,6,-9],.38,'#ddd5c8');
 const wall=box(g,[20,8,.35],[0,1,-9],0x111315,{metalness:.25,roughness:.45});
 const labels=[['JOTFORM',-6,2.2],['WEBSITE TASKS',0,2.2],['OPERATIONS',6,2.2],['DATA ENTRY',0,-.8]];
 labels.forEach(([t,x,y],i)=>{frame(g,4.6,1.7,[x,y,-8.78],i===0?ivory:steel,.48);label3D(g,t,[x,y,-8.72],.18,'#c3bbae');});
 line(g,[-3.7,2.2,-8.72],[-2.3,2.2,-8.72],steel,.35);line(g,[2.3,2.2,-8.72],[3.7,2.2,-8.72],steel,.35);line(g,[0,1.2,-8.72],[0,.1,-8.72],steel,.35);
 hotspot(g,[7.5,4.8,-8.7],'freelance','CLIENT WORK');
}

function makeContact(){
 const g=new THREE.Group();g.position.z=-248;root.add(g);polishedFloor(g,-5,34,26);
 // architectural horizon instead of portal
 box(g,[24,7,.35],[0,.5,-10],0x0e1012,{metalness:.3,roughness:.4});
 box(g,[13,.05,.05],[0,1.8,-9.78],ivory,{emissive:ivory,emissiveIntensity:.7});
 label3D(g,'OPEN TO THE NEXT ENGINEERING CHAPTER',[0,.4,-9.72],.34,'#e8e1d5');
}

function corridor(){
 const g=new THREE.Group();root.add(g);
 for(let i=0;i<46;i++){
   const z=8-i*5.55;
   const left=box(g,[.035,7,4.2],[-11,0,z],0x151719,{metalness:.65,roughness:.25});
   const right=box(g,[.035,7,4.2],[11,0,z],0x151719,{metalness:.65,roughness:.25});
   if(i%4===0){box(g,[.05,6,.05],[-10.8,0,z],ivory,{emissive:ivory,emissiveIntensity:.65});}
 }
}

function init(){
 bootBar.style.width='18%';bootCopy.textContent='Composing architectural space…';
 scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x080808,.0125);
 camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,320);camera.position.set(...CHAPTERS[0].pos);
 renderer=new THREE.WebGLRenderer({canvas,antialias:!isTouch,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.2:1.65));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
 scene.add(new THREE.HemisphereLight(0xb5bcc4,0x050506,.8));
 const key=new THREE.DirectionalLight(0xf1e8d9,1.7);key.position.set(-4,8,4);scene.add(key);
 const fill=new THREE.PointLight(0x8c959f,8,60,2);fill.position.set(8,4,-110);scene.add(fill);
 const warm=new THREE.PointLight(0xe9dfcd,7,55,2);warm.position.set(-8,3,-205);scene.add(warm);
 root=new THREE.Group();scene.add(root);
 corridor();makeIntro();makeFoundation();makeML();makeRetail();makeCybercom();makeQA();makeFreelance();makeContact();
 composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 if(!isTouch&&!reduced)composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.16,.25,.96));
 raycaster=new THREE.Raycaster();mouse=new THREE.Vector2();clock=new THREE.Clock();bind();
 bootBar.style.width='100%';bootCopy.textContent='Ready.';setTimeout(()=>boot.classList.add('is-done'),260);animate();
}
function bind(){
 addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight)});
 addEventListener('scroll',onScroll,{passive:true});
 addEventListener('pointermove',e=>{pointerX=(e.clientX/innerWidth-.5)*2;pointerY=(e.clientY/innerHeight-.5)*2;mouse.set(pointerX,-pointerY);if(cursor){cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'}raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(interactive,false).find(h=>h.object.userData.panel);document.body.classList.toggle('cursor-active',!!hit);canvas.style.cursor=hit?'pointer':'default';},{passive:true});
 canvas.addEventListener('click',()=>{raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(interactive,false).find(h=>h.object.userData.panel);if(hit)openPanel(hit.object.userData.panel);});
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture?.(e.pointerId);canvas.dataset.px=e.clientX;canvas.dataset.py=e.clientY});
 canvas.addEventListener('pointermove',e=>{if(!canvas.hasPointerCapture?.(e.pointerId))return;const dx=e.clientX-Number(canvas.dataset.px||e.clientX),dy=e.clientY-Number(canvas.dataset.py||e.clientY);dragX=Math.max(-.65,Math.min(.65,dragX+dx*.00125));dragY=Math.max(-.3,Math.min(.3,dragY+dy*.00125));canvas.dataset.px=e.clientX;canvas.dataset.py=e.clientY;});
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
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);scrollT+=(targetScrollT-scrollT)*(reduced?1:Math.min(1,dt*3.2));
 const st=camState(scrollT);camera.position.lerp(st.pos,.075);
 const px=(pointerX+dragX)*(isTouch?.07:.18),py=(pointerY+dragY)*(isTouch?.04:.1);camera.position.x+=px;camera.position.y-=py;const look=st.look.clone();look.x+=px*.45;look.y-=py*.25;camera.lookAt(look);
 composer.render();
}
let audioCtx,osc,gain,ambient=false;
document.querySelector('#soundToggle').addEventListener('click',()=>{ambient=!ambient;const b=document.querySelector('#soundToggle');b.textContent=ambient?'●':'◌';b.setAttribute('aria-pressed',String(ambient));if(ambient){audioCtx??=new(window.AudioContext||window.webkitAudioContext)();osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.type='sine';osc.frequency.value=47;gain.gain.value=.007;osc.connect(gain).connect(audioCtx.destination);osc.start();}else if(osc){gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.18);osc.stop(audioCtx.currentTime+.2);osc=null;}});
try{init()}catch(err){console.error(err);boot.classList.add('is-done');document.querySelector('#fallback').hidden=false;canvas.style.display='none';}
