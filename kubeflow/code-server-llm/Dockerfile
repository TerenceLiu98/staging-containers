ARG TARGETPLATFORM=linux/amd64
ARG LLM_BASE_IMAGE=nvidia/cuda:13.0.3-devel-ubuntu24.04
FROM --platform=$TARGETPLATFORM ${LLM_BASE_IMAGE}

ARG TARGETPLATFORM
ARG TARGETARCH
ARG LLM_BASE_IMAGE
ARG NB_USER=jovyan
ARG NB_UID=1000
ARG NB_GID=0
ARG USERS_GID=100
ARG CODESERVER_VERSION
ARG S6_VERSION=v3.2.0.2
ARG UV_VERSION
ARG PYTHON_VERSION
ARG PYTORCH_VERSION
ARG TORCHAUDIO_VERSION
ARG TORCHVISION_VERSION
ARG LLM_PYTORCH_CUDA_INDEX
ARG VLLM_VERSION
ARG XFORMERS_VERSION
ARG DEEPSPEED_VERSION
ARG TRANSFORMERS_VERSION
ARG ACCELERATE_VERSION
ARG DATASETS_VERSION
ARG PEFT_VERSION
ARG TRL_VERSION
ARG BITSANDBYTES_VERSION
ARG SENTENCEPIECE_VERSION

ENV NB_USER=${NB_USER}
ENV NB_UID=${NB_UID}
ENV NB_GID=${NB_GID}
ENV USERS_GID=${USERS_GID}
ENV HOME=/home/${NB_USER}
ENV HOME_TMP=/tmp_home/${NB_USER}
ENV PERSISTENT_DIR=/home/${NB_USER}/srv
ENV SHELL=/bin/bash
ENV VIRTUAL_ENV=/opt/llm
ENV UV_PYTHON_INSTALL_DIR=/opt/uv/python
ENV UV_CACHE_DIR=/opt/uv/cache
ENV UV_LINK_MODE=hardlink
ENV PATH=/opt/llm/bin:/home/${NB_USER}/.local/bin:/usr/local/bin:${PATH}
ENV CUDA_HOME=/usr/local/cuda
ENV TORCH_HOME=/home/${NB_USER}/srv/.cache/torch
ENV VLLM_CACHE_ROOT=/home/${NB_USER}/srv/.cache/vllm
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility
ENV S6_CMD_WAIT_FOR_SERVICES_MAXTIME=300000
ENV S6_BEHAVIOUR_IF_STAGE2_FAILS=2

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN export DEBIAN_FRONTEND=noninteractive \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    software-properties-common \
 && add-apt-repository -y universe \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
    bash \
    build-essential \
    cmake \
    dnsutils \
    fd-find \
    git \
    git-lfs \
    htop \
    iproute2 \
    iputils-ping \
    jq \
    less \
    libaio-dev \
    libopenmpi-dev \
    locales \
    lsof \
    nano \
    net-tools \
    ninja-build \
    numactl \
    openmpi-bin \
    openssh-client \
    pciutils \
    pkg-config \
    procps \
    psmisc \
    python3 \
    python3-pip \
    python3-venv \
    ripgrep \
    rsync \
    sudo \
    tmux \
    tree \
    unzip \
    vim \
    wget \
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
    "${TORCH_HOME}" \
    "${VLLM_CACHE_ROOT}" \
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
    --index-url "https://download.pytorch.org/whl/${LLM_PYTORCH_CUDA_INDEX}" \
    "torch==${PYTORCH_VERSION}" \
    "torchaudio==${TORCHAUDIO_VERSION}" \
    "torchvision==${TORCHVISION_VERSION}" \
 && uv cache clean \
 && uv pip install --python "${VIRTUAL_ENV}/bin/python" \
    --extra-index-url "https://download.pytorch.org/whl/${LLM_PYTORCH_CUDA_INDEX}" \
    "xformers==${XFORMERS_VERSION}" \
 && uv cache clean \
 && uv pip install --python "${VIRTUAL_ENV}/bin/python" \
    "vllm==${VLLM_VERSION}" \
    "deepspeed==${DEEPSPEED_VERSION}" \
    "transformers==${TRANSFORMERS_VERSION}" \
    "accelerate==${ACCELERATE_VERSION}" \
    "datasets==${DATASETS_VERSION}" \
    "peft==${PEFT_VERSION}" \
    "trl==${TRL_VERSION}" \
    "bitsandbytes==${BITSANDBYTES_VERSION}" \
    "sentencepiece==${SENTENCEPIECE_VERSION}" \
    "protobuf" \
    "einops" \
    "safetensors" \
    "huggingface_hub[cli]" \
    "openai" \
    "anthropic" \
    "fastapi" \
    "uvicorn[standard]" \
    "jupyter" \
    "ipykernel" \
 && uv cache clean \
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
 && /usr/bin/code-server --install-extension openai.chatgpt \
 && /usr/bin/code-server --install-extension Anthropic.claude-code

RUN cp -p -r -T "${HOME}" "${HOME_TMP}" \
 && chmod -R g=u "${HOME_TMP}"

EXPOSE 8888
ENTRYPOINT ["/init"]
