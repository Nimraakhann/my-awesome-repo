const boot=document.querySelector('#boot');
const bootBar=document.querySelector('#bootBar');
const bootPct=document.querySelector('#bootPct');
const bootCopy=document.querySelector('#bootCopy');
const sections=[...document.querySelectorAll('.chapter')];
const nav=[...document.querySelectorAll('.chapter-nav__item')];
const marker=document.querySelector('#chapterMarker');
const rail=document.querySelector('#railProgress');
const panel=document.querySelector('#panel');
const panelInner=document.querySelector('#panelInner');
const resume=document.querySelector('#resume');
const cursor=document.querySelector('#cursor');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
if(!coarse)document.body.classList.add('has-pointer');

const CASES={
 education:{
  kicker:'FOUNDATION',
  title:'BS Software Engineering',
  period:'COMSATS University Islamabad · Sep 2021 – Jul 2025',
  intro:'The degree is the base layer behind the rest of my work: software development, data, interfaces, databases and structured problem solving.',
  bullets:['CGPA 3.89 / 4.00','Gold Medalist','Programming: Python, JavaScript, HTML, CSS and SQL','Frontend: React.js and responsive web interfaces','Backend and databases: Django and MySQL','Tools and practices include Git, GitHub, Object-Oriented Programming and Agile Scrum']
 },
 ml:{
  kicker:'MACHINE LEARNING INTERNSHIP',
  title:'Object detection with YOLOv8m',
  period:'Codic Solution · Remote · Jul 2024 – Sep 2024',
  intro:'My ML internship focused on the full object-detection loop: preparing data, training, tuning and evaluating the model rather than treating inference as a black box.',
  bullets:['Implemented YOLOv8m object detection in Python','Annotated training data','Trained and tuned the model','Reached 94.4% mAP@50','Reached 76.1% mAP@50–95']
 },
 retail:{
  kicker:'PROJECT CASE STUDY',
  title:'Retail Vista — Smart Retail Analytics Platform',
  period:'Sep 2024 – May 2025',
  intro:'My role covered data collection and labelling, model-training support and frontend development for an end-to-end retail analytics platform.',
  bullets:['Built React.js frontend features for shoplifting detection, people counting, demographic analysis, promotions and MappedIn store maps','Connected frontend workflows to a Django + MySQL backend so analytics views could consume model outputs','Collected and labelled training data','Worked with YOLOv8m, YOLOv11, OpenCV, PyTorch and TensorFlow/Keras','Shoplifting detector: mAP@50 89.6% · precision 86.3% · recall 84.0%','Demographic CNN: approximately 93% accuracy']
 },
 cybercom:{
  kicker:'SOFTWARE ENGINEERING INTERNSHIP',
  title:'Frontend, interface design and reporting',
  period:'Cybercom Pvt. Ltd. · Islamabad · Oct 2025 – Dec 2025',
  intro:'This role moved the focus back into software delivery: responsive interfaces, visual consistency, reporting and documentation.',
  bullets:['Developed responsive, user-friendly frontend interfaces','Designed UI layouts in Figma for visual consistency','Built Power BI dashboards for reporting','Prepared technical and functional documentation on delivery timelines']
 },
 qa:{
  kicker:'CURRENT EXPERIENCE',
  title:'QA Engineer',
  period:'Citrusbits · Islamabad · Jan 2026 – Present',
  intro:'My current role sits at the point where software behavior becomes product quality — across interfaces, APIs, defects and fixes.',
  bullets:['Test web, mobile and desktop application behavior through structured manual checks','Catch defects before release','Validate APIs with Postman','Track defects in Jira','Partner with developers to reproduce issues','Verify fixes in Agile Scrum sprints']
 },
 freelance:{
  kicker:'ADDITIONAL EXPERIENCE',
  title:'Earlier freelance work',
  period:'Fiverr + Pure Oxygen Therapy UK · Remote · Jul 2021 – Mar 2024',
  intro:'Earlier client work gave me practical exposure to international delivery, websites, forms and operational tasks.',
  bullets:['Designed interactive Jotform forms for international clients','Received 100% positive feedback','Managed website and operational tasks','Completed data-entry projects']
 },
 certs:{
  kicker:'CONTINUED LEARNING',
  title:'Certifications',
  period:'Ongoing',
  intro:'Focused courses that reinforce ML, Python, web development and professional skills.',
  bullets:['The Nuts and Bolts of Machine Learning — In Progress · Google via Coursera','Getting Started with Python · Google via Coursera','HTML, CSS, and JavaScript for Web Developers · Johns Hopkins University via Coursera','Google Soft Skills · Google via PAFLA']
 }
};

