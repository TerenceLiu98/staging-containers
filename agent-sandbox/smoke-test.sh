#!/usr/bin/env bash
# Local smoke test for the agent-sandbox image.
#
#   kubeflow/agent-sandbox/smoke-test.sh [image]
#
# Starts the image the way Kubeflow does (port 8888, NB_PREFIX, a volume on
# /home/jovyan/srv), checks every gateway route, drives the VNC browser with
# agent-browser, then restarts the container and checks that state persisted.
set -euo pipefail

IMAGE="${1:-terencelau/agent-sandbox:latest}"
CONTAINER_CLI="${CONTAINER_CLI:-docker}"
NAME="${SMOKE_NAME:-agent-sandbox-smoke}"
VOLUME="${NAME}-srv"
HOST_PORT="${SMOKE_PORT:-18888}"
PREFIX="/notebook/smoke/sandbox"
BASE="http://127.0.0.1:${HOST_PORT}${PREFIX}"

failures=0

pass() { printf '  \033[32mok\033[0m   %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; failures=$((failures + 1)); }

check() {
  local description="$1"
  shift
  if "$@" >/dev/null 2>&1; then pass "${description}"; else fail "${description}"; fi
}

in_container() {
  "${CONTAINER_CLI}" exec -u 1000 -e HOME=/home/jovyan -w /home/jovyan/srv "${NAME}" bash -lc "$1"
}

cleanup() {
  "${CONTAINER_CLI}" rm -f "${NAME}" >/dev/null 2>&1 || true
  "${CONTAINER_CLI}" volume rm -f "${VOLUME}" >/dev/null 2>&1 || true
}

wait_ready() {
  for _ in $(seq 1 90); do
    if curl -fsS "${BASE}/cdp/json/version" >/dev/null 2>&1 && curl -fsS "${BASE}/code/healthz" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  "${CONTAINER_CLI}" logs "${NAME}" | tail -n 80
  return 1
}

start() {
  "${CONTAINER_CLI}" run -d --name "${NAME}" \
    -p "127.0.0.1:${HOST_PORT}:8888" \
    -e NB_PREFIX="${PREFIX}" \
    -v "${VOLUME}:/home/jovyan/srv" \
    "${IMAGE}" >/dev/null
}

cleanup
trap cleanup EXIT

echo "== starting ${IMAGE}"
start
wait_ready || { echo "sandbox did not become ready"; exit 1; }

echo "== gateway routes"
check "root /healthz" curl -fsS "http://127.0.0.1:${HOST_PORT}/healthz"
check "prefixed /healthz" curl -fsS "${BASE}/healthz"
check "prefix without slash redirects" bash -c \
  "curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' '${BASE}' | grep -q '^302 .*${PREFIX}/$'"
check "dashboard page" bash -c "curl -fsS '${BASE}/' | grep -q '<title>Agent Sandbox</title>'"
check "dashboard script" curl -fsS "${BASE}/app.js"
check "status.json" bash -c "curl -fsS '${BASE}/status.json' | jq -e '.components.codex and .components.zcode'"
check "display viewer page" curl -fsS "${BASE}/display.html"
check "noVNC module served as JavaScript" bash -c \
  "curl -fsSI '${BASE}/vnc/core/rfb.js' | grep -qi 'content-type: .*javascript'"
check "code-server" curl -fsS "${BASE}/code/healthz"
check "ttyd terminal page" bash -c "curl -fsS '${BASE}/terminal/' | grep -qi 'ttyd'"
check "ttyd token endpoint" curl -fsS "${BASE}/terminal/token"
check "CDP version through gateway" curl -fsS "${BASE}/cdp/json/version"
check "CDP websocket URL rewritten to gateway" bash -c \
  "curl -fsS '${BASE}/cdp/json/version' | jq -r .webSocketDebuggerUrl | grep -q '^ws://127.0.0.1:${HOST_PORT}${PREFIX}/cdp/devtools/browser/'"
websocket_upgrades() {
  local path="$1"
  shift
  # curl times out on the open socket (exit 28); only the status line matters.
  { curl -sS -i -N --max-time 3 \
    -H "Connection: Upgrade" -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: c21va2UtdGVzdC1rZXktMTIzNA==" \
    "$@" "${BASE}/${path}" 2>/dev/null || true; } | head -n 1 | grep -q " 101 "
}
check "terminal websocket upgrades" websocket_upgrades "terminal/ws" -H "Sec-WebSocket-Protocol: tty"
check "VNC websocket upgrades" websocket_upgrades "vnc/websockify" -H "Sec-WebSocket-Protocol: binary"
check "ZCode VNC websocket upgrades" websocket_upgrades "zcode-vnc/websockify" -H "Sec-WebSocket-Protocol: binary"
check "Claude VNC websocket upgrades" websocket_upgrades "claude-vnc/websockify" -H "Sec-WebSocket-Protocol: binary"
check "CDP websocket upgrades" bash -c \
  "$(declare -f websocket_upgrades); BASE='${BASE}'; websocket_upgrades \"cdp/devtools/browser/\$(curl -fsS '${BASE}/cdp/json/version' | jq -r .webSocketDebuggerUrl | sed 's|.*/devtools/browser/||')\""
check "unknown path is 404" bash -c \
  "test \"\$(curl -s -o /dev/null -w '%{http_code}' '${BASE}/no-such-thing')\" = 404"

echo "== processes and users"
check "services run as jovyan" bash -c \
  "${CONTAINER_CLI} exec ${NAME} ps -o user= -C Xvnc,nginx,ttyd,websockify,openbox | grep -vq root"
for port in 5901 5902 5903 6080 6081 6082 7681 8200 9222; do
  check "port ${port} listens on loopback only" bash -c \
    "${CONTAINER_CLI} exec ${NAME} ss -ltnH | awk '\$4 ~ /:${port}\$/ {print \$4}' | grep -v -E '^(127\\.0\\.0\\.1|\\[::1\\]):' | grep -q . && exit 1 || exit 0"
done

check "ZCode desktop is running" bash -c "${CONTAINER_CLI} exec ${NAME} pgrep -u jovyan -f /opt/ZCode/zcode"
check "Claude Desktop is running" bash -c "${CONTAINER_CLI} exec ${NAME} pgrep -u jovyan -f /usr/lib/claude-desktop"
check "Claude keyring service is up" bash -c "${CONTAINER_CLI} exec ${NAME} pgrep -u jovyan -f gnome-keyring-daemon"

echo "== agent CLIs"
for command in codex claude opencode zcode agent-browser chromium; do
  check "${command} --version" in_container "${command} --version"
done
check "zcode runs its doctor" in_container "zcode doctor --json >/dev/null"
check "agent-browser skills available" in_container "agent-browser skills list | grep -q core"

echo "== agent-browser drives the VNC browser"
check "open the dashboard" in_container "agent-browser open 'http://127.0.0.1:8888${PREFIX}/'"
check "snapshot lists the app toggles" in_container "agent-browser snapshot -i | grep -q 'VS Code'"
check "page is visible in the shared Chromium" bash -c \
  "curl -fsS '${BASE}/cdp/json/list' | jq -e '.[] | select(.url | contains(\"${PREFIX}/\"))'"
check "screenshot" in_container "agent-browser screenshot /home/jovyan/srv/smoke-dashboard.png"
check "open-url opens a tab in the shared browser" bash -c \
  "${CONTAINER_CLI} exec -u 1000 ${NAME} bash -lc 'xdg-open https://example.org/?from=open-url' >/dev/null 2>&1; sleep 2; curl -fsS '${BASE}/cdp/json/list' | grep -q 'from=open-url'"

echo "== terminal sessions"
check "session script rejects unknown names" bash -c "! ${CONTAINER_CLI} exec -u 1000 ${NAME} /opt/agent-sandbox/bin/session nope"
check "codex session starts in tmux" in_container \
  "tmux new-session -d -s codex 'codex --version; exec bash -l' && tmux has-session -t codex"

echo "== persistence across restart"
in_container "echo marker > ~/.codex/smoke-marker && echo marker > ~/.claude/smoke-marker && git config --global user.name smoke"
check "codex state stored on the volume" in_container "test -f /home/jovyan/srv/.state/codex/smoke-marker"
check "claude config dir is linked" in_container "test \"\$(readlink ~/.claude)\" = /home/jovyan/srv/.state/claude"
check "agent guidance seeded" in_container "test -s ~/.claude/CLAUDE.md && test -s ~/.codex/AGENTS.md"
check "agent-browser skill seeded" in_container "test -f ~/.claude/skills/agent-browser/SKILL.md"
check "agent-browser socket kept off the volume" in_container "! find /home/jovyan/srv/.state -type s | grep -q ."
check "no root-owned leftovers in /tmp" bash -c "test -z \"\$(${CONTAINER_CLI} exec ${NAME} find /tmp -mindepth 1 -maxdepth 1 -user root ! -name .X11-unix)\""
check "browser profile on the volume" in_container "test -d /home/jovyan/srv/.state/browser/Default"
check "Claude Desktop data on the volume" in_container "test -d /home/jovyan/srv/.state/claude-desktop"
check "claude button points at the desktop app" bash -c "curl -fsS \"${BASE}/\" | grep -q \"display.html?socket=claude-vnc/websockify\" || ${CONTAINER_CLI} exec ${NAME} grep -q claude-vnc /opt/agent-sandbox/dashboard/app.js"
check "ZCode desktop data on the volume" in_container "test -d /home/jovyan/srv/.state/zcode-desktop/session"
check "zcode:// links go to the wrapper" in_container "grep -q '^Exec=/usr/local/bin/zcode-desktop ' /usr/share/applications/zcode.desktop"
"${CONTAINER_CLI}" rm -f "${NAME}" >/dev/null
start
wait_ready || { echo "sandbox did not become ready after restart"; exit 1; }
check "codex marker survived" in_container "test -f ~/.codex/smoke-marker"
check "claude marker survived" in_container "test -f ~/.claude/smoke-marker"
check "git identity survived" in_container "test \"\$(git config --global user.name)\" = smoke"
check "browser restarted after hostname change" curl -fsS "${BASE}/cdp/json/version"
check "ZCode desktop restarted after hostname change" bash -c "sleep 5; ${CONTAINER_CLI} exec ${NAME} pgrep -u jovyan -f /opt/ZCode/zcode"
check "Claude Desktop restarted after hostname change" bash -c "${CONTAINER_CLI} exec ${NAME} pgrep -u jovyan -f /usr/lib/claude-desktop"

if [ "${KEEP_SCREENSHOT:-}" != "" ]; then
  "${CONTAINER_CLI}" cp "${NAME}:/home/jovyan/srv/smoke-dashboard.png" "${KEEP_SCREENSHOT}" >/dev/null && echo "screenshot: ${KEEP_SCREENSHOT}"
fi

echo
if [ "${failures}" -eq 0 ]; then
  echo "all checks passed"
else
  echo "${failures} check(s) failed"
  exit 1
fi
