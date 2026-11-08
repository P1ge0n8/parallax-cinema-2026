// The inset follows the actual wooden boards, including the chipped outer edges.
export const TABLE_BOUNDS={minX:-3.78,maxX:3.78,minZ:-1.72,maxZ:1.72};
const GAP=.025;
function footprint(item){return item.userData.footprint||square(item.userData.radius);}
function square(radius){return {minX:-radius,maxX:radius,minZ:-radius,maxZ:radius};}
export function clampPosition(x,z,shape){
 const f=typeof shape==='number'?square(shape):shape;
 return {x:Math.max(TABLE_BOUNDS.minX-f.minX,Math.min(TABLE_BOUNDS.maxX-f.maxX,x)),z:Math.max(TABLE_BOUNDS.minZ-f.minZ,Math.min(TABLE_BOUNDS.maxZ-f.maxZ,z))};
}
export function canPlace(item,x,z,items){
 if(item.userData.fixed)return false;
 const a=footprint(item);
 return items.every(other=>{
  if(other===item)return true;
  const b=footprint(other),p=other.position;
  return x+a.maxX+GAP<=p.x+b.minX||x+a.minX-GAP>=p.x+b.maxX||z+a.maxZ+GAP<=p.z+b.minZ||z+a.minZ-GAP>=p.z+b.maxZ;
 });
}
// Sweep the route, not just the final point: no tunnelling through the computer.
// A blocked diagonal slides along the free axis instead of sticking completely.
export function resolveMove(item,x,z,items,onStep){
 const p={x:item.position.x,z:item.position.z};if(item.userData.fixed)return p;
 const target=clampPosition(x,z,footprint(item));
 const count=Math.max(1,Math.ceil(Math.hypot(target.x-p.x,target.z-p.z)/.035));
 const dx=(target.x-p.x)/count,dz=(target.z-p.z)/count;
 for(let i=0;i<count;i++){
  if(canPlace(item,p.x+dx,p.z+dz,items)){p.x+=dx;p.z+=dz;}
  else{
   if(canPlace(item,p.x+dx,p.z,items))p.x+=dx;
   if(canPlace(item,p.x,p.z+dz,items))p.z+=dz;
  }
  onStep?.(p);
 }
 return p;
}
export function isDrag(x,y,startX,startY){return Math.hypot(x-startX,y-startY)>4;}
