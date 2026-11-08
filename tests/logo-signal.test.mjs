import test from 'node:test';
import assert from 'node:assert/strict';
import {createLogoSignal} from '../src/logoSignal.js';

test('signal samples once, scales for DPR, pauses offscreen, respects reduced motion and cleans up',()=>{
 const queue=new Map(),events=new Map(),mediaEvents=new Map();let id=0,samples=0,disconnected=false;
 const media={matches:false,addEventListener:(name,fn)=>mediaEvents.set(name,fn),removeEventListener:name=>mediaEvents.delete(name)};
 const context=new Proxy({getImageData(){samples++;return {data:new Uint8ClampedArray(576*576*4).fill(255)};}},{get:(obj,key)=>obj[key]??(()=>{})});
 const makeCanvas=()=>({width:0,height:0,dataset:{},getContext:()=>context,getBoundingClientRect:()=>({width:320,height:320,left:0,top:0})});
 const replacements={window:{devicePixelRatio:2},document:{hidden:false,createElement:makeCanvas,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)},matchMedia:()=>media,Path2D:class{moveTo(){}lineTo(){}},ResizeObserver:class{observe(){}disconnect(){disconnected=true;}},requestAnimationFrame:fn=>{queue.set(++id,fn);return id;},cancelAnimationFrame:id=>queue.delete(id)};
 const old=Object.fromEntries(Object.keys(replacements).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 Object.assign(globalThis,replacements);
 function tick(ms){const current=[...queue.values()];queue.clear();current.forEach(fn=>fn(ms));}
 let signal;
 try{
  const canvas=makeCanvas();signal=createLogoSignal(canvas);
  assert.equal(samples,1);assert.equal(canvas.width,640);assert.equal(canvas.height,640);
  tick(16);tick(32);assert.equal(queue.size,1);assert.equal(samples,1);
  signal.point(100,100);tick(48);assert.equal(canvas.dataset.effect,'detect');
  signal.setVisible(false);assert.equal(queue.size,0);
  signal.setVisible(true);tick(64);assert.equal(queue.size,1);assert.equal(canvas.dataset.effect,'idle');
  document.hidden=true;events.get('visibilitychange')();assert.equal(queue.size,0);
  document.hidden=false;events.get('visibilitychange')();tick(80);assert.equal(queue.size,1);
  media.matches=true;mediaEvents.get('change')();tick(96);assert.equal(queue.size,0);assert.equal(canvas.dataset.running,'false');
  signal.focus();tick(112);assert.equal(queue.size,0);assert.equal(canvas.dataset.effect,'detect');
  signal.destroy();signal=null;assert.equal(queue.size,0);assert.equal(events.size,0);assert.equal(mediaEvents.size,0);assert.ok(disconnected);
 }finally{
  signal?.destroy();for(const [key,descriptor] of Object.entries(old)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
 }
});
