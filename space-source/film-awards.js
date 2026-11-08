import * as THREE from 'three';

export function createFilmAwards({prop,mesh,box,cyl,tube,mat,materialSet,texture,label,textMap}){
 const gold=new THREE.MeshPhysicalMaterial({color:'#efbd42',metalness:.88,roughness:.27,flatShading:true,clearcoat:.23,envMapIntensity:1.8});
 const goldLight=new THREE.MeshStandardMaterial({color:'#f5d36d',metalness:.8,roughness:.29,flatShading:true});
 materialSet.add(gold);materialSet.add(goldLight);
 const black=mat('#222b29',null,.35);black.roughness=.28;
 function oval(parent,x,y,z,sx,sy,sz,m=gold,detail=1){const o=mesh(new THREE.IcosahedronGeometry(1,detail),m,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;}
 function limb(parent,a,b,r1,r2,m=gold){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=mesh(new THREE.CylinderGeometry(r2,r1,delta.length(),7),m,parent);o.position.copy(start).addScaledVector(delta,.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
 const bear=prop('bear','金熊奖杯','GOLDEN BEAR / 10',1.62,-.98,.29,'一只站起来的金熊，举着前爪。\n轻点转动，拖动调整位置。');
 const bearModel=new THREE.Group();bearModel.scale.setScalar(.39);bear.add(bearModel);
 box(1.13,.25,.82,0,.125,0,black,bearModel,.025);
 oval(bearModel,0,1.15,-.03,.35,.60,.25);
 oval(bearModel,0,.80,-.04,.38,.30,.27);
 limb(bearModel,[-.22,.84,0],[-.34,.37,.10],.19,.22);limb(bearModel,[.22,.82,0],[.37,.37,.13],.19,.23);
 oval(bearModel,-.35,.34,.22,.23,.11,.27);oval(bearModel,.38,.34,.24,.23,.11,.27);
 oval(bearModel,-.035,1.99,.02,.34,.34,.29);
 oval(bearModel,-.30,2.19,.02,.12,.14,.085, goldLight);oval(bearModel,.24,2.20,.02,.115,.14,.085,goldLight);
 oval(bearModel,.00,1.94,.28,.20,.14,.18,goldLight);
 oval(bearModel,.02,2.00,.435,.085,.06,.045);
 for(const x of [-.14,.14])oval(bearModel,x,2.075,.279,.025,.028,.017,black,0);
 limb(bearModel,[-.27,1.65,0],[-.19,1.50,.40],.15,.17);limb(bearModel,[-.19,1.50,.40],[.27,1.70,.58],.16,.12);
 limb(bearModel,[.26,1.63,0],[.48,1.85,.20],.17,.13);limb(bearModel,[.48,1.85,.20],[.53,2.14,.34],.13,.12);
 oval(bearModel,.54,2.20,.35,.15,.18,.10,goldLight);oval(bearModel,.29,1.75,.59,.17,.13,.10,goldLight);
 for(let i=0;i<3;i++)oval(bearModel,.46+i*.065,2.31,.365,.027,.046,.03,goldLight,0);
 label(textMap(['BERLIN'],'#8b6b2c','#ead391',256,64),.61,.10,0,.13,.416,bearModel);

 const lion=prop('lion','金狮奖杯','GOLDEN LION / 11',1.62,-.20,.69,'展开翅膀的金狮，站在黑色石座上。\n轻点转动，拖动调整位置。');
 const lionModel=new THREE.Group();lionModel.scale.setScalar(.44);lion.add(lionModel);
 box(1.92,.24,.87,0,.12,0,black,lionModel,.025);
 oval(lionModel,.02,.84,0,.62,.27,.24);
 oval(lionModel,-.57,.97,.02,.28,.34,.28,goldLight);
 oval(lionModel,-.76,1.10,.045,.245,.245,.235);
 oval(lionModel,-.94,1.04,.16,.19,.105,.135,goldLight);
 oval(lionModel,-1.04,1.08,.19,.055,.045,.07);
 for(const z of [-.15,.19]){
  oval(lionModel,-.69,1.29,z,.07,.085,.055,goldLight,0);
  oval(lionModel,-.88,1.16,z,.026,.025,.018,black,0);
  limb(lionModel,[-.47,.87,z],[-.62,.34,z+.015],.10,.085);
  oval(lionModel,-.69,.31,z+.08,.17,.075,.11,goldLight);
  limb(lionModel,[.46,.80,z],[.59,.56,z],.14,.10);limb(lionModel,[.59,.56,z],[.53,.32,z+.01],.095,.07);
  oval(lionModel,.45,.30,z+.08,.16,.07,.10,goldLight);
 }
 tube([[.55,.93,-.04],[.83,.92,-.05],[1.05,.65,-.04],[1.30,.58,0],[1.45,.68,.04]],.033,gold,lionModel);
 oval(lionModel,1.45,.69,.04,.09,.045,.055,goldLight,0);
 // Swept wings have a broad silhouette and individually raised feather ridges.
 for(const sign of [-1,1]){
  const wing=new THREE.Group();wing.position.set(-.25,.99,sign*.13);wing.rotation.x=sign*.30;lionModel.add(wing);
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-.23,.39,-.22,.62,.08,.75);shape.lineTo(.93,1.20);shape.lineTo(.89,.91);shape.lineTo(.73,.74);shape.lineTo(.91,.84);shape.lineTo(.77,.58);shape.lineTo(.58,.43);shape.lineTo(.70,.49);shape.lineTo(.48,.20);shape.lineTo(.20,.04);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSegments:1,bevelThickness:.012,bevelSize:.012,curveSegments:3});mesh(geo,gold,wing);
  for(let i=0;i<5;i++){const a=[.04+i*.025,.09+i*.042,.065],b=[.42+i*.11,.37+i*.17,.065];tube([a,[(a[0]+b[0])*.5,(a[1]+b[1])*.5+.055,.085],b],.018,goldLight,wing);}
 }
 label(textMap(['VENEZIA'],'#a78234','#f1d888',256,64),1.0,.12,0,.13,.445,lionModel);
 return {bear,lion,bearModel,lionModel};
}
