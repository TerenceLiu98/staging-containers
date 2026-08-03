ARG TARGETPLATFORM=linux/amd64
ARG ARCHLINUX_BASE_IMAGE=archlinux
ARG ARCHLINUX_BASE_IMAGE_VERSION=base-20260726.0.562117
FROM --platform=$TARGETPLATFORM ${ARCHLINUX_BASE_IMAGE}:${ARCHLINUX_BASE_IMAGE_VERSION}

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
ARG NODE_VERSION
ARG RUST_VERSION=stable
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
ENV RUSTUP_HOME=/usr/local/rustup
ENV CARGO_HOME=/usr/local/cargo
ENV PATH=/opt/code-server/bin:/usr/local/cargo/bin:/home/${NB_USER}/.local/bin:/usr/local/bin:${PATH}
ENV S6_CMD_WAIT_FOR_SERVICES_MAXTIME=300000
ENV S6_BEHAVIOUR_IF_STAGE2_FAILS=2

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN pacman -Syu --noconfirm \
 && pacman -S --noconfirm --needed \
    base-devel \
    ca-certificates \
    cmake \
    curl \
    diffutils \
    fd \
    file \
    git \
    git-lfs \
    github-cli \
    glibc-locales \
    htop \
    iproute2 \
    iputils \
    jq \
    less \
    lsof \
    nano \
    ninja \
    openssh \
    procps-ng \
    psmisc \
    patch \
    ripgrep \
    rsync \
    sudo \
    tmux \
    tree \
    unzip \
    vim \
    wget \
    xz \
    zip \
 && git lfs install --system \
 && gh --version \
 && rm -rf /var/cache/pacman/pkg/*

RUN sed -i 's/^#en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
 && locale-gen
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

RUN ARCH="${TARGETARCH:-$(uname -m)}" \
 && case "$ARCH" in \
      x86_64|amd64) S6_ARCH="x86_64" ;; \
      aarch64|arm64) S6_ARCH="aarch64" ;; \
      *) echo "Unsupported architecture: ${ARCH} (${TARGETPLATFORM})"; exit 1 ;; \
    esac \
 && curl -fsSL "https://github.com/just-containers/s6-overlay/releases/download/${S6_VERSION}/s6-overlay-noarch.tar.xz" -o /tmp/s6-overlay-noarch.tar.xz \
 && curl -fsSL "https://github.com/just-containers/s6-overlay/releases/download/${S6_VERSION}/s6-overlay-${S6_ARCH}.tar.xz" -o /tmp/s6-overlay-${S6_ARCH}.tar.xz \
 && tar -C / -Jxpf /tmp/s6-overlay-noarch.tar.xz \
 && tar -C / -Jxpf /tmp/s6-overlay-${S6_ARCH}.tar.xz \
 && rm -f /tmp/s6-overlay-noarch.tar.xz /tmp/s6-overlay-${S6_ARCH}.tar.xz

RUN ARCH="${TARGETARCH:-$(uname -m)}" \
 && case "$ARCH" in \
      x86_64|amd64) CODESERVER_ARCH="amd64" ;; \
      aarch64|arm64) CODESERVER_ARCH="arm64" ;; \
      *) echo "Unsupported code-server architecture: ${ARCH} (${TARGETPLATFORM})"; exit 1 ;; \
    esac \
 && curl -fsSL "https://github.com/coder/code-server/releases/download/v${CODESERVER_VERSION}/code-server-${CODESERVER_VERSION}-linux-${CODESERVER_ARCH}.tar.gz" -o /tmp/code-server.tar.gz \
 && mkdir -p /usr/lib/code-server \
 && tar -xzf /tmp/code-server.tar.gz --strip-components=1 -C /usr/lib/code-server \
 && ln -s /usr/lib/code-server/bin/code-server /usr/bin/code-server \
 && rm -f /tmp/code-server.tar.gz \
 && /usr/bin/code-server --version

RUN WORKBENCH="/usr/lib/code-server/lib/vscode/out/vs/code/browser/workbench/workbench.js" \
 && grep -q 'this.buffer.slice(' "${WORKBENCH}" || sed -i 's/this\.buffer\.subarray(/this.buffer.slice(/g' "${WORKBENCH}" \
 && echo "Patched VSBuffer.slice WebKit workaround in ${WORKBENCH}"

RUN ARCH="${TARGETARCH:-$(uname -m)}" \
 && case "$ARCH" in \
      x86_64|amd64) NODE_ARCH="x64" ;; \
      aarch64|arm64) NODE_ARCH="arm64" ;; \
      *) echo "Unsupported Node architecture: ${ARCH} (${TARGETPLATFORM})"; exit 1 ;; \
    esac \
 && curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" -o /tmp/node.tar.xz \
 && tar -xJf /tmp/node.tar.xz --strip-components=1 -C /usr/local \
 && rm -f /tmp/node.tar.xz \
 && node --version \
 && npm --version

RUN curl -fsSL https://sh.rustup.rs -sSf | sh -s -- -y --no-modify-path --default-toolchain "${RUST_VERSION}" \
 && rustup component add rustfmt clippy \
 && chmod -R a+w /usr/local/cargo /usr/local/rustup \
 && rustc --version \
 && cargo --version

RUN if ! getent group "${USERS_GID}" >/dev/null; then \
      groupadd --gid "${USERS_GID}" kubeflow; \
    fi \
 && if getent passwd "${NB_UID}" >/dev/null; then \
      EXISTING_USER="$(getent passwd "${NB_UID}" | cut -d: -f1)"; \
      if [ "${EXISTING_USER}" != "${NB_USER}" ]; then \
        usermod --login "${NB_USER}" "${EXISTING_USER}"; \
      fi; \
      usermod --home "${HOME}" --shell /bin/bash --gid "${NB_GID}" "${NB_USER}"; \
      usermod --append --groups "${USERS_GID},wheel" "${NB_USER}"; \
    else \
      useradd -M -N \
        --shell /bin/bash \
        --home "${HOME}" \
        --uid "${NB_UID}" \
        --gid "${NB_GID}" \
        --groups "${USERS_GID},wheel" "${NB_USER}"; \
    fi \
 && echo '%wheel ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers.d/nopasswd \
 && chmod 0440 /etc/sudoers.d/nopasswd \
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
