"use strict";

// Agent Sandbox workspace: several apps side by side, each in its own iframe.
//
// Iframes are never moved in the DOM (moving one reloads it, which would restart
// VS Code and drop terminal and VNC connections). Every panel is absolutely
// positioned inside #workspace and a layout change only recomputes its rectangle.

const APPS = [
  { id: "code", title: "VS Code", src: "code/", probe: "code/healthz" },
  { id: "browser", title: "Browser", src: "display.html", probe: "cdp/json/version" },
  { id: "terminal", title: "Terminal", src: "terminal/", probe: "terminal/" },
  { id: "codex", title: "Codex", src: "terminal/?arg=codex", probe: "terminal/" },
  { id: "claude", title: "Claude", src: "terminal/?arg=claude", probe: "terminal/" },
  { id: "opencode", title: "OpenCode", src: "terminal/?arg=opencode", probe: "terminal/" },
  { id: "zcode", title: "ZCode", src: "display.html?socket=zcode-vnc/websockify", probe: "zcode-vnc/core/rfb.js" },
];

const LAYOUTS = ["auto", "columns", "rows", "focus"];
const STORAGE_KEY = "agent-sandbox.workspace.v1";
const GUTTER = 6;
const MIN_PANEL = 120;
const PROBE_INTERVAL_MS = 15000;

const appsById = new Map(APPS.map((app) => [app.id, app]));
const baseUrl = new URL(".", window.location.href);

const workspace = document.getElementById("workspace");
const emptyState = document.getElementById("empty");
const toggleBar = document.getElementById("app-toggles");
const overlay = document.getElementById("drag-overlay");
const aboutButton = document.getElementById("about-button");
const aboutBox = document.getElementById("about");

const panels = new Map(); // id -> { el, iframe, dot, maxButton }
const toggles = new Map(); // id -> { el, dot }
const probeStatus = new Map(); // probe url -> "ok" | "error"
let lastPlacement = { panels: [], gutters: [] };
let gutterEls = [];
let renderQueued = false;

const state = loadState();

function defaultState() {
  return {
    visible: ["code", "browser", "terminal"],
    order: APPS.map((app) => app.id),
    layout: "auto",
    maximized: null,
    focused: "code",
    ratios: {},
  };
}

function sanitizeState(raw) {
  const result = defaultState();
  if (!raw || typeof raw !== "object") {
    return result;
  }
  if (Array.isArray(raw.visible)) {
    result.visible = raw.visible.filter((id) => appsById.has(id));
  }
  if (Array.isArray(raw.order)) {
    const known = raw.order.filter((id) => appsById.has(id));
    result.order = [...new Set([...known, ...APPS.map((app) => app.id)])];
  }
  if (LAYOUTS.includes(raw.layout)) {
    result.layout = raw.layout;
  }
  if (appsById.has(raw.maximized) && result.visible.includes(raw.maximized)) {
    result.maximized = raw.maximized;
  }
  if (appsById.has(raw.focused)) {
    result.focused = raw.focused;
  }
  if (raw.ratios && typeof raw.ratios === "object") {
    for (const [key, value] of Object.entries(raw.ratios)) {
      if (Array.isArray(value) && value.every((n) => typeof n === "number" && n > 0)) {
        result.ratios[key] = value;
      }
    }
  }
  return result;
}

function loadState() {
  let stored = null;
  try {
    stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
  } catch (error) {
    stored = null;
  }
  const result = sanitizeState(stored);

  // ?apps=code,browser&layout=columns&max=browser override the remembered state.
  const params = new URLSearchParams(window.location.search);
  if (params.has("apps")) {
    result.visible = params.get("apps").split(",").map((id) => id.trim()).filter((id) => appsById.has(id));
    result.maximized = null;
  }
  if (LAYOUTS.includes(params.get("layout"))) {
    result.layout = params.get("layout");
  }
  if (appsById.has(params.get("max"))) {
    const id = params.get("max");
    if (!result.visible.includes(id)) {
      result.visible.push(id);
    }
    result.maximized = id;
  }
  return result;
}

function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Storage may be unavailable (private mode, blocked site data); the layout still works.
  }
}

function resolve(path) {
  return new URL(path, baseUrl).href;
}

// ---------------------------------------------------------------------------
// Layout tree
// ---------------------------------------------------------------------------

