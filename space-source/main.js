import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {resolveMove,isDrag} from './interaction.js';
import {recordPoint,returnRoute,sampleReturn} from './return-motion.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createSignalScreen} from './signal-screen.js';
import {createWoodDesk} from './old-wood-desk.js';
import {lensAmount,lensPoint,lensGLSL} from './lens.js';
import {createPugLamp,createSpilledWine} from './desk-additions.js';
import {terminalViewDistance} from './camera-framing.js';
import {createSunsetWater} from './sunset-water.js';
import {createFilmAwards} from './film-awards.js';
import {createDeskDissolve} from './desk-dissolve.js';
import {createObjectGallery} from './object-gallery.js';
import {createDirectory} from './space-directory.js';
import {modules} from './directory-icons.js';
import {isSiteRoute,routeToStage,stageToRoute} from './route-protocol.js';
import {channels,galleryPhase} from './gallery-layout.js';

import {textFor,validLanguage,objectName,localMessage} from '../src/i18n.js';

export function mountSpace(scope,{onNavigate,initialRoute='home',initialLanguage='zh-CN',onStageChange=()=>{}}){
let language=validLanguage(initialLanguage);
const t=key=>textFor(language,key),nameOf=obj=>objectName(language,obj.userData.id);
const say=(zh,en)=>toast(localMessage(language,zh,en));
const shell=scope.querySelector('.scene-shell');
const $=s=>scope.querySelector(s), canvas=$('#world'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
canvas.dataset.sceneId=crypto.randomUUID();canvas.dataset.effects='grain,fisheye';
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new THREE.Scene();scene.background=new THREE.Color('#000000');
const environmentRoom=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);
const reflection=pmrem.fromScene(environmentRoom,.04);scene.environment=reflection.texture;scene.environmentIntensity=.85;environmentRoom.dispose();pmrem.dispose();
const camera=new THREE.PerspectiveCamera(46,1,.1,240),viewCamera=camera.clone();
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=true;controls.panSpeed=.55;controls.cursor.set(0,2.05,0);controls.maxTargetRadius=1.1;
controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;controls.minPolarAngle=.035;controls.maxPolarAngle=Math.PI-.035;
controls.minDistance=6.8;controls.maxDistance=22;controls.rotateSpeed=.55;controls.zoomSpeed=.65;
const TABLE=2.15, objects=[],textures=new Set(), materialSet=new Set(), geometries=new Set();
const deskRoot=new THREE.Group();deskRoot.name='Desk and all ten objects';scene.add(deskRoot);
let seed=431;function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function texture(draw,w=256,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearMipmapLinearFilter;textures.add(t);return t;}
function grunge(base,variant='metal'){
 return texture((c,w,h)=>{
  c.fillStyle=base;c.fillRect(0,0,w,h);
  for(let i=0;i<3000;i++){const size=1+Math.floor(rnd()*7);c.fillStyle=rnd()>.52?`rgba(13,20,12,${rnd()*.25})`:`rgba(203,199,162,${rnd()*.17})`;c.fillRect(rnd()*w,rnd()*h,size,size*(.5+rnd()));}
  for(let i=0;i<170;i++){c.strokeStyle=`rgba(20,15,10,${rnd()*.25})`;c.lineWidth=.5+rnd();const x=rnd()*w,y=rnd()*h;c.beginPath();c.moveTo(x,y);c.lineTo(x+rnd()*22,y+rnd()*3);c.stroke();}
  if(variant==='tile'){c.strokeStyle='#252b22';c.lineWidth=3;for(let i=0;i<=4;i++){c.beginPath();c.moveTo(i*64,0);c.lineTo(i*64,256);c.moveTo(0,i*64);c.lineTo(256,i*64);c.stroke();}c.strokeStyle='#a0a08855';c.lineWidth=1;c.strokeRect(3,3,58,58);}
  if(variant==='wall'){for(let i=0;i<40;i++){const x=rnd()*w;c.fillStyle=`rgba(33,40,23,${rnd()*.13})`;c.fillRect(x,rnd()*30,2+rnd()*6,50+rnd()*180);}}
 });
}
function mat(color,map=null,metal=.1){const m=new THREE.MeshStandardMaterial({color,map,roughness:.9,metalness:metal,flatShading:true});materialSet.add(m);return m;}
const worn=grunge('#8c8c74'),darkTex=grunge('#353d34'),rustTex=grunge('#6b493b');
const steel=mat('#a6aaa1',worn,.35),dark=mat('#5a665c',darkTex,.3),ivory=mat('#dbd4ab',worn),green=mat('#748571',worn),red=mat('#8c423c',worn),black=mat('#141b17',darkTex),rust=mat('#927864',rustTex,.3),paper=mat('#c0b997',grunge('#bbb69b'));
function mesh(geometry,material,parent=scene){geometries.add(geometry);const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,x,y,z,m=steel,parent=scene,bevel=0){const o=mesh(bevel?new RoundedBoxGeometry(w,h,d,1,bevel):new THREE.BoxGeometry(w,h,d),m,parent);o.position.set(x,y,z);return o;}
function cyl(rt,rb,h,x,y,z,m=steel,parent=scene,n=12){const o=mesh(new THREE.CylinderGeometry(rt,rb,h,n),m,parent);o.position.set(x,y,z);return o;}
function sphere(r,x,y,z,m,parent=scene){const o=mesh(new THREE.SphereGeometry(r,10,7),m,parent);o.position.set(x,y,z);return o;}
function tube(points,r,m,parent=scene){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*6),r,6,false),m,parent);}
function textMap(lines,bg='#9da38a',fg='#1b241b',w=256,h=128){return texture((c)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=fg;c.textAlign='center';lines.forEach((line,i)=>{c.font=`bold ${i===0?24:15}px monospace`;c.fillText(line,w/2,36+i*29);});for(let i=0;i<140;i++){c.fillStyle='#151d1522';c.fillRect(rnd()*w,rnd()*h,rnd()*12,1);}},w,h);}
function label(map,w,h,x,y,z,parent=scene,flat=false){const material=new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide});materialSet.add(material);const p=mesh(new THREE.PlaneGeometry(w,h),material,parent);p.position.set(x,y,z);if(flat)p.rotation.x=-Math.PI/2;p.castShadow=false;return p;}
function bolt(x,y,z,parent){cyl(.035,.035,.025,x,y,z,dark,parent,6);}
function shadow(parent,r=.6){const map=texture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,5,w/2,h/2,w/2);g.addColorStop(0,'rgba(0,0,0,.7)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);},64,64);const m=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,opacity:.65});materialSet.add(m);const o=mesh(new THREE.PlaneGeometry(r*2.7,r*2.3),m,parent);o.rotation.x=-Math.PI/2;o.position.y=.012;o.castShadow=false;o.userData.decorative=true;}
function prop(id,name,en,x,z,r,copy){const g=new THREE.Group();g.position.set(x,TABLE,z);g.userData={id,name,en,radius:r,copy,home:new THREE.Vector3(x,TABLE,z),trail:[{x,z}],state:0};deskRoot.add(g);objects.push(g);shadow(g,r);return g;}

// The desk and sunset are separate branches, so the background survives the dissolve.
createWoodDesk({scene:deskRoot,box,cyl,mesh,texture,mat,materialSet,TABLE});
const sunsetWorld=createSunsetWater({scene,mesh,box,cyl,tube,texture,mat,materialSet});canvas.dataset.backgroundPeople=String(sunsetWorld.peopleCount);
// 01 / CRT terminal.
const terminal=prop('terminal','监视终端','PARALLAX SIGNAL / 01',0,-1.13,1.14,'视差之见 · 落日信号正在传输。\n点击靠近平视，桌面会化为微粒，显现四格导览，选择播客进入三个电影物件。');
terminal.userData.fixed=true;
box(1.85,.17,1.12,0,.13,0,dark,terminal,.04);box(.65,.25,.65,0,.31,-.12,ivory,terminal,.03);
box(1.93,1.47,1.2,0,1.13,-.05,ivory,terminal,.11);box(1.62,1.18,.14,-.06,1.19,.59,dark,terminal,.07);
const screenCanvas=document.createElement('canvas');screenCanvas.width=768;screenCanvas.height=512;
const signalScreen=createSignalScreen(screenCanvas);let signalPointer=null,terminalStage='desk',menuKeyboard=-1,dissolveStarted=0,menuPress=null;
const channelButtons=Array.from(scope.querySelectorAll('#channel-nav button'));
const directoryButtons=Array.from(scope.querySelectorAll('#directory-nav button'));
function navigateSite(route){if(isSiteRoute(route))onNavigate(route);}
function publishStage(){const route=stageToRoute(terminalStage);if(route)navigateSite(route);}
const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;screenTexture.magFilter=THREE.NearestFilter;textures.add(screenTexture);
const screen=label(screenTexture,1.43,.99,-.06,1.2,.673,terminal);screen.material.toneMapped=false;
const screenGlow=new THREE.PointLight('#8fbe70',1.4,3,2);screenGlow.position.set(0,1.3,1);terminal.add(screenGlow);
for(let i=0;i<8;i++)box(.23,.018,.018,.65,.62+i*.035,.637,dark,terminal);
const led=mat('#b4dd7e');led.emissive.set('#82b956');led.emissiveIntensity=2;sphere(.027,.66,.55,.656,led,terminal);
box(1.75,.12,.58,0,.09,.94,ivory,terminal,.025);
for(let y=0;y<4;y++)for(let x=0;x<13;x++)box(.095,.028,.082,-.7+x*.115,.169,.75+y*.11,x>10?dark:paper,terminal);
label(textMap(['PARALLAX / SERVICE TERMINAL'],'#929884','#243820',512,64),.83,.1,-.29,.55,.643,terminal);
// Rear housing is visible during a complete orbit, including vents and a service plate.
for(let row=0;row<9;row++)for(const x of [-.47,.17])box(.48,.025,.012,x,.89+row*.063,-.657,dark,terminal);
box(.4,.16,.025,.52,.64,-.67,dark,terminal,.012);
const rearLabel=label(textMap(['PARALLAX','CRT-03 / 1996'],'#aaa98f','#323a2c',256,128),.43,.22,-.49,.59,-.675,terminal);rearLabel.rotation.y=Math.PI;


// 02 / Silver clamshell mobile, with a genuinely hinged display.
const phone=prop('phone','翻盖手机','NO SIGNAL / 02',3.0,1.10,.37,'一部没有信号的旧手机。\n轻点翻开或合上。');phone.rotation.y=-.23;
const phoneShell=mat('#a9ada6',worn,.62);
box(.47,.105,.86,0,.1,0,phoneShell,phone,.035);
box(.405,.018,.73,0,.164,0,black,phone,.018);
for(let row=0;row<4;row++)for(let col=0;col<3;col++)box(.09,.018,.075,(col-1)*.12,.184,.04+row*.095,ivory,phone,.007);
const navKey=cyl(.075,.075,.015,0,.184,-.18,steel,phone,12);
const hinge=cyl(.065,.065,.48,0,.2,-.36,steel,phone);hinge.rotation.z=Math.PI/2;
const phoneLid=new THREE.Group();phoneLid.position.set(0,.2,-.36);phone.add(phoneLid);phoneLid.rotation.x=0;
box(.47,.085,.84,0,.045,.4,phoneShell,phoneLid,.03);
box(.38,.012,.57,0,-.003,.40,black,phoneLid,.015);
label(textMap(['03:17','NO SIGNAL'],'#2b4539','#a0d0aa',256,128),.32,.41,0,-.012,.4,phoneLid,true);
for(let i=0;i<4;i++)box(.034,.013,.018,-.075+i*.05,-.005,.74,dark,phoneLid);
label(textMap(['017'],'#27362c','#89b59b',128,64),.22,.11,0,.095,.4,phoneLid,true);

// 03 / Cassette recorder.
const recorder=prop('tape','磁带录音机','TAPE 04-B / 03',-1.70,-.95,.62,'上一班留下的录音。\n点击开始或停止播放。');
box(1.13,.22,.77,0,.15,0,dark,recorder,.025);box(.73,.04,.46,-.12,.278,-.04,black,recorder,.01);
const reels=[];for(const x of [-.3,.12]){const r=cyl(.105,.105,.02,x,.311,-.04,paper,recorder,12);reels.push(r);for(let i=0;i<3;i++){const b=box(.13,.01,.025,0,.015,0,dark,r);b.rotation.y=i*Math.PI/3;}}
for(let i=0;i<5;i++)box(.14,.05,.13,-.37+i*.18,.3,.28,i===4?red:ivory,recorder,.008);
for(let i=0;i<6;i++)box(.025,.008,.42,.34+i*.034,.273,-.07,black,recorder);

// 04 / A seated ceramic pug wearing red/cyan cinema glasses.
const lamp=prop('lamp','3D 巴哥犬','THE SPECTATOR / 04',2.95,-.95,.49,'它戴着红蓝眼镜，等一场永不散场的电影。\n轻点开关小灯，它会歪头看你。');lamp.rotation.y=-.3;
const pug=createPugLamp({lamp,mesh,box,cyl,sphere,tube,mat,worn,dark,materialSet});
const {light:lampLight,bulb}=pug;

// 05 / Folder: a hinged cover with a readable printed sheet inside.
const file=prop('file','交接档案','CASE FILE / 05',-2.75,.18,.63,'档案编号与你的工号相同。\n点击打开封面。');file.rotation.y=-.12;
box(1.23,.05,.86,0,.06,0,paper,file);
const cover=new THREE.Group();cover.position.set(-.61,.1,0);file.add(cover);
box(1.24,.024,.88,.62,0,0,mat('#a18f5f',worn),cover);
label(textMap(['NIGHT SHIFT','CASE 03 / INTERNAL','DO NOT DUPLICATE'],'#a39769','#4b3328',256,180),.95,.67,.65,.018,0,cover,true);
label(textMap(['SHIFT RECORD','03:17  // NO CHANGE','03:17  // NO CHANGE','03:17  // NO CHANGE'],'#c7c3a2','#414937',256,180),1.12,.79,0,.091,0,file,true);

// 07 / Enamel mug, thick rim, black coffee and ring handle.
const mug=prop('mug','微笑马克杯','PERSONAL EFFECT / 07',3.08,.25,.43,'杯子仍然是温的。\n点击看看杯底。');
cyl(.22,.18,.47,0,.27,0,ivory,mug,48);cyl(.204,.204,.014,0,.51,0,dark,mug,14);cyl(.174,.174,.008,0,.514,0,mat('#261c15'),mug,14);
const handle=mesh(new THREE.TorusGeometry(.165,.037,10,28),ivory,mug);handle.position.set(.278,.29,0);handle.scale.y=1.14;
const smileTexture=texture((c,w,h)=>{
 c.clearRect(0,0,w,h);c.fillStyle='#ffcc32';c.beginPath();c.arc(w/2,h/2,w*.44,0,Math.PI*2);c.fill();
 c.strokeStyle='#d99b17';c.lineWidth=4;c.stroke();c.fillStyle='#33230d';
 for(const x of [.35,.65]){c.beginPath();c.ellipse(w*x,h*.41,8,12,0,0,Math.PI*2);c.fill();}
 c.strokeStyle='#33230d';c.lineWidth=9;c.lineCap='round';c.beginPath();c.arc(w/2,h*.49,w*.22,.15,Math.PI-.15);c.stroke();
});
const smileMaterial=new THREE.MeshBasicMaterial({map:smileTexture,transparent:true,depthWrite:false});materialSet.add(smileMaterial);
const smile=mesh(new THREE.CylinderGeometry(.217,.192,.30,32,1,true,-.80,1.60),smileMaterial,mug);smile.position.y=.29;smile.castShadow=false;
label(textMap(['NOT THE FIRST'],'#b7b79b','#3a4433',256,64),.29,.09,0,.029,0,mug,true);
// 08 / Both palm and crystal shrink another 35% from the previous version.
const trophy=prop('trophy','金棕榈奖杯','PALME / 08',1.62,.65,.51,'金色棕榈枝，封存在切角水晶前。\n轻点缓慢转动。');
trophy.scale.setScalar(.65);trophy.userData.radius*=.65;
const palmModel=new THREE.Group();palmModel.scale.setScalar(2/3);trophy.add(palmModel);
const crystal=new THREE.MeshPhysicalMaterial({color:'#aecfc5',roughness:.22,metalness:.03,transmission:.68,thickness:.45,ior:1.45,envMapIntensity:1.5});materialSet.add(crystal);
const crystalShape=new THREE.Shape();const bevel=.14,w=1.22,h=1.73;
crystalShape.moveTo(-w/2+bevel,0);crystalShape.lineTo(w/2-bevel,0);crystalShape.lineTo(w/2,bevel);crystalShape.lineTo(w/2,h-bevel);crystalShape.lineTo(w/2-bevel,h);crystalShape.lineTo(-w/2+bevel,h);crystalShape.lineTo(-w/2,h-bevel);crystalShape.lineTo(-w/2,bevel);crystalShape.closePath();
const glassBlock=mesh(new THREE.ExtrudeGeometry(crystalShape,{depth:.4,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.035,bevelThickness:.035}),crystal,palmModel);glassBlock.position.set(0,.04,-.22);
const gold=new THREE.MeshPhysicalMaterial({color:'#d9b354',metalness:.91,roughness:.2,clearcoat:.6,envMapIntensity:2.4});materialSet.add(gold);
const goldEdge=mat('#e6c77f',null,.75);goldEdge.roughness=.24;
const stemPoints=[[-.36,.12,.3],[-.40,.52,.29],[-.18,1,.29],[.18,1.53,.29],[.34,1.98,.27]];
tube(stemPoints,.038,gold,palmModel);
const stemCurve=new THREE.CatmullRomCurve3(stemPoints.map(p=>new THREE.Vector3(...p)));
function palmLeaf(start,end,width){
 const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),axis=b.clone().sub(a),perp=new THREE.Vector3(-axis.y,axis.x,0).normalize();
 const verts=[],indices=[];const slices=10;
 for(let i=0;i<=slices;i++){
  const t=i/slices,center=a.clone().lerp(b,t);center.z+=Math.sin(t*Math.PI)*.055;const span=Math.sin(t*Math.PI)*width;
  for(const side of [-1,0,1]){const v=center.clone().addScaledVector(perp,span*side);v.z+=side===0?.035*Math.sin(t*Math.PI):0;verts.push(v.x,v.y,v.z);}
 }
 for(let i=0;i<slices;i++)for(let j=0;j<2;j++){const k=i*3+j;indices.push(k,k+3,k+1,k+1,k+3,k+4);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();
 const leaf=mesh(g,gold,palmModel);leaf.material.side=THREE.DoubleSide;
 tube([start,[(start[0]+end[0])*.5,(start[1]+end[1])*.5,start[2]+.08],end],.009,goldEdge,palmModel);
}
for(let i=0;i<7;i++){
 const t=.22+i*.095,p=stemCurve.getPoint(t),q=stemCurve.getPoint(Math.min(.96,t+.04));
 const reach=.59-(i/6)*.21;
 palmLeaf([p.x,p.y,p.z],[p.x+reach,p.y+.08+(i/6)*.22,p.z+.035],.055);
 palmLeaf([q.x,q.y,q.z],[q.x-reach*.72,q.y+.36-(i/6)*.08,q.z+.02],.052);
}
const tip=stemCurve.getPoint(.94);palmLeaf([tip.x,tip.y,tip.z],[.35,2.18,.28],.047);
label(textMap(['FESTIVAL','DE CANNES'],'#304a41','#d3dbbd',256,128),.47,.23,.12,.30,.225,palmModel);

// 09 / A tipped stemmed glass and the wine it left on the wood.
const wine=prop('wine','倾倒的红酒杯','AFTER THE SCREENING / 09',-1.0,.62,.67,'酒已经洒了，放映还没有结束。\n轻点晃动酒杯；拖走杯子，酒渍仍留在原处。');
const wineGlass=createSpilledWine({wine,scene:deskRoot,mesh,cyl,mat,materialSet});
const awards=createFilmAwards({prop,mesh,box,cyl,tube,mat,materialSet,texture,label,textMap});

// An old coffee ring stays on the tabletop; the two red pencils are removed.
const ringMaterial=new THREE.MeshBasicMaterial({color:'#332a1a',transparent:true,opacity:.35,side:THREE.DoubleSide});materialSet.add(ringMaterial);
const ring=mesh(new THREE.RingGeometry(.23,.26,24),ringMaterial,deskRoot);ring.rotation.x=-Math.PI/2;ring.position.set(2.6,TABLE+.026,.65);

const dissolve=createDeskDissolve({root:deskRoot,scene,geometries,materialSet});
const gallery=createObjectGallery({scene,mesh,box,cyl,sphere,tube,mat,worn,materialSet});
const directory=createDirectory({scene,mesh,materialSet,textures});
let galleryReveal=0;

// Broad sky fill and warm directional daylight keep the old wood readable.
const hemi=new THREE.HemisphereLight('#ffe0b6','#9e7967',1.8);scene.add(hemi);
const sunlight=new THREE.DirectionalLight('#ffc276',2.2);sunlight.position.set(12,6,-10);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.camera.left=-12;sunlight.shadow.camera.right=12;sunlight.shadow.camera.top=10;sunlight.shadow.camera.bottom=-10;sunlight.shadow.normalBias=.035;scene.add(sunlight);
const overhead=new THREE.SpotLight('#f5dfde',22,25,.95,.6,2);overhead.position.set(-2,6,1);overhead.target.position.set(0,TABLE,0);overhead.castShadow=false;overhead.shadow.mapSize.set(2048,2048);overhead.shadow.bias=-.0004;overhead.shadow.normalBias=.025;scene.add(overhead,overhead.target);
const rim=new THREE.PointLight('#c8e6f4',12,17,2);rim.position.set(4,4.5,-4);scene.add(rim);
const palmFill=new THREE.PointLight('#ffe0a0',22,5,2);palmFill.position.set(-3.4,4,2);scene.add(palmFill);
const underFill=new THREE.PointLight('#9c8172',16,9,2);underFill.position.set(0,-2,3);scene.add(underFill);

const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,viewCamera));composer.addPass(new OutputPass());
const analog=new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},strength:{value:1},lens:{value:0},size:{value:new THREE.Vector2(1,1)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`
 uniform sampler2D tDiffuse;uniform float time;uniform float strength;uniform float lens;uniform vec2 size;varying vec2 vUv;
 float noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 ${lensGLSL}
 void main(){
  vec2 uv=lensUV(vUv);
  if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.)))){gl_FragColor=vec4(0.,0.,0.,1.);return;}
  vec2 res=vec2(min(size.x,640.),min(size.y,480.));vec2 snapped=(floor(uv*res)+.5)/res;uv=mix(uv,snapped,strength);
  float shift=.0008*strength;vec3 col=vec3(texture2D(tDiffuse,uv+vec2(shift,0.)).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-vec2(shift,0.)).b);
  float luminance=max(col.r,max(col.g,col.b));
  if(luminance<.003){gl_FragColor=vec4(0.,0.,0.,1.);return;}
  float grain=noise(floor(vUv*res)+floor(time*9.));
  float dither=(mod(floor(vUv.x*res.x),2.)+2.*mod(floor(vUv.y*res.y),2.))/4.-.375;
  col=mix(col,floor(max(col+vec3((grain-.5)*.022+dither*.024),vec3(0.))*24.)/24.,strength*.8);
  col*=1.-.12*pow(length((vUv-.5)*vec2(1.,.8)),1.4);gl_FragColor=vec4(col,1.);
 }`});composer.addPass(analog);
