// Dashboard interaction test for the agent-sandbox image.
//
//   node kubeflow/agent-sandbox/ui-test.mjs http://127.0.0.1:18889/notebook/a/b/
//
// Drives the dashboard of a running sandbox in a headless Chrome on the host (Node.js
// 22+ for the built-in WebSocket; set CHROME to the browser binary when it is not the
// macOS default) and checks layouts, shortcuts, maximize, hide, gutter resizing, panel
// swapping, that no iframe reloads, and that the layout survives a page reload.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.argv[2];
if (!url) {
  console.error("usage: node ui-test.mjs <dashboard-url>");
  process.exit(2);
}
const port = 9800 + Math.floor(Math.random() * 100);
const chromeBinary = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chrome = spawn(chromeBinary, [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "ui-"))}`,
  "--window-size=1600,1000", "--no-first-run", "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result.result.value;
};
const mouse = (type, x, y) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });

let failures = 0;
const expect = (name, ok, detail = "") => {
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${ok ? "" : `  ${detail}`}`);
  if (!ok) failures++;
};

await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
await send("Page.enable");
// Wait until the dashboard has rendered and every visible app has loaded.
const waitFor = async (expression, timeoutMs = 60000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (await evaluate(expression)) return true;
    } catch {}
    await sleep(500);
  }
  throw new Error(`timed out waiting for: ${expression}`);
};
const appsLoaded = `document.querySelectorAll('.app-toggle').length === 7 && [...document.querySelectorAll('.panel:not(.hidden) iframe')].every(f => { try { return f.contentDocument && f.contentDocument.readyState === 'complete' && f.contentWindow.location.href !== 'about:blank'; } catch (e) { return false; } })`;

await send("Page.navigate", { url: `${url}?apps=code,browser,terminal&layout=auto` });
await waitFor(appsLoaded);
await sleep(2000);

const visible = () => evaluate(`[...document.querySelectorAll('.panel:not(.hidden)')].map(p => p.dataset.app).sort().join(',')`);
const rect = (app) => evaluate(`(() => { const r = document.querySelector('.panel[data-app="${app}"]').getBoundingClientRect(); return {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)}; })()`);

// Mark every iframe's window so a reload (which drops the marker) is detectable.
await evaluate(`document.querySelectorAll('iframe').forEach(f => { try { f.contentWindow.__marker = 42; } catch (e) {} }); true`);

expect("initial apps from URL", (await visible()) === "browser,code,terminal", await visible());
const code0 = await rect("code");
const browser0 = await rect("browser");
expect("auto layout: code left, browser top right", code0.x < browser0.x && browser0.y < (await rect("terminal")).y, JSON.stringify({ code0, browser0 }));

await evaluate(`document.querySelector('[data-layout="rows"]').click()`);
await sleep(300);
const codeRows = await rect("code");
expect("rows layout stacks panels at full width", codeRows.w > 1500 && codeRows.h < 400, JSON.stringify(codeRows));

await evaluate(`document.querySelector('[data-layout="columns"]').click()`);
await sleep(300);
expect("columns layout splits width", (await rect("code")).w < 600, JSON.stringify(await rect("code")));

// Alt+5 from inside the terminal iframe toggles Claude (shortcut handler in iframes).
await evaluate(`document.querySelector('iframe[data-app="terminal"]').contentWindow.dispatchEvent(new KeyboardEvent('keydown', {code: 'Digit5', altKey: true, bubbles: true, cancelable: true}))`);
await sleep(500);
expect("Alt+5 inside an iframe shows Claude", (await visible()) === "browser,claude,code,terminal", await visible());

await evaluate(`document.querySelector('.panel[data-app="code"] .panel-actions button[title^="Maximize"]').click()`);
await sleep(300);
expect("maximize shows only VS Code", (await visible()) === "code", await visible());
expect("maximized panel fills the workspace", (await rect("code")).w > 1550, JSON.stringify(await rect("code")));

await evaluate(`document.querySelector('.panel[data-app="code"] .panel-actions button[title^="Restore"]').click()`);
await sleep(300);
expect("restore brings the others back", (await visible()) === "browser,claude,code,terminal", await visible());

await evaluate(`document.querySelector('.panel[data-app="claude"] .panel-actions button[title="Hide"]').click()`);
await sleep(300);
expect("hide removes Claude", (await visible()) === "browser,code,terminal", await visible());

// Drag the first gutter 200px to the right.
const gutter = await evaluate(`(() => { const g = document.querySelector('.gutter.h').getBoundingClientRect(); return {x: g.x + g.width / 2, y: g.y + g.height / 2}; })()`);
const before = (await rect("code")).w;
await mouse("mousePressed", gutter.x, gutter.y);
for (let i = 1; i <= 10; i++) { await mouse("mouseMoved", gutter.x + i * 20, gutter.y); await sleep(20); }
await mouse("mouseReleased", gutter.x + 200, gutter.y);
await sleep(300);
const after = (await rect("code")).w;
expect("dragging a gutter resizes panels", Math.abs(after - before - 200) < 15, `${before} -> ${after}`);

// Drag the VS Code header onto the Terminal panel to swap them.
const codeHeader = await rect("code");
const terminalBox = await rect("terminal");
await mouse("mousePressed", codeHeader.x + 60, codeHeader.y + 14);
for (let i = 1; i <= 10; i++) {
  await mouse("mouseMoved", codeHeader.x + 60 + ((terminalBox.x + terminalBox.w / 2 - codeHeader.x - 60) * i) / 10, codeHeader.y + 14 + ((terminalBox.y + terminalBox.h / 2 - codeHeader.y - 14) * i) / 10);
  await sleep(20);
}
await mouse("mouseReleased", terminalBox.x + terminalBox.w / 2, terminalBox.y + terminalBox.h / 2);
await sleep(300);
expect("dragging a header swaps panel positions", (await rect("terminal")).x < (await rect("code")).x, JSON.stringify({ code: await rect("code"), terminal: await rect("terminal") }));

const markers = await evaluate(`[...document.querySelectorAll('iframe')].filter(f => ['code','browser','terminal'].includes(f.dataset.app)).map(f => { try { return f.dataset.app + ':' + f.contentWindow.__marker; } catch (e) { return f.dataset.app + ':x'; } }).sort().join(',')`);
expect("no iframe reloaded during layout changes", markers === "browser:42,code:42,terminal:42", markers);

const stored = await evaluate(`localStorage.getItem('agent-sandbox.workspace.v1')`);
await send("Page.navigate", { url });
await waitFor(appsLoaded);
expect("layout survives a page reload", (await visible()) === "browser,code,terminal" && (await rect("terminal")).x < (await rect("code")).x,
  `${await visible()} ${stored}`);

const dots = await evaluate(`[...document.querySelectorAll('.app-toggle .dot')].map(d => d.dataset.status).join(',')`);
expect("all health dots are green", dots.split(",").every((d) => d === "ok"), dots);

console.log(failures ? `${failures} UI check(s) failed` : "all UI checks passed");
ws.close();
chrome.kill();
process.exit(failures ? 1 : 0);
