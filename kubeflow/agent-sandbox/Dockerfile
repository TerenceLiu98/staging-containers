ARG TARGETPLATFORM
ARG REGISTRY_PREFIX
ARG PROJECT_NAME
ARG BASE_IMAGE_TAG

FROM --platform=$TARGETPLATFORM ${REGISTRY_PREFIX}/${PROJECT_NAME}:${BASE_IMAGE_TAG}

ARG TARGETPLATFORM
ARG AGENT_SANDBOX_IMAGE_REVISION
ARG CODESERVER_VERSION
ARG AGENT_SANDBOX_NODE_VERSION
ARG AGENT_SANDBOX_NODE_SHA256_AMD64
ARG AGENT_SANDBOX_NODE_SHA256_ARM64
ARG PLAYWRIGHT_VERSION
ARG NOVNC_VERSION
ARG NOVNC_SHA256
ARG TTYD_VERSION
ARG TTYD_SHA256_AMD64
ARG TTYD_SHA256_ARM64
ARG CODEX_CLI_VERSION
ARG CODEX_CLI_SHA256_AMD64
ARG CODEX_CLI_SHA256_ARM64
ARG CLAUDE_CODE_VERSION
ARG CLAUDE_CODE_SHA256_AMD64
ARG CLAUDE_CODE_SHA256_ARM64
ARG AGENT_SANDBOX_OPENCODE_VERSION
ARG AGENT_SANDBOX_OPENCODE_SHA256_AMD64
ARG AGENT_SANDBOX_OPENCODE_SHA256_ARM64
ARG ZCODE_VERSION
ARG ZCODE_SHA512_AMD64
ARG ZCODE_SHA512_ARM64
ARG AGENT_BROWSER_VERSION
ARG AGENT_BROWSER_SHA512

LABEL org.opencontainers.image.version="${AGENT_SANDBOX_IMAGE_REVISION}" \
      org.opencontainers.image.description="Agent Sandbox for Kubeflow: VS Code, VNC browser, terminal and coding agents in one workspace" \
      io.agent-sandbox.code-server.version="${CODESERVER_VERSION}" \
      io.agent-sandbox.playwright.version="${PLAYWRIGHT_VERSION}" \
      io.agent-sandbox.codex.version="${CODEX_CLI_VERSION}" \
      io.agent-sandbox.claude-code.version="${CLAUDE_CODE_VERSION}" \
      io.agent-sandbox.opencode.version="${AGENT_SANDBOX_OPENCODE_VERSION}" \
      io.agent-sandbox.zcode.version="${ZCODE_VERSION}" \
      io.agent-sandbox.agent-browser.version="${AGENT_BROWSER_VERSION}"

USER root

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ENV AGENT_SANDBOX_DIR=/opt/agent-sandbox \
    AGENT_SANDBOX_NODE_DIR=/opt/node24 \
    PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright \
    DISPLAY=:1 \
    VNC_GEOMETRY=1600x1000 \
    BROWSER_CDP_PORT=9222 \
    BROWSER_EXTRA_ARGS="" \
    BROWSER_HOMEPAGE=about:blank \
    AGENT_BROWSER_EXECUTABLE_PATH=/usr/local/bin/chromium \
    AGENT_BROWSER_SOCKET_DIR=/tmp/agent-browser \
    CLAUDE_CONFIG_DIR=/home/jovyan/.claude \
    ZCODE_DISPLAY=:2 \
    ZCODE_DESKTOP=true \
    BROWSER=/opt/agent-sandbox/bin/open-url

RUN export DEBIAN_FRONTEND=noninteractive \
 && apt-get -yq update \
 && apt-get -yq install --no-install-recommends \
    dbus-x11 \
    fonts-dejavu-core \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    gettext-base \
    gh \
    iproute2 \
    jq \
    less \
    lsof \
    nginx \
    openbox \
    procps \
    psmisc \
    ripgrep \
    rsync \
    tigervnc-standalone-server \
    tmux \
    tree \
    websockify \
    x11-utils \
    x11-xserver-utils \
    xdg-utils \
 && rm -f /etc/nginx/sites-enabled/default \
 && mkdir -p /tmp/.X11-unix \
 && chmod 1777 /tmp/.X11-unix \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Node.js 24 for ZCode; installed separately so it never shadows other Node installs.
