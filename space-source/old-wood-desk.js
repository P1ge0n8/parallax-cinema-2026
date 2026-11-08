import * as THREE from 'three';

export function createWoodDesk({scene,box,cyl,mesh,texture,mat,materialSet,TABLE}) {
 const group=new THREE.Group();group.name='Cracked oak desk';scene.add(group);
 let seed=83;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function grain(base){return texture((c,w,h)=>{
  c.fillStyle=base;c.fillRect(0,0,w,h);
  for(let i=0;i<150;i++){
   const y=random()*h;c.strokeStyle=i%3?`rgba(27,15,8,${.08+random()*.24})`:`rgba(224,186,128,${.05+random()*.14})`;c.lineWidth=.5+random()*2;
   c.beginPath();for(let x=0;x<=w;x+=8){const dy=Math.sin(x*.017+i)*1.7+Math.sin(x*.051+i)*.6;x?c.lineTo(x,y+dy):c.moveTo(x,y+dy);}c.stroke();
  }
  for(let k=0;k<3;k++){
   const x=70+random()*(w-140),y=20+random()*(h-40);
   for(let r=12;r>1;r-=1.6){c.strokeStyle=`rgba(31,17,10,${.14+random()*.18})`;c.lineWidth=.8;c.beginPath();c.ellipse(x,y,r*3.4,r,0,0,Math.PI*2);c.stroke();}
  }
  for(let i=0;i<450;i++){c.fillStyle=random()>.5?'#bda17a28':'#21160d40';c.fillRect(random()*w,random()*h,1+random()*25,1);}
 },512,128);}
 const plankColors=['#786042','#806749','#6e553a','#8c7150','#735c40'];
 const iron=mat('#302e26',null,.55),heart=mat('#372619',grain('#795938'));heart.roughness=1;
 const wood=[];
 // Five individually cut boards. The outline contains actual split ends and chipped corners.
 for(let i=0;i<5;i++){
  const length=7.8-(i===1?.08:0),half=length/2,d=.712,split=.022+i*.003;
  const shape=new THREE.Shape();
  const points=[[-half+.08,-d/2],[-half+.015,-d/2+.07],[-half,d/2-.1],[-half+.07,d/2],
   [half-.1,d/2],[half,d/2-.08],[half,d*.16+split],[half-.62-i*.05,d*.13],[half-.14,d*.16-split],
   [half-.018,-d/2+.04],[half-.11,-d/2],[.8,-d/2],[.77,-d/2+.026],[-.45,-d/2+.012]];
  points.forEach(([x,y],j)=>j?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.23,steps:1,bevelEnabled:true,bevelSegments:1,bevelThickness:.018,bevelSize:.012,curveSegments:1});
  // Normalize planar UVs so the visible grain follows the full board length.
  const uv=geo.attributes.uv,p=geo.attributes.position;
  for(let j=0;j<uv.count;j++)uv.setXY(j,(p.getX(j)+half)/length,(p.getY(j)+d/2)/d);
  const m=mat('#e3d4b5',grain(plankColors[i]),0);m.roughness=.97;wood.push(m);
  const plank=mesh(geo,m,group);plank.rotation.x=-Math.PI/2;plank.position.set(0,TABLE-.25,(i-2)*.73);
  // Hairline cracks are tapered polygons, visibly sunk into the top, with forks.
  for(let j=0;j<3;j++){
   const start=-3.5+random()*4.8,z=(i-2)*.73+(random()-.5)*.42,len=.5+random()*1.6;
   const points3=[start,TABLE-.0005,z,start+len*.32,TABLE-.0005,z+.012,start+len*.68,TABLE-.0005,z-.022,start+len,TABLE-.0005,z-.008,start+len*.58,TABLE-.0005,z-.045,start+len*.21,TABLE-.0005,z-.014];
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points3,3));g.setIndex([0,5,1,1,5,4,1,4,2,2,4,3]);g.computeVertexNormals();
   const crack=mesh(g,heart,group);crack.material.side=THREE.DoubleSide;crack.castShadow=false;
  }
 }
 const legWood=mat('#a28b6b',grain('#6b5037'),0),edgeWood=mat('#b29c7c',grain('#67503a'),0);
 // Heavy timber apron and tapered, imperfect legs replace the metal cabinet frame.
 box(7.12,.34,.16,0,TABLE-.47,-1.4,edgeWood,group,.012);box(7.12,.34,.16,0,TABLE-.47,1.4,edgeWood,group,.012);
 for(const x of [-3.43,3.43]){
  box(.16,.34,2.7,x,TABLE-.47,0,edgeWood,group,.012);
  for(const z of [-1.35,1.35]){
   const leg=mesh(new THREE.CylinderGeometry(.23,.17,TABLE-.25,4,1),legWood,group);leg.rotation.y=Math.PI/4;leg.rotation.z=x>0?-.018:.018;leg.position.set(x,(TABLE-.25)/2,z);
   for(const y of [.08,.2]){const band=box(.32,.055,.32,x,y,z,iron,group);band.rotation.y=.012;}
   // Square iron nails and side repairs, part of the table rather than floating scenery.
   const nail=cyl(.023,.023,.008,x,TABLE+.002,z,iron,group,5);nail.castShadow=false;
  }
  box(.16,.15,2.6,x,.4,0,edgeWood,group,.01);
 }
 box(6.7,.16,.17,0,.43,0,legWood,group,.01);
 // Small shallow center drawer; a dark reveal separates it from the apron.
 box(1.65,.28,.8,0,TABLE-.45,.95,heart,group,.012);box(1.68,.24,.095,0,TABLE-.45,1.48,wood[1],group,.012);
 box(.34,.045,.09,0,TABLE-.45,1.56,iron,group,.01);
 for(const x of [-3.25,3.25]){box(.32,.025,.46,x,TABLE+.005,.12,iron,group);for(const z of [-.025,.26])cyl(.027,.027,.018,x,TABLE+.026,z,iron,group,5);}
 // A chipped front edge exposes a lighter strip of the inner wood.
 const splinter=box(.68,.045,.042,-2.0,TABLE-.15,1.816,mat('#977550'),group);splinter.rotation.z=-.02;
 return group;
}
