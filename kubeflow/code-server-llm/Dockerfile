ARG TARGETPLATFORM
ARG LLM_BASE_IMAGE
FROM --platform=$TARGETPLATFORM ${LLM_BASE_IMAGE}

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
ENV UV_LINK_MODE=copy
ENV PATH=/opt/llm/bin:/home/${NB_USER}/.local/bin:/usr/local/bin:${PATH}
ENV CUDA_HOME=/usr/local/cuda
ENV HF_HOME=/home/${NB_USER}/srv/.cache/huggingface
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
    bash \
    build-essential \
    ca-certificates \
    cmake \
    curl \
    git \
    git-lfs \
    gnupg \
    libaio-dev \
    libopenmpi-dev \
    locales \
    nano \
    ninja-build \
    openmpi-bin \
    openssh-client \
    pkg-config \
    python3 \
    python3-pip \
    python3-venv \
    rsync \
    software-properties-common \
    sudo \
    unzip \
    vim \
    wget \
    zip \
 && git lfs install \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen \
 && locale-gen
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

RUN ARCH="$(echo "$TARGETPLATFORM" | cut -d '/' -f2)" \
 && case "$ARCH" in \
      amd64) S6_ARCH="x86_64" ;; \
      arm64) S6_ARCH="aarch64" ;; \
      ppc64le) S6_ARCH="ppc64le" ;; \
      *) echo "Unsupported architecture: ${TARGETPLATFORM}"; exit 1 ;; \
    esac \
 && curl -fsSL "https://github.com/just-containers/s6-overlay/releases/download/${S6_VERSION}/s6-overlay-noarch.tar.xz" -o /tmp/s6-overlay-noarch.tar.xz \
 && curl -fsSL "https://github.com/just-containers/s6-overlay/releases/download/${S6_VERSION}/s6-overlay-${S6_ARCH}.tar.xz" -o /tmp/s6-overlay-${S6_ARCH}.tar.xz \
 && tar -C / -Jxpf /tmp/s6-overlay-noarch.tar.xz \
 && tar -C / -Jxpf /tmp/s6-overlay-${S6_ARCH}.tar.xz \
 && rm -f /tmp/s6-overlay-noarch.tar.xz /tmp/s6-overlay-${S6_ARCH}.tar.xz

RUN TARGETARCH="$(echo "$TARGETPLATFORM" | cut -d '/' -f2)" \
 && curl -fsSL "https://github.com/coder/code-server/releases/download/v${CODESERVER_VERSION}/code-server_${CODESERVER_VERSION}_${TARGETARCH}.deb" -o /tmp/code-server.deb \
 && dpkg -i /tmp/code-server.deb \
 && rm -f /tmp/code-server.deb

RUN useradd -M -N \
    --shell /bin/bash \
    --home "${HOME}" \
    --uid "${NB_UID}" \
    --gid "${NB_GID}" \
    --groups "${USERS_GID}" "${NB_USER}" \
 && usermod -a -G sudo "${NB_USER}" \
 && echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers \
 && mkdir -p "${HOME}" "${HOME_TMP}" "${PERSISTENT_DIR}" "${UV_PYTHON_INSTALL_DIR}" "${VIRTUAL_ENV}" \
 && chmod 2775 "${HOME}" "${HOME_TMP}" "${PERSISTENT_DIR}" "${UV_PYTHON_INSTALL_DIR}" "${VIRTUAL_ENV}" \
 && chown -R "${NB_USER}:${NB_GID}" "${HOME}" "${HOME_TMP}" "${PERSISTENT_DIR}" "${UV_PYTHON_INSTALL_DIR}" "${VIRTUAL_ENV}"

RUN python3 -m pip install --no-cache-dir --upgrade "uv==${UV_VERSION}" \
 && uv python install "${PYTHON_VERSION}" \
 && uv venv "${VIRTUAL_ENV}" --python "${PYTHON_VERSION}" \
 && uv pip install --python "${VIRTUAL_ENV}/bin/python" --upgrade pip setuptools wheel packaging \
 && uv pip install --python "${VIRTUAL_ENV}/bin/python" \
    --index-url "https://download.pytorch.org/whl/${LLM_PYTORCH_CUDA_INDEX}" \
    "torch==${PYTORCH_VERSION}" \
    "torchaudio==${TORCHAUDIO_VERSION}" \
    "torchvision==${TORCHVISION_VERSION}" \
 && uv pip install --python "${VIRTUAL_ENV}/bin/python" \
    --extra-index-url "https://download.pytorch.org/whl/${LLM_PYTORCH_CUDA_INDEX}" \
    "xformers==${XFORMERS_VERSION}" \
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
 && chown -R "${NB_USER}:${NB_GID}" "${UV_PYTHON_INSTALL_DIR}" "${VIRTUAL_ENV}"

COPY --chown=${NB_USER}:${NB_GID} --chmod=755 s6/ /etc

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
