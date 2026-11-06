// ============================================================
//  DEV GOD MODE (Options -> DEV GOD MODE). Fly, cannot be hurt or killed, the Helicarrier is editable, free blocks that can be placed in mid-air,
//  and COPY GAME STATE: one block of text with every block change in the current world + where you stand, to paste to Claude.
//  Space / A = up, C / Ctrl / B = down, Shift / X = boost. Right-click with the omnitool on empty air puts a block 4.5 blocks in front of you.
// ============================================================
const GOD = {
  get on() { return !!SaveStore.doc.settings.god; },
  set(v) {
    v = !!v; if (v === this.on) return; setSetting('god', v);
    if (v) { this.wasCreative = Inv.creative; Inv.creative = true; Inv.changed && Inv.changed(); } else if (this.wasCreative === false) { Inv.creative = false; Inv.changed && Inv.changed(); }
    P.vx = P.vy = P.vz = 0; try { feed(v ? 'GOD MODE ON — SPACE/A UP · C/B DOWN · SHIFT/X BOOST' : 'GOD MODE OFF', v ? '#ffd24a' : '#9aa'); } catch (e) { }
  },
  fly(dt, w, k, gp) {                                          // called by updatePlayer: replaces gravity with free flight (blocks still stop you)
    const sp = (k.ShiftLeft || k.ShiftRight || gp.slide ? 34 : 14), up = (k.Space || gp.a ? 1 : 0) - (k.KeyC || k.ControlLeft || k.ControlRight || gp.dn ? 1 : 0);
    const kk = Math.min(1, 10 * dt); P.vy += 32 * dt;                                  // undo this frame's gravity
    P.vx += ((w.moving ? w.x * sp : 0) - P.vx) * kk; P.vz += ((w.moving ? w.z * sp : 0) - P.vz) * kk; P.vy += (up * sp * .8 - P.vy) * kk;
    P.sliding = false; P.slamming = false; P.dashT = 0; P.latch = null; P.onGround = false; P.airT = 0; P.hp = 100; P.hurtFlash = 0;
  },
  air() {                                                      // the empty spot in front of you, for placing a block with nothing to stick it to
    const e = eyePos(), f = fwdV(), x = Math.floor(e[0] + f[0] * 4.5), y = Math.floor(e[1] + f[1] * 4.5), z = Math.floor(e[2] + f[2] * 4.5);
    return y >= 1 && get(x, y, z) === 0 ? { x, y, z, nx: 0, ny: 0, nz: 0, t: 4.5 } : null;
  },
  state() {                                                    // everything Claude needs to rebuild the changes: block edits grouped by block, runs along X as [x,y,z,length]
    const list = WorldSave.list(), by = {};
    list.sort((a, b) => a[3] - b[3] || a[1] - b[1] || a[2] - b[2] || a[0] - b[0]);
    for (const [x, y, z, id] of list) { const r = by[id] || (by[id] = []), l = r[r.length - 1]; if (l && l[1] === y && l[2] === z && l[0] + l[3] === x) l[3]++; else r.push([x, y, z, 1]); }
    const names = {}; for (const [id, nm] of (DATA.blocks.build || [])) names[id] = nm;
    const legend = {}; for (const id of Object.keys(by)) { const n = +id; legend[id] = n === 0 ? 'AIR (block removed)' : (names[n] || names[BASE[n]] || 'block ' + BASE[n]) + (BASE[n] !== n ? ' (shaped, base ' + BASE[n] + ')' : ''); }
    const c = WorldStore.cur;
    return JSON.stringify({ hbz: 'god-state', v: 1, world: c ? c.meta.name : '', seed: c ? c.meta.seed : 0, where: OW.gen === 3 ? 'HELICARRIER' : OW.gen === 4 ? 'REALM ' + (OW.S || '') : 'OVERWORLD', gen: OW.gen,
      player: { x: +P.x.toFixed(2), y: +P.y.toFixed(2), z: +P.z.toFixed(2), yaw: +P.yaw.toFixed(2), pitch: +P.pitch.toFixed(2) }, edits: list.length, legend, blocks: by });
  },
  openBox() {
    const s = this.state();
    el.savebox.innerHTML = '<div class="sh-t">GAME STATE</div><div class="sh-g">Every block you changed in this world + where you stand. Copy it and paste it to Claude.</div>'
      + '<textarea id="sb-out" readonly rows="8"></textarea><div><button onclick="sbCopy()">COPY STATE</button><button onclick="closeSaveBox()">CLOSE</button></div><div class="sh-m" id="sb-msg"></div>';
    $('sb-out').value = s; el.savebox.classList.add('on'); try { sbCopy(); } catch (e) { }
  }
};
