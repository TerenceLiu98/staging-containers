# Agent Sandbox

An all-in-one agent workspace in a single container, modelled on
[agent-infra/sandbox](https://github.com/agent-infra/sandbox). One URL serves a
multi-panel dashboard:

- **VS Code** (code-server)
- **Browser** — a real Chromium on a VNC display; agents drive the same visible
  window over CDP with the bundled [`agent-browser`](https://github.com/vercel-labs/agent-browser)
- **Terminal** — tmux-backed sessions that survive page reloads
- **Codex, OpenCode** — one terminal panel each (Claude Code CLI also
  available as a terminal session)
- **Claude** — the Claude Desktop app on a VNC display (sign-in persisted
  via gnome-keyring)
- **ZCode** — the ZCode desktop app on another VNC display

Links opened inside the container (OAuth logins included) open as tabs in the
shared browser. Tool state, logins and browser profiles persist under
`/home/jovyan/srv/.state`.

This is the standalone image. Kubeflow-specific adaptation (registry wiring,
cluster validation) will be layered separately on top.

## Run

```bash
docker run -d --name agent-sandbox \
  -p 127.0.0.1:8080:8888 \
  -v agent-sandbox-srv:/home/jovyan/srv \
  terencelau/agent-sandbox:latest
# open http://127.0.0.1:8080/
```

Optional: `-e NB_PREFIX=/some/prefix` to serve under a path prefix (any reverse
proxy works; Kubeflow sets this automatically), `-e ZCODE_DESKTOP=false` or
`-e CLAUDE_DESKTOP=false` to skip a desktop app's display and save memory.

## Build and test

```bash
make -C agent-sandbox build TARGETPLATFORM=linux/arm64   # pins in versions/agent-sandbox.env
make -C agent-sandbox smoke
node agent-sandbox/ui-test.mjs http://127.0.0.1:18889/   # against a running container
```

The design and implementation notes are in [`DESIGN.md`](DESIGN.md).
