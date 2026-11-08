// Retain corners, but merge consecutive points on a straight drag segment.
export function recordPoint(path,point){
 const p={x:point.x,z:point.z},last=path.at(-1);
 if(last&&Math.hypot(p.x-last.x,p.z-last.z)<.001)return;
 if(path.length>1){
  const before=path.at(-2),ax=last.x-before.x,az=last.z-before.z,bx=p.x-last.x,bz=p.z-last.z;
  if(ax*bx+az*bz>=0&&Math.abs(ax*bz-az*bx)<.00001){path[path.length-1]=p;return;}
 }
 path.push(p);
}
export function returnRoute(path,current){
 const points=path.map(p=>({...p}));recordPoint(points,current);points.reverse();
 const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances.at(-1)+Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z));
 return {points,distances,length:distances.at(-1)};
}
export function sampleReturn(route,progress,out={}){
 const distance=Math.max(0,Math.min(1,progress))*route.length;
 let i=0;while(i<route.points.length-2&&route.distances[i+1]<distance)i++;
 const a=route.points[i],b=route.points[i+1]||a,span=(route.distances[i+1]||0)-route.distances[i];
 const t=span?Math.min(1,(distance-route.distances[i])/span):0;
 out.x=a.x+(b.x-a.x)*t;out.z=a.z+(b.z-a.z)*t;out.segment=i;return out;
}