function openCase(key){
 const d=CASES[key]; if(!d)return;
 panelInner.innerHTML=`<div class="kicker">${d.kicker}</div><h3>${d.title}</h3><div class="period">${d.period}</div><p>${d.intro}</p><ul>${d.bullets.map(x=>`<li>${x}</li>`).join('')}</ul>`;
 panel.showModal();
}
document.querySelectorAll('[data-panel]').forEach(el=>el.addEventListener('click',()=>openCase(el.dataset.panel)));
document.querySelector('#panelClose').addEventListener('click',()=>panel.close());
document.querySelectorAll('[data-open="resume"]').forEach(el=>el.addEventListener('click',()=>resume.showModal()));
document.querySelector('#resumeClose').addEventListener('click',()=>resume.close());
document.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',()=>sections[Number(el.dataset.go)]?.scrollIntoView({behavior:reduced?'auto':'smooth'})));
nav.forEach(el=>el.addEventListener('click',()=>sections[Number(el.dataset.chapter)]?.scrollIntoView({behavior:reduced?'auto':'smooth'})));

const chapterNames=['Intro','Foundation','ML','Retail Vista','Cybercom','QA','Archive'];
let currentChapter=0;
function updateScrollUI(){
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 const p=Math.min(1,Math.max(0,scrollY/max));
 rail.style.height=(p*100)+'%';
 let best=0,dist=Infinity;
 sections.forEach((s,i)=>{const d=Math.abs(s.getBoundingClientRect().top-innerHeight*.24);if(d<dist){dist=d;best=i}});
 if(best!==currentChapter){
  currentChapter=best;
  nav.forEach((n,i)=>n.classList.toggle('is-active',i===best));
  marker.innerHTML=`<span>0${best}</span><b>${chapterNames[best]}</b>`;
 }
 return p;
}
addEventListener('scroll',updateScrollUI,{passive:true});
updateScrollUI();

const bootFailSafe=setTimeout(()=>{
 if(!boot.classList.contains('is-done')){
  bootCopy.textContent='Opening lightweight view…';
  boot.classList.add('is-done');
 }
},7000);

function setBoot(p,text){
 const v=Math.round(p*100);
 bootBar.style.width=v+'%';
 bootPct.textContent=String(v).padStart(2,'0');
 if(text)bootCopy.textContent=text;
}
function finishBoot(){
 clearTimeout(bootFailSafe);
 setBoot(1,'Ready');
 setTimeout(()=>boot.classList.add('is-done'),260);
}

async function start(){
 try{
  setBoot(.08,'Loading spatial engine…');
  const [THREE,composerMod,renderMod,bloomMod]=await Promise.all([
   import('https://cdn.jsdelivr.net/npm/three@0.169.0/+esm'),
   import('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/EffectComposer.js/+esm'),
   import('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/RenderPass.js/+esm'),
   import('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/UnrealBloomPass.js/+esm')
  ]);
  setBoot(.2,'Composing environments…');
  buildExperience(THREE,composerMod.EffectComposer,renderMod.RenderPass,bloomMod.UnrealBloomPass);
 }catch(err){
  console.error(err);
  document.querySelector('#fallback').hidden=false;
  document.querySelector('#world').style.display='none';
  finishBoot();
 }
}

