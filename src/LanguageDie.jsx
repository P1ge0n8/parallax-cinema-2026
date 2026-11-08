import {useEffect,useRef} from 'react';
import {LANGUAGES,languageLabels,nextLanguage,pixelFamilies,textFor} from './i18n.js';

// Six flat pixel textures, projected onto a tiny rotating cube. No WebGL context.
const faces=[
 {normal:[0,0,1],corners:[[-1,1,1],[1,1,1],[1,-1,1],[-1,-1,1]]},
 {normal:[-1,0,0],corners:[[-1,1,-1],[-1,1,1],[-1,-1,1],[-1,-1,-1]]},
 {normal:[0,0,-1],corners:[[1,1,-1],[-1,1,-1],[-1,-1,-1],[1,-1,-1]]},
 {normal:[1,0,0],corners:[[1,1,1],[1,1,-1],[1,-1,-1],[1,-1,1]]},
 {normal:[0,1,0],corners:[[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]]},
 {normal:[0,-1,0],corners:[[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1]]}
];
function makeFace(language){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.scale(4,4);
 c.fillStyle='#f5dba8';c.fillRect(0,0,32,32);c.strokeStyle='#795731';c.lineWidth=2;c.strokeRect(1,1,30,30);
 c.strokeStyle='#ffe4b1';c.lineWidth=1;c.strokeRect(3.5,3.5,25,25);
 c.fillStyle='#b18b52';for(const [x,y] of [[5,25],[8,27],[24,6],[26,8],[24,24]])c.fillRect(x,y,1,1);
 c.fillStyle='#24180e';
 if(language){c.font=`12px ${pixelFamilies[language]}`;c.textAlign='center';c.textBaseline='middle';c.fillText(languageLabels[language],16,16);}
 else{c.fillRect(14,14,4,4);}
 return canvas;
}
function paintDie(canvas,textures,angle,quarter,language){
 const c=canvas.getContext('2d'),resolution=canvas.width/64;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);c.scale(resolution,resolution);c.imageSmoothingEnabled=false;
 const co=Math.cos(angle),si=Math.sin(angle);
 const rotate=([x,y,z])=>[x*co+z*si,y,-x*si+z*co];
 const project=p=>{const [x,y,z]=rotate(p);return [32+x*17,31-y*15+z*7];};
 const depth=([x,y,z])=>{const r=rotate([x,y,z]);return r[2]*.9+r[1]*.44;};
 c.fillStyle='#51341944';c.fillRect(15,55,34,3);c.fillRect(20,58,24,2);
 const languages=[language,nextLanguage(language),nextLanguage(nextLanguage(language)),language];
 faces.map((face,i)=>({face,i,depth:depth(face.normal)})).filter(f=>f.depth>.001).sort((a,b)=>a.depth-b.depth).forEach(({face,i,depth:d})=>{
  const points=face.corners.map(project),[a,b,,e]=points;
  c.save();c.beginPath();points.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
  c.setTransform((b[0]-a[0])*resolution/128,(b[1]-a[1])*resolution/128,(e[0]-a[0])*resolution/128,(e[1]-a[1])*resolution/128,a[0]*resolution,a[1]*resolution);
  c.drawImage(textures[i<4?languages[(i-quarter+4)%4]:'top'],0,0);
  c.fillStyle=`rgba(65,35,10,${i===4?.03:.09+(1-d)*.22})`;c.fillRect(0,0,128,128);c.restore();
  c.beginPath();points.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.strokeStyle='#72502b';c.lineWidth=1;c.stroke();
 });
}
export function LanguageDie({language,onToggle}){
 const canvas=useRef(null),button=useRef(null),textures=useRef(null),frame=useRef(0),rolling=useRef(false),quarter=useRef(0),locale=useRef(language);
 const next=nextLanguage(language);
 const paint=()=>{if(textures.current&&canvas.current)paintDie(canvas.current,textures.current,Math.PI/6+quarter.current*Math.PI/2,quarter.current,locale.current);};
 useEffect(()=>{
  let cancelled=false;
  const prepare=()=>{textures.current=Object.fromEntries([...LANGUAGES.map(code=>[code,makeFace(code)]),['top',makeFace()]]);if(!rolling.current)paint();};
  prepare();
  Promise.all(LANGUAGES.map(code=>document.fonts.load(`12px ${pixelFamilies[code]}`))).then(()=>{if(!cancelled)prepare();}).catch(()=>{});
  return()=>{cancelled=true;cancelAnimationFrame(frame.current);};
 },[]);
 useEffect(()=>{locale.current=language;if(!rolling.current)paint();},[language]);
 function roll(){
  if(rolling.current)return;
  onToggle();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  rolling.current=true;button.current.dataset.rolling='true';
  const start=performance.now(),from=quarter.current,shown=locale.current;
  function tick(now){
   const p=Math.min(1,(now-start)/520),eased=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
   // Quantised angular frames retain the deliberately low-resolution motion.
   const angle=Math.PI/6+(from+Math.round(eased*16)/16)*Math.PI/2;
   paintDie(canvas.current,textures.current,angle,from,shown);
   if(p<1){frame.current=requestAnimationFrame(tick);return;}
   quarter.current=(from+1)%4;rolling.current=false;button.current.dataset.rolling='false';paint();
  }
  frame.current=requestAnimationFrame(tick);
 }
 return <button ref={button} className="language-die" onClick={roll} aria-label={`${textFor(language,'languageHint')}: ${languageLabels[next]}`} title={`${textFor(language,'languageHint')}: 繁中 / 简中 / ENG`} draggable={false}>
  <canvas ref={canvas} width="192" height="192" aria-hidden="true"/>
 </button>;
}
