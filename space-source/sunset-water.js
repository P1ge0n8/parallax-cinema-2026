import * as THREE from 'three';

// A film-still-inspired sunset pool: four separate figures, a square sun, and a ladder.
export function createSunsetWater({scene,mesh,box,cyl,tube,texture,mat,materialSet}){
 const world=new THREE.Group();world.name='Sunset water / four silhouettes';scene.add(world);
 let seed=198;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 scene.background=texture((c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#986746');g.addColorStop(.43,'#c48138');g.addColorStop(.76,'#edab3d');g.addColorStop(1,'#e2ae64');c.fillStyle=g;c.fillRect(0,0,w,h);},16,128);
 scene.fog=new THREE.Fog('#c7955a',38,150);
 const deckMap=texture((c,w,h)=>{c.fillStyle='#ae9671';c.fillRect(0,0,w,h);for(let i=0;i<1200;i++){c.fillStyle=i%2?'#86775d33':'#d9bf8d44';c.fillRect(random()*w,random()*h,1+random()*3,1);}},128,128);
 deckMap.wrapS=deckMap.wrapT=THREE.RepeatWrapping;deckMap.repeat.set(25,25);
 const deckMaterial=mat('#e2c7a1',deckMap);const deck=mesh(new THREE.PlaneGeometry(180,150),deckMaterial,world);deck.rotation.x=-Math.PI/2;deck.position.set(0,-.07,69);deck.castShadow=false;
 const coping=mat('#aa8664');box(180,.18,.45,0,-.13,-6.05,coping,world);
 const geo=new THREE.PlaneGeometry(230,180,110,75);geo.rotateX(-Math.PI/2);geo.translate(0,-.30,-96.4);
 const p=geo.attributes.position,base=p.array.slice(),colors=new Float32Array(p.count*3),shimmer=new Float32Array(p.count),reflection=new Float32Array(p.count);
 const water=new THREE.Color('#53616b'),gold=new THREE.Color('#f0b454'),temp=new THREE.Color();
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i),axis=z*.05,width=1.2+(-z)*.022;
  reflection[i]=Math.exp(-Math.pow((x-axis)/width,2));shimmer[i]=random();
  temp.copy(water).lerp(gold,reflection[i]*(.35+random()*.65));temp.multiplyScalar(.64+random()*.45);temp.toArray(colors,i*3);
 }
 geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
 const seaMaterial=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});materialSet.add(seaMaterial);
 const sea=mesh(geo,seaMaterial,world);sea.castShadow=sea.receiveShadow=false;
 const edge=mat('#655b50');
 // One low platform reaches into the water at the left of the table.
 box(5.4,.16,2.8,-7.25,.01,-8.1,edge,world);box(1.3,.14,2.1,-7.25,-.01,-6.3,edge,world);
 const silhouettes=new THREE.Group();silhouettes.name='Exactly four people';world.add(silhouettes);
 const darks=['#38231b','#3e2920','#30231f','#4a2a1c'].map(color=>{const m=new THREE.MeshBasicMaterial({color,fog:true});materialSet.add(m);return m;});
 function limb(parent,a,b,r,material){const v=new THREE.Vector3(...a),end=new THREE.Vector3(...b),d=end.clone().sub(v);const o=mesh(new THREE.CylinderGeometry(r*.84,r,d.length(),7),material,parent);o.position.copy(v).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
 function oval(parent,x,y,z,sx,sy,sz,material){const o=mesh(new THREE.SphereGeometry(1,8,6),material,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;}
 for(let i=0;i<4;i++){
  const person=new THREE.Group();person.name='Silhouette '+(i+1);person.position.set(-8.65+i*.93,.10,-8.15+(i%2)*.18);person.rotation.y=[.30,-.24,.22,-.65][i];person.scale.setScalar([1.16,1.23,1.12,1.17][i]);silhouettes.add(person);
  const m=darks[i];cyl(.19,.25,.55,0,1.26,0,m,person,7);oval(person,0,.94,0,.225,.17,.16,m);
  cyl(.066,.08,.12,0,1.61,0,m,person,7);oval(person,0,1.82,0,.17,.21,.16,m);
  oval(person,0,1.91,-.045,.18,.14,.16,m);if(i===1)oval(person,.11,1.99,-.10,.09,.10,.08,m);
  for(const sign of [-1,1]){
   const x=sign*.13,bend=i===3&&sign>0?.08:0;
   limb(person,[x,.93,0],[x+bend,.52,.015],.095,m);limb(person,[x+bend,.52,.015],[x+sign*.02,.10,.025],.075,m);
   oval(person,x+sign*.02,.07,.095,.095,.07,.16,m);
  }
  const left=i===0?[[-.20,1.48,0],[-.36,1.15,.02],[-.28,.91,.1]]:[[-.20,1.48,0],[-.31,1.18,.04],[-.33,.91,.06]];
  const right=i===2?[[.20,1.48,0],[.40,1.36,.02],[.48,1.53,.04]]:i===3?[[.20,1.48,0],[.32,1.19,.1],[.05,1.12,.25]]:[[.20,1.48,0],[.30,1.18,.02],[.30,.91,.04]];
  for(const arm of [left,right]){limb(person,arm[0],arm[1],.067,m);limb(person,arm[1],arm[2],.052,m);oval(person,...arm[2],.06,.08,.05,m);}
 }
 // Two bent steel rails and rungs descend from the right-hand deck into the pool.
 const rail=mat('#b69971',null,.68);rail.roughness=.32;
 for(const x of [4.6,5.75])tube([[x,.02,-5.75],[x,1.45,-5.75],[x,1.66,-6.0],[x,1.43,-6.45],[x,-1.05,-6.45]],.065,rail,world);
 for(let i=0;i<5;i++){const rung=cyl(.04,.04,1.15,5.175,.83-i*.34,-6.45,rail,world,8);rung.rotation.z=Math.PI/2;}
 const sunMaterial=new THREE.MeshBasicMaterial({color:'#ffe3a1',toneMapped:false,fog:false});materialSet.add(sunMaterial);
 const sun=mesh(new THREE.PlaneGeometry(5.1,5.1),sunMaterial,world);sun.position.set(-4,.65,-82);sun.castShadow=sun.receiveShadow=false;
 const haloMap=texture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,216,121,.48)');g.addColorStop(.3,'rgba(255,189,74,.26)');g.addColorStop(1,'rgba(255,164,53,0)');c.fillStyle=g;c.fillRect(0,0,w,h);},64,64);
 const haloMat=new THREE.SpriteMaterial({map:haloMap,transparent:true,depthWrite:false,toneMapped:false,fog:false});materialSet.add(haloMat);const halo=new THREE.Sprite(haloMat);halo.position.copy(sun.position);halo.scale.set(22,22,1);world.add(halo);
 // Muted horizontal cloud streaks preserve the reference's hazy, empty horizon.
 const hazeMat=new THREE.MeshBasicMaterial({color:'#ba814a',transparent:true,opacity:.16,depthWrite:false,fog:false});materialSet.add(hazeMat);
 for(const [x,y,z,w,h] of [[-24,14,-85,65,1.4],[-8,9,-94,72,.8],[39,16,-115,55,1.1]]){const o=mesh(new THREE.PlaneGeometry(w,h),hazeMat,world);o.position.set(x,y,z);o.castShadow=false;}
 world.traverse(o=>{o.userData.decorative=true;});
 return {peopleCount:silhouettes.children.length,update(time,reduced){
  const t=reduced?0:time;
  for(let i=0;i<p.count;i++){
   const x=base[i*3],z=base[i*3+2];p.setY(i,-.3+Math.sin(x*.65+z*.72+t*.7)*.048+Math.sin(z*1.2-t*.6)*.025);
   const glint=reflection[i]*(.38+.62*Math.max(0,Math.sin(z*2.3+t*1.2+shimmer[i]*3)));
   temp.copy(water).lerp(gold,glint).multiplyScalar(.67+shimmer[i]*.36);temp.toArray(colors,i*3);
  }
  p.needsUpdate=true;geo.attributes.color.needsUpdate=true;
 }};
}
