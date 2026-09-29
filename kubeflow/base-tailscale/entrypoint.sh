#!/usr/bin/env bash
set -Eeuo pipefail

TS_STATE_DIR="${TS_STATE_DIR:-/var/lib/tailscale}"
TS_SOCKET="${TS_SOCKET:-/var/run/tailscale/tailscaled.sock}"
TS_USERSPACE="${TS_USERSPACE:-true}"
TS_AUTH_ONCE="${TS_AUTH_ONCE:-true}"
TS_EXTRA_ARGS="${TS_EXTRA_ARGS:-}"
TS_HOSTNAME="${TS_HOSTNAME:-}"

mkdir -p "${TS_STATE_DIR}" "$(dirname "${TS_SOCKET}")" /run/sshd
chmod 700 "${TS_STATE_DIR}"

tailscaled_args=(
  "--state=${TS_STATE_DIR}/tailscaled.state"
  "--socket=${TS_SOCKET}"
)

if [[ "${TS_USERSPACE,,}" == "true" || "${TS_USERSPACE}" == "1" ]]; then
  tailscaled_args+=(
    "--tun=userspace-networking"
    "--socks5-server=127.0.0.1:1055"
    "--outbound-http-proxy-listen=127.0.0.1:1055"
  )
fi

tailscaled "${tailscaled_args[@]}" &
TAILSCALED_PID=$!

cleanup() {
  kill "${MAIN_PID:-}" "${SSHD_PID:-}" "${TAILSCALED_PID}" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT TERM INT

for _ in {1..60}; do
  if [[ -S "${TS_SOCKET}" ]]; then
    break
  fi
  if ! kill -0 "${TAILSCALED_PID}" 2>/dev/null; then
    echo "tailscaled exited before its control socket became ready" >&2
    exit 1
  fi
  sleep 0.5
done

if [[ ! -S "${TS_SOCKET}" ]]; then
  echo "tailscaled control socket did not become ready" >&2
  exit 1
fi

if [[ -n "${TS_AUTHKEY:-}" ]]; then
  should_authenticate=true
  if [[ "${TS_AUTH_ONCE,,}" == "true" || "${TS_AUTH_ONCE}" == "1" ]] \
    && tailscale --socket="${TS_SOCKET}" status >/dev/null 2>&1; then
    should_authenticate=false
  fi

  if [[ "${should_authenticate}" == "true" ]]; then
    tailscale_up_args=(
      "--socket=${TS_SOCKET}"
      up
      "--auth-key=${TS_AUTHKEY}"
    )
    if [[ -n "${TS_HOSTNAME}" ]]; then
      tailscale_up_args+=("--hostname=${TS_HOSTNAME}")
    fi
    if [[ -n "${TS_EXTRA_ARGS}" ]]; then
      read -r -a extra_args <<< "${TS_EXTRA_ARGS}"
      tailscale_up_args+=("${extra_args[@]}")
    fi
    tailscale "${tailscale_up_args[@]}"
  fi
else
  echo "Tailscale is running but not authenticated. Set TS_AUTHKEY or run: tailscale up" >&2
fi

ssh-keygen -A
/usr/sbin/sshd -D -e &
SSHD_PID=$!

if [[ "$#" -eq 0 ]]; then
  set -- sleep infinity
fi

"$@" &
MAIN_PID=$!
wait "${MAIN_PID}"
