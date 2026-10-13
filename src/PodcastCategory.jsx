import {useEffect,useRef,useState} from 'react';
const CHARS='!<>-_/[]{}=+*^?#';

function useScramble(title,english){
 const [display,setDisplay]=useState(title),timer=useRef(null);
 const reset=()=>{clearInterval(timer.current);setDisplay(title);};
 useEffect(()=>()=>clearInterval(timer.current),[]);
 const play=()=>{
  clearInterval(timer.current);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){setDisplay(english);return;}
  let frame=0;
  timer.current=setInterval(()=>{
   frame++;
   setDisplay(english.split('').map((c,i)=>c===' '?' ':frame-i*1.2>24*.6?c:CHARS[Math.floor(Math.random()*CHARS.length)]).join(''));
   if(frame>24+english.length){clearInterval(timer.current);setDisplay(english);}
  },35);
 };
 return [display,play,reset];
}

export function PodcastCategory({src,title,english,onSelect}){
 const canvas=useRef(null),[display,play,reset]=useScramble(title,english);
 useEffect(()=>{
  let alive=true;const img=new Image();img.src=src;
  img.decode().then(()=>{
   if(!alive)return;
   const sample=document.createElement('canvas');sample.width=80;sample.height=64;
   const s=sample.getContext('2d',{willReadFrequently:true});s.drawImage(img,0,0,80,64);
   const pixels=s.getImageData(0,0,80,64).data,c=canvas.current.getContext('2d');
   c.clearRect(0,0,480,480);c.font='7px monospace';c.textBaseline='top';
   for(let y=0;y<64;y++)for(let x=0;x<80;x++){
    const i=(y*80+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2],alpha=pixels[i+3]/255;
    if(alpha<.15)continue;
    c.fillStyle=Math.max(r,g,b)-Math.min(r,g,b)>45?`rgba(${r},${g},${b},${alpha})`:`rgba(24,30,27,${alpha})`;
    c.fillText('8',x*6,y*7.5);
   }
   canvas.current.dataset.ready='true';
  }).catch(()=>{if(alive)canvas.current.dataset.error='true';});
  return()=>{alive=false;};
 },[src]);
 return <figure className="podcast-category">
  <button className="category-art" onClick={onSelect} aria-label={'前往'+title}><img src={src} alt=""/><canvas ref={canvas} width="480" height="480" aria-hidden="true"/></button>
  <figcaption><button className="category-title" onClick={onSelect} onMouseEnter={play} onMouseLeave={reset} onFocus={play} onBlur={reset} aria-label={title+' / '+english}><span aria-hidden="true">{display}</span></button></figcaption>
 </figure>;
}