RUN case "${TARGETPLATFORM}" in \
      linux/amd64) NODE_ARCH="x64"; NODE_SHA256="${AGENT_SANDBOX_NODE_SHA256_AMD64}" ;; \
      linux/arm64) NODE_ARCH="arm64"; NODE_SHA256="${AGENT_SANDBOX_NODE_SHA256_ARM64}" ;; \
      *) echo "Unsupported Node.js target platform: ${TARGETPLATFORM}" >&2; exit 1 ;; \
    esac \
 && NODE_ASSET="node-v${AGENT_SANDBOX_NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" \
 && curl -fsSL "https://nodejs.org/dist/v${AGENT_SANDBOX_NODE_VERSION}/${NODE_ASSET}" -o "/tmp/${NODE_ASSET}" \
 && echo "${NODE_SHA256}  /tmp/${NODE_ASSET}" | sha256sum -c - \
 && mkdir -p "${AGENT_SANDBOX_NODE_DIR}" \
 && tar -xJf "/tmp/${NODE_ASSET}" --strip-components=1 -C "${AGENT_SANDBOX_NODE_DIR}" \
 && rm -f "/tmp/${NODE_ASSET}" \
 && "${AGENT_SANDBOX_NODE_DIR}/bin/node" --version

# Chromium from Playwright: Ubuntu 24.04 only ships a snap stub and Google Chrome is amd64-only.
RUN export DEBIAN_FRONTEND=noninteractive \
 && HOME=/tmp/playwright-home PATH="${AGENT_SANDBOX_NODE_DIR}/bin:${PATH}" \
      npx --yes "playwright@${PLAYWRIGHT_VERSION}" install --with-deps --no-shell chromium \
 && CHROME_BIN="$(find "${PLAYWRIGHT_BROWSERS_PATH}" -type f -name chrome -perm -u+x | head -n 1)" \
 && test -n "${CHROME_BIN}" \
 && ln -sf "${CHROME_BIN}" /usr/local/bin/chromium \
 && chmod -R a+rX "${PLAYWRIGHT_BROWSERS_PATH}" \
 && /usr/local/bin/chromium --version \
 && rm -rf /tmp/playwright-home \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

RUN case "${TARGETPLATFORM}" in \
      linux/amd64) CODESERVER_ARCH="amd64" ;; \
      linux/arm64) CODESERVER_ARCH="arm64" ;; \
      *) echo "Unsupported code-server target platform: ${TARGETPLATFORM}" >&2; exit 1 ;; \
    esac \
 && curl -fsSL "https://github.com/coder/code-server/releases/download/v${CODESERVER_VERSION}/code-server_${CODESERVER_VERSION}_${CODESERVER_ARCH}.deb" -o /tmp/code-server.deb \
 && dpkg -i /tmp/code-server.deb \
 && rm -f /tmp/code-server.deb

RUN python3 -c 'from pathlib import Path; p=Path("/usr/lib/code-server/lib/vscode/out/vs/code/browser/workbench/workbench.js"); s=p.read_text(); old="this.buffer.subarray("; count=s.count(old); assert count, f"{old} not found in {p}"; p.write_text(s.replace(old, "this.buffer.slice(")); print(f"Patched VSBuffer.slice WebKit workaround in {p}: {count} replacement(s)")'

RUN case "${TARGETPLATFORM}" in \
      linux/amd64) TTYD_ARCH="x86_64"; TTYD_SHA256="${TTYD_SHA256_AMD64}" ;; \
      linux/arm64) TTYD_ARCH="aarch64"; TTYD_SHA256="${TTYD_SHA256_ARM64}" ;; \
      *) echo "Unsupported ttyd target platform: ${TARGETPLATFORM}" >&2; exit 1 ;; \
    esac \
 && curl -fsSL "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.${TTYD_ARCH}" -o /tmp/ttyd \
 && echo "${TTYD_SHA256}  /tmp/ttyd" | sha256sum -c - \
 && install -m 0755 /tmp/ttyd /usr/local/bin/ttyd \
 && rm -f /tmp/ttyd \
 && /usr/local/bin/ttyd --version

