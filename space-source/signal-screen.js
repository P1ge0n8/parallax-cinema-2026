import {layers} from './logoSignalLayers.js';

const N=96, weights=[.35,1.05,2.2,3.65], colors=['#8fc39b','#08bccb','#b62360'];
let sampled;
function sampleLogo(){
 if(sampled)return sampled;
 const off=document.createElement('canvas');off.width=off.height=N*6;
 const context=off.getContext('2d',{willReadFrequently:true});
 context.fillStyle='#000';context.fillRect(0,0,off.width,off.height);
 const size=off.width*.94;
 context.translate((off.width-size)/2,(off.height-size*266/268)/2);context.scale(size/268,size/268);
 for(const layer of layers){context.fillStyle=layer.color;context.fill(new Path2D(layer.path));}
 const pixels=context.getImageData(0,0,off.width,off.height).data;
 const light=new Float32Array(N*N),color=new Uint8Array(N*N);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  let r=0,g=0,b=0;
  for(let j=0;j<6;j++)for(let i=0;i<6;i++){const p=((y*6+j)*off.width+x*6+i)*4;r+=pixels[p];g+=pixels[p+1];b+=pixels[p+2];}
  r/=36;g/=36;b/=36;const id=y*N+x;
  light[id]=(.2126*r+.7152*g+.0722*b)/255;
  color[id]=r>g*1.45?2:g>r*1.5&&b>r*1.5?1:0;
 }
 off.width=off.height=0;
 const candidates=[],boxes=[];
 for(let y=2;y<N-12;y+=2)for(let x=4;x<N-12;x+=2){
  let score=0;for(let j=0;j<10;j++)for(let i=0;i<10;i++)score+=light[(y+j)*N+x+i];
  candidates.push({x,y,score});
 }
 candidates.sort((a,b)=>b.score-a.score);
 for(const box of candidates){if(boxes.every(b=>Math.hypot(b.x-box.x,b.y-box.y)>20)){boxes.push(box);if(boxes.length===3)break;}}
 sampled={light,color,boxes};return sampled;
}
function hash(x,y){const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
function noise(x,y){
 const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;
 u=u*u*(3-2*u);v=v*v*(3-2*v);
 return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;
}

export function createSignalScreen(canvas){
 const ctx=canvas.getContext('2d'),data=sampleLogo();
 const offsets=new Float32Array(N*N),velocity=new Float32Array(N*N);
 const width=canvas.width,height=canvas.height,side=448,left=(width-side)/2,top=(height-side)/2,dx=side/N,scale=side/440;
 let last=-1,reveal=0;
 return {draw(time,dt,{reduced=false,active=false,point=null}={}){
  if(time-last<1/30)return false;
  dt=Math.min(last<0?1/30:time-last,.05);last=time;
  const pointer=point||{x:width/2,y:height/2};
  ctx.fillStyle='#020605';ctx.fillRect(0,0,width,height);ctx.lineCap='butt';
  reveal=reduced?Number(active):reveal+(Number(active)-reveal)*(1-Math.exp(-dt*9));
  const paths=Array.from({length:12},()=>new Path2D());
  for(let x=0;x<N;x++)for(let y=0;y<N;y++){
   const id=y*N+x,px=left+(x+.5)*dx,py=top+y*dx;
   const radius=70*scale,distance=Math.hypot(px-pointer.x,py-pointer.y);
   const target=!reduced&&active&&distance<radius?(px<pointer.x?-1:1)*Math.pow(1-distance/radius,2)*23*scale:0;
   if(reduced){offsets[id]=velocity[id]=0;}else{velocity[id]+=(target-offsets[id])*135*dt;velocity[id]*=Math.exp(-10*dt);offsets[id]+=velocity[id]*dt;}
   const n=noise(x*.17,y*.14-(reduced?0:time*.3));
   const brightness=Math.max(0,Math.min(1,Math.pow(Math.min(1,data.light[id]/.62),.58)*.88+(n-.45)*.22));
   const band=brightness>.83?3:brightness>.53?2:brightness>.17?1:0;
   const xx=px+offsets[id]+(reduced?0:(n-.5)*1.4*scale),path=paths[data.color[id]*4+band];path.moveTo(xx,py);path.lineTo(xx,py+dx*.93);
  }
  for(let color=0;color<3;color++)weights.forEach((weight,i)=>{ctx.strokeStyle=colors[color];ctx.lineWidth=weight*scale;ctx.globalAlpha=i===0?.12:1;ctx.stroke(paths[color*4+i]);});ctx.globalAlpha=1;
  if(reveal>.01){
   ctx.save();ctx.globalAlpha=reveal;ctx.strokeStyle=ctx.fillStyle='#69b4ff';ctx.lineWidth=1.4;ctx.font='11px monospace';
   ctx.beginPath();data.boxes.forEach((b,i)=>{const x=left+(b.x+5)*dx,y=top+(b.y+5)*dx;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
   for(const b of data.boxes){const x=left+b.x*dx,y=top+b.y*dx,size=10*dx;ctx.globalAlpha=reveal*.45;ctx.strokeRect(x,y,size,size);ctx.globalAlpha=reveal;
    for(const [cx,cy,sx,sy] of [[x,y,1,1],[x+size,y,-1,1],[x,y+size,1,-1],[x+size,y+size,-1,-1]]){ctx.beginPath();ctx.moveTo(cx+sx*8,cy);ctx.lineTo(cx,cy);ctx.lineTo(cx,cy+sy*8);ctx.stroke();}
    ctx.fillText(`[${b.x}, ${b.y}]`,x,y-5);
   }ctx.restore();
  }
  ctx.fillStyle='#acc29b';ctx.font='13px monospace';ctx.textAlign='left';ctx.fillText('PARALLAX / LIVE SIGNAL',24,24);ctx.textAlign='right';ctx.fillText(active?'SUBJECT DETECTED':'03:17 / CONNECTED',width-24,height-15);
  ctx.strokeStyle='#64846c';ctx.lineWidth=1;ctx.strokeRect(12,9,width-24,height-18);
  return true;
 }};
}
