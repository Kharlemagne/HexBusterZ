// ---------------- tiny WebGL renderer ----------------
const canvas = $('c');
const VS = `attribute vec3 p;attribute vec4 c;attribute vec2 uv;attribute float t;uniform mat4 vp;uniform vec3 cam;uniform float tm;varying vec4 vc;varying float vd;varying vec2 vuv;varying float vt;varying vec3 vwp;
void main(){
  vec3 q=p;float ti=abs(t)-1.0;float isl=max(step(7.5,ti)*step(ti,9.5),step(45.5,ti)*step(ti,61.5));
  q.y+=isl*step(1.5,c.a)*(sin(tm*1.7+p.x*1.3+p.z*1.1)*0.04+sin(tm*2.9-p.x*0.8+p.z*1.9)*0.025);   // the lava surface swells and sinks
  gl_Position=vp*vec4(q,1.0);vc=c;vd=length(q-cam);vuv=uv;vt=t;vwp=q;}`;
// colour = vertex colour (base colour x light/AO) x texture (a multiplier map, x1.6 for headroom); emissive tiles (negative index) ignore night; fog blends to the horizon colour
const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec4 vc;varying float vd;varying vec2 vuv;varying float vt;varying vec3 vwp;uniform sampler2D tex;uniform sampler2D avg;uniform vec3 fogc;uniform vec2 fogr;uniform float amb;uniform float tm;
float lh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float lv(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(lh(i),lh(i+vec2(1.0,0.0)),f.x),mix(lh(i+vec2(0.0,1.0)),lh(i+vec2(1.0,1.0)),f.x),f.y);}
// flowing lava in WORLD space, so neighbouring lava blocks form one continuous river: warped noise drifts, a dark crust floats on glowing orange, bright cracks open and close
vec3 lava(vec3 w,float t,float dist){
  vec2 p=w.xz*0.42+vec2(t*0.055,t*0.032);float n=0.0,a=0.5;
  for(int i=0;i<4;i++){n+=a*lv(p+vec2(sin(p.y*1.6+t*0.35),cos(p.x*1.4-t*0.3))*0.7);p=p*2.03+vec2(1.7,9.2);a*=0.5;}
  float crust=smoothstep(0.5,0.64,n);float crack=smoothstep(0.035,0.0,abs(n-0.5))*0.9;
  vec3 hot=mix(vec3(1.0,0.28,0.04),vec3(1.0,0.82,0.25),smoothstep(0.22,0.46,n));
  vec3 c=mix(hot,vec3(0.16,0.035,0.02),crust*0.9)+vec3(1.0,0.6,0.1)*crack;
  c*=0.88+0.12*sin(t*2.2+w.x*0.9+w.z*0.7);
  return mix(c,vec3(0.95,0.33,0.07),smoothstep(55.0,115.0,dist));
}
void main(){
  float em=step(vt,-0.5);float ti=floor(abs(vt)+0.5)-1.0;
  vec2 tc=vec2(mod(ti,16.0),floor(ti/16.0));vec2 f=fract(vuv);
  vec3 tx=texture2D(tex,(tc*16.0+0.5+f*15.0)/256.0).rgb;
  vec3 av=texture2D(avg,vec2((ti+0.5)/256.0,0.5)).rgb;
  tx=mix(tx,av,smoothstep(36.0,90.0,vd));
  vec3 col=vc.rgb*tx*1.6;
  if((ti>7.5&&ti<9.5)||(ti>45.5&&ti<61.5)){float sd=step(0.5,mod(ti,2.0));col=lava(mix(vec3(vwp.x+vwp.z,0.0,vwp.y*1.3+tm*0.8),vwp,sd),tm,vd);}
  float lamp=0.62*(1.0-smoothstep(1.5,22.0,vd));
  col*=mix(max(amb,lamp),1.0,em);
  float fg=smoothstep(fogr.x,fogr.y,vd)*min(vc.a,1.0);
  gl_FragColor=vec4(mix(col,fogc,fg),1.0);
}`;
// the sky: one full-screen triangle; every pixel works out its view direction and paints gradient, sun, moon (an eye), stars and the horizon band
const SKY_VS = `attribute vec2 q;varying vec2 ndc;void main(){ndc=q;gl_Position=vec4(q,1.0,1.0);}`;
const SKY_FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 ndc;uniform vec3 fwd,rgt,upv,zen,hor,gnd;uniform vec3 sunC[2];uniform vec3 moonC[4];uniform vec2 tanf;uniform float stars,sunA,tm;
float h3(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float opn(float t,float per,float off){float ph=fract((t+off)/per);float b=smoothstep(0.93,0.955,ph)*(1.0-smoothstep(0.965,0.99,ph));return 1.0-b*0.96;}
// an eye in unit-disc space: sclera, streaky iris, slit pupil, eyelid squash
vec4 eye(vec2 p,float open,vec3 scl,vec3 iri,float pw){
  vec2 q=vec2(p.x,p.y/max(open,0.04));float r=length(q);if(r>1.0)return vec4(0.0);
  float a=atan(q.y,q.x);vec3 c=scl*(0.78+0.22*h2(floor(q*7.0)));
  c=mix(c,vec3(0.7,0.05,0.1),smoothstep(0.02,0.0,abs(sin(a*7.0+r*4.0))-0.97)*0.8*smoothstep(0.55,0.9,r));
  float ir=smoothstep(0.62,0.56,r);c=mix(c,iri*(0.65+0.35*sin(a*20.0)),ir);
  float pup=smoothstep(pw,pw*0.45,abs(q.x))*smoothstep(0.58,0.44,abs(q.y));c=mix(c,vec3(0.02,0.0,0.03),pup);
  c*=1.0-smoothstep(0.8,1.0,r)*0.55;return vec4(c,smoothstep(1.0,0.93,r));
}
// writhing tentacle halo around a body; k = number of arms
float arms(vec2 p,float k,float spd,float len){
  float r=length(p),a=atan(p.y,p.x);float w=sin(a*k+tm*spd+sin(r*3.5-tm*1.7)*1.6+sin(a*3.0-tm*.6)*0.7)*0.5+0.5;
  return pow(w,3.0)*smoothstep(len,1.0,r)*smoothstep(0.92,1.12,r);
}
void body(vec3 d,vec3 c,float R,int kind,float vis,inout vec3 col){
  if(vis<=0.001)return;float cd=dot(d,c);float lim=3.6*R;if(cd<1.0-0.5*lim*lim)return;
  vec3 ref=abs(c.y)>0.97?vec3(0.0,0.0,1.0):vec3(0.0,1.0,0.0);vec3 rr=normalize(cross(c,ref)),uu=cross(rr,c);
  vec2 p=vec2(dot(d,rr),dot(d,uu))/R;float r=length(p),a=atan(p.y,p.x);vec3 add=vec3(0.0);vec4 B=vec4(0.0);
  if(kind==0){                       // THE WATCHER: blazing eye, white-hot rim, fire-tendril corona
    float op=opn(tm,11.0,0.0);B=eye(p,op,vec3(1.0,0.93,0.7),vec3(1.0,0.45,0.1),0.16+0.05*sin(tm*0.8));
    B.rgb+=vec3(1.0,0.6,0.2)*smoothstep(0.7,1.0,r)*0.8;
    add+=vec3(1.0,0.45,0.12)*arms(p,9.0,1.3,3.4)*1.2+vec3(1.0,0.5,0.2)*exp(-r*1.1)*0.45;
  }else if(kind==1){                 // THE LESSER: a crimson maw turning slowly, ringed with teeth
    float tooth=smoothstep(0.46,0.5,abs(fract(a*6.0/6.2832+tm*0.05)-0.5));float ring=smoothstep(1.0,0.96,r)*smoothstep(0.55,0.62,r);
    vec3 cc=mix(vec3(1.0,0.12,0.1)*(0.7+0.4*sin(tm*3.0+r*8.0)),vec3(1.0,0.85,0.7),tooth*ring);
    cc=mix(cc,vec3(1.0,0.5,0.15)*1.3,smoothstep(0.5,0.0,r));B=vec4(cc,smoothstep(1.0,0.94,r));
    add+=vec3(1.0,0.15,0.1)*arms(p,6.0,-1.0,2.6)*0.9+vec3(1.0,0.2,0.1)*exp(-r*1.4)*0.3;
  }else if(kind==2){                 // THE PALE EYE: a cold eyeball with a cyan iris
    B=eye(p,opn(tm,13.0,3.0),vec3(0.85,0.93,1.0),vec3(0.15,0.8,1.0),0.12);add+=vec3(0.3,0.6,1.0)*exp(-r*1.2)*0.35;
  }else if(kind==3){                 // THE MAW: dark moon, magenta throat, rotating fangs
    float open=0.35+0.25*sin(tm*0.9);float tooth=smoothstep(0.45,0.5,abs(fract(a*12.0/6.2832-tm*0.08)-0.5));
    float inner=smoothstep(open,open-0.12,r);vec3 cc=mix(vec3(0.16,0.06,0.28),vec3(0.95,0.95,0.9),tooth*smoothstep(open-0.02,open+0.25,r)*step(r,0.95));
    cc=mix(cc,vec3(1.0,0.2,0.85)*(0.8+0.3*sin(tm*4.0+a*4.0)),inner);B=vec4(cc,smoothstep(1.0,0.94,r));add+=vec3(0.8,0.2,0.9)*exp(-r*1.3)*0.4;
  }else if(kind==4){                 // THE HIVE: a cluster of seven eyes, blinking out of step
    B=vec4(vec3(0.1,0.04,0.2),smoothstep(1.0,0.94,r));
    for(int i=0;i<7;i++){vec2 o=i==0?vec2(0.0):vec2(cos(float(i)*1.0472),sin(float(i)*1.0472))*0.62;float sz=i==0?0.46:0.3;
      vec4 e=eye((p-o)/sz,opn(tm,7.0+float(i),float(i)*1.7),vec3(0.9,0.85,1.0),vec3(0.8,0.2,1.0),0.15);B.rgb=mix(B.rgb,e.rgb,e.a);}
    add+=vec3(0.6,0.2,1.0)*exp(-r*1.3)*0.3;
  }else{                             // THE WRITHING: a black disc crawling with magenta tentacles around one green eye
    B=vec4(vec3(0.02,0.0,0.05),smoothstep(1.0,0.94,r));vec4 e=eye(p/0.32,opn(tm,9.0,5.0),vec3(0.4,1.0,0.5),vec3(0.1,0.9,0.3),0.2);B.rgb=mix(B.rgb,e.rgb,e.a*smoothstep(0.35,0.3,r));
    add+=vec3(1.0,0.2,0.8)*arms(p,11.0,1.9,3.8)*1.1+vec3(0.9,0.2,0.7)*exp(-r*1.2)*0.25;
  }
  col+=add*vis;col=mix(col,B.rgb,B.a*vis);
}
void main(){
  vec3 d=normalize(fwd+rgt*(ndc.x*tanf.x)+upv*(ndc.y*tanf.y));
  float h=d.y;
  vec3 col=mix(hor,zen,pow(clamp(h*1.7,0.0,1.0),0.55));
  col=mix(col,gnd,smoothstep(0.0,-0.08,h));
  col+=hor*0.22*exp(-abs(h)*26.0)*(0.5+0.5*sunA);
  float vis=smoothstep(-0.004,0.012,h);                      // everything in the sky sets behind the horizon line
  vec3 sp=floor(d*330.0);float sh=h3(sp);
  if(sh>0.9975&&h>0.02){float tw=0.6+0.4*sin(tm*3.0+sh*400.0);col+=mix(vec3(0.8,0.9,1.0),vec3(1.0,0.5,0.9),step(0.9992,sh))*tw*stars*smoothstep(0.02,0.25,h);}
  col+=vec3(0.18,0.05,0.3)*stars*smoothstep(0.1,0.5,h)*(0.5+0.5*sin(d.x*5.0+tm*0.2))*0.35;
  float nightV=smoothstep(0.0,0.7,stars);
  body(d,sunC[0],0.075,0,vis,col);body(d,sunC[1],0.042,1,vis,col);
  body(d,moonC[0],0.07,2,vis*nightV,col);body(d,moonC[1],0.052,3,vis*nightV,col);body(d,moonC[2],0.06,4,vis*nightV,col);body(d,moonC[3],0.045,5,vis*nightV,col);
  gl_FragColor=vec4(col,1.0);
}`;
let skyProg = null, skyBuf = null, texAtlas = null, texAvg = null;
function mkShader(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
const FOG = [0.10, 0.02, 0.04];
const VF = 10;                                                                 // floats per vertex: pos3 colour4 uv2 tile1
const DYN_MAX = 150000, dyn = new Float32Array(DYN_MAX * VF); let dn = 0;
let dynBuf = null;
function initGL() {
  gl = canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance' }) || canvas.getContext('webgl', { antialias: false }) || canvas.getContext('experimental-webgl');
  if (!gl) { showFatal('Your browser could not start WebGL.', 'Try reloading, turn on hardware acceleration in your browser settings, or open the downloaded HTML file directly in Chrome / Edge / Firefox.'); throw new Error('WebGL unavailable'); }
  prog = gl.createProgram(); gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(prog, 0, 'p'); gl.bindAttribLocation(prog, 1, 'c'); gl.bindAttribLocation(prog, 2, 'uv'); gl.bindAttribLocation(prog, 3, 't'); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  loc.p = 0; loc.c = 1; loc.uv = 2; loc.t = 3;
  loc.vp = gl.getUniformLocation(prog, 'vp'); loc.cam = gl.getUniformLocation(prog, 'cam');
  loc.fogc = gl.getUniformLocation(prog, 'fogc'); loc.fogr = gl.getUniformLocation(prog, 'fogr'); loc.amb = gl.getUniformLocation(prog, 'amb'); loc.tm = gl.getUniformLocation(prog, 'tm');
  gl.uniform1i(gl.getUniformLocation(prog, 'tex'), 0); gl.uniform1i(gl.getUniformLocation(prog, 'avg'), 1); gl.uniform1f(loc.amb, 1);
  for (const k of [loc.p, loc.c, loc.uv, loc.t]) gl.enableVertexAttribArray(k);
  { const A = makeAtlas(); texAtlas = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texAtlas);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, A.canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    texAvg = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texAvg);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, A.avg);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.activeTexture(gl.TEXTURE0); }
  skyProg = gl.createProgram(); gl.attachShader(skyProg, mkShader(gl.VERTEX_SHADER, SKY_VS)); gl.attachShader(skyProg, mkShader(gl.FRAGMENT_SHADER, SKY_FS)); gl.bindAttribLocation(skyProg, 0, 'q'); gl.linkProgram(skyProg);
  if (!gl.getProgramParameter(skyProg, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(skyProg));
  skyBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(FOG[0], FOG[1], FOG[2], 1);
  gl.uniform3fv(loc.fogc, FOG); gl.uniform2f(loc.fogr, 26, 100);
  dynBuf = gl.createBuffer();
}
initGL();
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); glLost = true; showToast('graphics context lost, restoring'); });
canvas.addEventListener('webglcontextrestored', () => { try { initGL(); meshes.clear(); buildAll(); glLost = false; } catch (e) { showFatal(e.message, 'The graphics context could not be restored. Reload to continue.'); } });
function bindAttribs() { gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 40, 12); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 40, 28); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 40, 36); }
function flushDyn() {
  if (!dn) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
  gl.bufferData(gl.ARRAY_BUFFER, dyn.subarray(0, dn), gl.DYNAMIC_DRAW);
  bindAttribs(); gl.drawArrays(gl.TRIANGLES, 0, dn / VF); dn = 0;
}
let camX = 0, camY = 20, camZ = 0, camFX = 0, camFZ = 1, cullR = 140;
function drawWorld() {
  for (const [k, m] of meshes) {
    if (!m.count) continue;
    const dx = ckx(k) * CS + 8 - camX, dz = ckz(k) * CS + 8 - camZ, d2 = dx * dx + dz * dz; if (d2 > cullR * cullR) continue;
    if (useChunks && d2 > 900 && (dx * camFX + dz * camFZ) < -14 * Math.sqrt(d2) * .5 - 16) continue;      // behind the camera (cheap cull for the big open world)
    gl.bindBuffer(gl.ARRAY_BUFFER, m.buf); bindAttribs();
    gl.drawArrays(gl.TRIANGLES, 0, m.count);
  }
}
// math
function perspective(fovy, asp, n, f) {
  const t = 1 / Math.tan(fovy / 2);
  return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]);
}
function mul4(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s;
  }
  return o;
}
function lookView(ex, ey, ez, fx, fy, fz, roll) {
  // s = f x up(0,1,0)
  let sx = -fz, sy = 0, sz = fx; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
  let ux = sy * fz - sz * fy, uy = sz * fx - sx * fz, uz = sx * fy - sy * fx;
  if (roll) { const c = Math.cos(roll), s = Math.sin(roll); const nsx = sx * c + ux * s, nsy = sy * c + uy * s, nsz = sz * c + uz * s; ux = -sx * s + ux * c; uy = -sy * s + uy * c; uz = -sz * s + uz * c; sx = nsx; sy = nsy; sz = nsz; }
  return new Float32Array([sx, ux, -fx, 0, sy, uy, -fy, 0, sz, uz, -fz, 0, -(sx * ex + sy * ey + sz * ez), -(ux * ex + uy * ey + uz * ez), (fx * ex + fy * ey + fz * ez), 1]);
}
// 3x3 rotation helpers (row-major)
const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
function mulR(A, B) {
  const o = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c];
  return o;
}
const LD = (() => { const l = [.36, .88, .32], m = Math.hypot(...l); return l.map(v => v / m); })();
const FACES = [
  { n: [1, 0, 0], v: [[.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5], [.5, -.5, .5]] },
  { n: [-1, 0, 0], v: [[-.5, -.5, .5], [-.5, .5, .5], [-.5, .5, -.5], [-.5, -.5, -.5]] },
  { n: [0, 1, 0], v: [[-.5, .5, -.5], [-.5, .5, .5], [.5, .5, .5], [.5, .5, -.5]] },
  { n: [0, -1, 0], v: [[-.5, -.5, .5], [-.5, -.5, -.5], [.5, -.5, -.5], [.5, -.5, .5]] },
  { n: [0, 0, 1], v: [[.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5], [-.5, -.5, .5]] },
  { n: [0, 0, -1], v: [[-.5, -.5, -.5], [-.5, .5, -.5], [.5, .5, -.5], [.5, -.5, -.5]] }];