RUN curl -fsSL "https://github.com/novnc/noVNC/archive/refs/tags/v${NOVNC_VERSION}.tar.gz" -o /tmp/novnc.tar.gz \
 && echo "${NOVNC_SHA256}  /tmp/novnc.tar.gz" | sha256sum -c - \
 && mkdir -p /opt/novnc \
 && tar -xzf /tmp/novnc.tar.gz --strip-components=1 -C /opt/novnc \
 && test -f /opt/novnc/core/rfb.js \
 && rm -rf /tmp/novnc.tar.gz /opt/novnc/docs /opt/novnc/tests /opt/novnc/snap

RUN case "${TARGETPLATFORM}" in \
      linux/amd64) \
        CODEX_TARGET="x86_64-unknown-linux-musl"; \
        CODEX_SHA256="${CODEX_CLI_SHA256_AMD64}"; \
        CLAUDE_PLATFORM="linux-x64"; \
        CLAUDE_SHA256="${CLAUDE_CODE_SHA256_AMD64}"; \
        OPENCODE_ASSET="opencode-linux-x64-baseline.tar.gz"; \
        OPENCODE_SHA256="${AGENT_SANDBOX_OPENCODE_SHA256_AMD64}" ;; \
      linux/arm64) \
        CODEX_TARGET="aarch64-unknown-linux-musl"; \
        CODEX_SHA256="${CODEX_CLI_SHA256_ARM64}"; \
        CLAUDE_PLATFORM="linux-arm64"; \
        CLAUDE_SHA256="${CLAUDE_CODE_SHA256_ARM64}"; \
        OPENCODE_ASSET="opencode-linux-arm64.tar.gz"; \
        OPENCODE_SHA256="${AGENT_SANDBOX_OPENCODE_SHA256_ARM64}" ;; \
      *) echo "Unsupported AI CLI target platform: ${TARGETPLATFORM}" >&2; exit 1 ;; \
    esac \
 && CODEX_ASSET="codex-${CODEX_TARGET}.tar.gz" \
 && CODEX_RELEASE="https://github.com/openai/codex/releases/download/rust-v${CODEX_CLI_VERSION}" \
 && curl -fsSL "${CODEX_RELEASE}/${CODEX_ASSET}" -o "/tmp/${CODEX_ASSET}" \
 && echo "${CODEX_SHA256}  /tmp/${CODEX_ASSET}" | sha256sum -c - \
 && tar -xzf "/tmp/${CODEX_ASSET}" -C /tmp "codex-${CODEX_TARGET}" \
 && install -m 0755 "/tmp/codex-${CODEX_TARGET}" /usr/local/bin/codex \
 && rm -f "/tmp/${CODEX_ASSET}" "/tmp/codex-${CODEX_TARGET}" \
 && CLAUDE_RELEASE="https://downloads.claude.ai/claude-code-releases/${CLAUDE_CODE_VERSION}/${CLAUDE_PLATFORM}/claude" \
 && curl -fsSL "${CLAUDE_RELEASE}" -o /tmp/claude \
 && echo "${CLAUDE_SHA256}  /tmp/claude" | sha256sum -c - \
 && install -m 0755 /tmp/claude /usr/local/bin/claude \
 && rm -f /tmp/claude \
 && OPENCODE_RELEASE="https://github.com/anomalyco/opencode/releases/download/v${AGENT_SANDBOX_OPENCODE_VERSION}" \
 && curl -fsSL "${OPENCODE_RELEASE}/${OPENCODE_ASSET}" -o "/tmp/${OPENCODE_ASSET}" \
 && echo "${OPENCODE_SHA256}  /tmp/${OPENCODE_ASSET}" | sha256sum -c - \
 && tar -xzf "/tmp/${OPENCODE_ASSET}" -C /usr/local/bin opencode \
 && chmod 0755 /usr/local/bin/opencode \
 && rm -f "/tmp/${OPENCODE_ASSET}" \
 && mkdir -p /opt/agent-cli-smoke-home/.codex \
 && HOME=/opt/agent-cli-smoke-home CODEX_HOME=/opt/agent-cli-smoke-home/.codex CLAUDE_CONFIG_DIR=/opt/agent-cli-smoke-home/.claude \
      bash -c '/usr/local/bin/codex --version && /usr/local/bin/claude --version && /usr/local/bin/opencode --version' \
 && rm -rf /opt/agent-cli-smoke-home /tmp/opencode /tmp/node-compile-cache \
 && rm -rf "${HOME}/.codex" "${HOME}/.claude" "${HOME}/.claude.json" "${HOME}/.local/share/opencode" "${HOME}/.cache/opencode" \
 && test ! -e "${HOME}/.codex" \
 && test ! -e "${HOME}/.claude"

