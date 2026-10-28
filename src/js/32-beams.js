// ---------------- beams (tracers) ----------------
const beams = [];
function addBeam(a, b, th, col, life) { beams.push({ a, b, th, col, life, t: life }); }
function drawBeams(dt) {
  for (let i = beams.length - 1; i >= 0; i--) {
    const m = beams[i]; m.t -= dt; if (m.t <= 0) { beams.splice(i, 1); continue; }
    const f = m.t / m.life;
    pushBeam(m.a[0], m.a[1], m.a[2], m.b[0], m.b[1], m.b[2], m.th * f, m.col, 1);
  }
}