function buildExperience(THREE,EffectComposer,RenderPass,UnrealBloomPass){
 const canvas=document.querySelector('#world');
 const scene=new THREE.Scene();
 scene.background=new THREE.Color(0x050608);
 scene.fog=new THREE.FogExp2(0x050608,.0125);

 const camera=new THREE.PerspectiveCamera(51,innerWidth/innerHeight,.1,300);
 camera.position.set(0,1.2,12);

 const renderer=new THREE.WebGLRenderer({canvas,antialias:!coarse,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,coarse?1.2:1.65));
 renderer.setSize(innerWidth,innerHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.02;

 const composer=new EffectComposer(renderer);
 composer.addPass(new RenderPass(scene,camera));
 if(!coarse&&!reduced)composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.28,.55,.92));

 scene.add(new THREE.HemisphereLight(0xb9c9e6,0x08090c,1.15));
 const key=new THREE.DirectionalLight(0xeaf3ff,2.2);key.position.set(5,9,5);scene.add(key);
 const accentA=new THREE.PointLight(0xd9ff67,10,38,2);accentA.position.set(-7,6,-75);scene.add(accentA);
 const accentB=new THREE.PointLight(0x86d9ff,11,42,2);accentB.position.set(8,5,-126);scene.add(accentB);
 const accentC=new THREE.PointLight(0xb79cff,9,40,2);accentC.position.set(-8,5,-162);scene.add(accentC);

 const world=new THREE.Group();scene.add(world);
 const interactive=[];
 const animated=[];

 const anchors=[
  new THREE.Vector3(0,1.2,11),
  new THREE.Vector3(0,1.4,-22),
  new THREE.Vector3(7,1.9,-58),
  new THREE.Vector3(-7,2.4,-94),
  new THREE.Vector3(7,1.8,-131),
  new THREE.Vector3(-7,2.1,-168),
  new THREE.Vector3(0,2,-207)
 ];
 const looks=[
  new THREE.Vector3(0,0,-3),
  new THREE.Vector3(0,0,-34),
  new THREE.Vector3(0,0,-71),
  new THREE.Vector3(0,0,-108),
  new THREE.Vector3(0,0,-145),
  new THREE.Vector3(0,0,-181),
  new THREE.Vector3(0,0,-220)
 ];

 const glass=new THREE.MeshPhysicalMaterial({color:0x151a20,metalness:.08,roughness:.18,transmission:.55,transparent:true,opacity:.72,thickness:.9,clearcoat:.8,clearcoatRoughness:.18});
 const darkMetal=new THREE.MeshStandardMaterial({color:0x11151a,metalness:.72,roughness:.28});
 const matte=new THREE.MeshStandardMaterial({color:0x0f1216,metalness:.12,roughness:.72});
 const lime=new THREE.MeshBasicMaterial({color:0xd9ff67,transparent:true,opacity:.88});
 const cyan=new THREE.MeshBasicMaterial({color:0x86d9ff,transparent:true,opacity:.82});
 const violet=new THREE.MeshBasicMaterial({color:0xb79cff,transparent:true,opacity:.82});

 function canvasTexture(text,sub='',accent='#d9ff67',align='left'){
  const c=document.createElement('canvas');c.width=1200;c.height=540;
  const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);
  x.textAlign=align;x.textBaseline='middle';
  const px=align==='left'?70:c.width/2;
  x.font='500 30px "DM Mono", monospace';x.fillStyle=accent;x.fillText(sub.toUpperCase(),px,115);
  x.font='600 78px Inter, sans-serif';x.fillStyle='#f0eee8';
  const words=text.split('\n');words.forEach((w,i)=>x.fillText(w,px,245+i*90));
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
 }
 function labelPlane(parent,text,sub,pos,rot=[0,0,0],scale=1,accent='#d9ff67'){
  const tex=canvasTexture(text,sub,accent);
  const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false});
  const p=new THREE.Mesh(new THREE.PlaneGeometry(7.2,3.24),m);
  p.position.set(...pos);p.rotation.set(...rot);p.scale.setScalar(scale);parent.add(p);return p;
 }
 function line(parent,points,color=0x5f6772,opacity=.45){
  const g=new THREE.BufferGeometry().setFromPoints(points);
  const l=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity}));
  parent.add(l);return l;
 }
 function rect(parent,w,h,pos,color=0x6c747f,opacity=.6){
  const pts=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2],[-w/2,-h/2]].map(([x,y])=>new THREE.Vector3(x,y,0));
  const l=line(parent,pts,color,opacity);l.position.set(...pos);return l;
 }
 function plaque(parent,key,label,pos,color=0xd9ff67){
  const g=new THREE.Group();g.position.set(...pos);parent.add(g);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.31,.37,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,side:THREE.DoubleSide}));
  ring.userData.panel=key;g.add(ring);interactive.push(ring);
  const t=labelPlane(g,label,'CLICK TO OPEN',[.65,0,0],[0,0,0],.18,'#d9ff67');
  t.position.y=.08;return g;
 }

 function architecture(){
  const g=new THREE.Group();g.position.z=-34;world.add(g);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(34,28),new THREE.MeshStandardMaterial({color:0x080a0d,metalness:.25,roughness:.72}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-3;g.add(floor);
  const grid=new THREE.GridHelper(34,34,0x293039,0x14191e);grid.position.y=-2.98;g.add(grid);
  const planes=[
   {x:-7.4,z:0,h:8,label:'CODE',a:'#d9ff67'},
   {x:-2.5,z:-2.4,h:9.5,label:'INTERFACE',a:'#86d9ff'},
   {x:2.5,z:-5,h:10.5,label:'DATA',a:'#b79cff'},
   {x:7.4,z:-7.7,h:12,label:'SYSTEMS',a:'#d9ff67'}
  ];
  planes.forEach((p,i)=>{
   const slab=new THREE.Mesh(new THREE.BoxGeometry(.18,p.h,6.8),i%2?glass:darkMetal);slab.position.set(p.x,p.h/2-3,p.z);g.add(slab);
   labelPlane(g,p.label,'FOUNDATION',[p.x+(i%2?.18:-.18),1.2,p.z+3.48],[0,0,i%2?.02:-.02],.3,p.a);
  });
  const beam=new THREE.Mesh(new THREE.BoxGeometry(18,.08,.08),lime);beam.position.set(0,4.8,-4);beam.rotation.z=-.13;g.add(beam);
  plaque(g,'education','EDUCATION',[0,6,-8]);
 }

 function intro(){
  const g=new THREE.Group();g.position.z=-4;world.add(g);
  for(let i=0;i<7;i++){
   const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-9+i*2.7,-4,5),
    new THREE.Vector3(-6+i*2.0,-1.5,0),
    new THREE.Vector3(-3+i*.9,1.5,-5),
    new THREE.Vector3((i-3)*.6,4,-12)
   ]);
   const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,90,.018,5,false),i===3?lime:new THREE.MeshBasicMaterial({color:0x313740,transparent:true,opacity:.62}));
   g.add(tube);
  }
  const pg=new THREE.BufferGeometry();const pts=[];
  for(let i=0;i<700;i++){pts.push((Math.random()-.5)*24,(Math.random()-.5)*14,(Math.random()-.5)*26);}
  pg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  const particles=new THREE.Points(pg,new THREE.PointsMaterial({color:0x7c8490,size:.024,transparent:true,opacity:.42}));
  g.add(particles);particles.userData.rotate=.008;animated.push(particles);
 }

 function mlScene(){
  const g=new THREE.Group();g.position.z=-72;world.add(g);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(34,26),matte);floor.rotation.x=-Math.PI/2;floor.position.y=-3;g.add(floor);
  const grid=new THREE.GridHelper(34,30,0x223142,0x11161d);grid.position.y=-2.98;g.add(grid);

  const cloud=new THREE.BufferGeometry();const pos=[];const colors=[];
  const c1=new THREE.Color(0x86d9ff),c2=new THREE.Color(0xd9ff67);
  for(let i=0;i<520;i++){
   const cls=i%2;
   const cx=cls?-4.5:4.5,cy=cls?.8:-.4;
   pos.push(cx+(Math.random()-.5)*5.2,cy+(Math.random()-.5)*5.2,(Math.random()-.5)*6);
   const c=cls?c1:c2;colors.push(c.r,c.g,c.b);
  }
  cloud.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  cloud.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const points=new THREE.Points(cloud,new THREE.PointsMaterial({size:.045,vertexColors:true,transparent:true,opacity:.72}));
  g.add(points);points.userData.rotate=.025;animated.push(points);

  const trainCurve=new THREE.CatmullRomCurve3([
   new THREE.Vector3(-8,-2,5),new THREE.Vector3(-5,0,1),new THREE.Vector3(-1,2,-2),new THREE.Vector3(4,1,-5),new THREE.Vector3(8,3,-8)
  ]);
  const trainTube=new THREE.Mesh(new THREE.TubeGeometry(trainCurve,120,.055,8,false),cyan);g.add(trainTube);
  animated.push({userData:{pulse:true},material:trainTube.material});

  const evalPts=[];
  for(let i=0;i<50;i++){const x=-7+i*.29;const y=-1.5+4.2*(1-Math.exp(-i/12))+(Math.sin(i*.5)*.08);evalPts.push(new THREE.Vector3(x,y,-9));}
  const evalLine=line(g,evalPts,0xd9ff67,.9);evalLine.material.linewidth=2;
  labelPlane(g,'94.4%','mAP@50',[4.8,4.3,-8.7],[0,0,0],.45,'#d9ff67');
  labelPlane(g,'76.1%','mAP@50–95',[4.8,1.6,-8.7],[0,0,0],.34,'#86d9ff');
  plaque(g,'ml','ML INTERNSHIP',[0,6,-10],0x86d9ff);
 }

 function retailScene(){
  const g=new THREE.Group();g.position.z=-109;world.add(g);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(38,30),new THREE.MeshStandardMaterial({color:0x090b0e,metalness:.15,roughness:.78}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-3;g.add(floor);
  const grid=new THREE.GridHelper(38,38,0x2e2833,0x141217);grid.position.y=-2.98;g.add(grid);

  const walls=[
   [[-12,-2.9,-3],[-12,-2.9,-16]], [[-12,-2.9,-16],[12,-2.9,-16]], [[12,-2.9,-16],[12,-2.9,-3]],
   [[-7,-2.9,-4],[-7,-2.9,-12]], [[-2,-2.9,-7],[-2,-2.9,-16]], [[3,-2.9,-4],[3,-2.9,-12]], [[8,-2.9,-7],[8,-2.9,-16]]
  ];
  walls.forEach(w=>line(g,w.map(v=>new THREE.Vector3(...v)),0x6d7580,.72));

  const zones=[
   {p:[-8,-2.86,-7],r:2.2,c:0xb79cff},
   {p:[0,-2.86,-11],r:2.8,c:0x86d9ff},
   {p:[8,-2.86,-8],r:2.1,c:0xd9ff67}
  ];
  zones.forEach(z=>{
   const disc=new THREE.Mesh(new THREE.RingGeometry(z.r*.72,z.r,64),new THREE.MeshBasicMaterial({color:z.c,transparent:true,opacity:.12,side:THREE.DoubleSide}));
   disc.rotation.x=-Math.PI/2;disc.position.set(...z.p);g.add(disc);disc.userData.rotate=.04;animated.push(disc);
  });

  const trackers=[];
  const routes=[
   [new THREE.Vector3(-10,-2.7,-4),new THREE.Vector3(-7,-2.7,-9),new THREE.Vector3(-3,-2.7,-14)],
   [new THREE.Vector3(10,-2.7,-4),new THREE.Vector3(5,-2.7,-9),new THREE.Vector3(1,-2.7,-14)],
   [new THREE.Vector3(-4,-2.7,-4),new THREE.Vector3(0,-2.7,-8),new THREE.Vector3(7,-2.7,-14)]
  ];
  routes.forEach((rp,i)=>{
   const curve=new THREE.CatmullRomCurve3(rp);
   line(g,curve.getPoints(60),i===1?0xd9ff67:0x86d9ff,.42);
   const dot=new THREE.Mesh(new THREE.SphereGeometry(.14,16,16),new THREE.MeshBasicMaterial({color:i===1?0xd9ff67:0x86d9ff}));
   g.add(dot);
   const box=rect(g,1.2,2.4,[0,0,0],i===1?0xd9ff67:0x86d9ff,.8);
   trackers.push({curve,dot,box,offset:i*.29});
  });
  animated.push({userData:{trackers}});

  const analytics=new THREE.Mesh(new THREE.PlaneGeometry(8.5,5),glass);analytics.position.set(7,2,-16);analytics.rotation.y=-.16;g.add(analytics);
  labelPlane(g,'89.6%','SHOPLIFTING mAP@50',[6.6,2.9,-15.72],[0,-.16,0],.38,'#d9ff67');
  labelPlane(g,'84.0%','RECALL',[6.7,.7,-15.72],[0,-.16,0],.28,'#86d9ff');
  plaque(g,'retail','FULL CASE',[0,6,-17],0xd9ff67);
 }

 function cybercomScene(){
  const g=new THREE.Group();g.position.z=-146;world.add(g);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(34,25),matte);floor.rotation.x=-Math.PI/2;floor.position.y=-3;g.add(floor);
  const grid=new THREE.GridHelper(34,28,0x272d38,0x12161b);grid.position.y=-2.98;g.add(grid);
  const screens=[
   {x:-7,z:-3,r:.28,w:7,h:4.4},
   {x:0,z:-7,r:0,w:8.5,h:5},
   {x:7,z:-3,r:-.28,w:7,h:4.4}
  ];
  screens.forEach((s,i)=>{
   const panel=new THREE.Mesh(new THREE.PlaneGeometry(s.w,s.h),glass);panel.position.set(s.x,1.2,s.z);panel.rotation.y=s.r;g.add(panel);
   for(let row=0;row<4;row++){
    line(g,[new THREE.Vector3(s.x-s.w*.38,2.4-row*.72,s.z+.03),new THREE.Vector3(s.x+s.w*.32,2.4-row*.72,s.z+.03)],i===1?0x86d9ff:0x505964,.5);
   }
   rect(g,s.w*.8,s.h*.7,[s.x,1.2,s.z+.05],i===1?0x86d9ff:0x5d6570,.44).rotation.y=s.r;
  });
  const bars=[1.2,2.4,1.8,3.1,2.6,3.8];
  bars.forEach((h,i)=>{
   const b=new THREE.Mesh(new THREE.BoxGeometry(.55,h,.55),darkMetal);b.position.set(-1.7+i*.72,-3+h/2,-12);g.add(b);
   const cap=new THREE.Mesh(new THREE.BoxGeometry(.57,.05,.57),i===5?lime:cyan);cap.position.set(b.position.x,-3+h,-12);g.add(cap);
  });
  labelPlane(g,'FIGMA · POWER BI','INTERFACE + REPORTING',[0,5.7,-12],.42,'#86d9ff');
  plaque(g,'cybercom','CYBERCOM',[0,6.8,-8],0x86d9ff);
 }

 function qaScene(){
  const g=new THREE.Group();g.position.z=-183;world.add(g);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(36,27),new THREE.MeshStandardMaterial({color:0x080b0f,metalness:.2,roughness:.74}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-3;g.add(floor);
  const grid=new THREE.GridHelper(36,30,0x26323f,0x111820);grid.position.y=-2.98;g.add(grid);

  const devices=[
   {x:-7,w:3.2,h:6,label:'MOBILE'},
   {x:0,w:7.2,h:4.7,label:'WEB'},
   {x:7,w:5.4,h:4.1,label:'DESKTOP'}
  ];
  devices.forEach((d,i)=>{
   const plate=new THREE.Mesh(new THREE.PlaneGeometry(d.w,d.h),glass);plate.position.set(d.x,1,-5);g.add(plate);
   rect(g,d.w*.88,d.h*.84,[d.x,1,-4.93],i===1?0x86d9ff:0x69737e,.62);
   labelPlane(g,d.label,'TEST TARGET',[d.x,-2.1,-4.8],[0,0,0],.22,i===1?'#86d9ff':'#aeb6bf');
  });

  const apiCurve=new THREE.CatmullRomCurve3([
   new THREE.Vector3(-10,4,-11),new THREE.Vector3(-4,2.5,-13),new THREE.Vector3(0,3.2,-12),new THREE.Vector3(5,1.5,-14),new THREE.Vector3(10,3,-12)
  ]);
  const apiTube=new THREE.Mesh(new THREE.TubeGeometry(apiCurve,110,.035,7,false),cyan);g.add(apiTube);
  const packets=[];
  for(let i=0;i<9;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.09,12,12),lime);g.add(p);packets.push({m:p,o:i/9});}
  animated.push({userData:{packets,curve:apiCurve}});

  const cyclePts=[
   new THREE.Vector3(-7,-1,-16),new THREE.Vector3(-3.5,.2,-17),new THREE.Vector3(0,-.8,-16),new THREE.Vector3(3.5,.4,-17),new THREE.Vector3(7,-.6,-16)
  ];
  line(g,cyclePts,0xd9ff67,.7);
  ['CHECK','DEFECT','JIRA','FIX','VERIFY'].forEach((t,i)=>labelPlane(g,t,'',[cyclePts[i].x,cyclePts[i].y+.85,cyclePts[i].z],[0,0,0],.16,'#d9ff67'));
  labelPlane(g,'POSTMAN → API','VALIDATION',[0,5.8,-13],.38,'#86d9ff');
  plaque(g,'qa','QA EXPERIENCE',[0,6.7,-17],0xd9ff67);
 }

 function archiveScene(){
  const g=new THREE.Group();g.position.z=-222;world.add(g);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(34,24),matte);floor.rotation.x=-Math.PI/2;floor.position.y=-3;g.add(floor);
  const plates=[
   {y:3.7,z:-2,t:'JOTFORM',s:'EARLIER FREELANCE'},
   {y:1.8,z:-4,t:'WEBSITE WORK',s:'CLIENT DELIVERY'},
   {y:-.1,z:-6,t:'PYTHON',s:'GOOGLE · COURSERA'},
   {y:-2,z:-8,t:'WEB DEVELOPMENT',s:'JOHNS HOPKINS'}
  ];
  plates.forEach((p,i)=>{
   const slab=new THREE.Mesh(new THREE.BoxGeometry(15,.08,3.2),i===0?glass:darkMetal);slab.position.set(0,p.y,p.z);g.add(slab);
   labelPlane(g,p.t,p.s,[-5.7,p.y+.18,p.z+1.62],[0,0,0],.25,i===0?'#d9ff67':'#aeb6bf');
  });
  const horizon=new THREE.Mesh(new THREE.PlaneGeometry(30,.04),lime);horizon.position.set(0,-2.8,-15);g.add(horizon);
  plaque(g,'freelance','EARLIER WORK',[-4.5,5,-8],0xb79cff);
  plaque(g,'certs','CERTIFICATIONS',[4.5,5,-8],0x86d9ff);
 }

 intro();setBoot(.34,'Building foundation…');
 architecture();setBoot(.46,'Building ML space…');
 mlScene();setBoot(.58,'Mapping Retail Vista…');
 retailScene();setBoot(.7,'Building interface studio…');
 cybercomScene();setBoot(.8,'Building QA chamber…');
 qaScene();setBoot(.9,'Building archive…');
 archiveScene();

 const pathCurve=new THREE.CatmullRomCurve3(anchors,false,'catmullrom',.44);
 const lookCurve=new THREE.CatmullRomCurve3(looks,false,'catmullrom',.44);
 let targetScroll=updateScrollUI();
 let smoothScroll=targetScroll;
 let mouseX=0,mouseY=0;
 let raycaster=new THREE.Raycaster();
 let mouse=new THREE.Vector2();
 const clock=new THREE.Clock();

 addEventListener('scroll',()=>{targetScroll=updateScrollUI()},{passive:true});
 addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);
 });
 addEventListener('pointermove',e=>{
  mouseX=(e.clientX/innerWidth-.5)*2;mouseY=(e.clientY/innerHeight-.5)*2;
  if(cursor){cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'}
  mouse.set(mouseX,-mouseY);raycaster.setFromCamera(mouse,camera);
  const hit=raycaster.intersectObjects(interactive,false)[0];
  document.body.classList.toggle('cursor-hot',!!hit);
  canvas.style.cursor=hit?'pointer':'default';
 },{passive:true});
 canvas.addEventListener('click',()=>{
  raycaster.setFromCamera(mouse,camera);
  const hit=raycaster.intersectObjects(interactive,false)[0];
  if(hit?.object?.userData.panel)openCase(hit.object.userData.panel);
 });

 function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(.05,clock.getDelta());
  smoothScroll+=(targetScroll-smoothScroll)*(reduced?1:Math.min(1,dt*3.6));
  const t=Math.min(.9999,Math.max(0,smoothScroll));
  const pos=pathCurve.getPoint(t);const look=lookCurve.getPoint(t);
  camera.position.lerp(pos,.08);
  camera.position.x+=mouseX*(coarse?.06:.24);
  camera.position.y-=mouseY*(coarse?.04:.12);
  camera.lookAt(look.x+mouseX*.2,look.y-mouseY*.1,look.z);

  const time=performance.now()*.001;
  animated.forEach(o=>{
   if(o.userData?.rotate)o.rotation.y+=o.userData.rotate*dt;
   if(o.userData?.pulse&&o.material)o.material.opacity=.55+Math.sin(time*2.2)*.22;
   if(o.userData?.trackers)o.userData.trackers.forEach((tr,i)=>{
    const q=(time*.05+tr.offset)%1;const p=tr.curve.getPoint(q);tr.dot.position.copy(p);tr.dot.position.y=-2.68;
    tr.box.position.set(p.x,p.y+1.25,p.z+.02);
   });
   if(o.userData?.packets)o.userData.packets.forEach(pk=>pk.m.position.copy(o.userData.curve.getPoint((time*.09+pk.o)%1)));
  });
  composer.render();
 }
 finishBoot();
 animate();
}

let audioCtx,osc,gain,audioOn=false;
document.querySelector('#soundToggle').addEventListener('click',()=>{
 audioOn=!audioOn;
 const b=document.querySelector('#soundToggle');b.textContent=audioOn?'Sound on':'Sound off';b.setAttribute('aria-pressed',String(audioOn));
 if(audioOn){
  audioCtx??=new(window.AudioContext||window.webkitAudioContext)();
  osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.type='sine';osc.frequency.value=48;gain.gain.value=.009;osc.connect(gain).connect(audioCtx.destination);osc.start();
 }else if(osc){
  gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.16);osc.stop(audioCtx.currentTime+.18);osc=null;
 }
});

start();