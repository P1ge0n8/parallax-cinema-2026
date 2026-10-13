import React, {useEffect,useRef,useState} from 'react';
import {SocialIconButtons} from './SocialIconButtons';
import {AsciiArt} from './AsciiArt';
import {PodcastCategory} from './PodcastCategory';

const A=import.meta.env.BASE_URL+'assets/';
function AsciiLogo({onEnter,visible=true}){
 const ref=useRef(null), active=useRef(false),shown=useRef(visible); const [on,setOn]=useState(false);
 useEffect(()=>{active.current=on},[on]);
 useEffect(()=>{shown.current=visible},[visible]);
 useEffect(()=>{
  const canvas=ref.current,ctx=canvas.getContext('2d'); let frame,alive=true,points=[]; const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const img=new Image();img.src=A+'logo.jpg';
  img.onload=()=>{
   if(!alive)return;
   const sample=document.createElement('canvas');sample.width=108;sample.height=74;const s=sample.getContext('2d');
   s.drawImage(img,0,0,108,74);const p=s.getImageData(0,0,108,74).data;
   for(let y=0;y<74;y++)for(let x=0;x<108;x++){let i=(y*108+x)*4;const r=p[i],g=p[i+1],b=p[i+2];if(Math.max(r,g,b)>34)points.push({x,y,c:'8',color:`rgb(${Math.min(255,r*1.35+10)},${Math.min(255,g*1.35+10)},${Math.min(255,b*1.35+10)})`});}
   canvas.dataset.ready='true';canvas.dataset.points=points.length;
   let last=0,nextPatch=0,patches=[],nextBurst=0,burstEnd=0;
   const draw=t=>{if(!alive)return;frame=requestAnimationFrame(draw);if(!shown.current||document.hidden||t-last<65)return;last=t;ctx.clearRect(0,0,600,600);ctx.font='8px monospace';ctx.textBaseline='top';
    if(t>=nextBurst){burstEnd=t+220+Math.random()*400;nextBurst=burstEnd+1100+Math.random()*2400;}
    const glitch=!motion.matches&&(active.current||t<burstEnd);
    if(glitch&&t>=nextPatch){
     patches=Array.from({length:1+Math.floor(Math.random()*3)},()=>({x:Math.random()*94,y:Math.random()*66,w:10+Math.random()*22,h:3+Math.random()*7,shift:(Math.random()>.5?1:-1)*(5+Math.random()*10)}));
     nextPatch=t+220+Math.random()*240;
    }
    if(!glitch)patches=[];
    canvas.dataset.effect=glitch?'glitch':'idle';
    for(const p of points){const patch=patches.find(a=>p.x>=a.x&&p.x<a.x+a.w&&p.y>=a.y&&p.y<a.y+a.h);const band=!!patch;let x=p.x*5.55+(patch?.shift||0),y=p.y*8.1;
     if(band){ctx.fillStyle='#139aaa';ctx.fillText(p.c,x+(glitch?6:1),y);ctx.fillStyle='#a32759';ctx.fillText(p.c,x-(glitch?5:1),y+1)}
     ctx.fillStyle=p.color;ctx.globalAlpha=.92;ctx.fillText(band&&p.x%12===0?'#':p.c,x,y);ctx.globalAlpha=1;
    }
   };frame=requestAnimationFrame(draw);
  };
  return()=>{alive=false;cancelAnimationFrame(frame)};
 },[]);
 return <button className={'dog '+(on?'is-active':'')} onPointerEnter={()=>setOn(true)} onPointerLeave={()=>setOn(false)} onFocus={()=>setOn(true)} onBlur={()=>setOn(false)} onClick={onEnter} aria-label="进入视差之见"><canvas ref={ref} width="600" height="600" role="img" aria-label="以数字 8 组成的完整视差之见 Logo，包含狗、中文字和原始色差纹理"/></button>
}

