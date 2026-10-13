import {useEffect, useRef} from 'react';
import {parseGIF, decompressFrames} from 'gifuct-js';

// Render supplied silhouettes as glyphs; composite GIF disposal before sampling.
export function AsciiArt({src, animated=false, enabled=true, className='', label}) {
 const ref=useRef(null),playing=useRef(enabled),restartRef=useRef(null);
 useEffect(()=>{playing.current=enabled;restartRef.current?.()},[enabled]);
 useEffect(()=>{
  const canvas=ref.current,ctx=canvas.getContext('2d');
  const sample=document.createElement('canvas');sample.width=80;sample.height=64;
  const s=sample.getContext('2d',{willReadFrequently:true});
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const controller=new AbortController();let alive=true,timer,index=0,frames=[];
  function draw(){
   if(!alive||!frames.length)return;
   const pixels=frames[index].pixels;
   ctx.clearRect(0,0,480,480);ctx.font='7px monospace';ctx.textBaseline='top';
   for(let y=0;y<64;y++)for(let x=0;x<80;x++){
    const i=(y*80+x)*4;if(pixels[i+3]<48)continue;
    ctx.fillStyle=animated ? `rgba(${pixels[i]},${pixels[i+1]},${pixels[i+2]},${pixels[i+3]/255})` : `rgba(171,209,164,${pixels[i+3]/255})`;
    ctx.fillText('8',x*6,y*7.5);
   }
   canvas.dataset.frame=String(index);canvas.dataset.frames=String(frames.length);
  }
  function tick(){if(!alive||!frames.length)return;draw();if(animated&&playing.current&&!motion.matches)timer=setTimeout(()=>{index=(index+1)%frames.length;tick()},frames[index].delay)}
  function restart(){clearTimeout(timer);tick()}
  restartRef.current=restart;
  motion.addEventListener('change',restart);
  async function load(){
   if(animated){
    const response=await fetch(src,{signal:controller.signal});if(!response.ok)throw new Error('GIF unavailable');
    const gif=parseGIF(await response.arrayBuffer()),decoded=decompressFrames(gif,true);
    const stage=document.createElement('canvas');stage.width=gif.lsd.width;stage.height=gif.lsd.height;
    const c=stage.getContext('2d',{willReadFrequently:true}),patch=document.createElement('canvas'),p=patch.getContext('2d');
    for(const f of decoded){
     const prev=f.disposalType===3?c.getImageData(0,0,stage.width,stage.height):null;
     patch.width=f.dims.width;patch.height=f.dims.height;p.putImageData(new ImageData(f.patch,f.dims.width,f.dims.height),0,0);c.drawImage(patch,f.dims.left,f.dims.top);
     s.clearRect(0,0,80,64);s.drawImage(stage,0,0,80,64);frames.push({pixels:s.getImageData(0,0,80,64).data,delay:Math.max(20,f.delay||100)});
     if(f.disposalType===2)c.clearRect(f.dims.left,f.dims.top,f.dims.width,f.dims.height);
     if(prev)c.putImageData(prev,0,0);
    }
   }else{
    const img=new Image();img.src=src;await img.decode();s.drawImage(img,0,0,80,64);frames=[{pixels:s.getImageData(0,0,80,64).data}];
   }
   if(alive)tick();
  }
  load().catch(error=>{if(error.name!=='AbortError'){canvas.dataset.error='true';console.error(error)}});
  return()=>{restartRef.current=null;alive=false;controller.abort();clearTimeout(timer);motion.removeEventListener('change',restart)};
 },[src,animated]);
 return <canvas ref={ref} width="480" height="480" className={className} role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true}/>;
}
