import * as THREE from 'three';
import {CanvasTexture,NoColorSpace,LinearFilter} from 'three';
import {modules,drawGlyph} from './directory-icons.js';
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const noiseGLSL=`
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}`;
const glyphFragment=`
 varying vec2 vUv;uniform sampler2D uMap;uniform float uTime;uniform float uActive;uniform float uLens;uniform float uMotion;uniform float uReveal;
 ${noiseGLSL}
 float phosphor(vec2 p){
  float a=texture2D(uMap,p).a*.42;
  a+=texture2D(uMap,p+vec2(.005,0.)).a*.21;
  a+=texture2D(uMap,p-vec2(.005,0.)).a*.21;
  a+=texture2D(uMap,p+vec2(0.,.004)).a*.08;
  a+=texture2D(uMap,p-vec2(0.,.004)).a*.08;
  return a;
 }
 void main(){
  // Inverse barrel projection magnifies the centre without moving the hit plane.
  vec2 q=vUv-.5;
  vec2 uv=.5+q*(1.+uLens*1.35*dot(q,q))/(1.+uLens*.39);
  float row=floor(uv.y*100.);
  float drift=(hash(vec2(row,floor(uTime*6.)*uMotion))-.5)*.004*uMotion;
  uv.x+=drift;
  uv=floor(uv*150.)/150.;
  float ink=phosphor(uv);
  float ghost=phosphor(uv-vec2(.014,.003))*.21;
  float edge=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));
  float frame=1.-smoothstep(.013,.021,edge);
  frame*=.55+.45*noise(vUv*vec2(143.,127.));
  float halo=(1.-smoothstep(.018,.044,edge))*.12;
  float wear=.68+.32*noise(uv*vec2(81.,95.));
  float scan=.79+.21*sin(vUv.y*730.);
  float grain=.88+.12*hash(vec2(floor(vUv*vec2(151.,143.)))+floor(uTime*9.)*uMotion);
  float flicker=1.-.055*hash(vec2(floor(uTime*9.),1.))*uMotion;
  float pulse=mix(1.,.59+.41*(.5+.5*sin(uTime*3.5)),uMotion)*uActive+(1.-uActive);
  vec3 color=mix(vec3(.94,.64,.30),vec3(1.,.085,.025),uActive);
  float alpha=clamp((ink+ghost)*wear+frame+halo,0.,1.)*scan*grain;
  if(alpha<.002)discard;
  gl_FragColor=vec4(color*flicker*pulse,alpha*uReveal);
  #include <colorspace_fragment>
 }`;

function makeTexture(item,index){
 const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');
 drawGlyph(ctx,item,35,33,1.45);
 let seed=9123+index*981;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 ctx.globalCompositeOperation='destination-out';
 for(let i=0;i<1600;i++){ctx.globalAlpha=.15+rand()*.65;const s=.5+rand()*1.6;ctx.fillRect(rand()*256,rand()*256,s,s*(.5+rand()));}
 for(let i=0;i<15;i++){ctx.globalAlpha=.25+rand()*.3;ctx.fillRect(rand()*256,rand()*256,5+rand()*17,.6+rand());}
 const t=new CanvasTexture(c);t.colorSpace=NoColorSpace;t.magFilter=LinearFilter;t.minFilter=LinearFilter;t.generateMipmaps=false;return t;
}

// The old CRT guide is now a branch of the sunset scene, with no second renderer.
export function createDirectory({scene,mesh,materialSet,textures}){
 const root=new THREE.Group();root.name='Four phosphor channels';root.visible=false;scene.add(root);
 const plates=modules.map((item,i)=>{
  const map=makeTexture(item,i);textures.add(map);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,vertexShader:vertex,fragmentShader:glyphFragment,uniforms:{uMap:{value:map},uTime:{value:0},uActive:{value:0},uLens:{value:0},uMotion:{value:1},uReveal:{value:0}}});materialSet.add(material);
  const plate=mesh(new THREE.PlaneGeometry(1,1),material,root);plate.position.set((i%2-.5)*1.06,(.5-Math.floor(i/2))*1.06,.005);plate.userData.channel=i;return plate;
 });
 const glassMaterial=new THREE.MeshBasicMaterial({color:'#382516',transparent:true,opacity:.92,depthWrite:false,toneMapped:false});materialSet.add(glassMaterial);
 for(const plate of plates){const backing=mesh(new THREE.PlaneGeometry(1,1),glassMaterial,root);backing.position.copy(plate.position);backing.position.z=0;}
 root.traverse(o=>{o.userData.decorative=true;o.castShadow=false;o.receiveShadow=false;});
 let active=-1,lastSize=0;
 return {
  targets:plates,
  hover(i){active=i;},
  reset(){active=-1;root.visible=false;},
  update({camera,width,height,time,delta,reduced,reveal,nav,caption}){
   root.visible=reveal>0;if(!root.visible)return;
   const size=Math.max(170,Math.min(328,width*.68,height*.46));
   const distance=4,unit=2*distance*Math.tan(camera.fov*Math.PI/360)/height;
   root.position.copy(camera.position);root.quaternion.copy(camera.quaternion);root.translateZ(-distance);root.scale.setScalar(size/2.06*unit*(.92+.08*reveal));
   glassMaterial.opacity=.75*reveal;
   plates.forEach((plate,i)=>{const u=plate.material.uniforms;u.uTime.value=time;u.uMotion.value=reduced?0:1;u.uActive.value=i===active?1:0;u.uReveal.value=reveal;u.uLens.value+=((i===active?1:0)-u.uLens.value)*(reduced?1:1-Math.exp(-delta*11));});
   if(lastSize!==size){nav.style.width=nav.style.height=size+'px';nav.style.gap=(size*.06/2.06)+'px';caption.style.top=`calc(50% + ${size/2+22}px)`;lastSize=size;}
  }
 };
}
