import * as THREE from 'three';

// All geometry, textures and materials belong to the scene's existing resource sets.
export function createPugLamp({lamp,mesh,box,cyl,sphere,tube,mat,worn,dark,materialSet}){
 const fawn=mat('#d2b17d',worn),mask=mat('#302923'),nose=mat('#100f0e'),fold=mat('#8a7050');
 fawn.roughness=.7;mask.roughness=.62;
 function oval(rx,ry,rz,x,y,z,m,parent=lamp){const o=sphere(1,x,y,z,m,parent);o.scale.set(rx,ry,rz);return o;}
 // A squat seated body, broad haunches, two front paws and a tightly curled tail.
 oval(.32,.47,.29,0,.48,-.07,fawn);
 for(const sign of [-1,1]){
  oval(.205,.24,.24,sign*.24,.23,-.08,fawn);
  oval(.11,.31,.12,sign*.15,.34,.17,fawn);
  oval(.135,.09,.18,sign*.16,.09,.26,fawn);
  for(const dx of [-.035,.035])tube([[sign*.16+dx,.12,.38],[sign*.16+dx,.08,.40]],.008,fold,lamp);
 }
 const tail=mesh(new THREE.TorusGeometry(.135,.057,5,12,Math.PI*1.85),fawn,lamp);
 tail.position.set(.24,.4,-.32);tail.rotation.y=.5;tail.rotation.z=.3;
 const head=new THREE.Group();head.position.set(0,.99,.08);lamp.add(head);
 oval(.355,.32,.30,0,0,0,fawn,head);
 oval(.28,.23,.16,0,-.08,.22,mask,head);
 // Folded button ears and the pug's short, divided muzzle replace the long hound snout.
 for(const sign of [-1,1]){
  const ear=oval(.145,.21,.085,sign*.295,.13,-.015,mask,head);ear.rotation.z=sign*.48;
  oval(.145,.10,.10,sign*.10,-.155,.34,mask,head);
  tube([[sign*.035,.25,.15],[sign*.13,.23,.21],[sign*.22,.17,.21]],.014,fold,head);
  tube([[sign*.04,-.19,.403],[sign*.10,-.22,.36],[sign*.18,-.19,.32]],.009,nose,head);
 }
 oval(.095,.062,.055,0,-.095,.397,nose,head);
 oval(.10,.055,.06,0,-.24,.31,fawn,head);
 const frames=mat('#d9d6c0',null,.08);frames.roughness=.6;
 const redLens=new THREE.MeshBasicMaterial({color:'#d8203c',transparent:true,opacity:.96,toneMapped:false});
 const blueLens=new THREE.MeshBasicMaterial({color:'#18b8d0',transparent:true,opacity:.96,toneMapped:false});
 materialSet.add(redLens);materialSet.add(blueLens);
 // Chunky off-white cinema glasses with a red left lens and cyan right lens.
 for(const sign of [-1,1]){
  const x=sign*.171;
  box(.315,.205,.04,x,.055,.306,frames,head,.025);
  box(.247,.14,.018,x,.055,.333,sign<0?redLens:blueLens,head,.012);
  box(.017,.014,.006,x-.074,.10,.346,frames,head);
  tube([[sign*.326,.067,.30],[sign*.355,.08,.06],[sign*.31,.055,-.11]],.019,frames,head);
 }
 box(.075,.04,.046,0,.075,.31,frames,head,.008);
 const collar=mesh(new THREE.CylinderGeometry(.235,.24,.07,12),dark,lamp);collar.position.set(0,.735,.025);
 const bulb=mat('#f1c67e');bulb.emissive.set('#ffad46');bulb.emissiveIntensity=2;
 const tag=cyl(.047,.047,.025,0,.73,.282,bulb,lamp,8);tag.rotation.x=Math.PI/2;
 const light=new THREE.PointLight('#edc99b',8,5,2);light.position.set(0,.83,.45);lamp.add(light);
 return {head,light,bulb,redLens,blueLens};
}

export function createSpilledWine({wine,scene,mesh,cyl,mat,materialSet}){
 const glass=new THREE.MeshPhysicalMaterial({color:'#e0e9e3',roughness:.075,metalness:0,transmission:1,thickness:.025,ior:1.46,side:THREE.DoubleSide,envMapIntensity:.5});
 materialSet.add(glass);
 const edge=mat('#acbfb6',null,.65);edge.roughness=.18;
 const redWine=mat('#540922',null,.1);redWine.roughness=.16;redWine.emissive.set('#2c010c');redWine.emissiveIntensity=.3;
 const glassPivot=new THREE.Group();glassPivot.position.set(.47,.267,-.1);glassPivot.rotation.z=Math.PI/2;wine.add(glassPivot);
 const base=cyl(.19,.19,.028,0,.015,0,glass,glassPivot,16);base.castShadow=false;
 cyl(.018,.022,.40,0,.235,0,edge,glassPivot,8);
 const profile=[[.025,.43],[.10,.46],[.18,.52],[.24,.64],[.253,.77],[.23,.96]].map(p=>new THREE.Vector2(...p));
 const bowl=mesh(new THREE.LatheGeometry(profile,14),glass,glassPivot);bowl.castShadow=false;
 const rim=mesh(new THREE.TorusGeometry(.23,.012,5,18),edge,glassPivot);rim.rotation.x=Math.PI/2;rim.position.y=.96;
 const foot=mesh(new THREE.TorusGeometry(.183,.009,4,18),edge,glassPivot);foot.rotation.x=Math.PI/2;foot.position.y=.02;
 // The spill remains on the wood when the empty glass is picked up and moved.
 const spill=new THREE.Group();spill.position.copy(wine.position);scene.add(spill);
 const outline=new THREE.Shape();
 outline.moveTo(-.30,-.16);outline.bezierCurveTo(-.65,-.28,-1.05,-.20,-1.01,.10);
 outline.bezierCurveTo(-.97,.30,-.71,.24,-.68,.37);outline.bezierCurveTo(-.51,.48,-.20,.28,-.36,.09);
 outline.bezierCurveTo(-.30,-.04,-.10,-.10,-.30,-.16);
 const puddle=mesh(new THREE.ShapeGeometry(outline,12),redWine,spill);puddle.rotation.x=-Math.PI/2;puddle.position.y=.03;puddle.castShadow=false;
 for(const [x,z,r] of [[-.98,.34,.048],[-.57,.53,.035],[-1.12,.13,.025],[-.17,.28,.022]]){
  const drop=cyl(r,r,.006,x,.032,z,redWine,spill,10);drop.scale.z=.65;drop.castShadow=false;
 }
 const glint=new THREE.MeshBasicMaterial({color:'#aa3c52',transparent:true,opacity:.45,depthWrite:false});materialSet.add(glint);
 const shine=mesh(new THREE.CircleGeometry(.12,12),glint,spill);shine.rotation.x=-Math.PI/2;shine.position.set(-.73,.035,.05);shine.scale.set(1,.12,1);shine.castShadow=false;
 // Decorative liquid cannot block a glass click or be dragged as a solid object.
 spill.traverse(o=>{o.userData.decorative=true;});
 return glassPivot;
}
