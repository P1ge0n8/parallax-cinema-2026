// Four smooth angular windows, peaking at diagonal views. No discontinuity at +/- PI.
export function lensAmount(azimuth,polar){
 const diagonal=Math.pow(Math.abs(Math.sin(azimuth*2)),6);
 const elevation=Math.exp(-Math.pow((polar-1.22)/.78,4));
 return diagonal*elevation;
}
// This is the same output-pixel -> source-pixel mapping used by the lens shader.
export function lensPoint(u,v,aspect,amount,out){
 const x=(u-.5)*aspect,y=v-.5,r2=x*x+y*y;
 const factor=(1+.62*amount*r2)/(1+.16*amount);
 out.x=.5+x*factor/aspect;out.y=.5+y*factor;return out;
}
export const lensGLSL=`
 vec2 lensUV(vec2 uv){
  vec2 p=(uv-.5)*vec2(size.x/size.y,1.);
  p*=(1.+.62*lens*dot(p,p))/(1.+.16*lens);
  return p/vec2(size.x/size.y,1.)+.5;
 }
`;
