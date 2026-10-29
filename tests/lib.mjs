// Shared helpers for the headless-browser tests.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const req = createRequire(import.meta.url);
function loadPlaywright() {
  try { return req('playwright'); } catch { /* fall through */ }
  try { return req(path.join(execSync('npm root -g').toString().trim(), 'playwright')); } catch { /* fall through */ }
  if (process.env.PLAYWRIGHT_PATH) return req(process.env.PLAYWRIGHT_PATH);
  throw new Error('playwright not found: run `npm install` (and `npx playwright install chromium`)');
}
export const { chromium } = loadPlaywright();
export const GAME_URL = process.env.GAME_URL || pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.html')).href;

// Software-GL flags so the game runs on CI machines without a GPU.
export const GL_ARGS = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required'];

export async function openGame({ width = 960, height = 540, init, url = GAME_URL, context, browser: shared } = {}) {
  const browser = shared || await chromium.launch({ args: GL_ARGS });
  const ctx = context ? await browser.newContext(context) : await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  if (init) await page.addInitScript(init);
  await page.goto(url);
  await page.waitForFunction(() => window.__g && document.getElementById('msub') && /CLICK TO PLAY/.test(document.getElementById('msub').textContent), null, { timeout: 20000 });
  return { browser, ctx, page, errors, async close() { if (shared) await ctx.close(); else await browser.close(); } };
}
export async function startPlaying(page) { await page.click('#menu'); await page.waitForFunction(() => __g.state() === 'play'); }

// Minimal assertion/reporting
let failed = 0;
export function check(name, cond, detail = '') { if (cond) console.log('  ok   ' + name); else { failed++; console.log('  FAIL ' + name + (detail ? '  -> ' + detail : '')); } }
export function done(errors = []) {
  const real = errors.filter(e => !/GPU stall|ReadPixels|GL Driver Message/i.test(e));
  check('no JavaScript errors', real.length === 0, real.slice(0, 3).join(' | '));
  if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
}
