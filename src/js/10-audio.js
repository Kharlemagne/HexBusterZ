// ---------------- audio ----------------
let AC = null, master = null, sfxGain = null, musicGain = null, noiseBuf = null, muted = false;
function initAudio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.42; master.connect(AC.destination);
    sfxGain = AC.createGain(); sfxGain.connect(master); musicGain = AC.createGain(); musicGain.connect(master); applyVolumes();
    const len = AC.sampleRate; noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    startMusic();
  } catch (e) { AC = null; }
}
function tone(f, dur, type = 'square', vol = .3, f2 = null, delay = 0) {
  if (!AC || muted) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, vol = .4, ft = 'lowpass', ff = 2000, delay = 0, f2 = null) {
  if (!AC || muted) return;
  const t = AC.currentTime + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = ft; f.frequency.setValueAtTime(ff, t);
  if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
}
const SFX = {
  revolver() { noise(.1, .5, 'bandpass', 2600); tone(240, .12, 'sawtooth', .3, 50); },
  charged() { noise(.35, .7, 'bandpass', 1800, 0, 300); tone(700, .4, 'sawtooth', .35, 40); },
  shotgun() { noise(.3, .9, 'lowpass', 1800, 0, 200); tone(110, .25, 'sawtooth', .5, 28); },
  blast() { noise(.4, 1, 'lowpass', 900, 0, 120); tone(70, .4, 'square', .6, 20); },
  rivet() { noise(.04, .3, 'highpass', 3000); tone(520, .05, 'square', .15, 260); },
  bomb() { tone(300, .2, 'triangle', .3, 900); },
  rail() { noise(.6, .8, 'bandpass', 4000, 0, 200); tone(1400, .6, 'sawtooth', .35, 40); tone(60, .5, 'sine', .8, 25); },
  boom() { noise(.8, 1, 'lowpass', 700, 0, 60); tone(70, .6, 'sine', .9, 20); },
  hit() { tone(900, .04, 'square', .12, 500); },
  kill() { noise(.22, .6, 'lowpass', 1200, 0, 200); tone(140, .18, 'square', .25, 40); },
  dash() { noise(.22, .35, 'highpass', 1500, 0, 6000); },
  jump() { tone(180, .1, 'sine', .2, 320); },
  hurt() { noise(.25, .7, 'lowpass', 600); tone(90, .3, 'sawtooth', .5, 40); },
  shink() { noise(.1, .55, 'highpass', 7000, 0, 12000); tone(2600, .22, 'triangle', .22, 4200); noise(.1, .55, 'highpass', 7000, .08, 12000); tone(3200, .22, 'triangle', .22, 5200, .08); tone(900, .3, 'sine', .12, 500, .02); },
  reflect() { tone(1700, .14, 'triangle', .3, 2800); noise(.12, .4, 'highpass', 6000, 0, 10000); tone(900, .2, 'sine', .15, 400, .03); },
  bt() {   // a clock winding down: ticks that stretch out, a falling drone, and a final low tock
    let t = 0, iv = .055; for (let i = 0; i < 17; i++) { noise(.03, .42, 'highpass', 3800, t); tone(i % 2 ? 1500 : 1900, .035, 'square', .09, 900, t); t += iv; iv *= 1.2; }
    tone(420, 2.2, 'sine', .3, 38); noise(1.8, .35, 'lowpass', 3500, 0, 90); tone(65, 1.6, 'sawtooth', .1, 28); tone(90, .4, 'triangle', .4, 40, t);
  },
  btEnd() { tone(60, .5, 'sine', .35, 520); noise(.5, .35, 'highpass', 800, 0, 9000); tone(900, .08, 'square', .1, 1800, .02); },
  slam() { noise(.6, 1, 'lowpass', 500, 0, 60); tone(55, .5, 'sine', 1, 20); },
  dig() { noise(.07, .35, 'lowpass', 900); },
  place() { tone(160, .08, 'square', .2, 100); },
  wave() { tone(110, .6, 'sawtooth', .4, 220); tone(165, .6, 'sawtooth', .3, 330, .1); },
  spawn() { tone(60, .3, 'sawtooth', .15, 120); },
  rank() { tone(440, .1, 'square', .2); tone(660, .12, 'square', .2, null, .08); },
  empty() { tone(120, .05, 'square', .1); }
};

function applyVolumes() { if (!AC) return; sfxGain.gain.value = optV('sfx'); musicGain.gain.value = optV('music'); }
