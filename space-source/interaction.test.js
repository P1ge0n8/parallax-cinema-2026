import test from 'node:test';
import assert from 'node:assert/strict';
import {clampPosition,canPlace,isDrag,resolveMove,TABLE_BOUNDS} from './interaction.js';
import {recordPoint,returnRoute,sampleReturn} from './return-motion.js';

test('reset retraces drag corners in reverse rather than cutting across objects',()=>{
 const path=[{x:0,z:0}];
 for(const p of [{x:1,z:0},{x:2,z:0},{x:2,z:1},{x:2,z:2}])recordPoint(path,p);
 assert.equal(path.length,3);
 const route=returnRoute(path,{x:2,z:2});
 assert.deepEqual(sampleReturn(route,.25),{x:2,z:1,segment:0});
 assert.deepEqual(sampleReturn(route,.75),{x:1,z:0,segment:1});
 assert.deepEqual(sampleReturn(route,1),{x:0,z:0,segment:1});
 assert.deepEqual(path[0],{x:0,z:0});
});
test('a reversed drag and a stationary prop keep valid return paths',()=>{
 const path=[{x:0,z:0}];recordPoint(path,{x:2,z:0});recordPoint(path,{x:1,z:0});
 assert.equal(path.length,3);
 assert.deepEqual(sampleReturn(returnRoute(path,{x:1,z:0}),1/3),{x:2,z:0,segment:0});
 assert.deepEqual(sampleReturn(returnRoute([{x:3,z:1}],{x:3,z:1}),.5),{x:3,z:1,segment:0});
});
test('interrupting a return retains the unvisited route for the next reset',()=>{
 const route=returnRoute([{x:0,z:0},{x:2,z:0},{x:2,z:2}],{x:2,z:2});
 const current=sampleReturn(route,.25);
 const remaining=route.points.slice(current.segment+1).reverse().map(p=>({...p}));recordPoint(remaining,current);
 const next=returnRoute(remaining,current);
 assert.deepEqual(next.points,[{x:2,z:1},{x:2,z:0},{x:0,z:0}]);
 assert.deepEqual(sampleReturn(next,1),{x:0,z:0,segment:1});
});

test('all movable footprints remain within the tabletop when dragged beyond every edge',()=>{
 for(const radius of [.37,.62,.49,.63,.42*.65,.43,.51*.65,.67,.29,.69])for(const x of [-100,0,100])for(const z of [-100,0,100]){
  const p=clampPosition(x,z,radius);
  assert.ok(Math.abs(p.x)+radius<=TABLE_BOUNDS.maxX+.000001);
  assert.ok(Math.abs(p.z)+radius<=TABLE_BOUNDS.maxZ+.000001);
 }
});

import {terminalViewDistance} from './camera-framing.js';
test('closer terminal view fits its full screen on portrait and landscape',()=>{
 for(const [aspect,fov] of [[390/844,55],[320/844,55],[1,46],[16/9,46],[21/9,46]]){
  const distance=terminalViewDistance(aspect,fov),halfHeight=distance*Math.tan(fov*Math.PI/360);
  assert.ok(halfHeight*aspect>=.8399,'screen and margin remain inside the viewport');
  assert.ok(halfHeight>=.6399,'screen top and bottom remain visible');
  assert.ok(distance>=1.65,'camera stays in front of the CRT face');
 }
});
test('the fixed terminal rejects movement and reserves its tabletop footprint',()=>{
 const terminal={position:{x:0,z:-1.13},userData:{radius:1.14,fixed:true}};
 const phone={position:{x:1.9,z:.87},userData:{radius:.37}};
 assert.equal(canPlace(terminal,-2,0,[terminal,phone]),false);
 assert.equal(canPlace(phone,0,-1.13,[terminal,phone]),false);
 assert.equal(canPlace(phone,1.9,.87,[terminal,phone]),true);
});
test('moving an object cannot place its center inside another object',()=>{
 const a={position:{x:0,z:0},userData:{radius:.6}};
 const b={position:{x:1,z:0},userData:{radius:.4}};
 assert.equal(canPlace(a,1,0,[a,b]),false);
 assert.equal(canPlace(a,1.1,.1,[a,b]),false);
 assert.equal(canPlace(a,-1,0,[a,b]),true);
 assert.equal(canPlace(a,0,0,[a]),true);
});
test('small pointer jitter remains a click; a diagonal movement becomes a drag',()=>{
 assert.equal(isDrag(102,103,100,100),false);
 assert.equal(isDrag(104,104,100,100),true);
 assert.equal(isDrag(100,100,100,100),false);
});