const QI = [0, 1, 2, 0, 2, 3];
// push a lit box into the dynamic batch. R: optional 3x3 rotation. fog: 1 normal / 0 none. lit=false => emissive
function pushBox(cx, cy, cz, sx, sy, sz, r, g, b, R, lit, fog, tex) {
  if (dn + 6 * 6 * VF > dyn.length) return;
  const a = fog === undefined ? 1 : fog;
  const tile = (tex === undefined ? (lit === false ? TILE.WHITE : TILE.GRAIN) : tex) + 1, vtile = lit === false ? -tile : tile;     // sign = emissive (ignores night)
  for (let f = 0; f < 6; f++) {
    const F = FACES[f]; let nx = F.n[0], ny = F.n[1], nz = F.n[2];
    if (R) { const rx = R[0] * nx + R[1] * ny + R[2] * nz, ry = R[3] * nx + R[4] * ny + R[5] * nz, rz = R[6] * nx + R[7] * ny + R[8] * nz; nx = rx; ny = ry; nz = rz; }
    const sh = lit === false ? 1 : .4 + .6 * Math.max(0, nx * LD[0] + ny * LD[1] + nz * LD[2]);
    const cr = r * sh, cg = g * sh, cb = b * sh, ax = f < 2 ? 0 : f < 4 ? 1 : 2;
    for (let k = 0; k < 6; k++) {
      const v = F.v[QI[k]]; let lx = v[0] * sx, ly = v[1] * sy, lz = v[2] * sz, wx, wy, wz;
      if (R) { wx = R[0] * lx + R[1] * ly + R[2] * lz + cx; wy = R[3] * lx + R[4] * ly + R[5] * lz + cy; wz = R[6] * lx + R[7] * ly + R[8] * lz + cz; }
      else { wx = lx + cx; wy = ly + cy; wz = lz + cz; }
      dyn[dn++] = wx; dyn[dn++] = wy; dyn[dn++] = wz; dyn[dn++] = cr; dyn[dn++] = cg; dyn[dn++] = cb; dyn[dn++] = a;
      dyn[dn++] = ax === 0 ? lz : lx; dyn[dn++] = ax === 1 ? lz : ly; dyn[dn++] = vtile;      // one tile repeat per world unit
    }
  }
}
// oriented beam between two points (axis aligned thin box along direction)
function pushBeam(ax, ay, az, bx, by, bz, th, col, fog) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.hypot(dx, dy, dz) || 1e-4;
  const fx = dx / len, fy = dy / len, fz = dz / len;
  let ux = 0, uy = 1, uz = 0; if (Math.abs(fy) > .95) { ux = 1; uy = 0; }
  let rx = fy * uz - fz * uy, ry = fz * ux - fx * uz, rz = fx * uy - fy * ux; const rl = Math.hypot(rx, ry, rz); rx /= rl; ry /= rl; rz /= rl;
  const tx = ry * fz - rz * fy, ty = rz * fx - rx * fz, tz = rx * fy - ry * fx;
  // columns: x->r, y->t, z->f (box long along z)
  const R = [rx, tx, fx, ry, ty, fy, rz, tz, fz];
  pushBox((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, th, th, len, col[0], col[1], col[2], R, false, fog);
}