function leaf(id) {
  return { id };
}

function split(dir, children) {
  return { dir, children };
}

function visibleInOrder() {
  return state.order.filter((id) => state.visible.includes(id));
}

function buildTree(ids) {
  if (ids.length === 0) {
    return null;
  }
  if (state.maximized && ids.includes(state.maximized)) {
    return leaf(state.maximized);
  }
  if (state.layout === "focus") {
    return leaf(ids.includes(state.focused) ? state.focused : ids[0]);
  }
  if (state.layout === "columns") {
    return ids.length === 1 ? leaf(ids[0]) : split("h", ids.map(leaf));
  }
  if (state.layout === "rows") {
    return ids.length === 1 ? leaf(ids[0]) : split("v", ids.map(leaf));
  }
  const [a, b, c, d] = ids;
  switch (ids.length) {
    case 1:
      return leaf(a);
    case 2:
      return split("h", [leaf(a), leaf(b)]);
    case 3:
      return split("h", [leaf(a), split("v", [leaf(b), leaf(c)])]);
    case 4:
      return split("v", [split("h", [leaf(a), leaf(b)]), split("h", [leaf(c), leaf(d)])]);
    default: {
      const top = Math.ceil(ids.length / 2);
      return split("v", [split("h", ids.slice(0, top).map(leaf)), split("h", ids.slice(top).map(leaf))]);
    }
  }
}

function ratiosFor(key, count) {
  const stored = state.ratios[key];
  if (Array.isArray(stored) && stored.length === count) {
    const total = stored.reduce((sum, n) => sum + n, 0);
    return stored.map((n) => n / total);
  }
  return Array.from({ length: count }, () => 1 / count);
}