import {lensAmount,lensPoint} from './lens.js';
test('lens has continuous 360-degree activation, with strongest framing at desk corners',()=>{
 assert.equal(lensAmount(0,1.22),0);
 assert.ok(lensAmount(Math.PI/4,1.22)>.99);
 assert.ok(Math.abs(lensAmount(-Math.PI+.1,1.22)-lensAmount(Math.PI+.1,1.22))<1e-10);
 assert.ok(lensAmount(Math.PI/4,.05)<.01);
 for(let angle=-8;angle<8;angle+=.05){const value=lensAmount(angle,1.22);assert.ok(value>=0&&value<=1);}
});
test('fisheye picking preserves the center and maps mirrored pixels symmetrically',()=>{
 const p={},q={};lensPoint(.5,.5,16/9,1,p);assert.deepEqual(p,{x:.5,y:.5});
 lensPoint(.2,.3,16/9,0,p);assert.ok(Math.abs(p.x-.2)<1e-12);assert.ok(Math.abs(p.y-.3)<1e-12);
 lensPoint(.2,.3,16/9,1,p);lensPoint(.8,.7,16/9,1,q);
 assert.ok(Math.abs(p.x+q.x-1)<1e-12);assert.ok(Math.abs(p.y+q.y-1)<1e-12);
 // The output-to-source map must never fold over itself, for portrait or landscape.
 for(const aspect of [.46,1,1.78,2.4]){let previous=-Infinity;for(let i=0;i<=100;i++){lensPoint(i/100,.3,aspect,1,p);assert.ok(p.x>previous);previous=p.x;}}
});

import {galleryLayout,galleryPhase} from './gallery-layout.js';
test('all three fixed gallery models and labels fit portrait and landscape viewports',()=>{
 for(const [aspect,fov] of [[320/844,55],[390/844,55],[517/801,55],[1,46],[16/9,46],[21/9,46]]){
  const {distance,scale,spacing}=galleryLayout(aspect,fov);
  const halfHeight=distance*Math.tan(fov*Math.PI/360),halfWidth=halfHeight*aspect;
  assert.ok((spacing+.75)*scale<halfWidth,'outer objects remain inside screen edges');
  assert.ok(1.28*scale<halfHeight,'objects stay within the vertical safe area');
  assert.ok(1.04*scale<halfHeight,'labels stay below the objects and inside the frame');
 }
});
test('particle transition is bounded and reduced motion finishes without a long animation',()=>{
 for(const reduced of [false,true]){
  let last=-1;
  for(let time=-.1;time<3;time+=.017){const state=galleryPhase(time,reduced);assert.ok(state.dissolve>=last);last=state.dissolve;assert.ok(state.reveal>=0&&state.reveal<=1);}
  assert.deepEqual(galleryPhase(0,reduced),{dissolve:0,reveal:0,done:false});
  assert.equal(galleryPhase(3,reduced).done,true);
 }
 assert.equal(galleryPhase(.19,true).done,true);
 assert.equal(galleryPhase(.19,false).done,false);
});


test('asymmetric keyboard and phone footprints can reach the edge without crossing it',()=>{
 const f={minX:-.25,maxX:.38,minZ:-.42,maxZ:.66};
 for(const x of [-20,20])for(const z of [-20,20]){
  const p=clampPosition(x,z,f);
  assert.ok(p.x+f.minX>=TABLE_BOUNDS.minX-.000001);
  assert.ok(p.x+f.maxX<=TABLE_BOUNDS.maxX+.000001);
  assert.ok(p.z+f.minZ>=TABLE_BOUNDS.minZ-.000001);
  assert.ok(p.z+f.maxZ<=TABLE_BOUNDS.maxZ+.000001);
 }
});
test('a long thin item fits beside the computer without the old circular exclusion zone',()=>{
 const terminal={position:{x:0,z:-.7},userData:{fixed:true,footprint:{minX:-1,maxX:1,minZ:-.65,maxZ:1.2}}};
 const phone={position:{x:1.32,z:0},userData:{footprint:{minX:-.23,maxX:.23,minZ:-.45,maxZ:.45}}};
 assert.equal(canPlace(phone,1.32,0,[phone,terminal]),true);
 assert.equal(canPlace(phone,1.1,0,[phone,terminal]),false);
});
test('a single fast pointer movement cannot tunnel through another prop',()=>{
 const moving={position:{x:-2,z:0},userData:{radius:.2}};
 const fixed={position:{x:0,z:0},userData:{radius:.5,fixed:true}};
 const p=resolveMove(moving,2,0,[moving,fixed]);
 assert.ok(p.x<-.7);assert.ok(p.x>-1);assert.equal(p.z,0);
 assert.deepEqual(resolveMove(fixed,3,1,[moving,fixed]),fixed.position);
});
test('a diagonal drag slides along an obstacle while retaining fractional precision',()=>{
 const moving={position:{x:-1,z:0},userData:{radius:.2}};
 const fixed={position:{x:0,z:0},userData:{radius:.5,fixed:true}};
 const p=resolveMove(moving,0,.5,[moving,fixed]);
 assert.ok(p.x<-.7);assert.ok(Math.abs(p.z-.5)<1e-10);
 const fine=resolveMove(moving,-.995,.003,[moving,fixed]);
 assert.ok(Math.abs(fine.x+.995)<1e-10);assert.ok(Math.abs(fine.z-.003)<1e-10);
});
