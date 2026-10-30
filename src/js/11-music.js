// ---- 8-BIT DEATH METAL score: pulse + triangle + noise "chip" voices -------------------
let step = 0, nextT = 0, musicIntensity = 0, musicMode = 1, musicSlow = 1;   // mode 0 hub (half-time doom), 1 dungeon, 2 boss (blast beats)
const PULSE = {};
function mkPulse(w) {
  const N = 128, H_ = 40, re = new Float32Array(H_), im = new Float32Array(H_);
  for (let k = 1; k < H_; k++) { let a = 0, b = 0; for (let i = 0; i < N; i++) { const v = (i / N) < w ? 1 : -1, ph = 2 * Math.PI * k * i / N; a += v * Math.cos(ph); b += v * Math.sin(ph); } re[k] = a / N * 2; im[k] = b / N * 2; }
  return AC.createPeriodicWave(re, im);
}
function pulseNote(f, dur, vol, duty, d, f2) {
  if (!AC || muted) return;
  const t = AC.currentTime + d, o = AC.createOscillator(), g = AC.createGain();
  if (!PULSE[duty]) PULSE[duty] = mkPulse(duty);
  o.setPeriodicWave(PULSE[duty]); o.frequency.setValueAtTime(f, t); if (f2) o.frequency.linearRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + dur * .65); g.gain.linearRampToValueAtTime(.0001, t + dur);   // blocky NES-style envelope
  o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + dur + .02);
}
const dKick = d => { tone(175, .085, 'triangle', .55, 38, d); noise(.012, .3, 'lowpass', 1200, d); };
const dSnare = d => { noise(.1, .32, 'bandpass', 2800, d); tone(240, .06, 'square', .12, 110, d); };
const dHat = d => noise(.025, .09, 'highpass', 8500, d);
const dCrash = d => noise(.55, .22, 'highpass', 5000, d, 9500);
function startMusic() {
  setInterval(() => {
    if (!AC || muted || state !== 'play') { nextT = 0; return; }
    if (nextT < AC.currentTime) nextT = AC.currentTime + .05;
    const bpm = [DATA.music.bpm.hub, DATA.music.bpm.dungeon, DATA.music.bpm.boss][musicMode] || DATA.music.bpm.dungeon;
    while (nextT < AC.currentTime + .25) { musicStep(nextT - AC.currentTime); nextT += 60 / bpm / 4 / musicSlow; }
  }, 50);
}
const E2 = DATA.music.baseHz, nf = (base, semi) => base * Math.pow(2, semi / 12);
// four-bar riffs (semitones above E; -1 = rest) — chromatic, phrygian, lots of 16th-note palm-mute chugs
const RIFF = DATA.music.riff;                                  // data/music.json
const SCALE = DATA.music.scale;                                // E phrygian dominant
const DEG = DATA.music.leadDegrees, ARP = DATA.music.leadArp;
function musicStep(d) {
  const s = step % 16, bar = ((step / 16) | 0) % 4; step++;
  const I = Math.min(8, musicIntensity + (musicMode === 2 ? 3 : 0)), hub = musicMode === 0;
  const semi = RIFF[bar][s];
  // ---- drums
  if (hub) {                                                   // half-time doom feel
    if (s === 0 || s === 6 || s === 10) dKick(d); if (s === 8) dSnare(d); if (s % 4 === 0) dHat(d); if (s === 0 && bar === 0) dCrash(d);
  } else {
    const blast = I >= 5 || (I >= 4 && bar >= 2), dbl = I >= 2;
    if (blast) { if (s % 2 === 0) dKick(d); else dSnare(d); }                       // blast beat
    else {
      if (dbl ? true : s % 2 === 0) dKick(d);                                        // double-bass 16ths / 8ths
      if (s === 4 || s === 12) dSnare(d);
    }
    if (I >= 1 && s % 2 === 0) dHat(d);
    if (s === 0 && (bar === 0 || bar === 2)) dCrash(d);
  }
  // ---- rhythm guitar (two pulse voices = power chord) + triangle bass
  if (semi >= 0 && (!hub || s % 2 === 0)) {
    const acc = s % 4 === 0, f = nf(E2, semi), dur = acc ? .11 : .062, v = (hub ? .035 : .055) * (acc ? 1.25 : 1);
    pulseNote(f, dur, v, .125, d); pulseNote(f * 1.4983, dur, v * .8, .25, d); pulseNote(f * 2, dur, v * .45, .125, d);
    if (s % 2 === 0 || I >= 3) tone(f / 2, hub ? .16 : .1, 'triangle', .26, null, d);
  }
  // ---- lead: tremolo-picked arpeggios, then a screaming bend at the end of the phrase
  if (!hub && I >= 3) {
    const deg = (DEG[bar] + ARP[s % 4]) % 8, oct = (s % 8 >= 4) ? 12 : 0, f = nf(E2 * 4, SCALE[deg] + oct);
    pulseNote(f, .06, .045, .25, d);
    if (I >= 6 && s % 4 === 2) pulseNote(f * 2, .05, .025, .125, d);
  }
  if (!hub && I >= 5 && bar === 3 && s === 12) pulseNote(nf(E2 * 8, 7), .5, .05, .5, d, nf(E2 * 8, 12));
  if (hub && bar === 2 && s === 0) pulseNote(nf(E2 * 4, 3), .9, .04, .5, d, nf(E2 * 4, 1));
}

