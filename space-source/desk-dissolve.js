import * as THREE from 'three';
import {MeshSurfaceSampler} from 'three/addons/math/MeshSurfaceSampler.js';

// One shared uniform dissolves the desk's colour and shadow passes together.
// The sunset world is a different scene branch and is never touched.
export function createDeskDissolve({root,scene,geometries,materialSet}){
 const progress={value:0}, patched=new Set(), meshes=[], depths=new Map(),depthWrites=new Map();
 const noise='float dustHash(vec3 p){return fract(sin(dot(floor(p*85.),vec3(12.9898,78.233,39.425)))*43758.5453);}';
 function patch(material){
  if(patched.has(material))return;patched.add(material);
  material.onBeforeCompile=shader=>{
   shader.uniforms.deskDissolve=progress;
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vDustPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvDustPosition=(modelMatrix*vec4(position,1.)).xyz;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float deskDissolve;varying vec3 vDustPosition;\n'+noise).replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(deskDissolve>0. && dustHash(vDustPosition)<deskDissolve)discard;').replace('#include <opaque_fragment>','diffuseColor.a *= 1.-smoothstep(0.02,0.78,deskDissolve);\n#include <opaque_fragment>');
  };
  material.customProgramCacheKey=()=> 'desk-dissolve-v1';material.needsUpdate=true;
 }
 root.traverse(o=>{
  if(!o.isMesh)return;
  const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if(!depthWrites.has(m))depthWrites.set(m,m.depthWrite);m.transparent=true;patch(m);});
  if(!o.userData.decorative)meshes.push(o);
  if(!depths.has(mats[0])){
   const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide});patch(depth);depths.set(mats[0],depth);materialSet.add(depth);
  }
  o.customDepthMaterial=depths.get(mats[0]);
 });
 const count=8500,positions=new Float32Array(count*3),colors=new Float32Array(count*3),seeds=new Float32Array(count);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setAttribute('seed',new THREE.BufferAttribute(seeds,1));geometries.add(geometry);
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,toneMapped:false,uniforms:{progress},vertexShader:`
  uniform float progress;attribute float seed;varying vec3 vColor;varying float vAlpha;
  void main(){
   float start=seed*.64;float age=max(0.,(progress-start)/.36);
   vec3 p=position+vec3(sin(seed*98.)*.7+1.1,1.0+seed*1.3,cos(seed*81.)*.6)*age;
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
   gl_PointSize=clamp((2.+seed*2.)*5./max(2.,-mv.z),1.2,4.);
   vAlpha=step(start+.005,progress)*(1.-smoothstep(.1,1.,age))*(1.-smoothstep(.78,1.,progress));vColor=color;
  }`,fragmentShader:'varying vec3 vColor;varying float vAlpha;void main(){if(vAlpha<.01)discard;gl_FragColor=vec4(vColor,vAlpha*.85);}'});
 materialSet.add(material);const points=new THREE.Points(geometry,material);points.frustumCulled=false;points.visible=false;points.userData.decorative=true;scene.add(points);
 const sample=new THREE.Vector3(),color=new THREE.Color(),fallback=new THREE.Color('#ba986c'),dustTint=new THREE.Color('#ffce86');
 return {
  capture(){
   root.updateWorldMatrix(true,true);let total=0;
   const entries=meshes.map(o=>{const sampler=new MeshSurfaceSampler(o).build();o.getWorldScale(sample);total+=sampler.distribution.at(-1)*Math.pow(Math.abs(sample.x*sample.y*sample.z),2/3);return {o,sampler,end:total};});
   let index=0;
   for(let i=0;i<count;i++){
    const area=(i+.5)*total/count;while(index<entries.length-1&&entries[index].end<area)index++;
    const {o,sampler}=entries[index];sampler.sample(sample);sample.applyMatrix4(o.matrixWorld);sample.toArray(positions,i*3);
    const m=Array.isArray(o.material)?o.material[0]:o.material;color.copy(m.color||fallback).lerp(dustTint,.3);color.toArray(colors,i*3);seeds[i]=Math.random();
   }
   geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;geometry.attributes.seed.needsUpdate=true;
  },
  set(value){progress.value=value;root.visible=value<1;points.visible=value>0&&value<1;for(const [m,write] of depthWrites)m.depthWrite=value===0?write:false;},
 };
}
