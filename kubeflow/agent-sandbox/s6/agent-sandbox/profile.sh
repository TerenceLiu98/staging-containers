# Agent Sandbox: keep shell history on the persistent volume.
if [ -n "${PERSISTENT_DIR:-}" ]; then
  export HISTFILE="${PERSISTENT_DIR}/.state/bash_history"
  export HISTSIZE=50000
  export HISTFILESIZE=50000
fi