const podcastColumns=[['film-fest','影节庆','FILM FEST'],['focus','焦点','FOCUS'],['in-cinemas','院线','IN CINEMAS']];
const filmFestEpisodes=[
 ['4.1','聚焦戛纳：平庸的金棕榈是一次“普通事故”','68493eed1c45a63232a602e6'],
 ['4.2','聚焦戛纳：深度讨论《风林火山》和《狂野时代》','684940edb23ed76e607fa4d9'],
 ['4.3','聚焦戛纳：你“戈达尔”了没？','698fbe86a22480add6142158'],
 ['8.1','诺兰为什么没进戛纳','6a985441f03e74ee6b041e11']
];
function Podcast(){
 const sections=useRef([]),top=useRef(null);
 function goTo(index){
  const target=sections.current[index];
  target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  target.querySelector('h2').focus({preventScroll:true});
 }
 return <div className="podcast-page">
  <section ref={top} className="podcast-minimal podcast-snap" aria-label="播客"><div className="eyebrow">PODCAST</div><div className="podcast-categories" aria-label="播客栏目">
   {podcastColumns.map(([key,title,english],index)=><PodcastCategory key={key} src={A+'podcast-icons/'+key+'.png'} title={title} english={english} onSelect={()=>goTo(index)}/>)}
  </div></section>
  {podcastColumns.map(([key,title,english],index)=><section key={key} ref={element=>sections.current[index]=element} className="podcast-section podcast-snap" aria-label={title}>
   <div className="podcast-section-content"><div className="podcast-section-heading"><h2 tabIndex="-1">{title}<span>{english}</span></h2><button className="podcast-back" onClick={()=>top.current.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}>返回栏目 ↑</button></div>
    {index===0?<div className="episode-collection"><ol className="episode-grid">{filmFestEpisodes.map(([number,title,id])=><li key={id}><a href={'https://www.xiaoyuzhoufm.com/episode/'+id} target="_blank" rel="noreferrer"><img src={A+'logo.jpg'} alt="" loading="lazy"/><span className="episode-title">#{number} | {title}</span></a></li>)}</ol></div>:<p className="podcast-empty">节目整理中</p>}
   </div>
  </section>)}
 </div>;
}

function Articles(){
 return <section className="journal-minimal" aria-label="文章"><div className="eyebrow">JOURNAL</div><p className="journal-coming">STAY TUNED</p></section>;
}

function About(){const [sent,setSent]=useState(false);return <section className="page about"><div className="eyebrow">关于我们 / ABOUT</div><h1>视线有偏差，<br/>电影有回声。</h1><div className="about-grid"><img src={A+'logo.jpg'} alt="视差之见原始色差故障标识"/><div><p>{introCopy}</p><p>{introCopyEnd}</p></div></div><section className="contact"><div><span className="eyebrow">保持联系 / CONTACT</span><h2>从一句话开始。</h2><p>选题、合作，或只是分享一部电影。</p></div><form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);const blob=new Blob([`称呼：${data.get('name')}\n邮箱：${data.get('email')}\n\n${data.get('message')}`],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='视差之见-联系草稿.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setSent(true)}}><label>怎么称呼你<input name="name" required placeholder="你的名字"/></label><label>电子邮箱<input name="email" type="email" required placeholder="you@example.com"/></label><label>想聊些什么<textarea name="message" rows="3" required placeholder="写下一点想法……"/></label><button type="submit">保存联系草稿 ↗</button>{sent&&<p className="caption" role="status">草稿已下载到你的设备，未发送。</p>}</form></section></section>}

const introCopy = '每一双眼睛，乃至每一只眼，看电影和世界的角度都不尽相同，也造就了我们有时截然不同的“观点”。';
const introCopyEnd = '允许不同视角的交流、不同立场的碰撞，这里是“视差”发声的空间。';

function Toolbar({section}) {
 return <header className="floating-toolbar" aria-label="浮动工具栏">
  <a className="toolbar-brand" href="#/home" aria-label="返回首页"><img src={A+'logo.jpg'} alt=""/></a>
  <nav className="toolbar-links" aria-label="主要导航">
   {[['intro','导览','HOME'],['podcast','播客','PODCAST'],['articles','文章','ARTICLES'],['about','联系','CONTACT']].map(([key,label,english])=><a className={key==='about'?'toolbar-contact':undefined} key={key} href={'#/'+key} onClick={event=>{if(key==='podcast'&&section==='podcast'){event.preventDefault();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}} aria-label={label} aria-current={section===key?'page':undefined}><span className="toolbar-label" aria-hidden="true"><span className="toolbar-word">{label}</span><span className="toolbar-english">{english}</span></span></a>)}
  </nav>
 </header>
}

function Entrance({entered,active=true}) {
 const introRef=useRef(null),[transitioning,setTransitioning]=useState(false);
 useEffect(()=>{
  if(!transitioning)return;
  const timer=setTimeout(()=>setTransitioning(false),950);
  return()=>clearTimeout(timer);
 },[transitioning]);
 function enter(){
  if(entered||transitioning)return;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setTransitioning(true);
  location.hash='/intro';
 }
 useEffect(()=>{
  if(!entered||transitioning||!active)return;
  introRef.current?.focus({preventScroll:true});
 },[entered,transitioning,active]);
 return <div className={'entrance '+(entered?'is-intro':'')}><div className={'entrance-track '+(entered?'entered':'')}>
  <section className="entrance-panel landing" aria-label="首页" inert={entered} aria-hidden={entered}>
   <div className="landing-logo"><AsciiLogo onEnter={enter} visible={!entered||transitioning}/><a className="enter-link" href="#/intro" onClick={e=>{e.preventDefault();enter()}}>click now</a></div>
   <SocialIconButtons/>
  </section>
  <section className={'entrance-panel introduction '+(entered?'revealed':'')} aria-label="视差之见介绍与导览" inert={!entered||transitioning} aria-hidden={!entered||transitioning} ref={introRef} tabIndex="-1">
   <div className="intro-layout">
    <div className="intro-copy pixel-panel"><AsciiArt src={import.meta.env.BASE_URL+'ascii-dog/source.gif'} animated enabled={active&&entered&&!transitioning} className="intro-boxer" label="动态 ASCII 拳击斗牛犬"/><p>{introCopy}</p><p>{introCopyEnd}</p></div>

   </div>
   <a className="return-link" href="#/home">← 返回</a>
  </section>
 </div></div>
}

export function App(){
 const [route,setRoute]=useState(location.hash.slice(2)||'home');
 const [previous,setPrevious]=useState(null);
 const mainRef=useRef(null);
 useEffect(()=>{
  const change=()=>{
   const next=location.hash.slice(2)||'home';
   if(next===route)return;
   const entranceOnly=[route,next].every(value=>value==='home'||value==='intro');
   setPrevious(entranceOnly||matchMedia('(prefers-reduced-motion: reduce)').matches?null:{route,scroll:window.scrollY});
   setRoute(next);window.scrollTo(0,0);
  };
  window.addEventListener('hashchange',change);
  return()=>window.removeEventListener('hashchange',change);
 },[route]);
 useEffect(()=>{
  if(!previous)return;
  const timer=setTimeout(()=>setPrevious(null),1100);
  return()=>clearTimeout(timer);
 },[previous]);
 useEffect(()=>{if(route!=='home'&&route!=='intro')mainRef.current?.focus({preventScroll:true});},[route]);
 const section=route.split('/')[0],entrance=section==='home'||section==='intro',minimalPodcast=section==='podcast';
 const views=[...(previous?[{...previous,outgoing:true}]:[]),{route,outgoing:false}];
 return <div className={'site '+(minimalPodcast?'podcast-site':entrance?'home':'')}>
  <div className={'route-background landscape-background '+(entrance||minimalPodcast?'is-visible':'')} aria-hidden="true"/>
  <div className={'route-background podcast-background '+(minimalPodcast?'is-visible':'')} aria-hidden="true"/>
  <div className={'home-dimmer '+(section==='home'?'is-visible':'')} aria-hidden="true"/>
  <a href="#main" onClick={e=>{e.preventDefault();mainRef.current?.focus()}} className="skip">跳至内容</a>
  {section!=='home'&&<Toolbar section={section}/>}
  <div className="route-transition">
   {views.map(view=>{
    const page=view.route.split('/')[0],isEntrance=page==='home'||page==='intro',editorial=page!=='podcast'&&page!=='articles'&&!isEntrance;
    return <div key={isEntrance?'entrance':view.route} className={'route-layer '+(view.outgoing?'route-departure':'route-arrival')+(editorial?' interior':'')} style={view.outgoing?{top:-view.scroll}:undefined} inert={view.outgoing} aria-hidden={view.outgoing||undefined}>
     <main ref={view.outgoing?undefined:mainRef} id={view.outgoing?undefined:'main'} tabIndex="-1">{isEntrance?<Entrance entered={page==='intro'} active={!view.outgoing}/>:page==='podcast'?<Podcast/>:page==='articles'?<Articles/>:page==='about'?<About/>:<section className="page"><h1>这一帧走丢了。</h1><a href="#/home">返回首页</a></section>}</main>

    </div>;
   })}
  </div>
 </div>
}
