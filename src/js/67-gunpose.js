// ---------------- GUN ARM POSITION MODE ----------------
// Pause menu -> GUN ARM POSITION. The HUD is cleared and you steer the cannon arm by hand; the numbers are on screen so a screenshot says exactly where it sits.
// All values are offsets ON TOP of the shipped pose (all zero = the pose as it is today), saved with the settings.
const GP_BASE = { x: .094, y: .015, z: .044, yaw: -.392, pitch: -.088, roll: 0, scale: .905 };      // the shipped pose (hand-tuned in this mode and baked in)
const GP = {
  on: false, hide: false, box: null,
  v: Object.assign({ x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, scale: 1 }, {}),
  last: 0, target: 'arm', h: { x: 0, y: 0, z: 0, scale: 1 },                 // target 'holo' = the DEV MODE DISPLAY POSITION tool (offsets for the weapon-mode hologram)
  start(target) {
    this.target = target || 'arm'; this.on = true; this.hide = false; this.last = performance.now();
    const h = document.getElementById('hud'); if (h) h.style.visibility = 'hidden';
    if (!this.box) { this.box = document.createElement('pre'); this.box.id = 'gpinfo'; this.box.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:60;margin:0;padding:8px 10px;font:12px/1.35 monospace;color:#7ff;background:rgba(0,10,16,.72);border:1px solid #2cc;pointer-events:none;white-space:pre'; document.body.appendChild(this.box); }
    this.box.style.display = 'block'; this.text();
  },
  stop() {
    if (!this.on) return; this.on = false; const h = document.getElementById('hud'); if (h) h.style.visibility = ''; if (this.box) this.box.style.display = 'none';
    delete SaveStore.doc.settings.gunPose; SaveStore.dirty = true;     // offsets are per-session now: the shipped pose is GP_BASE
  },
  reset() { if (this.target === 'holo') this.h = { x: 0, y: 0, z: 0, scale: 1 }; else this.v = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, scale: 1 }; },
  text() {
    if (!this.box) return; const v = this.v, f = n => (n >= 0 ? ' ' : '') + n.toFixed(3);
    if (this.target === 'holo') { const o = this.h; this.box.textContent = this.hide ? '' : 'MODE DISPLAY POSITION  (offsets from the shipped spot)\nx ' + f(o.x) + '  y ' + f(o.y) + '  z ' + f(o.z) + '  scale ' + o.scale.toFixed(3) + '\nA/D side  R/F height  W/S depth  [ ] resize\nHold SHIFT = fine   BACKSPACE = reset   H = hide this   ENTER = exit   1-4 = weapon'; this.box.style.padding = this.hide ? '0' : '8px 10px'; this.box.style.border = this.hide ? 'none' : '1px solid #2cc'; return; }
    this.box.textContent = this.hide ? '' : 'GUN ARM POSITION  (offsets from the shipped pose)\n' +
      'x ' + f(v.x) + '  y ' + f(v.y) + '  z ' + f(v.z) + '\nyaw ' + f(v.yaw) + '  pitch ' + f(v.pitch) + '  roll ' + f(v.roll) + '  scale ' + v.scale.toFixed(3) + '\n' +
      'A/D side  R/F height  W/S depth  Q/E yaw  T/G pitch  Z/X roll  [ ] scale\nHold SHIFT = fine   BACKSPACE = reset   H = hide this   ENTER = exit   1-5 = weapon';
    if (this.hide) this.box.style.padding = '0', this.box.style.border = 'none'; else this.box.style.padding = '8px 10px', this.box.style.border = '1px solid #2cc';
  },
  key(e) {                                                       // returns true when the key is ours (everything except the weapon digits)
    if (/^Digit[1-5]$/.test(e.code)) return false;
    if (e.code === 'Enter' || e.code === 'KeyP') { this.stop(); return true; }
    if (e.code === 'Backspace') { this.reset(); this.text(); return true; }
    if (e.code === 'KeyH') { this.hide = !this.hide; this.text(); return true; }
    return true;
  },
  tick() {
    if (!this.on) return; const now = performance.now(), dt = Math.min(.1, (now - this.last) / 1000); this.last = now;
    const k = c => keys[c] ? 1 : 0, fine = keys.ShiftLeft || keys.ShiftRight ? .2 : 1, v = this.v, m = dt * fine;
    if (this.target === 'holo') { const o = this.h, a = o.x + '|' + o.y + '|' + o.z + '|' + o.scale; o.x += (k('KeyD') - k('KeyA')) * .25 * m; o.y += (k('KeyR') - k('KeyF')) * .25 * m; o.z += (k('KeyS') - k('KeyW')) * .25 * m; o.scale = clamp(o.scale + (k('BracketRight') - k('BracketLeft')) * .5 * m, .3, 3); if (a !== o.x + '|' + o.y + '|' + o.z + '|' + o.scale) this.text(); return; }
    v.x += (k('KeyD') - k('KeyA')) * .25 * m; v.y += (k('KeyR') - k('KeyF')) * .25 * m; v.z += (k('KeyS') - k('KeyW')) * .25 * m;
    v.yaw += (k('KeyQ') - k('KeyE')) * .8 * m; v.pitch += (k('KeyT') - k('KeyG')) * .8 * m; v.roll += (k('KeyZ') - k('KeyX')) * .8 * m;
    v.scale = clamp(v.scale + (k('BracketRight') - k('BracketLeft')) * .5 * m, .2, 3);
    if (Object.values(this.v).some((n, i) => n !== (this._p || [])[i])) { this._p = Object.values(this.v); this.text(); }
  }
};