let fish=0,presetMotion=null,returnMotion=null,hudTime=0,terminalClose=false,savedView=null;
const lensPointer=new THREE.Vector2(),cameraOffset=new THREE.Vector3(),orbitState=new THREE.Spherical();
function updateLens(dt){
 const desired=!terminalClose?lensAmount(controls.getAzimuthalAngle(),controls.getPolarAngle()):0;
 if(!drag)fish=THREE.MathUtils.lerp(fish,desired,reduced.matches?1:1-Math.exp(-dt*3.8));
 viewCamera.quaternion.copy(camera.quaternion);viewCamera.aspect=camera.aspect;cameraOffset.copy(camera.position).sub(controls.target);
 const distance=Math.max(Math.min(5.8,cameraOffset.length()),cameraOffset.length()*(1-.39*fish));cameraOffset.setLength(distance);
 viewCamera.position.copy(controls.target).add(cameraOffset);viewCamera.fov=camera.fov+19*fish;viewCamera.lookAt(controls.target);viewCamera.updateProjectionMatrix();viewCamera.updateMatrixWorld();analog.uniforms.lens.value=fish;
 hudTime+=dt;if(hudTime>.15){hudTime=0;canvas.dataset.lens=fish.toFixed(3);canvas.dataset.azimuth=controls.getAzimuthalAngle().toFixed(3);canvas.dataset.polar=controls.getPolarAngle().toFixed(3);canvas.dataset.cameraMode=terminalClose?'terminal':'desk';canvas.dataset.viewDistance=distance.toFixed(3);}
}

