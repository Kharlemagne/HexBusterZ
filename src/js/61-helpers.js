// ---------------- helpers ----------------
const fwdV = () => { const cp = Math.cos(P.pitch); return [-Math.sin(P.yaw) * cp, Math.sin(P.pitch), -Math.cos(P.yaw) * cp]; };
const rightV = () => [Math.cos(P.yaw), 0, -Math.sin(P.yaw)];
function upV(f, r) { return [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]]; }
const eyePos = () => [P.x, P.y + P.eye, P.z];
function muzzle() { const e = eyePos(), f = fwdV(), r = rightV(), u = upV(f, r); return [e[0] + f[0] * .94 + r[0] * -.45 + u[0] * -.12, e[1] + f[1] * .94 + r[1] * -.45 + u[1] * -.12, e[2] + f[2] * .94 + r[2] * -.45 + u[2] * -.12]; }
function spreadDir(s) {
  const f = fwdV(), r = rightV(), u = upV(f, r), a = rnd(-s, s), b = rnd(-s, s);
  const d = [f[0] + r[0] * a + u[0] * b, f[1] + r[1] * a + u[1] * b, f[2] + r[2] * a + u[2] * b], l = Math.hypot(...d);
  return [d[0] / l, d[1] / l, d[2] / l];
}
const txt = (el, v) => { if (el._v !== v) { el.textContent = v; el._v = v; } };
const css = (el, k, v) => { const key = '_' + k; if (el[key] !== v) { el.style[k] = v; el[key] = v; } };