function place(node, rect, key, out) {
  if (!node.dir) {
    out.panels.push({ id: node.id, rect });
    return;
  }
  const horizontal = node.dir === "h";
  const count = node.children.length;
  const total = horizontal ? rect.w : rect.h;
  const available = Math.max(0, total - GUTTER * (count - 1));
  const ratios = ratiosFor(key, count);
  let position = horizontal ? rect.x : rect.y;

  node.children.forEach((child, index) => {
    const size = index === count - 1
      ? (horizontal ? rect.x + rect.w : rect.y + rect.h) - position
      : Math.round(available * ratios[index]);
    const childRect = horizontal
      ? { x: position, y: rect.y, w: size, h: rect.h }
      : { x: rect.x, y: position, w: rect.w, h: size };
    place(child, childRect, `${key}.${index}`, out);
    position += size;
    if (index < count - 1) {
      out.gutters.push({
        key,
        index,
        count,
        dir: node.dir,
        available,
        rect: horizontal
          ? { x: position, y: rect.y, w: GUTTER, h: rect.h }
          : { x: rect.x, y: position, w: rect.w, h: GUTTER },
      });
      position += GUTTER;
    }
  });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const ICONS = {
  reload: '<svg viewBox="0 0 16 16"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3"/></svg>',
  popout: '<svg viewBox="0 0 16 16"><path d="M9 2.5h4.5V7M13.5 2.5 7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/></svg>',
  maximize: '<svg viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="11" height="11" rx="1"/></svg>',
  restore: '<svg viewBox="0 0 16 16"><rect x="2.5" y="5" width="8.5" height="8.5" rx="1"/><path d="M5 5V3.5a1 1 0 0 1 1-1h6.5a1 1 0 0 1 1 1V10a1 1 0 0 1-1 1H11"/></svg>',
  close: '<svg viewBox="0 0 16 16"><path d="m4 4 8 8M12 4l-8 8"/></svg>',
};

function iconButton(name, title, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-button";
  button.title = title;
  button.innerHTML = ICONS[name];
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function ensurePanel(id) {
  if (panels.has(id)) {
    return panels.get(id);
  }
  const app = appsById.get(id);
  const el = document.createElement("section");
  el.className = "panel";
  el.dataset.app = id;

  const header = document.createElement("div");
  header.className = "panel-header";
  const dot = document.createElement("span");
  dot.className = "dot";
  const title = document.createElement("span");
  title.className = "panel-title";
  title.textContent = app.title;
  const actions = document.createElement("div");
  actions.className = "panel-actions";
  const maxButton = iconButton("maximize", "Maximize (Alt+Enter)", () => toggleMaximize(id));
  actions.append(
    iconButton("reload", "Reload", () => reloadApp(id)),
    iconButton("popout", "Open in a new tab", () => window.open(resolve(app.src), "_blank", "noopener")),
    maxButton,
    iconButton("close", "Hide", () => setVisible(id, false)),
  );
  header.append(dot, title, actions);
  header.addEventListener("dblclick", (event) => {
    if (!event.target.closest(".panel-actions")) {
      toggleMaximize(id);
    }
  });
  header.addEventListener("pointerdown", (event) => startMove(event, id));

  const body = document.createElement("div");
  body.className = "panel-body";
  const iframe = document.createElement("iframe");
  iframe.title = app.title;
  iframe.dataset.app = id;
  iframe.allow = "clipboard-read; clipboard-write; fullscreen";
  iframe.addEventListener("load", () => attachFrameShortcuts(iframe));
  iframe.src = resolve(app.src);
  body.append(iframe);

  el.append(header, body);
  el.addEventListener("pointerdown", () => setFocused(id), true);
  workspace.append(el);

  const panel = { el, iframe, dot, maxButton };
  panels.set(id, panel);
  updateDots();
  return panel;
}

function render() {
  renderQueued = false;
  const ids = visibleInOrder();
  const tree = buildTree(ids);
  const bounds = { x: 0, y: 0, w: workspace.clientWidth, h: workspace.clientHeight };
  const out = { panels: [], gutters: [] };
  if (tree) {
    const treeKey = state.maximized ? "max" : `${state.layout}:${ids.length}`;
    place(tree, { x: GUTTER, y: GUTTER, w: bounds.w - GUTTER * 2, h: bounds.h - GUTTER * 2 }, treeKey, out);
  }
  lastPlacement = out;

  const shown = new Set(out.panels.map((item) => item.id));
  for (const { id, rect } of out.panels) {
    const panel = ensurePanel(id);
    panel.el.classList.remove("hidden");
    Object.assign(panel.el.style, {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${Math.max(0, rect.w)}px`,
      height: `${Math.max(0, rect.h)}px`,
    });
  }
  // Hidden panels keep their last size so embedded apps (noVNC especially) do not
  // see a 0x0 viewport and resize the remote display.
  for (const [id, panel] of panels) {
    if (!shown.has(id)) {
      panel.el.classList.add("hidden");
    }
    panel.el.classList.toggle("focused", id === state.focused && shown.size > 1);
    const maximized = state.maximized === id;
    panel.maxButton.innerHTML = maximized ? ICONS.restore : ICONS.maximize;
    panel.maxButton.title = maximized ? "Restore (Alt+Enter)" : "Maximize (Alt+Enter)";
  }

  for (const el of gutterEls) {
    el.remove();
  }
  gutterEls = out.gutters.map((gutter) => {
    const el = document.createElement("div");
    el.className = `gutter ${gutter.dir}`;
    Object.assign(el.style, {
      left: `${gutter.rect.x}px`,
      top: `${gutter.rect.y}px`,
      width: `${gutter.rect.w}px`,
      height: `${gutter.rect.h}px`,
    });
    el.addEventListener("pointerdown", (event) => startResize(event, gutter, el));
    el.addEventListener("dblclick", () => {
      delete state.ratios[gutter.key];
      saveState();
      scheduleRender();
    });
    workspace.append(el);
    return el;
  });

  emptyState.hidden = ids.length > 0;
  for (const [id, toggle] of toggles) {
    toggle.el.classList.toggle("active", state.visible.includes(id));
    toggle.el.setAttribute("aria-pressed", String(state.visible.includes(id)));
  }
  for (const button of document.querySelectorAll("[data-layout]")) {
    button.classList.toggle("active", !state.maximized && button.dataset.layout === state.layout);
  }
}

function scheduleRender() {
  if (!renderQueued) {
    renderQueued = true;
    window.requestAnimationFrame(render);
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function setVisible(id, visible) {
  const isVisible = state.visible.includes(id);
  if (visible && !isVisible) {
    state.visible.push(id);
    state.focused = id;
    if (state.maximized) {
      state.maximized = id;
    }
  } else if (!visible && isVisible) {
    state.visible = state.visible.filter((item) => item !== id);
    if (state.maximized === id) {
      state.maximized = null;
    }
    if (state.focused === id) {
      state.focused = visibleInOrder()[0] || null;
    }
  }
  saveState();
  scheduleRender();
}

function toggleApp(id) {
  setVisible(id, !state.visible.includes(id));
}

function toggleMaximize(id) {
  state.maximized = state.maximized === id ? null : id;
  if (state.maximized) {
    state.focused = id;
  }
  saveState();
  scheduleRender();
}

function setLayout(layout) {
  state.layout = layout;
  state.maximized = null;
  saveState();
  scheduleRender();
}

function setFocused(id) {
  if (state.focused !== id) {
    state.focused = id;
    saveState();
    scheduleRender();
  }
}

function reloadApp(id) {
  const panel = panels.get(id);
  if (!panel) {
    return;
  }
  try {
    panel.iframe.contentWindow.location.reload();
  } catch (error) {
    panel.iframe.src = resolve(appsById.get(id).src);
  }
}

// ---------------------------------------------------------------------------
// Dragging: gutters resize, panel headers swap positions
// ---------------------------------------------------------------------------

function beginDrag(className) {
  overlay.hidden = false;
  document.body.classList.add(className);
}

function endDrag(className) {
  overlay.hidden = true;
  document.body.classList.remove(className);
}

function startResize(event, gutter, el) {
  if (event.button !== 0) {
    return;
  }
  event.preventDefault();
  const horizontal = gutter.dir === "h";
  const start = horizontal ? event.clientX : event.clientY;
  const ratios = ratiosFor(gutter.key, gutter.count);
  const pair = ratios[gutter.index] + ratios[gutter.index + 1];
  const minRatio = Math.min(pair / 2, MIN_PANEL / Math.max(gutter.available, 1));
  const className = horizontal ? "resizing-h" : "resizing-v";
  el.classList.add("active");
  beginDrag(className);

  const onMove = (moveEvent) => {
    const delta = ((horizontal ? moveEvent.clientX : moveEvent.clientY) - start) / Math.max(gutter.available, 1);
    const first = Math.min(Math.max(ratios[gutter.index] + delta, minRatio), pair - minRatio);
    const next = ratios.slice();
    next[gutter.index] = first;
    next[gutter.index + 1] = pair - first;
    state.ratios[gutter.key] = next;
    scheduleRender();
  };
  const onUp = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    endDrag(className);
    saveState();
    scheduleRender();
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

function panelAt(x, y) {
  const bounds = workspace.getBoundingClientRect();
  const localX = x - bounds.left;
  const localY = y - bounds.top;
  const hit = lastPlacement.panels.find(({ rect }) =>
    localX >= rect.x && localX <= rect.x + rect.w && localY >= rect.y && localY <= rect.y + rect.h);
  return hit ? hit.id : null;
}

function startMove(event, id) {
  if (event.button !== 0 || event.target.closest(".panel-actions") || lastPlacement.panels.length < 2) {
    return;
  }
  const startX = event.clientX;
  const startY = event.clientY;
  let moving = false;
  let target = null;

  const clearTarget = () => {
    if (target && panels.has(target)) {
      panels.get(target).el.classList.remove("drop-target");
    }
  };
  const onMove = (moveEvent) => {
    if (!moving) {
      if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 6) {
        return;
      }
      moving = true;
      panels.get(id).el.classList.add("drag-source");
      beginDrag("moving");
    }
    const hit = panelAt(moveEvent.clientX, moveEvent.clientY);
    const next = hit && hit !== id ? hit : null;
    if (next !== target) {
      clearTarget();
      target = next;
      if (target) {
        panels.get(target).el.classList.add("drop-target");
      }
    }
  };
  const onUp = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    if (!moving) {
      return;
    }
    panels.get(id).el.classList.remove("drag-source");
    clearTarget();
    endDrag("moving");
    if (target) {
      const order = state.order.slice();
      const from = order.indexOf(id);
      const to = order.indexOf(target);
      [order[from], order[to]] = [order[to], order[from]];
      state.order = order;
      saveState();
      scheduleRender();
    }
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts: Alt+1..7 toggles an app, Alt+Enter maximizes the focused one.
// The listener is also attached inside every (same-origin) iframe, in the capture
// phase, so the shortcuts work while VS Code or a terminal has focus.
// ---------------------------------------------------------------------------

function handleShortcut(event) {
  if (!event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }
  const match = /^Digit([1-9])$/.exec(event.code);
  if (match) {
    const app = APPS[Number(match[1]) - 1];
    if (app) {
      event.preventDefault();
      event.stopPropagation();
      toggleApp(app.id);
    }
    return;
  }
  if (event.code === "Enter" && state.focused && state.visible.includes(state.focused)) {
    event.preventDefault();
    event.stopPropagation();
    toggleMaximize(state.focused);
  }
}

function attachFrameShortcuts(iframe) {
  try {
    iframe.contentWindow.addEventListener("keydown", handleShortcut, true);
  } catch (error) {
    // Cross-origin content; shortcuts only work from the toolbar then.
  }
}

// Clicking into an iframe does not bubble to this document; track focus via blur.
window.addEventListener("blur", () => {
  window.setTimeout(() => {
    const active = document.activeElement;
    if (active && active.tagName === "IFRAME" && active.dataset.app) {
      setFocused(active.dataset.app);
    }
  }, 0);
});

// ---------------------------------------------------------------------------
// Health probes
// ---------------------------------------------------------------------------

function updateDots() {
  for (const app of APPS) {
    const status = probeStatus.get(app.probe) || "unknown";
    const toggle = toggles.get(app.id);
    if (toggle) {
      toggle.dot.dataset.status = status;
    }
    const panel = panels.get(app.id);
    if (panel) {
      panel.dot.dataset.status = status;
    }
  }
}

async function probeAll() {
  const probes = [...new Set(APPS.map((app) => app.probe))];
  await Promise.all(probes.map(async (probe) => {
    try {
      const response = await fetch(resolve(probe), { cache: "no-store", credentials: "same-origin" });
      probeStatus.set(probe, response.ok ? "ok" : "error");
    } catch (error) {
      probeStatus.set(probe, "error");
    }
  }));
  updateDots();
}

// ---------------------------------------------------------------------------
// About box
// ---------------------------------------------------------------------------

async function loadAbout() {
  try {
    const response = await fetch(resolve("status.json"), { cache: "no-store" });
    const status = await response.json();
    aboutBox.textContent = "";
    const heading = document.createElement("h2");
    heading.textContent = "Components";
    const list = document.createElement("dl");
    for (const [name, version] of Object.entries(status.components || {})) {
      const dt = document.createElement("dt");
      dt.textContent = name;
      const dd = document.createElement("dd");
      dd.textContent = version;
      list.append(dt, dd);
    }
    const note = document.createElement("p");
    note.textContent = `Image revision ${status.revision} · ${status.platform}. Shortcuts: Alt+1…${APPS.length} toggle apps, Alt+Enter maximize.`;
    aboutBox.append(heading, list, note);
  } catch (error) {
    aboutBox.textContent = "Version information is unavailable.";
  }
}

aboutButton.addEventListener("click", () => {
  const open = aboutBox.hidden;
  aboutBox.hidden = !open;
  aboutButton.setAttribute("aria-expanded", String(open));
  if (open) {
    loadAbout();
  }
});

document.addEventListener("pointerdown", (event) => {
  if (!aboutBox.hidden && !aboutBox.contains(event.target) && !aboutButton.contains(event.target)) {
    aboutBox.hidden = true;
    aboutButton.setAttribute("aria-expanded", "false");
  }
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

APPS.forEach((app, index) => {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "app-toggle";
  el.title = `Show or hide ${app.title} (Alt+${index + 1})`;
  const dot = document.createElement("span");
  dot.className = "dot";
  const label = document.createElement("span");
  label.textContent = app.title;
  const key = document.createElement("span");
  key.className = "key";
  key.textContent = String(index + 1);
  el.append(dot, label, key);
  el.addEventListener("click", () => toggleApp(app.id));
  toggleBar.append(el);
  toggles.set(app.id, { el, dot });
});

for (const button of document.querySelectorAll("[data-layout]")) {
  button.addEventListener("click", () => setLayout(button.dataset.layout));
}

window.addEventListener("keydown", handleShortcut, true);
new ResizeObserver(scheduleRender).observe(workspace);

saveState();
render();
probeAll();
window.setInterval(probeAll, PROBE_INTERVAL_MS);