let hovered=null,selected=null,drag=null,elapsed=0,frame=0,last=0,signalInspect=false,phoneUp=false,tapeOn=false,lampOn=true,fileOpen=false,mugLift=false,trophyTurns=0,bearTurns=0,lionTurns=0,wineRock=0,toastTimer;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-TABLE),hit=new THREE.Vector3(),pickedPoint=new THREE.Vector3();
const outline=new THREE.Box3Helper(new THREE.Box3(),'#9cae75');outline.material.transparent=true;outline.material.opacity=.45;outline.visible=false;scene.add(outline);
for(const obj of objects)obj.traverse(child=>{if(child.isMesh&&!child.userData.decorative)child.userData.owner=obj;});
// The wood also participates in picking, so objects cannot be selected through the tabletop.
const interactiveMeshes=[];scene.traverse(child=>{if(child.isMesh&&!child.userData.decorative)interactiveMeshes.push(child);});
function pointerRay(x,y){const r=canvas.getBoundingClientRect();lensPoint((x-r.left)/r.width,1-(y-r.top)/r.height,r.width/r.height,fish,lensPointer);pointer.set(lensPointer.x*2-1,lensPointer.y*2-1);scene.updateMatrixWorld();raycaster.setFromCamera(pointer,viewCamera);}
function pick(x,y){pointerRay(x,y);const intersection=raycaster.intersectObjects(interactiveMeshes,false)[0];if(intersection)pickedPoint.copy(intersection.point);signalPointer=intersection?.object===screen?{x:intersection.uv.x*screenCanvas.width,y:(1-intersection.uv.y)*screenCanvas.height}:null;return intersection?.object.userData.owner||null;}
function toast(message){$('#toast').textContent=message;$('#toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.opacity=0,3200);}
function select(obj){selected=obj;canvas.dataset.selected=obj?.userData.id||'none';updateOutline();}
const partBounds=new THREE.Box3(),propBounds=new THREE.Box3();
function refreshFootprints(){
 scene.updateMatrixWorld(true);
 for(const obj of objects){
  propBounds.makeEmpty();
  obj.traverse(child=>{if(child.isMesh&&!child.userData.decorative){if(!child.geometry.boundingBox)child.geometry.computeBoundingBox();partBounds.copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld);propBounds.union(partBounds);}});
  obj.userData.footprint={minX:propBounds.min.x-obj.position.x,maxX:propBounds.max.x-obj.position.x,minZ:propBounds.min.z-obj.position.z,maxZ:propBounds.max.z-obj.position.z};
 }
}
function publishPositions(){canvas.dataset.objectPositions=JSON.stringify(Object.fromEntries(objects.map(o=>[o.userData.id,{x:+o.position.x.toFixed(4),z:+o.position.z.toFixed(4),footprint:o.userData.footprint}])));}
function placeObject(obj,x,z){const p=resolveMove(obj,x,z,objects,point=>recordPoint(obj.userData.trail,point));obj.position.x=p.x;obj.position.z=p.z;}
// Flush residual orbit velocity without changing the current rendered viewpoint.
function holdCamera(){
 const position=camera.position.clone(),target=controls.target.clone();
 controls.enableDamping=false;controls.update();camera.position.copy(position);controls.target.copy(target);controls.update();controls.enableDamping=true;controls.enabled=false;
}
refreshFootprints();publishPositions();
function updateOutline(){const obj=hovered||selected;outline.visible=!!obj&&!drag&&!terminalClose;if(outline.visible&&obj){obj.updateWorldMatrix(true,true);outline.box.makeEmpty();obj.traverse(child=>{if(child.isMesh&&!child.userData.decorative){if(!child.geometry.boundingBox)child.geometry.computeBoundingBox();partBounds.copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld);outline.box.union(partBounds);}});outline.box.expandByScalar(.035);}}
function hover(obj,x,y){hovered=obj;canvas.style.cursor=obj?(obj.userData.fixed?'pointer':'grab'):'default';$('#tip').style.display=obj&&!(terminalClose&&obj===terminal)?'block':'none';if(obj){$('#tip').textContent=nameOf(obj)+' / '+t(obj.userData.fixed?'enter':'use');$('#tip').style.left=Math.min(x,innerWidth-280)+'px';$('#tip').style.top=Math.min(y,innerHeight-70)+'px';}updateOutline();}
function updateLanguageUI(){
 shell.classList.toggle('lang-en',language==='en');canvas.setAttribute('aria-label',t('world'));
 for(const [id,key] of [['sound',soundOn?'soundOn':'soundOff'],['help','manual'],['reset','reset'],['close-help','done']])$('#'+id+' .ui-copy').textContent=t(key);
 const loading=$('#loading');if(loading)loading.textContent=t('loading');
 $('#help-dialog h2').textContent=t('manualTitle');scope.querySelectorAll('#help-dialog p').forEach((p,i)=>p.textContent=t('manualP'+(i+1)));
 $('.gallery-heading p').textContent=t(terminalStage==='menu'?'gallery':'choose');
 const hint=$('.gallery-hint');hint.replaceChildren(document.createTextNode(t(terminalStage==='menu'?'hover':'guideHint')));
 const keys=document.createElement('span');keys.textContent=t(terminalStage==='menu'?'galleryKeys':'guideKeys');hint.append(keys);
 $('#back .ui-copy').textContent=t(terminalStage==='menu'?'back':'backDesk')+' ↩';
 $('#directory-nav').setAttribute('aria-label',t('directory'));$('#channel-nav').setAttribute('aria-label',t('podcast'));
 directoryButtons.forEach((b,i)=>{b.textContent=t(modules[i].id);b.setAttribute('aria-label',t(modules[i].id));});
 const channelKeys=['filmFest','focus','cinema'];
 channelButtons.forEach((b,i)=>{b.querySelector('strong').textContent=t(channelKeys[i]);b.setAttribute('aria-label',t(channelKeys[i]));});
 $('#directory-caption').textContent=modules.some(m=>m.id===canvas.dataset.directoryHover)?t(canvas.dataset.directoryHover):'';
}
function setLanguagePhase(phase){shell.classList.toggle('locale-out',phase==='out');}
function setLanguage(next){language=validLanguage(next);updateLanguageUI();$('#tip').style.display='none';$('#toast').style.opacity=0;}
function setTerminalStage(stage){
 terminalStage=stage;canvas.dataset.terminalStage=stage;onStageChange(stage);
 shell.classList.toggle('terminal-close',stage!=='desk');
 shell.classList.toggle('gallery-mode',['dissolve','directory','menu'].includes(stage));
 shell.classList.toggle('directory-mode',stage==='directory'||stage==='dissolve');
 shell.classList.toggle('reading',stage==='reading');
 canvas.tabIndex=stage==='reading'?-1:0;canvas.setAttribute('aria-hidden',String(stage==='reading'));
 $('#back').hidden=stage==='desk'||stage==='reading';
 $('#directory-nav').hidden=stage!=='directory';$('#directory-caption').hidden=stage!=='directory';
 if(stage!=='menu')gallery.reset();
 if(stage!=='directory'&&stage!=='dissolve')directory.reset();
 directoryHover(-1);$('#channel-nav').hidden=stage!=='menu';
 if(stage==='desk'){
  menuKeyboard=-1;menuPress=null;galleryReveal=0;gallery.reset();dissolve.set(0);
  canvas.dataset.channel='none';canvas.dataset.galleryHover='none';canvas.dataset.dissolve='0';
  channelButtons.forEach(b=>b.setAttribute('aria-pressed','false'));
 }
 updateLanguageUI();
}
function openChannels(){
 if(terminalStage!=='approach')return;
 hover(null,0,0);dissolve.capture();dissolveStarted=elapsed;setTerminalStage('dissolve');
 $('#toast').style.opacity=0;
}
function chooseChannel(index){
 if(terminalStage!=='menu'||index<0||index>=channels.length)return;
 gallery.select(index);menuKeyboard=index;canvas.dataset.channel=channels[index].id;
 channelButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
 clickTone();navigateSite('podcast/'+channels[index].id);
}
function galleryHover(index){
 gallery.hover(index);canvas.dataset.galleryHover=index<0?'none':channels[index].id;
 channelButtons.forEach((b,i)=>b.classList.toggle('is-hovered',i===index));
 canvas.style.cursor=index>=0?'pointer':'default';
}
function directoryHover(index){
 directory.hover(index);canvas.dataset.directoryHover=index<0?'none':modules[index].id;
 $('#directory-caption').textContent=index<0?'':t(modules[index].id);
 canvas.style.cursor=index>=0?'pointer':'default';
}
function chooseDirectory(index){
 if(terminalStage!=='directory'||!modules[index])return;
 clickTone();if(modules[index].id==='podcast'){setTerminalStage('menu');galleryReveal=0;publishStage();canvas.focus({preventScroll:true});}
 else navigateSite(modules[index].id);
}
function activeHover(i){terminalStage==='directory'?directoryHover(i):galleryHover(i);}
function chooseActive(i){terminalStage==='directory'?chooseDirectory(i):chooseChannel(i);}
function pickChannel(x,y){pointerRay(x,y);return raycaster.intersectObjects(terminalStage==='directory'?directory.targets:gallery.targets,false)[0]?.object.userData.channel??-1;}
function activate(obj){
 if(!obj||terminalStage!=='desk')return;select(obj);clickTone();
 switch(obj.userData.id){
  case'terminal':{
   playVoice('welcome');
   if(terminalStage==='desk'){focusTerminal();signalInspect=true;toast(t('approach'));}
   break;
  }
  case'phone':phoneUp=!phoneUp;say(phoneUp?'屏幕亮起：03:17 / 没有信号。':'手机已合上。',phoneUp?'03:17 / No signal.':'Phone closed.');break;
  case'tape':tapeOn=!tapeOn;say(tapeOn?'正在播放：上一班的空白录音。':'磁带已暂停',tapeOn?'Playing a blank recording from the last shift.':'Tape paused.');break;
  case'lamp':playVoice('bark');lampOn=!lampOn;say(lampOn?'巴哥犬戴好眼镜，继续观影。':'巴哥犬歪了歪头。',lampOn?'Glasses on. The film continues.':'The pug tilts its head.');break;
  case'file':fileOpen=!fileOpen;say(fileOpen?'交接记录：03:17 / 没有变化。':'档案已合上。',fileOpen?'Shift record: 03:17 / No change.':'File closed.');break;
  case'mug':playVoice('hongjiu');mugLift=!mugLift;say(mugLift?'杯底刻着：你不是第一个。':'杯子仍然是温的。',mugLift?'Underneath: You are not the first.':'The mug is still warm.');break;
  case'trophy':trophyTurns++;say('金棕榈 · 另一面的光','Palme d’Or · Light on the other side');break;
  case'bear':bearTurns++;say('金熊 · 柏林的金色回声','Golden Bear · An echo of Berlin');break;
  case'lion':lionTurns++;say('金狮 · 威尼斯的风','Golden Lion · A breeze from Venice');break;
  case'wine':wineRock=reduced.matches?0:1;say('酒杯轻轻晃动，酒渍留在原处。','The glass rocks. The wine stain stays.');break;
 }
 canvas.dataset.lastAction=obj.userData.id;canvas.dataset.actionCount=String(Number(canvas.dataset.actionCount||0)+1);
}
function begin(event){
 if(terminalClose){
  if(event.button===0&&['menu','directory'].includes(terminalStage)){
   menuPress={id:event.pointerId,x:event.clientX,y:event.clientY,index:pickChannel(event.clientX,event.clientY)};
   activeHover(menuPress.index);canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});
  }
  event.stopImmediatePropagation();event.preventDefault();return;
 }
 stopReturnMotion();stopCameraMotion();if(event.button!==0||drag)return;const obj=pick(event.clientX,event.clientY);if(!obj)return;
 refreshFootprints();plane.constant=-pickedPoint.y;
 if(!raycaster.ray.intersectPlane(plane,hit))return;
 obj.parent.worldToLocal(hit);
 drag={obj,id:event.pointerId,startX:event.clientX,startY:event.clientY,startHit:hit.clone(),gain:event.shiftKey?.2:1,moved:false,origin:obj.position.clone(),trail:obj.userData.trail.map(p=>({...p}))};
 holdCamera();canvas.dataset.dragging=obj.userData.id;canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});select(obj);event.stopImmediatePropagation();event.preventDefault();
}
function move(event){
 if(terminalClose){if(['menu','directory'].includes(terminalStage)){menuKeyboard=-1;activeHover(pickChannel(event.clientX,event.clientY));}event.stopImmediatePropagation();return;}
 if(drag&&event.pointerId===drag.id){
  drag.moved ||= isDrag(event.clientX,event.clientY,drag.startX,drag.startY);
  if(drag.moved&&!drag.obj.userData.fixed){pointerRay(event.clientX,event.clientY);if(raycaster.ray.intersectPlane(plane,hit)){drag.obj.parent.worldToLocal(hit);placeObject(drag.obj,drag.origin.x+(hit.x-drag.startHit.x)*drag.gain,drag.origin.z+(hit.z-drag.startHit.z)*drag.gain);}canvas.style.cursor='grabbing';$('#tip').style.display='none';outline.visible=false;}
  event.stopImmediatePropagation();return;
 }
 if(!event.buttons)hover(pick(event.clientX,event.clientY),event.clientX,event.clientY);
}
function end(event){
 if(menuPress&&event.pointerId===menuPress.id){
  const press=menuPress;menuPress=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  if(!isDrag(event.clientX,event.clientY,press.x,press.y)&&press.index===pickChannel(event.clientX,event.clientY))chooseActive(press.index);
  event.stopImmediatePropagation();return;
 }
 if(terminalClose&&!drag)return;
 if(!drag||event.pointerId!==drag.id)return;const current=drag;drag=null;canvas.dataset.dragging='none';publishPositions();controls.enabled=!terminalClose;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(current.moved){if(current.obj.userData.fixed)toast(t('fixed'));else{canvas.dataset.lastDrag=current.obj.userData.id;toast(nameOf(current.obj)+' · '+t('positionAdjusted'));}}else activate(current.obj);event.stopImmediatePropagation();hover(current.obj,event.clientX,event.clientY);}
