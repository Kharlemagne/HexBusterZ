// ---------------- shop ----------------
const SHOP = DATA.shop;                                       // data/shop.json
let shopSel = 0, shopMsg = '';
function openShop() {
  if (state !== 'play') return;
  state = 'shop'; mouse.l = mouse.r = false; try { document.exitPointerLock(); } catch (e) { }
  shopSel = 0; shopMsg = ''; renderShop(); el.shop.classList.add('on');
}
function closeShop() {
  if (state !== 'shop') return;
  state = 'play'; el.shop.classList.remove('on'); try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
}
function renderShop() {
  let h = '<div class="sh-t">VEX — DEMON SMITH</div><div class="sh-g">◆ ' + Save.gems + ' DEMON GEMS</div>';
  SHOP.forEach((it, i) => {
    const own = Save.unlocked[it.w], can = Save.gems >= it.cost;
    h += '<div class="sh-i' + (i === shopSel ? ' sel' : '') + (own ? ' own' : (can ? '' : ' no')) + '" onclick="shopSel=' + i + ';buyItem(' + i + ')"><b>' + it.name + '</b><span>' + (own ? 'OWNED' : '◆ ' + it.cost) + '</span><i>' + it.desc + '</i></div>';
  });
  h += '<div class="sh-m">' + (shopMsg || 'Gems come from chests and bosses in the Hellgate.') + '</div><div class="sh-f">CLICK / 1-3 / A to forge · ESC / E / B to leave</div>';
  el.shop.innerHTML = h;
}
function buyItem(i) {
  const it = SHOP[i]; if (!it) return;
  if (Save.unlocked[it.w]) { shopMsg = 'You already carry that one.'; renderShop(); return; }
  if (Save.gems < it.cost) { shopMsg = 'Not enough gems. Go bleed some demons.'; SFX.empty(); renderShop(); return; }
  Save.gems -= it.cost; Save.unlocked[it.w] = true; saveGame(); SFX.rank(); SFX.place();
  shopMsg = it.name + ' forged. Slot ' + (it.w + 1) + '.'; renderShop(); refreshHotbar();
}

