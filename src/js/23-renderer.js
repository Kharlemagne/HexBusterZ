// ---------------- tiny WebGL renderer ----------------
const canvas = $('c');
const VS = `attribute vec3 p;attribute vec4 c;uniform mat4 vp;uniform vec3 cam;varying vec4 vc;varying float vd;
void main(){gl_Position=vp*vec4(p,1.0);vc=c;vd=length(p-cam);}`;
const FS = `precision mediump float;varying vec4 vc;varying float vd;uniform vec3 fogc;uniform vec2 fogr;
void main(){float f=smoothstep(fogr.x,fogr.y,vd)*vc.a;gl_FragColor=vec4(mix(vc.rgb,fogc,f),1.0);}`;
function mkShader(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
const FOG = [0.10, 0.02, 0.04];
const DYN_MAX = 150000, dyn = new Float32Array(DYN_MAX * 7); let dn = 0;
let dynBuf = null;
function initGL() {
  gl = canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance' }) || canvas.getContext('webgl', { antialias: false }) || canvas.getContext('experimental-webgl');
  if (!gl) { showFatal('Your browser could not start WebGL.', 'Try reloading, turn on hardware acceleration in your browser settings, or open the downloaded HTML file directly in Chrome / Edge / Firefox.'); throw new Error('WebGL unavailable'); }
  prog = gl.createProgram(); gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  loc.p = gl.getAttribLocation(prog, 'p'); loc.c = gl.getAttribLocation(prog, 'c');
  loc.vp = gl.getUniformLocation(prog, 'vp'); loc.cam = gl.getUniformLocation(prog, 'cam');
  loc.fogc = gl.getUniformLocation(prog, 'fogc'); loc.fogr = gl.getUniformLocation(prog, 'fogr');
  gl.enableVertexAttribArray(loc.p); gl.enableVertexAttribArray(loc.c);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(FOG[0], FOG[1], FOG[2], 1);
  gl.uniform3fv(loc.fogc, FOG); gl.uniform2f(loc.fogr, 26, 100);
  dynBuf = gl.createBuffer();
}
initGL();
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); glLost = true; showToast('graphics context lost, restoring'); });
canvas.addEventListener('webglcontextrestored', () => { try { initGL(); chunkBuf.length = 0; for (let i = 0; i < 16; i++) chunkCount[i] = []; buildAll(); glLost = false; } catch (e) { showFatal(e.message, 'The graphics context could not be restored. Reload to continue.'); } });
function bindAttribs() { gl.vertexAttribPointer(loc.p, 3, gl.FLOAT, false, 28, 0); gl.vertexAttribPointer(loc.c, 4, gl.FLOAT, false, 28, 12); }
function flushDyn() {
  if (!dn) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
  gl.bufferData(gl.ARRAY_BUFFER, dyn.subarray(0, dn), gl.DYNAMIC_DRAW);
  bindAttribs(); gl.drawArrays(gl.TRIANGLES, 0, dn / 7); dn = 0;
}
let camX = 0, camZ = 0, cullR = 140;
function drawWorld() {
  for (let cx = 0; cx < NC; cx++) for (let cz = 0; cz < NC; cz++) {
    if (!chunkCount[cx] || !chunkCount[cx][cz]) continue;
    const dx = cx * CS + 8 - camX, dz = cz * CS + 8 - camZ; if (dx * dx + dz * dz > cullR * cullR) continue;
    gl.bindBuffer(gl.ARRAY_BUFFER, chunkBuf[cx][cz]); bindAttribs();
    gl.drawArrays(gl.TRIANGLES, 0, chunkCount[cx][cz]);
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
function pushBox(cx, cy, cz, sx, sy, sz, r, g, b, R, lit, fog) {
  if (dn + 252 > dyn.length) return;
  const a = fog === undefined ? 1 : fog;
  for (let f = 0; f < 6; f++) {
    const F = FACES[f]; let nx = F.n[0], ny = F.n[1], nz = F.n[2];
    if (R) { const rx = R[0] * nx + R[1] * ny + R[2] * nz, ry = R[3] * nx + R[4] * ny + R[5] * nz, rz = R[6] * nx + R[7] * ny + R[8] * nz; nx = rx; ny = ry; nz = rz; }
    const sh = lit === false ? 1 : .4 + .6 * Math.max(0, nx * LD[0] + ny * LD[1] + nz * LD[2]);
    const cr = r * sh, cg = g * sh, cb = b * sh;
    for (let k = 0; k < 6; k++) {
      const v = F.v[QI[k]]; let lx = v[0] * sx, ly = v[1] * sy, lz = v[2] * sz, wx, wy, wz;
      if (R) { wx = R[0] * lx + R[1] * ly + R[2] * lz + cx; wy = R[3] * lx + R[4] * ly + R[5] * lz + cy; wz = R[6] * lx + R[7] * ly + R[8] * lz + cz; }
      else { wx = lx + cx; wy = ly + cy; wz = lz + cz; }
      dyn[dn++] = wx; dyn[dn++] = wy; dyn[dn++] = wz; dyn[dn++] = cr; dyn[dn++] = cg; dyn[dn++] = cb; dyn[dn++] = a;
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

