resize(); addEventListener('orientationchange', resize);
if (window.visualViewport) visualViewport.addEventListener('resize', resize);
requestAnimationFrame(frame);
setTimeout(() => {      // build the world after the first paint so the page never looks frozen on load
  try {
    WorldStore.openDemo(); mode = 'hub'; genHub();
    refreshHotbar(); txt(el.wname, WNAMES[0]); hotSlots[0].classList.add('on'); P.weapon = 0;
    booted = true; txt(el.msub, 'CLICK TO PLAY'); applySettings(); openTitle();
  } catch (e) { reportErr(e && e.message || 'boot error'); }
}, 80);
window.__g = { startWorld, WorldStore, Menu, ACT, SCREENS, openPause, resumeGame, quitToTitle, seedFromText, optV, applySettings, hostCurrentWorld, booted: () => booted, startWorldQuick: () => { const d = SaveStore.doc; const w = WorldStore.find(d.lastWorld) || WorldStore.create({ name: 'TEST WORLD' }); startWorld(w.id); }, DayNight, sellShards, openInv, closeInv, Inv, OW, OWG, WorldSave, ckey, gateOf, gatesNear, nearestGate, gateAtPlayer, biomeAt, villageD, useChunks: () => useChunks, MQ, Relay, beams, slashes, Coop, players, addRemotePlayer, removeRemotePlayer, nearestPlayer, setBlock, genHub, genDungeon, SaveStore, exportSaveCode, importSaveCode, loadSave, flushSave, Net, setWorldSeed, R, MIGRATIONS, SAVE_SCHEMA, worldDt: () => worldDt, snapLook, hurtPlayer, tryDash, ATK, haz, eprojs, pieceSrc, spawnBoss, layoutDungeon, damageEnemy, Save, Run, enterDungeon, enterHub, openShop, buyItem, mode: () => mode, pollGamepad, update, renderFrame, hurtPlayer, die, dn: () => dn, P, S, Wv, enemies, keys, mouse, startGame, spawnEnemy, state: () => state, setState: s => state = s, explode, castBullet, switchWeapon, world, get, topY };

