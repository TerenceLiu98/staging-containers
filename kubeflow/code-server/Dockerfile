ARG TARGETPLATFORM=linux/amd64
ARG BASE_IMAGE=ubuntu
ARG BASE_IMAGE_VERSION=24.04
FROM --platform=$TARGETPLATFORM ${BASE_IMAGE}:${BASE_IMAGE_VERSION}

ARG TARGETPLATFORM
ARG TARGETARCH
ARG NB_USER=jovyan
ARG NB_UID=1000
ARG NB_GID=0
ARG USERS_GID=100
ARG CODESERVER_VERSION
ARG S6_VERSION=v3.2.0.2
ARG UV_VERSION
ARG PYTHON_VERSION
ARG CUDA_VERSION
ARG PYTORCH_VERSION
ARG TORCHAUDIO_VERSION
ARG TORCHVISION_VERSION
ARG PYTORCH_CUDA_INDEX=cu124
ARG INSTALL_OPENAI_CHATGPT_EXTENSION=false
ARG INSTALL_CLAUDE_CODE_EXTENSION=false

ENV NB_USER=${NB_USER}
ENV NB_UID=${NB_UID}
ENV NB_GID=${NB_GID}
ENV USERS_GID=${USERS_GID}
ENV HOME=/home/${NB_USER}
ENV HOME_TMP=/tmp_home/${NB_USER}
ENV PERSISTENT_DIR=/home/${NB_USER}/srv
ENV SHELL=/bin/bash
ENV VIRTUAL_ENV=/opt/code-server
ENV UV_PYTHON_INSTALL_DIR=/opt/uv/python
ENV UV_CACHE_DIR=/opt/uv/cache
ENV UV_LINK_MODE=hardlink
ENV PATH=/opt/code-server/bin:/home/${NB_USER}/.local/bin:/usr/local/bin:${PATH}
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility
ENV NVIDIA_REQUIRE_CUDA="cuda>=${CUDA_VERSION}"
ENV S6_CMD_WAIT_FOR_SERVICES_MAXTIME=300000
ENV S6_BEHAVIOUR_IF_STAGE2_FAILS=2

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN export DEBIAN_FRONTEND=noninteractive \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
    apt-transport-https \
    bash \
    build-essential \
    ca-certificates \
    cmake \
    curl \
    fd-find \
    git \
    git-lfs \
    gnupg \
    htop \
    iproute2 \
    iputils-ping \
    jq \
    less \
    locales \
    lsof \
    nano \
    ninja-build \
    openssh-client \
    pkg-config \
    procps \
    python3 \
    python3-venv \
    ripgrep \
    rsync \
    software-properties-common \
    sudo \
    tmux \
    tree \
    unzip \
    vim \
    wget \
    xz-utils \
    zip \
 && ln -sf /usr/bin/fdfind /usr/local/bin/fd \
 && git lfs install --system \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen \
 && locale-gen
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

RUN ARCH="${TARGETARCH:-$(dpkg --print-architecture)}" \
 && case "$ARCH" in \
      amd64|x86_64) S6_ARCH="x86_64" ;; \
      arm64|aarch64) S6_ARCH="aarch64" ;; \
      ppc64le) S6_ARCH="ppc64le" ;; \
      *) echo "Unsupported architecture: ${ARCH} (${TARGETPLATFORM})"; exit 1 ;; \
    esac \
 && curl -fsSL "https://github.com/just-containers/s6-overlay/releases/download/${S6_VERSION}/s6-overlay-noarch.tar.xz" -o /tmp/s6-overlay-noarch.tar.xz \
 && curl -fsSL "https://github.com/just-containers/s6-overlay/releases/download/${S6_VERSION}/s6-overlay-${S6_ARCH}.tar.xz" -o /tmp/s6-overlay-${S6_ARCH}.tar.xz \
 && tar -C / -Jxpf /tmp/s6-overlay-noarch.tar.xz \
 && tar -C / -Jxpf /tmp/s6-overlay-${S6_ARCH}.tar.xz \
 && rm -f /tmp/s6-overlay-noarch.tar.xz /tmp/s6-overlay-${S6_ARCH}.tar.xz

RUN ARCH="${TARGETARCH:-$(dpkg --print-architecture)}" \
 && case "$ARCH" in \
      amd64|arm64) CODESERVER_ARCH="$ARCH" ;; \
      *) echo "Unsupported code-server deb architecture: ${ARCH} (${TARGETPLATFORM})"; exit 1 ;; \
    esac \
 && curl -fsSL "https://github.com/coder/code-server/releases/download/v${CODESERVER_VERSION}/code-server_${CODESERVER_VERSION}_${CODESERVER_ARCH}.deb" -o /tmp/code-server.deb \
 && dpkg -i /tmp/code-server.deb \
 && rm -f /tmp/code-server.deb

RUN python3 -c 'from pathlib import Path; p=Path("/usr/lib/code-server/lib/vscode/out/vs/code/browser/workbench/workbench.js"); s=p.read_text(); old="this.buffer.subarray("; count=s.count(old); assert count, f"{old} not found in {p}"; p.write_text(s.replace(old, "this.buffer.slice(")); print(f"Patched VSBuffer.slice WebKit workaround in {p}: {count} replacement(s)")'

