# TODO

## Kubeflow Codex Web

Status: idea / design spike

Build a single-user Codex image for Kubeflow with an experience similar to the
existing `kubeflow/opencode` image. The service should open in a browser behind
the Kubeflow Notebook proxy, use `/home/jovyan/srv` as its workspace, and keep
user state on the notebook PVC.

Codex does not currently provide a standalone self-hosted Web UI. Its App
Server is a headless backend for rich clients, exposing threads, turns,
streaming events, approvals, command execution, and file changes over JSON-RPC.
The Web interface and Kubeflow base-path handling therefore need to be supplied
by this project.

### Proposed architecture

```text
Browser under NB_PREFIX
        |
        v
Web UI + server-side proxy on :8888
        |
        | stdio or Unix socket
        v
Codex App Server
        |
        +-- /home/jovyan/srv workspace
        +-- /home/jovyan/srv/.state/codex persistent state
        +-- OpenAI authentication and API traffic
```

Do not expose the App Server's experimental WebSocket listener directly to the
browser. Prefer a server-side Codex SDK integration or a local App Server over
stdio/Unix socket. The Web layer should own HTTP routing, authentication at the
Notebook boundary, and `NB_PREFIX` support.

### Phase 1: browser-terminal proof of concept

- [ ] Add a `kubeflow/codex` image based on the existing Kubeflow base image.
- [ ] Pin and install a known Codex CLI version.
- [ ] Run the interactive Codex CLI through a base-path-aware browser terminal.
- [ ] Run as `${NB_UID}:${NB_GID}` with `/home/jovyan/srv` as the working
      directory.
- [ ] Persist `CODEX_HOME` at `/home/jovyan/srv/.state/codex` without copying
      credentials into the image.
- [ ] Validate `codex login --device-auth` in a remote/headless Notebook pod.
- [ ] Optionally support an API key supplied through a Kubernetes Secret.
- [ ] Verify terminal HTTP and WebSocket traffic through a non-root
      `NB_PREFIX`.
- [ ] Add readiness/liveness checks and graceful shutdown.

This phase validates image packaging, authentication, persistence, and
Kubeflow routing. It is not intended to be the final user experience.

### Phase 2: native Web client

- [ ] Choose the server integration:
  - [ ] TypeScript `@openai/codex-sdk`, or
  - [ ] direct App Server JSON-RPC with generated, version-pinned schemas.
- [ ] Start one local Codex backend per Notebook user/pod.
- [ ] Implement thread creation, listing, resume, archive, and deletion.
- [ ] Implement prompt submission, turn steering, interruption, and retry.
- [ ] Stream agent messages, reasoning summaries, command progress, tool calls,
      and file changes.
- [ ] Present command/file approval requests and return the user's decision.
- [ ] Show diffs and changed-file status before users accept changes.
- [ ] Preserve active and historical sessions across pod restarts.
- [ ] Make all assets, APIs, navigation, and application WebSockets work under
      `${NB_PREFIX}`.
- [ ] Handle App Server overload, disconnect, restart, and protocol-version
      errors without losing the visible thread state.
- [ ] Add an explicit sign-out flow that removes the user's cached Codex
      credentials.

### Authentication and persistence

- [ ] Keep every user's Codex state isolated to that user's Notebook PVC.
- [ ] Treat `~/.codex/auth.json` as a secret and restrict its file permissions.
- [ ] Never bake API keys, access tokens, or cached login state into an image.
- [ ] Never expose credentials in browser storage, application logs, build
      output, or diagnostics.
- [ ] Decide whether the supported production login is per-user ChatGPT device
      authentication, per-user API keys, or both.
- [ ] Confirm which Codex capabilities are unavailable under API-key auth and
      document the difference for users.

### Security

- [ ] Default Codex to workspace-write access scoped to
      `/home/jovyan/srv`.
- [ ] Preserve interactive approval for commands that need broader access.
- [ ] Do not mount host paths, container runtime sockets, or cluster-admin
      credentials into the Codex pod.
- [ ] Apply appropriate egress policy while retaining required OpenAI and
      dependency-registry access.
- [ ] Ensure one browser user cannot connect to another pod's Codex backend.
- [ ] Review terminal escape, symlink, uploaded-file, and malicious-repository
      risks before calling the image production-ready.

### Build and release integration

- [ ] Add `CODEX_VERSION` to `versions/kubeflow.env`.
- [ ] Add `build-codex` and `push-codex` Makefile targets.
- [ ] Add `codex` to the Kubeflow Images workflow dispatch choices.
- [ ] Build and publish versioned and `latest-codex` image tags.
- [ ] Start with `linux/amd64`; add other architectures only after verifying
      the Codex runtime and browser-terminal/Web dependencies.
- [ ] Document image usage, Notebook configuration, login, persistence, and
      recovery in `README.md`.

### Acceptance criteria

- [ ] The UI loads from a Kubeflow Notebook URL with a non-root `NB_PREFIX`.
- [ ] A user can authenticate without shell access to the pod.
- [ ] Authentication, configuration, and thread history survive a pod restart.
- [ ] Codex can inspect, edit, and run commands in `/home/jovyan/srv` while
      respecting sandbox and approval settings.
- [ ] Streaming output, approvals, interrupts, reconnects, and errors are
      visible and actionable in the UI.
- [ ] No OpenAI credential is present in the image, exposed to another user, or
      emitted to logs.

### Open questions

- [ ] Is the browser-terminal PoC retained as a fallback after the native UI is
      available?
- [ ] Which frontend stack best fits a small, maintainable standalone client?
- [ ] Should the Web backend use the SDK or track the App Server protocol
      directly?
- [ ] How should multiple browser tabs coordinate access to one Codex backend?
- [ ] Should thread state live only in Codex storage, or also be indexed by the
      Web application?
- [ ] What App Server/SDK maturity level is required before production rollout?

### References

- <https://learn.chatgpt.com/docs/app-server>
- <https://learn.chatgpt.com/docs/codex-sdk>
- <https://learn.chatgpt.com/docs/auth>
- <https://github.com/openai/codex>
