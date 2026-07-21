ARG TARGETPLATFORM
ARG REGISTRY_PREFIX
ARG PROJECT_NAME
ARG OPENCODE_IMAGE_TAG

FROM --platform=$TARGETPLATFORM ${REGISTRY_PREFIX}/${PROJECT_NAME}:${OPENCODE_IMAGE_TAG}

ARG TARGETPLATFORM
ARG KUBECODE_VERSION
ARG CODEX_CLI_VERSION
ARG CODEX_CLI_SHA256_AMD64
ARG CODEX_CLI_SHA256_ARM64
ARG CLAUDE_CODE_VERSION
ARG CLAUDE_CODE_SHA256_AMD64
ARG CLAUDE_CODE_SHA256_ARM64

LABEL org.opencontainers.image.source="https://github.com/Bayes-Cluster/kubecode" \
      org.opencontainers.image.version="${KUBECODE_VERSION}" \
      org.opencontainers.image.licenses="AGPL-3.0-or-later" \
      org.opencontainers.image.description="Kubecode AI coding workspace for Kubeflow"

USER root

RUN case "${TARGETPLATFORM}" in \
      linux/amd64) KUBECODE_ARCH="amd64" ;; \
      linux/arm64) KUBECODE_ARCH="arm64" ;; \
      *) echo "Unsupported Kubecode target platform: ${TARGETPLATFORM}" >&2; exit 1 ;; \
    esac \
 && KUBECODE_ASSET="kubecode-${KUBECODE_VERSION}-linux-${KUBECODE_ARCH}.tar.gz" \
 && KUBECODE_RELEASE="https://github.com/Bayes-Cluster/kubecode/releases/download/v${KUBECODE_VERSION}" \
 && curl -fsSL "${KUBECODE_RELEASE}/${KUBECODE_ASSET}" -o "/tmp/${KUBECODE_ASSET}" \
 && curl -fsSL "${KUBECODE_RELEASE}/kubecode-${KUBECODE_VERSION}-SHA256SUMS" -o /tmp/kubecode-SHA256SUMS \
 && cd /tmp \
 && awk -v asset="${KUBECODE_ASSET}" '$2 == asset { print }' kubecode-SHA256SUMS > "${KUBECODE_ASSET}.sha256" \
 && test -s "${KUBECODE_ASSET}.sha256" \
 && sha256sum -c "${KUBECODE_ASSET}.sha256" \
 && mkdir -p /opt/kubecode \
 && tar -xzf "${KUBECODE_ASSET}" --strip-components=1 -C /opt/kubecode \
 && ln -s /opt/kubecode/bin/kubecode /usr/local/bin/kubecode \
 && /usr/local/bin/kubecode --version \
 && test -x /usr/local/bin/opencode \
 && rm -f "/tmp/${KUBECODE_ASSET}" "/tmp/${KUBECODE_ASSET}.sha256" /tmp/kubecode-SHA256SUMS \
 && rm -rf /etc/services.d/opencode

RUN case "${TARGETPLATFORM}" in \
      linux/amd64) \
        CODEX_TARGET="x86_64-unknown-linux-musl"; \
        CODEX_SHA256="${CODEX_CLI_SHA256_AMD64}"; \
        CLAUDE_PLATFORM="linux-x64"; \
        CLAUDE_SHA256="${CLAUDE_CODE_SHA256_AMD64}" ;; \
      linux/arm64) \
        CODEX_TARGET="aarch64-unknown-linux-musl"; \
        CODEX_SHA256="${CODEX_CLI_SHA256_ARM64}"; \
        CLAUDE_PLATFORM="linux-arm64"; \
        CLAUDE_SHA256="${CLAUDE_CODE_SHA256_ARM64}" ;; \
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
 && mkdir -p /opt/kubecode-cli-smoke-home/.codex \
 && HOME=/opt/kubecode-cli-smoke-home \
      CODEX_HOME=/opt/kubecode-cli-smoke-home/.codex \
      /usr/local/bin/codex --version \
 && HOME=/opt/kubecode-cli-smoke-home \
      /usr/local/bin/claude --version \
 && rm -rf /opt/kubecode-cli-smoke-home \
 && rm -rf "${HOME}/.codex" "${HOME}/.claude" \
 && test ! -e "${HOME}/.codex" \
 && test ! -e "${HOME}/.claude"

ENV KUBECODE_OPENCODE_PATH=/usr/local/bin/opencode

COPY --chown=${NB_USER}:${NB_GID} --chmod=755 s6/ /etc

USER ${NB_UID}
WORKDIR ${PERSISTENT_DIR}

EXPOSE 8888

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8888/readyz || exit 1