RUN if getent passwd "${NB_UID}" >/dev/null; then \
      EXISTING_USER="$(getent passwd "${NB_UID}" | cut -d: -f1)"; \
      if [ "${EXISTING_USER}" != "${NB_USER}" ]; then \
        usermod --login "${NB_USER}" "${EXISTING_USER}"; \
      fi; \
      usermod --home "${HOME}" --shell /bin/bash --gid "${NB_GID}" "${NB_USER}"; \
      usermod --append --groups "${USERS_GID},sudo" "${NB_USER}"; \
    else \
      useradd -M -N \
        --shell /bin/bash \
        --home "${HOME}" \
        --uid "${NB_UID}" \
        --gid "${NB_GID}" \
        --groups "${USERS_GID},sudo" "${NB_USER}"; \
    fi \
 && echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers \
 && mkdir -p \
    "${HOME}" \
    "${HOME}/.cache" \
    "${HOME}/.config" \
    "${HOME}/.local" \
    "${HOME_TMP}" \
    "${PERSISTENT_DIR}" \
    "${UV_PYTHON_INSTALL_DIR}" \
    "${UV_CACHE_DIR}" \
    "${VIRTUAL_ENV}" \
 && chmod 2775 "${HOME}" "${HOME_TMP}" "${PERSISTENT_DIR}" "${UV_PYTHON_INSTALL_DIR}" "${UV_CACHE_DIR}" "${VIRTUAL_ENV}" \
 && chown -R "${NB_UID}:${NB_GID}" "${HOME}" "${HOME_TMP}" "${PERSISTENT_DIR}" "${UV_PYTHON_INSTALL_DIR}" "${UV_CACHE_DIR}" "${VIRTUAL_ENV}"

RUN curl -LsSf "https://astral.sh/uv/${UV_VERSION}/install.sh" -o /tmp/uv-install.sh \
 && env UV_INSTALL_DIR=/usr/local/bin sh /tmp/uv-install.sh \
 && rm -f /tmp/uv-install.sh \
 && uv python install "${PYTHON_VERSION}" \
 && uv venv "${VIRTUAL_ENV}" --python "${PYTHON_VERSION}" \
 && uv pip install --python "${VIRTUAL_ENV}/bin/python" --upgrade pip setuptools wheel packaging \
 && uv pip install --python "${VIRTUAL_ENV}/bin/python" \
    --index-url "https://download.pytorch.org/whl/${PYTORCH_CUDA_INDEX}" \
    "torch==${PYTORCH_VERSION}" \
    "torchaudio==${TORCHAUDIO_VERSION}" \
    "torchvision==${TORCHVISION_VERSION}" \
 && uv pip install --python "${VIRTUAL_ENV}/bin/python" \
    "jupyter" \
    "ipykernel" \
 && uv cache clean \
 && mkdir -p "${UV_CACHE_DIR}" \
 && chown -R "${NB_UID}:${NB_GID}" "${UV_PYTHON_INSTALL_DIR}" "${UV_CACHE_DIR}" "${VIRTUAL_ENV}"

COPY --chown=${NB_USER}:${NB_GID} --chmod=755 s6/ /etc

RUN mkdir -p "${HOME}/.config/code-server" "${HOME}/.local/share/code-server" "${HOME}/.cache/code-server" \
 && chown -R "${NB_UID}:${NB_GID}" "${HOME}"

USER ${NB_UID}
WORKDIR ${PERSISTENT_DIR}

RUN /usr/bin/code-server --install-extension ms-python.python \
 && /usr/bin/code-server --install-extension ms-toolsai.jupyter \
 && /usr/bin/code-server --install-extension akamud.vscode-theme-onedark \
 && /usr/bin/code-server --install-extension emmanuelbeziat.vscode-great-icons \
 && /usr/bin/code-server --install-extension alexcvzz.vscode-sqlite \
 && /usr/bin/code-server --install-extension eamodio.gitlens \
 && if [ "${INSTALL_OPENAI_CHATGPT_EXTENSION}" = "true" ]; then \
      /usr/bin/code-server --install-extension openai.chatgpt; \
    fi \
 && if [ "${INSTALL_CLAUDE_CODE_EXTENSION}" = "true" ]; then \
      /usr/bin/code-server --install-extension Anthropic.claude-code; \
    fi

RUN mkdir -p "${HOME}/.local/share/code-server/User" \
 && printf '%s\n' \
    '{' \
    '  "chat.extensionUnification.enabled": false,' \
    '  "chat.disableAIFeatures": true,' \
    '  "terminal.integrated.tabs.allowAgentCliTitle": false' \
    '}' \
    > "${HOME}/.local/share/code-server/User/settings.json"

RUN cp -p -r -T "${HOME}" "${HOME_TMP}" \
 && chmod -R g=u "${HOME_TMP}"

EXPOSE 8888
ENTRYPOINT ["/init"]
