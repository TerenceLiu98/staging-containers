# openvscode-server/base/Dockerfile
ARG TARGETPLATFORM

FROM --platform=$TARGETPLATFORM buildpack-deps:22.04-curl

LABEL maintainer="terenceliu98<terenceliu1012@gmail.com>"

ARG VSCODE_VERSION
ARG RELEASE_ORG="gitpod-io"
ARG OPENVSCODE_SERVER_ROOT="/home/.openvscode-server"
ARG USERNAME=jovyan
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN apt-get update && apt-get install -y --no-install-recommends \
    vim \
    git \
    sudo \
    libatomic1 \
    openssh-client \
    build-essential \
    curl \
    wget \
    ca-certificates \
    unzip \
    zip \
    gnupg \
    lsb-release \
    software-properties-common \
    locales \
    libssl-dev \
    libffi-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    zlib1g-dev \
    libncursesw5-dev \
    libxml2-dev \
    libxmlsec1-dev \
    tk-dev \
    liblzma-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/

RUN if [ -z "${VSCODE_VERSION}" ]; then \
        echo "The VSCODE_VERSION build arg must be set." >&2 && \
        exit 1; \
    fi && \
    arch=$(uname -m) && \
    if [ "${arch}" = "x86_64" ]; then \
        arch="x64"; \
    elif [ "${arch}" = "aarch64" ]; then \
        arch="arm64"; \
    elif [ "${arch}" = "armv7l" ]; then \
        arch="armhf"; \
    fi && \
    wget https://github.com/${RELEASE_ORG}/openvscode-server/releases/download/${VSCODE_VERSION}/${VSCODE_VERSION}-linux-${arch}.tar.gz && \
    tar -xzf ${VSCODE_VERSION}-linux-${arch}.tar.gz && \
    mv -f ${VSCODE_VERSION}-linux-${arch} ${OPENVSCODE_SERVER_ROOT} && \
    cp ${OPENVSCODE_SERVER_ROOT}/bin/remote-cli/openvscode-server ${OPENVSCODE_SERVER_ROOT}/bin/remote-cli/code && \
    rm -f ${VSCODE_VERSION}-linux-${arch}.tar.gz


RUN groupadd --gid $USER_GID ${USERNAME} \
    && useradd --uid $USER_UID --gid ${USERNAME} -m -s /bin/bash ${USERNAME} \
    && echo ${USERNAME} ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/${USERNAME} \
    && chmod 0440 /etc/sudoers.d/${USERNAME}

RUN chmod g+rw /home && \
    mkdir -p /home/${USERNAME} && \
    chown -R ${USERNAME}:${USERNAME} /home/${USERNAME} && \
    chown -R ${USERNAME}:${USERNAME} ${OPENVSCODE_SERVER_ROOT} && \
    chmod 755 /home/${USERNAME} && \
    mkdir -p /home/${USERNAME}/srv && \
    chown -R ${USERNAME}:${USERNAME} /home/${USERNAME}/srv 

USER ${USERNAME}

WORKDIR /home/${USERNAME}/srv

ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    HOME=/home/${USERNAME}/srv \
    EDITOR=code \
    VISUAL=code \
    GIT_EDITOR="code --wait" \
    OPENVSCODE_SERVER_ROOT=${OPENVSCODE_SERVER_ROOT}


EXPOSE 3000

ENTRYPOINT [ "/bin/sh", "-c", "exec ${OPENVSCODE_SERVER_ROOT}/bin/openvscode-server --host 0.0.0.0 --without-connection-token \"${@}\"", "--" ]
