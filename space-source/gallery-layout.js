export const channels=[
 {id:'film-fest',name:'影节庆',en:'FILM FEST',line:'半杯红酒，下一场相遇。'},
 {id:'focus',name:'焦点',en:'FOCUS',line:'换一副眼镜，再看一次银幕。'},
 {id:'in-cinemas',name:'院线',en:'CINEMA',line:'镜头就位，电影即将开始。'}
];

// Three columns remain in the same order, including on narrow screens.
export function galleryLayout(aspect,fov,distance=5){
 const height=2*distance*Math.tan(fov*Math.PI/360),width=height*aspect;
 return {distance,scale:Math.min(width/6.8,height/4.7,1.3),spacing:2.2};
}

// The first click owns the whole approach -> dissolve -> three objects sequence.
export function galleryPhase(elapsed,reduced=false){
 const duration=reduced?.18:2.2,p=Math.max(0,Math.min(1,elapsed/duration));
 return {dissolve:p,reveal:Math.max(0,Math.min(1,(p-.62)/.38)),done:p>=1};
}
