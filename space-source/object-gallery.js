import * as THREE from 'three';
import {createPugLamp} from './desk-additions.js';
import {galleryLayout} from './gallery-layout.js';

export function createObjectGallery({scene,mesh,box,cyl,sphere,tube,mat,worn,materialSet}){
 const root=new THREE.Group();root.name='Three fixed cinema objects';root.visible=false;scene.add(root);
 const anchors=Array.from({length:3},(_,i)=>{const g=new THREE.Group();g.userData.channel=i;root.add(g);return g;});
 const models=anchors.map(anchor=>{const model=new THREE.Group();anchor.add(model);return model;});
 const targets=[],hoverWeights=[0,0,0],pulses=[0,0,0],labelPoints=anchors.map(()=>new THREE.Vector3());
 const dark=mat('#242b2b',null,.35),chrome=mat('#c8c5ae',null,.65);chrome.roughness=.24;
 // 01 / An upright, half-full glass. The liquid has its own moving surface.
 const glass=new THREE.MeshPhysicalMaterial({color:'#f3e1c5',roughness:.09,metalness:0,transmission:.92,thickness:.035,ior:1.45,side:THREE.DoubleSide,envMapIntensity:1.5});materialSet.add(glass);
 const glassEdge=mat('#e5c9a6',null,.35);glassEdge.roughness=.16;
 const glassModel=models[0];
 cyl(.34,.36,.045,0,.035,0,glass,glassModel,24);cyl(.028,.045,.63,0,.36,0,glassEdge,glassModel,12);
 const profile=[[.025,.65],[.14,.7],[.29,.85],[.41,1.1],[.47,1.38],[.455,1.7],[.42,1.9]].map(p=>new THREE.Vector2(...p));
 const bowl=mesh(new THREE.LatheGeometry(profile,24),glass,glassModel);bowl.castShadow=false;
 for(const [radius,y] of [[.42,1.9],[.34,.047]]){const rim=mesh(new THREE.TorusGeometry(radius,.012,5,28),glassEdge,glassModel);rim.rotation.x=Math.PI/2;rim.position.y=y;}
 const wine=mat('#7e122c',null,.14);wine.roughness=.18;wine.emissive.set('#390817');wine.emissiveIntensity=.18;
 const liquidGeo=new THREE.LatheGeometry([[0,.705],[.13,.74],[.275,.87],[.389,1.1],[.445,1.32],[0,1.32]].map(p=>new THREE.Vector2(...p)),28);
 const liquid=mesh(liquidGeo,wine,glassModel);liquid.castShadow=false;const liquidBase=liquidGeo.attributes.position.array.slice();
 const glint=mat('#efb6a4',null,.22);glint.roughness=.2;
 tube([[-.30,1.71,.30],[-.34,1.49,.33],[-.33,1.37,.33]],.012,glint,glassModel);
 // 02 / Reuse the actual desk pug, including its folded ears, paws and 3D glasses.
 const pugModel=models[1];pugModel.scale.setScalar(1.42);
 const pug=createPugLamp({lamp:pugModel,mesh,box,cyl,sphere,tube,mat,worn,dark,materialSet});pug.light.intensity=2;
 // 03 / A small horned owl holding an analogue camera between its wings.
 const bird=models[2],feather=mat('#615243',worn,.05),featherLight=mat('#ab9270'),beakMat=mat('#d6a958'),eyeMat=mat('#ead8b0'),iris=mat('#d49225');
 function oval(parent,x,y,z,sx,sy,sz,material){const o=sphere(1,x,y,z,material,parent);o.scale.set(sx,sy,sz);return o;}
 oval(bird,0,.84,0,.45,.57,.34,feather);oval(bird,0,.87,.24,.32,.41,.13,featherLight);
 const birdHead=new THREE.Group();birdHead.position.set(0,1.49,.03);bird.add(birdHead);
 oval(birdHead,0,0,0,.47,.39,.34,feather);
 for(const sign of [-1,1]){
  oval(birdHead,sign*.215,.035,.255,.239,.26,.115,featherLight);
  oval(birdHead,sign*.215,.035,.337,.193,.21,.055,eyeMat);
  oval(birdHead,sign*.215,.058,.385,.105,.119,.033,iris);
  oval(birdHead,sign*.215,.058,.412,.056,.078,.022,dark);
  oval(birdHead,sign*.195,.096,.432,.022,.026,.008,eyeMat);
  const tuft=mesh(new THREE.ConeGeometry(.12,.30,4),feather,birdHead);tuft.position.set(sign*.32,.32,-.025);tuft.rotation.z=-sign*.40;
  tube([[sign*.07,.26,.35],[sign*.22,.28,.35],[sign*.38,.22,.29]],.035,feather,birdHead);
 }
 const beak=mesh(new THREE.ConeGeometry(.09,.23,4),beakMat,birdHead);beak.position.set(0,-.11,.415);beak.rotation.z=Math.PI;beak.rotation.x=.35;beak.scale.z=.75;
 for(let i=0;i<5;i++){const tail=oval(bird,(i-2)*.075,.4,-.31,.07,.27,.10,feather);tail.rotation.x=-.6;tail.rotation.z=(i-2)*-.13;}
 for(const sign of [-1,1]){
  cyl(.06,.075,.20,sign*.19,.16,.04,beakMat,bird,6);
  for(let i=0;i<3;i++)tube([[sign*.19,.08,.06],[sign*.19+(i-1)*.085,.055,.25]],.027,beakMat,bird);
  for(let i=0;i<3;i++)oval(bird,sign*(.12+i*.07),.47+i*.12,.29,.035,.06,.025,feather);
 }
 const cameraRig=new THREE.Group();cameraRig.position.set(0,.85,.4);bird.add(cameraRig);
 box(.79,.43,.30,0,0,0,dark,cameraRig,.035);box(.69,.065,.30,0,.23,0,chrome,cameraRig,.016);
 box(.25,.12,.22,-.02,.30,0,dark,cameraRig,.012);
 box(.13,.08,.03,-.24,.09,.17,chrome,cameraRig,.005);
 const lensMat=mat('#226e80',null,.5);lensMat.roughness=.1;lensMat.emissive.set('#0b4556');lensMat.emissiveIntensity=.4;
 for(const [r,d,z,m] of [[.23,.13,.20,chrome],[.195,.18,.29,dark],[.157,.02,.39,lensMat]]){
  const o=cyl(r,r,d,.05,-.015,z,m,cameraRig,20);o.rotation.x=Math.PI/2;
 }
 const shine=mat('#8abec2');box(.035,.09,.013,-.01,.045,.409,shine,cameraRig,.006);
 const flashMat=new THREE.MeshBasicMaterial({color:'#fff0cf',toneMapped:false});materialSet.add(flashMat);
 const flash=box(.13,.075,.016,.26,.11,.16,flashMat,cameraRig,.006);flash.visible=false;
 const flashLight=new THREE.PointLight('#ffddb3',0,3);flashLight.position.set(0,1.2,1);bird.add(flashLight);
 const wings=[];
 for(const sign of [-1,1]){
  const wing=new THREE.Group();wing.position.set(sign*.39,1.02,.08);bird.add(wing);wings.push(wing);
  const upper=oval(wing,sign*.035,-.15,.13,.13,.30,.18,feather);upper.rotation.z=sign*.35;
  oval(wing,sign*-.04,-.26,.30,.14,.10,.17,feather);
  for(let i=0;i<3;i++)tube([[sign*.03+i*.023,-.19,.3],[sign*-.07+i*.026,-.29,.42]],.018,featherLight,wing);
 }
 tube([[-.30,1.2,.2],[-.42,.68,.17],[0,.48,.2],[.42,.68,.17],[.30,1.2,.2]],.018,dark,bird);
 // Generous pick volumes belong only to this fixed gallery, never to desk dragging.
 const hitMat=new THREE.MeshBasicMaterial({visible:false});materialSet.add(hitMat);
 anchors.forEach((anchor,i)=>{const hit=mesh(new THREE.BoxGeometry(1.25,2.15,1.1),hitMat,anchor);hit.position.y=.95;hit.userData.channel=i;targets.push(hit);});
 root.traverse(o=>{o.userData.decorative=true;if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
 const fill=new THREE.PointLight('#fff0ce',20,10,2);fill.position.set(-1.5,2,2);root.add(fill);
 let hovered=-1,selected=-1,layout;
 const projected=new THREE.Vector3(),labelPositions=anchors.map(()=>({x:-1,y:-1}));
 return {
  targets,
  hover(index){hovered=index;},
  select(index){selected=index;pulses[index]=1;},
  reset(){hovered=selected=-1;hoverWeights.fill(0);pulses.fill(0);root.visible=false;},
  update({camera,aspect,fov,reveal,time,delta,reduced,labels,width,height}){
   root.visible=reveal>0;if(!root.visible)return;
   layout=galleryLayout(aspect,fov);root.position.copy(camera.position);root.quaternion.copy(camera.quaternion);root.translateZ(-layout.distance);
   const emerge=1-Math.pow(1-reveal,3),scale=layout.scale*(.82+.18*emerge);
   anchors.forEach((anchor,i)=>{anchor.position.set((i-1)*layout.spacing*layout.scale,-.82*layout.scale-(1-emerge)*.3,0);anchor.scale.setScalar(scale*.68);});
   root.updateMatrixWorld(true);
   for(let i=0;i<3;i++){
    hoverWeights[i]=THREE.MathUtils.lerp(hoverWeights[i],hovered===i?1:0,reduced?1:1-Math.exp(-delta*7));pulses[i]=Math.max(0,pulses[i]-delta*1.5);
    labelPoints[i].set(0,-.22,0);anchors[i].localToWorld(labelPoints[i]);projected.copy(labelPoints[i]).project(camera);
    const x=(projected.x+1)*width/2,y=(1-projected.y)*height/2;
    if(Math.abs(x-labelPositions[i].x)+Math.abs(y-labelPositions[i].y)>.1){labels[i].style.left=x+'px';labels[i].style.top=y+'px';labelPositions[i].x=x;labelPositions[i].y=y;}
   }
   // Keep stems and anchors still: only the liquid surface oscillates.
   const slosh=reduced?0:hoverWeights[0],p=liquidGeo.attributes.position;
   for(let i=0;i<p.count;i++){
    const x=liquidBase[i*3],y=liquidBase[i*3+1],z=liquidBase[i*3+2];
    if(y>1.30)p.setY(i,y+slosh*(x*Math.sin(time*4.8)*.3+z*Math.cos(time*3.6)*.19+Math.sin(x*9+time*5)*.02));
   }
   p.needsUpdate=true;
   pug.head.rotation.z=hoverWeights[1]*(reduced?-.18:-.23+Math.sin(time*1.9)*.065);
   pug.head.rotation.y=hoverWeights[1]*(reduced?.08:Math.sin(time*1.2)*.09);
   pug.bulb.emissiveIntensity=2+hoverWeights[1]*1.2;pug.light.intensity=2+hoverWeights[1]*1.5;
   const aim=hoverWeights[2];cameraRig.position.y=.85+aim*.25;cameraRig.rotation.x=-aim*.07;
   wings.forEach(wing=>wing.rotation.x=-aim*.35);birdHead.rotation.z=aim*.1;birdHead.rotation.x=aim*.04;
   flash.visible=!reduced&&pulses[2]>.8;flashLight.intensity=flash.visible?2:0;
   // A subtle acknowledgement, without translating or freely rotating any object.
   glassEdge.emissive.set('#7c472b');glassEdge.emissiveIntensity=selected===0?.15:0;
  }
 };
}
