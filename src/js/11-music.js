// ============================================================
//  THE SCORE — Minecraft-style: one slow track at a time (soft piano, pads, bells), then a long silence before the next one.
//  Eldritch flavour: phrygian / locrian / octatonic scales, detuned piano, FM bells, whispering choir, reversed swells, minor-second clusters,
//  a heartbeat under the dungeons and low drums for the bosses. Tracks are described in data/music.json and re-composed every time they play,
//  so no two plays are the same. Everything runs through one reverb + echo bus.
// ============================================================
let musicIntensity = 0, musicMode = 1, musicSlow = 1;                  // mode 0 hub, 1 dungeon, 2 boss (set by the main loop)
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
let mBus = null, mReverb = null; const MUS_LEVEL = 1.5;
function makeReverb(ctx, sec = 3.8) {                                   // a dark, long stereo tail made from decaying noise
  const sr = ctx.sampleRate, len = Math.floor(sr * sec), buf = ctx.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); let lp = 0; for (let i = 0; i < len; i++) { const e = Math.pow(1 - i / len, 3.2); lp += ((Math.random() * 2 - 1) * e - lp) * (.18 + .6 * (1 - i / len) * (1 - i / len)); d[i] = lp * 1.9; } }
  return buf;
}
function buildMusicBus() {                                              // bus -> dry + reverb + a dark echo -> the music volume
  mBus = AC.createGain(); mBus.gain.value = MUS_LEVEL;
  const dry = AC.createGain(); dry.gain.value = .72; mBus.connect(dry); dry.connect(musicGain);
  mReverb = AC.createConvolver(); mReverb.buffer = makeReverb(AC); const wet = AC.createGain(); wet.gain.value = .62; mBus.connect(mReverb); mReverb.connect(wet); wet.connect(musicGain);
  const dl = AC.createDelay(1.5), fb = AC.createGain(), lp = AC.createBiquadFilter(), ew = AC.createGain(); dl.delayTime.value = .62; fb.gain.value = .38; lp.type = 'lowpass'; lp.frequency.value = 1500; ew.gain.value = .26;
  mBus.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(ew); ew.connect(musicGain); ew.connect(mReverb);
}
const mEnv = (g, t, a, peak, dur, rel = .06) => { g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0004, t + Math.max(a + .02, dur)); g.gain.linearRampToValueAtTime(0, t + dur + rel); };
// ---- instruments (d = seconds from now)
function piano(m, dur, vel, d) {                                        // soft felt piano, a touch out of tune so it feels haunted
  const t = AC.currentTime + d, f = mtof(m), g = AC.createGain(), lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900 + vel * 5200, t); lp.frequency.exponentialRampToValueAtTime(380, t + dur);
  const det = (Math.random() - .5) * 14;
  for (const [mult, type, v, dc] of [[1, 'sine', 1, 0], [2, 'sine', .32, 3], [3.01, 'sine', .1, -2], [1, 'triangle', .35, 9 + det]]) { const o = AC.createOscillator(), og = AC.createGain(); o.type = type; o.frequency.value = f * mult; o.detune.value = dc; og.gain.value = v; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + .3); }
  mEnv(g, t, .006, vel * .34, dur * 1.5, .25); lp.connect(g); g.connect(mBus);
}
function pad(m, dur, vol, d, wob = 1) {                                 // slow, wobbling saw pad
  const t = AC.currentTime + d, f = mtof(m), g = AC.createGain(), lp = AC.createBiquadFilter(), lfo = AC.createOscillator(), lg = AC.createGain(); lp.type = 'lowpass'; lp.frequency.value = 420 + f * .5; lp.Q.value = .7;
  lfo.frequency.value = .11 + Math.random() * .2; lg.gain.value = 9 * wob; lfo.connect(lg); lfo.start(t); lfo.stop(t + dur + 3);
  for (const dc of [-11, 0, 8]) { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dc; lg.connect(o.detune); o.connect(lp); o.start(t); o.stop(t + dur + 3); }
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .38); g.gain.setValueAtTime(vol, t + dur * .6); g.gain.linearRampToValueAtTime(0, t + dur + 2.2);
  lp.connect(g); g.connect(mBus);
}
function bell(m, dur, vol, d) {                                         // inharmonic FM bell
  const t = AC.currentTime + d, f = mtof(m), c = AC.createOscillator(), md = AC.createOscillator(), mg = AC.createGain(), g = AC.createGain();
  c.frequency.value = f; md.frequency.value = f * 3.51; mg.gain.setValueAtTime(f * 1.6, t); mg.gain.exponentialRampToValueAtTime(f * .05, t + dur * .7); md.connect(mg); mg.connect(c.frequency);
  mEnv(g, t, .004, vol, dur, .3); c.connect(g); g.connect(mBus); c.start(t); md.start(t); c.stop(t + dur + .5); md.stop(t + dur + .5);
}
function voice(m, dur, vol, d) {                                        // a whispering "ooh": two saws through a vowel filter with breath on top
  const t = AC.currentTime + d, f = mtof(m), g = AC.createGain(), bp = AC.createBiquadFilter(), bp2 = AC.createBiquadFilter(), lfo = AC.createOscillator(), lg = AC.createGain();
  bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 4; bp2.type = 'bandpass'; bp2.frequency.value = 1050; bp2.Q.value = 5; lfo.frequency.value = 4.6; lg.gain.value = 7; lfo.connect(lg); lfo.start(t); lfo.stop(t + dur + 3);
  for (const dc of [-14, 12]) { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dc; lg.connect(o.detune); o.connect(bp); o.connect(bp2); o.start(t); o.stop(t + dur + 3); }
  const n = AC.createBufferSource(), nf = AC.createBiquadFilter(), ng = AC.createGain(); n.buffer = noiseBuf; n.loop = true; nf.type = 'bandpass'; nf.frequency.value = 1800; nf.Q.value = 1.2; ng.gain.value = .35; n.connect(nf); nf.connect(ng); ng.connect(g); n.start(t); n.stop(t + dur + 3);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .45); g.gain.linearRampToValueAtTime(0, t + dur + 1.8); bp.connect(g); bp2.connect(g); g.connect(mBus);
}
function whisper(dur, vol, d) {                                         // breath that drifts across the stereo field
  const t = AC.currentTime + d, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; s.loop = true; f.type = 'bandpass'; f.frequency.setValueAtTime(2600 + Math.random() * 2400, t); f.frequency.linearRampToValueAtTime(1800 + Math.random() * 2000, t + dur); f.Q.value = 3;
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .5); g.gain.linearRampToValueAtTime(0, t + dur);
  let node = f; if (AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.setValueAtTime(Math.random() * 2 - 1, t); p.pan.linearRampToValueAtTime(Math.random() * 2 - 1, t + dur); f.connect(p); node = p; }
  s.connect(f); node.connect(g); g.connect(mBus); s.start(t, Math.random()); s.stop(t + dur + .1);
}
function swell(dur, vol, d) {                                           // a reversed-cymbal rush up into the next chord
  const t = AC.currentTime + d, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; s.loop = true; f.type = 'lowpass'; f.frequency.setValueAtTime(180, t); f.frequency.exponentialRampToValueAtTime(5200, t + dur); f.Q.value = 1.5;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * .96); g.gain.linearRampToValueAtTime(0, t + dur + .08); s.connect(f); f.connect(g); g.connect(mBus); s.start(t, Math.random()); s.stop(t + dur + .15);
}
function sub(m, dur, vol, d) {                                          // a drone you feel more than hear, with a slow throb
  const t = AC.currentTime + d, o = AC.createOscillator(), g = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain(); o.type = 'sine'; o.frequency.value = mtof(m); lfo.frequency.value = .16; lg.gain.value = vol * .45; lfo.connect(lg); lg.connect(g.gain);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .3); g.gain.setValueAtTime(vol, t + dur * .7); g.gain.linearRampToValueAtTime(0, t + dur + 1.5); o.connect(g); g.connect(mBus); o.start(t); lfo.start(t); o.stop(t + dur + 1.7); lfo.stop(t + dur + 1.7);
}
function thump(vol, d, deep = 1) {                                      // a heartbeat / low drum
  const t = AC.currentTime + d, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(95 * deep, t); o.frequency.exponentialRampToValueAtTime(34, t + .22);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .42); o.connect(g); g.connect(mBus); o.start(t); o.stop(t + .45);
}
// ---- composing a track from its description
function compose(sp) {
  const sc = DATA.music.scales[sp.scale], n = sc.length, ev = [], beats = sp.bars * 4, oct = sp.octave === undefined ? 12 : sp.octave;
  const deg = k => { const o = Math.floor(k / n), i = ((k % n) + n) % n; return sp.root + sc[i] + 12 * o; };
  const chords = Math.ceil(sp.bars / 4), add = (b, k, m, d, v) => ev.push({ b, k, m, d, v });
  for (let c = 0; c < chords; c++) {
    const b0 = c * 16, r = sp.prog[c % sp.prog.length], span = Math.min(17, beats - b0 + 1);
    add(b0, 'pad', deg(r) - 12, span, .1); add(b0, 'pad', deg(r + 4) - 12, span, .07); if (Math.random() < .5) add(b0 + 2, 'pad', deg(r + 2) + 12, span - 2, .04);
    if (sp.sub) add(b0, 'sub', deg(r) - 24, span, .22);
    if (Math.random() < sp.choir) add(b0 + 4, 'voice', deg(r + 4) + 12, 8, .07);
    if (Math.random() < sp.swell && c < chords - 1 || sp.loop && Math.random() < sp.swell) add(b0 + 12, 'swell', 0, 4, .12);
    if (Math.random() < sp.cluster) { add(b0 + 8, 'pad', deg(r) + 12, 8, .045); add(b0 + 8, 'pad', deg(r) + 13, 8, .04); }          // a minor second grinding against the root
  }
  for (let bar = 0; bar < sp.bars; bar++) {
    const b = bar * 4, r = sp.prog[Math.floor(bar / 4) % sp.prog.length], x = Math.random();
    if (x < sp.density) {                                                // the motif, transposed and thinned out differently each time
      const tr = [0, 0, 0, 2, -2, 1][(Math.random() * 6) | 0];
      for (const [mb, md, ml] of sp.motif) if (Math.random() > .16) add(b + mb + (Math.random() - .5) * .06, 'piano', deg(r + md + tr) + oct, ml * 1.4, .5 + Math.random() * .25);
    } else if (x < sp.density + .16) add(b + (Math.random() < .4 ? 1 : 0), 'piano', deg(r + [0, 2, 4][(Math.random() * 3) | 0] + n) + oct, 4, .42);   // one long, lonely note
    if (Math.random() < sp.bell) add(b + ((Math.random() * 3) | 0), 'bell', deg(r + [0, 2, 4, 6][(Math.random() * 4) | 0]) + 24, 6, .06);
    if (Math.random() < sp.whisper * .5) add(b + ((Math.random() * 2) | 0), 'whisper', 0, 3 + Math.random() * 3, .055);
    if (sp.taiko) { add(b, 'drum', 0, 0, .55); if (Math.random() < .5) add(b + 2, 'drum', 0, 0, .3); if (Math.random() < .35) add(b + 3.5, 'drum', 0, 0, .22); }
  }
  if (!sp.loop) { const e = beats - 4; add(e, 'piano', deg(sp.prog[0]) + oct, 8, .38); add(e + 1, 'bell', deg(sp.prog[0] + 4) + 24, 9, .05); }
  ev.sort((a, b) => a.b - b.b); return { ev, beats, bpm: sp.bpm, name: sp.name };
}
function playEv(e, d) {
  switch (e.k) {
    case 'piano': piano(e.m, e.d * 60 / Score.bpm, e.v, d); break; case 'pad': pad(e.m, e.d * 60 / Score.bpm, e.v, d); break; case 'sub': sub(e.m, e.d * 60 / Score.bpm, e.v, d); break;
    case 'bell': bell(e.m, e.d * 60 / Score.bpm, e.v, d); break; case 'voice': voice(e.m, e.d * 60 / Score.bpm, e.v, d); break; case 'whisper': whisper(e.d, e.v, d); break;
    case 'swell': swell(e.d * 60 / Score.bpm, e.v, d); break; case 'drum': thump(e.v, d, .75); break;
  }
}
// ---- the player: tracks, silences, mode changes
const Score = { track: null, i: 0, beat: 0, bpm: 60, mode: -1, wait: 4, last: 0, name: '', lastName: '', hb: -1 };
function pickTrack(mode) {
  const list = DATA.music.tracks.filter(t => t.mode === mode); if (!list.length) return null;
  let sp = list[(Math.random() * list.length) | 0]; if (list.length > 1 && sp.name === Score.lastName) sp = list[(list.indexOf(sp) + 1) % list.length]; return sp;
}
function startTrack(sp) {
  Score.track = compose(sp); Score.i = 0; Score.beat = -.5; Score.bpm = sp.bpm; Score.name = Score.lastName = sp.name; Score.hb = -1; Score.sp = sp;
  mBus.gain.cancelScheduledValues(AC.currentTime); mBus.gain.setTargetAtTime(MUS_LEVEL, AC.currentTime, .4);
}
function startMusic() {
  buildMusicBus();
  setInterval(() => {
    if (!AC || muted || state !== 'play') { Score.last = 0; return; }
    const now = AC.currentTime, dt = Score.last ? Math.min(1, now - Score.last) : .05; Score.last = now;
    const W = DATA.music.wait;
    if (Score.mode !== musicMode) {                                      // new place: let the old track fade out, then start something that fits
      if (Score.track && Score.mode >= 0) mBus.gain.setTargetAtTime(0, now, .9);
      Score.track = null; Score.mode = musicMode; Score.wait = Score.mode === 2 ? .6 : (Score.name ? W.afterModeChange : W.first);
    }
    if (!Score.track) {
      Score.wait -= dt; if (Score.wait > 0) return;
      const sp = pickTrack(Score.mode); if (sp) startTrack(sp); else Score.wait = 10; return;
    }
    const spb = Score.bpm / 60 * musicSlow, T = Score.track, look = Score.beat + .3 * spb + dt * spb;
    const prev = Score.beat; Score.beat += dt * spb;
    while (Score.i < T.ev.length && T.ev[Score.i].b < look) { const e = T.ev[Score.i++]; playEv(e, Math.max(0, (e.b - Score.beat) / spb)); }
    if (musicMode === 1 && musicIntensity >= 3 && Math.floor(Score.beat / 2) > Math.floor(prev / 2)) { thump(.2 + Math.min(.15, musicIntensity * .02), 0, .8); thump(.12, .32 / spb, .8); }     // the dungeon's pulse quickens when you are doing well
    if (Score.beat >= T.beats + (Score.sp.loop ? 0 : 5)) {              // the track is over
      Score.track = null; Score.wait = Score.sp.loop ? 0 : W.min + Math.random() * (W.max - W.min);
    }
  }, 50);
}
