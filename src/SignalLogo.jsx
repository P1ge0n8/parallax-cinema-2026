import React, {useEffect, useRef} from 'react';
import {createLogoSignal} from './logoSignal';

export function SignalLogo({onEnter, visible=true}) {
 const canvas=useRef(null), animation=useRef(null);
 useEffect(()=>{
  animation.current=createLogoSignal(canvas.current);
  return()=>{animation.current.destroy();animation.current=null;};
 },[]);
 useEffect(()=>{animation.current?.setVisible(visible);},[visible]);
 const clear=()=>animation.current?.leave();
 return <button className="dog signal-logo" onClick={onEnter}
  onPointerMove={event=>animation.current?.point(event.clientX,event.clientY)}
  onPointerDown={event=>animation.current?.point(event.clientX,event.clientY)}
  onPointerLeave={clear} onPointerCancel={clear}
  onPointerUp={event=>{if(event.pointerType!=='mouse')clear();}}
  onFocus={()=>animation.current?.focus()} onBlur={clear}
  aria-label="进入视差之见">
  <canvas ref={canvas} role="img" aria-label="由彩色竖线组成的视差之见 Logo，保留动物剪影、中文字和原始色差纹理"/>
 </button>;
}
