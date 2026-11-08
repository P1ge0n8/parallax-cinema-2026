// A screen-oriented close-up: substantially nearer than the previous housing view.
// Portrait framing still fits all three channel choices with an 18% side margin.
export function terminalViewDistance(aspect,fov){
 const halfAngle=fov*Math.PI/360;
 return Math.max(1.65,.84/(Math.tan(halfAngle)*aspect),.64/Math.tan(halfAngle));
}