function cancel(){if(menuPress){const id=menuPress.id;menuPress=null;if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}galleryHover(-1);if(drag){const id=drag.id;drag.obj.position.copy(drag.origin);drag.obj.userData.trail=drag.trail;drag=null;canvas.dataset.dragging='none';publishPositions();if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}controls.enabled=!terminalClose;hover(null,0,0);}
canvas.addEventListener('pointerdown',begin,true);canvas.addEventListener('pointermove',move,true);canvas.addEventListener('pointerup',end,true);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',()=>{if(drag||menuPress)cancel();});canvas.addEventListener('pointerleave',()=>{if(['menu','directory'].includes(terminalStage))activeHover(-1);else if(!drag)hover(null,0,0);});

let audio=null,audioGain=null,soundOn=true;
const voice=$('#object-voice');
voice.onplaying=()=>{voice.dataset.state='playing';};
voice.onended=()=>{voice.dataset.state='ended';};
function stopVoice(){voice.pause();voice.currentTime=0;voice.dataset.state='stopped';}
function playVoice(clip){
 if(!soundOn)return;
 stopVoice();voice.dataset.clip=clip;voice.dataset.state='loading';
 voice.src=import.meta.env.BASE_URL+'audio/'+clip+'.wav';voice.volume=.9;
 voice.play().catch(error=>{if(error.name!=='AbortError'&&!disposed){voice.dataset.state='error';toast(t('noAudio'));}});
}
function initAudio(){audio=new (window.AudioContext||window.webkitAudioContext)();audioGain=audio.createGain();audioGain.gain.value=soundOn?.7:0;audioGain.connect(audio.destination);
 for(const freq of [50,100,151]){const osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=freq;gain.gain.value=freq===50?.035:.008;osc.connect(gain);gain.connect(audioGain);osc.start();}
 const noiseBuffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),a=noiseBuffer.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(rnd()-.5)*.08;
 const source=audio.createBufferSource(),filter=audio.createBiquadFilter();source.buffer=noiseBuffer;source.loop=true;filter.type='lowpass';filter.frequency.value=500;source.connect(filter);filter.connect(audioGain);source.start();
}
function clickTone(){if(!soundOn)return;try{if(!audio)initAudio();}catch{return;}void audio.resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(230,audio.currentTime);o.frequency.exponentialRampToValueAtTime(70,audio.currentTime+.08);g.gain.setValueAtTime(.05,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.1);o.connect(g);g.connect(audioGain);o.start();o.stop(audio.currentTime+.12);}
$('#sound').onclick=async()=>{try{if(!audio)initAudio();soundOn=!soundOn;if(!soundOn)stopVoice();await audio.resume();audioGain.gain.setTargetAtTime(soundOn?.7:0,audio.currentTime,.2);updateLanguageUI();$('#sound').setAttribute('aria-pressed',String(soundOn));}catch{toast(t('noAudio'));}};
function stopReturnMotion(){
 if(!returnMotion)return;
 for(const item of returnMotion.items){
  item.obj.userData.trail=item.route.points.slice(item.sample.segment+1).reverse().map(p=>({...p}));
  if(!item.obj.userData.trail.length)item.obj.userData.trail=[{x:item.obj.userData.home.x,z:item.obj.userData.home.z}];
  recordPoint(item.obj.userData.trail,item.obj.position);
 }
 returnMotion=null;canvas.dataset.returning='false';publishPositions();
}
function reset(){
 cancel();stopReturnMotion();holdCamera();stopVoice();presetMotion=null;select(null);
 returnMotion={elapsed:0,items:objects.filter(o=>!o.userData.fixed).map(obj=>({obj,route:returnRoute(obj.userData.trail,obj.position),sample:{segment:0}}))};
 canvas.dataset.returning='true';terminalClose=false;controls.enabled=true;savedView=null;setTerminalStage('desk');
 tapeOn=fileOpen=mugLift=false;phoneUp=false;lampOn=true;trophyTurns=bearTurns=lionTurns=wineRock=0;signalInspect=false;
 const home=homeCameraView();cameraOffset.copy(home.position).sub(home.target);orbitState.setFromVector3(cameraOffset);
 moveCamera(home.target,orbitState.theta,orbitState.phi,orbitState.radius);publishStage();
}
$('#reset').onclick=reset;$('#help').onclick=()=>$('#help-dialog').showModal();$('#close-help').onclick=()=>$('#help-dialog').close();
function key(event){
 // Scene shortcuts only apply to the focused canvas, never a form or global control.
 if(event.composedPath()[0]!==canvas||$('#help-dialog').open||terminalStage==='reading')return;
 if(event.key.toLowerCase()==='r'){reset();return;}
 if(event.key==='Escape'){cancel();if(terminalClose)goBack();select(null);return;}
 const arrow=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key);
 if(['menu','directory'].includes(terminalStage)&&arrow){
  event.preventDefault();const count=terminalStage==='directory'?4:3;const step=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:(event.key==='ArrowUp'?-1:1)*(count===4?2:1);
  menuKeyboard=menuKeyboard<0?0:(menuKeyboard+step+count)%count;activeHover(menuKeyboard);return;
 }
 if(['menu','directory'].includes(terminalStage)&&event.key==='Enter'){event.preventDefault();chooseActive(menuKeyboard<0?0:menuKeyboard);return;}
 if(terminalClose)return;
 if(event.key==='Enter'){event.preventDefault();stopReturnMotion();activate(selected||terminal);}
 if(arrow){
  event.preventDefault();
  if(!event.shiftKey){const i=objects.indexOf(selected),step=event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1;select(objects[i<0?0:(i+step+objects.length)%objects.length]);toast(nameOf(selected));return;}
  if(!selected)return;
  if(selected.userData.fixed){toast(t('fixed'));return;}
  stopReturnMotion();const step=event.altKey?.005:.03;refreshFootprints();
  placeObject(selected,selected.position.x+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),selected.position.z+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0));canvas.dataset.lastDrag=selected.userData.id;publishPositions();updateOutline();
 }
}
window.addEventListener('keydown',key);
function homeCameraView(){
 const compact=innerWidth<700,aspect=innerWidth/innerHeight;
 const distance=Math.max(10.7,4.75/(Math.tan(THREE.MathUtils.degToRad(compact?55:46)/2)*aspect)+1.1);
 return {target:new THREE.Vector3(0,2.05,0),position:new THREE.Vector3(distance*.04,2.05+distance*.34,distance),distance};
}
function resetCamera(){
 terminalClose=false;controls.enabled=true;setTerminalStage('desk');savedView=null;$('#back').hidden=true;controls.maxTargetRadius=1.1;
 const {position,distance}=homeCameraView();
 controls.enableDamping=false;controls.update();controls.target.set(0,2.05,0);controls.cursor.copy(controls.target);
 camera.position.copy(position);controls.maxDistance=Math.max(22,distance+5);controls.minDistance=6.8;
 controls.update();controls.enableDamping=true;fish=0;updateLens(.016);
}
// A single camera owner eases orbit, target and distance; controls keep damping outside transitions.
function moveCamera(target,theta,phi,radius){
 controls.enableDamping=false;controls.update();controls.enableDamping=true;
 controls.minDistance=1.4;controls.maxTargetRadius=Infinity;
 presetMotion={target:target.clone(),theta:controls.getAzimuthalAngle()+Math.atan2(Math.sin(theta-controls.getAzimuthalAngle()),Math.cos(theta-controls.getAzimuthalAngle())),phi,radius};
}
function focusTerminal(){
 setTerminalStage('approach');controls.enabled=false;
 if(!terminalClose)savedView={target:controls.target.clone(),theta:controls.getAzimuthalAngle(),phi:controls.getPolarAngle(),radius:camera.position.distanceTo(controls.target)};
 terminalClose=true;$('#back').hidden=false;
 screen.getWorldPosition(focusTarget);
 moveCamera(focusTarget,0,Math.PI/2,terminalViewDistance(camera.aspect,camera.fov));
}
const focusTarget=new THREE.Vector3();
function stopCameraMotion(){
 if(!presetMotion||terminalClose)return;
 presetMotion=null;controls.cursor.copy(controls.target);controls.maxTargetRadius=1.1;
 controls.minDistance=terminalClose?1.4:Math.min(6.8,camera.position.distanceTo(controls.target));
}
controls.addEventListener('start',stopCameraMotion);
function returnToDesk(){
 if(!terminalClose)return;
 terminalClose=false;controls.enabled=true;setTerminalStage('desk');$('#back').hidden=true;signalInspect=false;
 if(savedView){moveCamera(savedView.target,savedView.theta,savedView.phi,savedView.radius);savedView=null;}
 else resetCamera();
 publishStage();toast(t('returned'));
}
channelButtons.forEach((b,i)=>{b.onclick=()=>chooseChannel(i);b.onfocus=b.onpointerenter=()=>{if(terminalStage==='menu'){menuKeyboard=i;galleryHover(i);}};b.onblur=b.onpointerleave=()=>galleryHover(-1);});
function goBack(){cancel();if(terminalStage==='menu'){setTerminalStage('directory');galleryReveal=1;publishStage();canvas.focus({preventScroll:true});}else returnToDesk();select(null);}
$('#back').onclick=goBack;
directoryButtons.forEach((b,i)=>{b.onclick=()=>chooseDirectory(i);b.onfocus=()=>{menuKeyboard=i;directoryHover(i);};b.onblur=()=>directoryHover(-1);});
function resize(){
 const compact=innerWidth<700;camera.aspect=innerWidth/innerHeight;camera.fov=compact?55:46;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight,false);composer.setSize(innerWidth,innerHeight);analog.uniforms.size.value.set(innerWidth,innerHeight);presetMotion=null;
 if(terminalClose){
  screen.getWorldPosition(focusTarget);controls.target.copy(focusTarget);controls.cursor.copy(focusTarget);
  camera.position.copy(focusTarget).add(new THREE.Vector3(0,0,terminalViewDistance(camera.aspect,camera.fov)));controls.update();updateLens(.016);
  if(terminalStage==='approach')openChannels();
 }else resetCamera();
}
resize();window.addEventListener('resize',resize);
function applyRoute(route){
 const stage=routeToStage(route),wasReading=terminalStage==='reading';if(!stage||stage===terminalStage)return;
 if(stage==='desk'){returnToDesk();return;}
 cancel();presetMotion=null;terminalClose=true;controls.enabled=false;$('#back').hidden=false;
 controls.minDistance=1.4;controls.maxTargetRadius=Infinity;screen.getWorldPosition(focusTarget);controls.target.copy(focusTarget);controls.cursor.copy(focusTarget);
 camera.position.copy(focusTarget).add(new THREE.Vector3(0,0,terminalViewDistance(camera.aspect,camera.fov)));controls.update();updateLens(.016);
 dissolve.set(1);canvas.dataset.dissolve='1';galleryReveal=1;setTerminalStage(stage);if(wasReading&&stage!=='reading')canvas.focus({preventScroll:true});
}
let disposed=false;
function draw(ms){frame=0;if(disposed||document.hidden)return;const dt=Math.min((ms-last)/1000||.016,.05);last=ms;elapsed+=dt;
 if(presetMotion){
  cameraOffset.copy(camera.position).sub(controls.target);orbitState.setFromVector3(cameraOffset);
  const k=reduced.matches?1:1-Math.exp(-dt*4);
  const theta=presetMotion.theta+Math.atan2(Math.sin(orbitState.theta-presetMotion.theta),Math.cos(orbitState.theta-presetMotion.theta));
  orbitState.theta=THREE.MathUtils.lerp(theta,presetMotion.theta,k);orbitState.phi=THREE.MathUtils.lerp(orbitState.phi,presetMotion.phi,k);orbitState.radius=THREE.MathUtils.lerp(orbitState.radius,presetMotion.radius,k);
  controls.target.lerp(presetMotion.target,k);camera.position.copy(controls.target).add(cameraOffset.setFromSpherical(orbitState));
  if(Math.abs(orbitState.theta-presetMotion.theta)+Math.abs(orbitState.phi-presetMotion.phi)+Math.abs(orbitState.radius-presetMotion.radius)+controls.target.distanceTo(presetMotion.target)<.002){
   controls.cursor.copy(presetMotion.target);controls.maxTargetRadius=1.1;controls.minDistance=terminalClose?1.4:6.8;presetMotion=null;if(terminalStage==='approach')openChannels();
  }
 }
 // Allow a full orbit around the floating cloud platform, including its underside.
 if(!terminalClose)controls.maxPolarAngle=Math.PI-.035;
 if(!drag)controls.update();updateLens(dt);
 const ease=1-Math.exp(-dt*8),fixed=reduced.matches;
 if(returnMotion){
  returnMotion.elapsed+=dt;const progress=fixed?1:Math.min(1,returnMotion.elapsed/1.35),eased=.5-.5*Math.cos(Math.PI*progress);
  for(const item of returnMotion.items){sampleReturn(item.route,eased,item.sample);item.obj.position.x=item.sample.x;item.obj.position.z=item.sample.z;}
  publishPositions();
  if(progress===1){for(const item of returnMotion.items){const h=item.obj.userData.home;item.obj.position.x=h.x;item.obj.position.z=h.z;item.obj.userData.trail=[{x:h.x,z:h.z}];}returnMotion=null;canvas.dataset.returning='false';publishPositions();toast(t('resetDone'));}
 }
 phoneLid.rotation.x=THREE.MathUtils.lerp(phoneLid.rotation.x,phoneUp?-2.25:0,fixed?1:ease);
 palmModel.rotation.y=THREE.MathUtils.lerp(palmModel.rotation.y,trophyTurns*Math.PI/2,fixed?1:ease);
 awards.bearModel.rotation.y=THREE.MathUtils.lerp(awards.bearModel.rotation.y,bearTurns*Math.PI/2,fixed?1:ease);
 awards.lionModel.rotation.y=THREE.MathUtils.lerp(awards.lionModel.rotation.y,lionTurns*Math.PI/2,fixed?1:ease);
 sunsetWorld.update(elapsed,fixed);
 cover.rotation.z=THREE.MathUtils.lerp(cover.rotation.z,fileOpen?2.15:0,fixed?1:ease);
 mug.rotation.z=THREE.MathUtils.lerp(mug.rotation.z,mugLift?-.9:0,fixed?1:ease);mug.position.y=THREE.MathUtils.lerp(mug.position.y,TABLE+(mugLift?.65:0),fixed?1:ease);
 if(tapeOn&&!fixed)for(const r of reels)r.rotation.y+=dt*1.6;
 lampLight.intensity=lampOn?8:0;bulb.emissiveIntensity=lampOn?2:0;
 pug.head.rotation.z=THREE.MathUtils.lerp(pug.head.rotation.z,lampOn?0:-.18,fixed?1:ease);
 pug.redLens.opacity=pug.blueLens.opacity=lampOn?.96:.58;
 wineRock=Math.max(0,wineRock-dt*1.8);wineGlass.rotation.x=fixed?0:Math.sin((1-wineRock)*Math.PI*5)*wineRock*.075;
 const screenChanged=deskRoot.visible&&signalScreen.draw(elapsed,dt,{reduced:fixed,active:signalInspect||hovered===terminal,point:signalPointer});
 if(screenChanged)screenTexture.needsUpdate=true;
if(terminalStage==='dissolve'){
  const phase=galleryPhase(elapsed-dissolveStarted,fixed);dissolve.set(phase.dissolve);galleryReveal=phase.reveal;
  canvas.dataset.dissolve=phase.dissolve.toFixed(3);
  if(phase.done){setTerminalStage('directory');galleryReveal=1;publishStage();canvas.focus({preventScroll:true});}
 }
 if(['dissolve','directory','menu','reading'].includes(terminalStage)){
  const fade=1-Number(canvas.dataset.dissolve||0);lampLight.intensity*=fade;screenGlow.intensity=1.4*fade;
  if(terminalStage==='menu'){galleryReveal=Math.min(1,galleryReveal+(fixed?1:dt*2.5));gallery.update({camera:viewCamera,aspect:camera.aspect,fov:camera.fov,reveal:galleryReveal,time:elapsed,delta:dt,reduced:fixed,labels:channelButtons,width:innerWidth,height:innerHeight});}
  else if(terminalStage!=='reading')directory.update({camera:viewCamera,width:innerWidth,height:innerHeight,time:elapsed,delta:dt,reduced:fixed,reveal:galleryReveal,nav:$('#directory-nav'),caption:$('#directory-caption')});
 }else screenGlow.intensity=1.4;
 analog.uniforms.time.value=fixed?0:elapsed;updateOutline();composer.render();if(canvas.dataset.ready!=='true')canvas.dataset.ready='true';
 frame=requestAnimationFrame(draw);
}
function visibility(){if(disposed)return;cancelAnimationFrame(frame);frame=0;last=0;if(document.hidden){stopVoice();if(audio)audio.suspend();}else{if(soundOn&&audio)audio.resume();frame=requestAnimationFrame(draw);}}
document.addEventListener('visibilitychange',visibility);
frame=requestAnimationFrame(draw);const loading=$('#loading');loading.style.opacity=0;const loadingTimer=setTimeout(()=>loading.remove(),750);
function dispose(){if(disposed)return;disposed=true;stopVoice();voice.removeAttribute('src');voice.load();clearTimeout(loadingTimer);window.removeEventListener('pagehide',pagehide);cancelAnimationFrame(frame);clearTimeout(toastTimer);window.removeEventListener('resize',resize);window.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);controls.dispose();for(const pass of composer.passes)pass.dispose();composer.dispose();for(const g of geometries)g.dispose();for(const m of materialSet)m.dispose();for(const t of textures)t.dispose();outline.geometry.dispose();outline.material.dispose();reflection.dispose();renderer.dispose();renderer.forceContextLoss();audio?.close();}
function pagehide(event){if(!event.persisted)dispose();}
window.addEventListener('pagehide',pagehide);
canvas.dataset.objectIds=objects.map(o=>o.userData.id).join(',');
applyRoute(initialRoute);
return {setRoute:applyRoute,setLanguage,setLanguagePhase,dispose};
}
