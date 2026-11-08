import {useEffect,useRef,useState} from 'react';
import {isSpaceRoute} from '../space-source/route-protocol.js';

// Keep one reading frame alive while its current contents fade before the swap.
export function useReadingTransition(route){
 const [displayed,setDisplayed]=useState(route),[phase,setPhase]=useState('idle');
 const current=useRef(route);
 useEffect(()=>{
  let timer;
  const commit=()=>{current.current=route;setDisplayed(route);};
  if(route===current.current){setPhase('idle');return;}
  if(isSpaceRoute(route)||isSpaceRoute(current.current)||matchMedia('(prefers-reduced-motion: reduce)').matches){commit();setPhase('idle');return;}
  setPhase('out');
  timer=setTimeout(()=>{commit();setPhase('in');timer=setTimeout(()=>setPhase('idle'),180);},160);
  return()=>clearTimeout(timer);
 },[route]);
 // Opening/closing the reader is immediate; only swaps within it are delayed.
 return {displayed:!isSpaceRoute(route)&&isSpaceRoute(displayed)?route:displayed,phase};
}
