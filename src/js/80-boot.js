resize(); addEventListener('orientationchange', resize);
if (window.visualViewport) visualViewport.addEventListener('resize', resize);
requestAnimationFrame(frame);
setTimeout(() => {      // build the world after the first paint so the page never looks frozen on load
  try {
    genHub(); buildAll(); mode = 'hub';
    refreshHotbar(); txt(el.wname, WNAMES[0]); hotSlots[0].classList.add('on'); P.weapon = 0;
    booted = true; txt(el.msub, 'CLICK TO PLAY');
  } catch (e) { reportErr(e && e.message || 'boot error'); }
}, 80);
window.__g = { worldDt: () => worldDt, snapLook, hurtPlayer, tryDash, ATK, haz, eprojs, pieceSrc, spawnBoss, layoutDungeon, damageEnemy, Save, Run, enterDungeon, enterHub, openShop, buyItem, mode: () => mode, pollGamepad, update, renderFrame, hurtPlayer, die, dn: () => dn, P, S, Wv, enemies, keys, mouse, startGame, spawnEnemy, state: () => state, setState: s => state = s, explode, castBullet, switchWeapon, world, get, topY };

