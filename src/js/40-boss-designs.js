
// ============================================================
//  PROCEDURAL BOSSES — 5 heads x 5 torsos x 5 legs, 20 attacks.
//  Each piece rolls its own attack every time a dungeon is generated,
//  and each piece has its own health bar.
// ============================================================
const BSC = 1.9, LH = 1.0, TH = 1.0, HH = .8, TOTH = LH + TH + HH;
const BAND = [LH / TOTH, (LH + TH) / TOTH];                 // legs | torso | head
const PSLOT = ['LEGS', 'TORSO', 'HEAD'];
const PSRC = [.2, .55, .9];

const bossDesign = d => ({ ...d, parts: partsFrom(d.parts) });          // data/bosses.json: 5 heads, 5 torsos, 5 legs
const BHEADS = DATA.bosses.heads.map(bossDesign), BTORSOS = DATA.bosses.torsos.map(bossDesign), BLEGS = DATA.bosses.legs.map(bossDesign);
ED.boss = { ...DATA.enemies.boss, h: TOTH * BSC, parts: [], scale: 1, boss: true };

