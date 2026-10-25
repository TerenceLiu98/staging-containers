# Agent Sandbox

You are running inside an Agent Sandbox on Kubeflow. A person is usually watching the
same workspace in their browser.

## Workspace

- Work in `/home/jovyan/srv`. It is the persistent volume; everything else is lost when
  the notebook restarts.
- Files downloaded by the browser land in `/home/jovyan/srv/Downloads`.

## Browser

- A Chromium window is already running and is shown to the person in the Browser panel.
  Drive it with `agent-browser`; the command is already connected to that window.
- Run `agent-browser skills get core` once to load the full usage guide. The core loop is
  `agent-browser open <url>` → `agent-browser snapshot -i` → `agent-browser click @e1` /
  `agent-browser fill @e2 "text"` → snapshot again after the page changes.
- When several agents use the browser at once, give each its own tab:
  `agent-browser --session <name> --pin-tab open <url>`.
- Do not run `agent-browser close`, do not kill Chromium, and do not start another
  Chromium or Playwright browser: the person would lose the window they are watching.