# ZCode publishes no standalone Linux CLI. Install the desktop app (shown on its own VNC
# display) and expose the CLI bundle it carries (resources/glm/zcode.cjs) as `zcode` for
# headless use; that bundle runs on plain Node.js 24 but has no terminal UI.
RUN case "${TARGETPLATFORM}" in \
      linux/amd64) ZCODE_ARCH="x64"; ZCODE_SHA512="${ZCODE_SHA512_AMD64}" ;; \
      linux/arm64) ZCODE_ARCH="arm64"; ZCODE_SHA512="${ZCODE_SHA512_ARM64}" ;; \
      *) echo "Unsupported ZCode target platform: ${TARGETPLATFORM}" >&2; exit 1 ;; \
    esac \
 && export DEBIAN_FRONTEND=noninteractive \
 && ZCODE_ASSET="ZCode-${ZCODE_VERSION}-linux-${ZCODE_ARCH}.deb" \
 && curl -fsSL "https://cdn-zcode.z.ai/zcode/electron/releases/${ZCODE_VERSION}/linux-${ZCODE_ARCH}/${ZCODE_ASSET}" -o "/tmp/${ZCODE_ASSET}" \
 && echo "${ZCODE_SHA512}  /tmp/${ZCODE_ASSET}" | sha512sum -c - \
 && apt-get -yq update \
 && apt-get -yq install --no-install-recommends "/tmp/${ZCODE_ASSET}" \
 && rm -f "/tmp/${ZCODE_ASSET}" /usr/bin/zcode \
 && (update-alternatives --remove-all zcode || true) \
 && test -x /opt/ZCode/zcode \
 && test -f /opt/ZCode/resources/glm/zcode.cjs \
 && ln -s ../config/provider /opt/ZCode/resources/glm/provider \
 && test -f /opt/ZCode/resources/glm/provider/zcode-builtin.json \
 && sed -i 's|^Exec=/opt/ZCode/zcode |Exec=/usr/local/bin/zcode-desktop |' /usr/share/applications/zcode.desktop \
 && grep -q '^Exec=/usr/local/bin/zcode-desktop ' /usr/share/applications/zcode.desktop \
 && printf '%s\n' '#!/bin/sh' "exec ${AGENT_SANDBOX_NODE_DIR}/bin/node /opt/ZCode/resources/glm/zcode.cjs \"\$@\"" > /usr/local/bin/zcode \
 && chmod 0755 /usr/local/bin/zcode \
 && HOME=/tmp/zcode-smoke-home /usr/local/bin/zcode --version \
 && rm -rf /tmp/zcode-smoke-home /tmp/node-compile-cache \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# agent-browser ships native binaries in its npm tarball; no Node runtime is needed.
RUN case "${TARGETPLATFORM}" in \
      linux/amd64) AGENT_BROWSER_ARCH="x64" ;; \
      linux/arm64) AGENT_BROWSER_ARCH="arm64" ;; \
      *) echo "Unsupported agent-browser target platform: ${TARGETPLATFORM}" >&2; exit 1 ;; \
    esac \
 && curl -fsSL "https://registry.npmjs.org/agent-browser/-/agent-browser-${AGENT_BROWSER_VERSION}.tgz" -o /tmp/agent-browser.tgz \
 && echo "${AGENT_BROWSER_SHA512}  /tmp/agent-browser.tgz" | sha512sum -c - \
 && mkdir -p /opt/agent-browser \
 && tar -xzf /tmp/agent-browser.tgz --strip-components=1 -C /opt/agent-browser \
    package/package.json package/LICENSE package/skill-data package/skills "package/bin/agent-browser-linux-${AGENT_BROWSER_ARCH}" \
 && ln -sf "/opt/agent-browser/bin/agent-browser-linux-${AGENT_BROWSER_ARCH}" /usr/local/bin/agent-browser-real \
 && chmod -R a+rX /opt/agent-browser \
 && chmod 0755 "/opt/agent-browser/bin/agent-browser-linux-${AGENT_BROWSER_ARCH}" \
 && rm -f /tmp/agent-browser.tgz \
 && /usr/local/bin/agent-browser-real --version

