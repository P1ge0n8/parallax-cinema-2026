import {useEffect,useRef,useState} from 'react';
import {mountSpace} from '../space-source/main.js';
import sceneTemplate from '../space-source/scene-template.html?raw';
import {textFor} from './i18n.js';
import {isSiteRoute} from '../space-source/route-protocol.js';
import {HomeSlogan} from './HomeSlogan.jsx';
// React owns the scene lifetime; the native renderer owns animation and controls.
// A ShadowRoot isolates the prototype's styles without a nested browsing context.
export default function SpaceHome({route,language,languagePhase}){
 const host=useRef(null),scene=useRef(null),current=useRef(route),locale=useRef(language);
 const [failed,setFailed]=useState(false),[atDesk,setAtDesk]=useState(route==='home');
 useEffect(()=>{current.current=route;scene.current?.setRoute(route);},[route]);
 useEffect(()=>{locale.current=language;scene.current?.setLanguage(language);},[language]);
 useEffect(()=>{scene.current?.setLanguagePhase(languagePhase);},[languagePhase]);
 useEffect(()=>{
  const root=host.current.shadowRoot||host.current.attachShadow({mode:'open'});
  root.innerHTML=sceneTemplate;
  try{
   scene.current=mountSpace(root,{initialRoute:current.current,initialLanguage:locale.current,onStageChange:stage=>setAtDesk(stage==='desk'),onNavigate:next=>{if(isSiteRoute(next)&&next!==(location.hash.slice(2)||'home'))location.hash='/'+next;}});
  }catch(error){console.error('Scene failed',error);setFailed(true);}
  return()=>{scene.current?.dispose();scene.current=null;root.innerHTML='';};
 },[]);
 return <div className="space-home"><div ref={host} className="space-frame"/>{atDesk&&route==='home'&&!failed&&<HomeSlogan language={language} phase={languagePhase}/>} {failed&&<div className="space-loading" role="alert">{textFor(language,'sceneUnavailable')}</div>}{failed&&<nav className="space-fallback is-visible" aria-label={textFor(language,'directory')}><a href="#/intro">{textFor(language,'directory')}</a><a href="#/podcast">{textFor(language,'podcast')}</a><a href="#/about">{textFor(language,'about')}</a><a href="#/articles">{textFor(language,'articles')}</a><a href="#/contact">{textFor(language,'contact')}</a></nav>}</div>;
}
