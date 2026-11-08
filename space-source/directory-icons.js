// Stencil silhouettes share a 128-unit drawing grid and one export source.
export const modules = [
 {id:'about',name:'关于我们',en:'ABOUT US',code:'01',shapes:[
  // Traced from the supplied graffiti portrait: cap, tall face, nose and collar.
  {d:'M25 44L28 25Q33 7 62 8Q101 4 107 22L113 39M52 10Q48 25 50 34M56 10Q80 16 100 33',stroke:5},
  {d:'M9 49Q60 30 115 40M25 47L27 91M109 44L111 92',stroke:6},
  {d:'M30 49H56V66H30Z M79 46H105V63H79Z M56 54L79 52',stroke:5},
  {d:'M36 60L48 53M86 52V58M96 52V58',stroke:3},
  {d:'M75 66Q79 61 82 66L93 91L67 84Z',stroke:5},
  {d:'M27 91Q12 90 14 108Q45 104 65 121Q87 105 117 108Q123 92 111 92M20 114L53 115M76 117L114 114',stroke:6}
 ]},
 {id:'podcast',name:'播客',en:'PODCAST',code:'02',shapes:[
  {d:'M16 69V51C16 3 112 3 112 51V69',stroke:9},
  {d:'M9 52H24V83H9Z M104 52H119V83H104Z'},
  {d:'M28 43L27 25L47 37Q64 32 81 37L101 25L100 43L105 78Q101 98 64 104Q27 98 23 78Z'},
  {d:'M57 64A18 21 0 1 1 21 64A18 21 0 1 1 57 64Z M107 64A18 21 0 1 1 71 64A18 21 0 1 1 107 64Z',cut:true},
  {d:'M52 65A12 15 0 1 1 28 65A12 15 0 1 1 52 65Z M100 65A12 15 0 1 1 76 65A12 15 0 1 1 100 65Z'},
  {d:'M45 65A5 8 0 1 1 35 65A5 8 0 1 1 45 65Z M93 65A5 8 0 1 1 83 65A5 8 0 1 1 93 65Z M57 79H71L64 91Z',cut:true}
 ]},
 {id:'articles',name:'文章',en:'ARTICLES',code:'03',shapes:[
  // Round ears and an open face outline; only the mohawk and nose are solid.
  {d:'M34 51C15 59 9 36 22 30Q35 25 40 40M88 40Q93 25 106 30C119 36 113 59 94 51',stroke:6},
  {d:'M37 43Q29 55 28 77Q27 108 64 112Q101 108 100 77Q99 55 91 43',stroke:6},
  {d:'M43 43L41 23L54 29L63 7L71 29L87 18L83 43Z'},
  {d:'M40 64L51 68M77 68L88 64',stroke:5},
  {d:'M44 89Q44 74 64 75Q84 74 84 89Q82 103 64 103Q46 103 44 89Z',stroke:5},
  {d:'M56 81H72L64 89Z'},
  {d:'M64 89V96',stroke:4}
 ]},
 {id:'contact',name:'联系我们',en:'CONTACT',code:'04',shapes:[
  // A spare rotary telephone, using the same worn phosphor line weight.
  {d:'M18 42V30Q18 18 40 18H88Q110 18 110 30V42H88V32H40V42Z',stroke:6},
  {d:'M35 49H93L111 91V106H17V91Z',stroke:6},
  {d:'M46 48V41M82 48V41M18 94H110',stroke:5},
  {d:'M81 72A17 17 0 1 1 47 72A17 17 0 1 1 81 72Z M70 72A6 6 0 1 1 58 72A6 6 0 1 1 70 72Z',stroke:4},
  {d:'M53 64L56 66M63 59V62M73 63L71 66M77 73H74M54 79L57 77',stroke:3}
 ]}
];
export function iconSvg(item,color='#adf69b',framed=false){
 const body=item.shapes.map(s=>`<path d="${s.d}" ${s.stroke?`fill="none" stroke="${s.cut?'black':'white'}" stroke-width="${s.stroke}" stroke-linecap="square" stroke-linejoin="miter"`:`fill="${s.cut?'black':'white'}"`}/>`).join('');
 const mask=`<defs><mask id="glyph"><rect width="128" height="128" fill="black"/>${body}</mask></defs>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${framed?'0 0 160 160':'0 0 128 128'}" role="img" aria-label="${item.name}">${framed?`<rect x="3" y="3" width="154" height="154" fill="none" stroke="${color}" stroke-width="6"/>`:''}<g transform="translate(${framed?'16 16':'0 0'})">${mask}<rect width="128" height="128" fill="${color}" mask="url(#glyph)"/></g></svg>`;
}
export function drawGlyph(ctx,item,x,y,scale){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 for(const shape of item.shapes){ctx.globalCompositeOperation=shape.cut?'destination-out':'source-over';ctx.fillStyle='#fff';ctx.strokeStyle='#fff';ctx.lineWidth=shape.stroke||1;ctx.lineJoin='miter';ctx.lineCap='square';const p=new Path2D(shape.d);shape.stroke?ctx.stroke(p):ctx.fill(p);}
 ctx.restore();
}
