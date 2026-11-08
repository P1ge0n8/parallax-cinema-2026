import {useEffect,useRef,useState} from 'react';
import {LANGUAGE_KEY,nextLanguage,validLanguage} from './i18n.js';

// Swap existing text while it is invisible. The reader and WebGL scene stay mounted.
export function useLocaleTransition(){
 const [language,setLanguage]=useState(()=>{try{return validLanguage(localStorage.getItem(LANGUAGE_KEY));}catch{return 'zh-CN';}});
 const [phase,setPhase]=useState('idle');
 const requested=useRef(language),timer=useRef(null);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 function cycleLanguage(){
  requested.current=nextLanguage(requested.current);clearTimeout(timer.current);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){setLanguage(requested.current);setPhase('idle');return;}
  setPhase('out');
  timer.current=setTimeout(()=>{
   setLanguage(requested.current);setPhase('in');
   timer.current=setTimeout(()=>setPhase('idle'),180);
  },160);
 }
 return {language,phase,cycleLanguage};
}