COPY --chown=${NB_USER}:${NB_GID} --chmod=755 s6/ /etc
COPY --chown=${NB_USER}:${NB_GID} --chmod=755 opt/ ${AGENT_SANDBOX_DIR}/

RUN ln -sf "${AGENT_SANDBOX_DIR}/bin/agent-browser" /usr/local/bin/agent-browser \
 && ln -sf "${AGENT_SANDBOX_DIR}/bin/zcode-desktop" /usr/local/bin/zcode-desktop \
 && ln -sf "${AGENT_SANDBOX_DIR}/bin/session" /usr/local/bin/agent-sandbox-session \
 && mv /etc/agent-sandbox/tmux.conf /etc/tmux.conf \
 && mv /etc/agent-sandbox/profile.sh /etc/profile.d/agent-sandbox.sh \
 && chmod 0644 /etc/tmux.conf /etc/profile.d/agent-sandbox.sh \
 && jq -n \
      --arg revision "${AGENT_SANDBOX_IMAGE_REVISION}" \
      --arg codeServer "${CODESERVER_VERSION}" \
      --arg chromium "$(/usr/local/bin/chromium --version)" \
      --arg playwright "${PLAYWRIGHT_VERSION}" \
      --arg novnc "${NOVNC_VERSION}" \
      --arg ttyd "${TTYD_VERSION}" \
      --arg codex "${CODEX_CLI_VERSION}" \
      --arg claude "${CLAUDE_CODE_VERSION}" \
      --arg opencode "${AGENT_SANDBOX_OPENCODE_VERSION}" \
      --arg zcode "${ZCODE_VERSION} (desktop), CLI $(HOME=/tmp/zcode-version-home /usr/local/bin/zcode --version | awk '{print $NF}')" \
      --arg agentBrowser "${AGENT_BROWSER_VERSION}" \
      --arg platform "${TARGETPLATFORM}" \
      '{revision: $revision, platform: $platform, components: {"code-server": $codeServer, chromium: $chromium, playwright: $playwright, noVNC: $novnc, ttyd: $ttyd, codex: $codex, "claude-code": $claude, opencode: $opencode, zcode: $zcode, "agent-browser": $agentBrowser}}' \
      > "${AGENT_SANDBOX_DIR}/dashboard/status.json" \
 && rm -rf /tmp/zcode-version-home /tmp/node-compile-cache \
 && chmod 0644 "${AGENT_SANDBOX_DIR}/dashboard/status.json"

RUN mkdir -p "${HOME}/.config/code-server" "${HOME}/.local/share/code-server/User" "${HOME}/.cache/code-server" \
 && chown -R "${NB_UID}:${NB_GID}" "${HOME}"

USER ${NB_UID}
WORKDIR ${PERSISTENT_DIR}

RUN /usr/bin/code-server --install-extension ms-python.python \
 && /usr/bin/code-server --install-extension akamud.vscode-theme-onedark \
 && /usr/bin/code-server --install-extension emmanuelbeziat.vscode-great-icons \
 && /usr/bin/code-server --install-extension eamodio.gitlens

RUN printf '%s\n' \
    '{' \
    '  "chat.extensionUnification.enabled": false,' \
    '  "chat.disableAIFeatures": true,' \
    '  "terminal.integrated.tabs.allowAgentCliTitle": false,' \
    '  "workbench.startupEditor": "none",' \
    '  "workbench.colorTheme": "Atom One Dark",' \
    '  "workbench.iconTheme": "vscode-great-icons",' \
    '  "security.workspace.trust.enabled": false' \
    '}' \
    > "${HOME}/.local/share/code-server/User/settings.json"

RUN cp -p -r -T "${HOME}" "${HOME_TMP}" \
 && chmod -R g=u "${HOME_TMP}"

EXPOSE 8888

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8888/healthz || exit 1

ENTRYPOINT ["/init"]
