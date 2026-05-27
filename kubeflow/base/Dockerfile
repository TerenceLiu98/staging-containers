ARG BASE_IMAGE
ARG BASE_IMAGE_VERSION
ARG TARGETPLATFORM

FROM --platform=$TARGETPLATFORM $BASE_IMAGE:$BASE_IMAGE_VERSION

ENV NB_USER jovyan
ENV NB_UID 1000
ENV NB_GID 0
ENV NB_PREFIX /
ENV HOME /home/$NB_USER
ENV SHELL /bin/bash

ENV USERS_GID 100
ENV HOME_TMP /tmp_home/$NB_USER
ENV PERSISTENT_DIR ${HOME}/srv

ENV S6_CMD_WAIT_FOR_SERVICES_MAXTIME 300000
ENV S6_BEHAVIOUR_IF_STAGE2_FAILS 2

# veersion arguments
ARG KUBECTL_VERSION=v1.31.6
ARG S6_VERSION=v3.2.0.2

# 24.11.3-0 / 24.3.1 / 3.11.11
ARG MINIFORGE_VERSION
ARG PIP_VERSION
ARG PYTHON_VERSION

SHELL ["/bin/bash", "-c"]

## STEP ONE: install s6 overlay, kubectl and other packages

# install - usefull linux packages
RUN export DEBIAN_FRONTEND=noninteractive \
 && apt-get -yq update \
 && apt-get -yq install --no-install-recommends \
    apt-transport-https \
    bash \
    bzip2 \
    ca-certificates \
    curl \
    git \
    gnupg \
    gnupg2 \
    locales \
    lsb-release \
    nano \
    software-properties-common \
    tzdata \
    unzip \
    vim \
    wget \
    xz-utils \
    zip \
    sudo \
    ssh \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

ARG TARGETPLATFORM
RUN ARCH=$(echo "$TARGETPLATFORM" | cut -d '/' -f2) \
   && case "$ARCH" in \
      amd64) S6_ARCH="x86_64" ;; \
      arm64) S6_ARCH="aarch64" ;; \
      ppc64le) S6_ARCH="ppc64le" ;; \
      *) echo "Unsupported architecture: ${TARGETPLATFORM}"; exit 1 ;; \
    esac \
 && curl -fsSL "https://github.com/just-containers/s6-overlay/releases/download/${S6_VERSION}/s6-overlay-noarch.tar.xz" -o /tmp/s6-overlay-noarch.tar.xz \
 && curl -fsSL "https://github.com/just-containers/s6-overlay/releases/download/${S6_VERSION}/s6-overlay-noarch.tar.xz.sha256" -o /tmp/s6-overlay-noarch.tar.xz.sha256 \
 && echo "$(cat /tmp/s6-overlay-noarch.tar.xz.sha256 | awk '{ print $1; }')  /tmp/s6-overlay-noarch.tar.xz" | sha256sum -c - \
 && curl -fsSL "https://github.com/just-containers/s6-overlay/releases/download/${S6_VERSION}/s6-overlay-${S6_ARCH}.tar.xz" -o /tmp/s6-overlay-${S6_ARCH}.tar.xz \
 && curl -fsSL "https://github.com/just-containers/s6-overlay/releases/download/${S6_VERSION}/s6-overlay-${S6_ARCH}.tar.xz.sha256" -o /tmp/s6-overlay-${S6_ARCH}.tar.xz.sha256 \
 && echo "$(cat /tmp/s6-overlay-${S6_ARCH}.tar.xz.sha256 | awk '{ print $1; }')  /tmp/s6-overlay-${S6_ARCH}.tar.xz" | sha256sum -c - \
 && tar -C / -Jxpf /tmp/s6-overlay-noarch.tar.xz \
 && tar -C / -Jxpf /tmp/s6-overlay-${S6_ARCH}.tar.xz \
 && rm /tmp/s6-overlay-noarch.tar.xz  \
       /tmp/s6-overlay-noarch.tar.xz.sha256 \
       /tmp/s6-overlay-${S6_ARCH}.tar.xz \
       /tmp/s6-overlay-${S6_ARCH}.tar.xz.sha256

RUN chmod 0775 /run

RUN curl -fsSL "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/${TARGETPLATFORM}/kubectl" -o /usr/local/bin/kubectl \
	&& curl -fsSL "https://dl.k8s.io/${KUBECTL_VERSION}/bin/${TARGETPLATFORM}/kubectl.sha256" -o /tmp/kubectl.sha256 \
 	&& echo "$(cat /tmp/kubectl.sha256 | awk '{ print $1; }')  /usr/local/bin/kubectl" | sha256sum -c - \
 	&& rm /tmp/kubectl.sha256 \
 	&& chmod +x /usr/local/bin/kubectl


## STEP TWO: create jovyan user with sudo permissions

# remove default user and add jovyan user with sudo permissions
RUN deluser --remove-home ubuntu || true \
	&& useradd -M -N \
    --shell /bin/bash \
    --home ${HOME} \
    --uid ${NB_UID} \
    --gid ${NB_GID} \
    --groups ${USERS_GID} ${NB_USER} \
   && usermod -a -G sudo ${NB_USER} \
   && echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers \
   && mkdir -pv ${HOME} \
   && mkdir -pv ${HOME_TMP} \
   && chmod 2775 ${HOME} \
   && chmod 2775 ${HOME_TMP} \
   && chown -R ${NB_USER}:${USERS_GID} ${HOME} \
   && chown -R ${NB_USER}:${USERS_GID} ${HOME_TMP} \
   && chown -R ${NB_USER}:${NB_GID} /usr/local/bin

RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen \
 && locale-gen
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8
ENV LC_ALL en_US.UTF-8

COPY --chown=${NB_USER}:${NB_GID} --chmod=755 s6/ /etc

## STEP THREE: install conda and set environment

RUN mkdir -p ${PERSISTENT_DIR}/.local \
    && mkdir -p ${HOME}/.conda \
    && mkdir -p ${HOME}/.conda/envs \
    && mkdir -p ${HOME}/.conda/pkgs \
    && touch ${HOME}/.condarc \
    && chown -R ${NB_USER}:${NB_GID} ${PERSISTENT_DIR}

ENV PYTHONUSERBASE=${PERSISTENT_DIR}/.local
ENV PATH=${PYTHONUSERBASE}/bin:${PATH}

RUN echo "export PYTHONUSERBASE=${PYTHONUSERBASE}" > /etc/profile.d/persistent_env.sh \
 && echo "export PATH=${PYTHONUSERBASE}/bin:\$PATH" >> /etc/profile.d/persistent_env.sh \
 && chmod +x /etc/profile.d/persistent_env.sh

ENV CONDA_DIR /opt/conda
ENV PATH "${CONDA_DIR}/bin:${PATH}"
RUN mkdir -pv ${CONDA_DIR} \
    && chmod 2775 ${CONDA_DIR} \
    && echo ". /opt/conda/etc/profile.d/conda.sh" >> /etc/skel/.bashrc \
    && echo ". /opt/conda/etc/profile.d/conda.sh" >> /etc/profile \
    && echo "conda activate base" >> /etc/skel/.bashrc \
    && echo "conda activate base" >> /etc/profile \
    && chown -R ${NB_USER}:${NB_GID} ${CONDA_DIR} \
    && chown -R ${NB_USER}:${NB_GID} ${HOME}

RUN { \
    echo ''; \
    echo 'echo "========================================================================"'; \
    echo 'echo "      Welcome to use the USBC Kubeflow"'; \
    echo 'echo "========================================================================"'; \
    echo 'echo ""'; \
    echo 'echo "Directory Information:"'; \
    echo 'echo "  - /home/jovyan/srv"'; \
    echo 'echo "    This is your main workspace. All data (code, datasets,"'; \
    echo 'echo "    and custom environments installed via pip/conda) will be preserved across container restarts."'; \
    echo 'echo ""'; \
    echo 'echo "  - /home/jovyan"'; \
    echo 'echo "    This is your system home directory, primarily used for storing runtime configuration files. Please make sure to keep all your"'; \
    echo 'echo "    work files and data in the /home/jovyan/srv directory."'; \
    echo 'echo ""'; \
    echo 'echo "⚠️  Important Notice:"'; \
    echo 'echo "    All paths inside the container other than /home/jovyan/srv (e.g. /tmp, /)"'; \
    echo 'echo "    are temporary! All data in these paths will be [permanently deleted] after the container is stopped."'; \

    echo 'echo ""'; \
    echo 'echo "⚠️  Any behavior that violates the usage policy, such as mining, is prohibited."'; \
    echo 'echo ""'; \
    echo 'cd /home/jovyan/srv > /dev/null'; \
    echo '# --- End of Welcome Message ---'; \
} >> /etc/skel/.bashrc

USER $NB_UID

ARG TARGETPLATFORM
RUN TARGETARCH=$(echo "$TARGETPLATFORM" | cut -d '/' -f2) \
    && case "${TARGETARCH}" in \
      amd64) MINIFORGE_ARCH="x86_64" ;; \
      arm64) MINIFORGE_ARCH="aarch64" ;; \
      ppc64le) MINIFORGE_ARCH="ppc64le" ;; \
      *) echo "Unsupported architecture: ${TARGETARCH}"; exit 1 ;; \
    esac \
    && curl -fsSL "https://github.com/conda-forge/miniforge/releases/download/${MINIFORGE_VERSION}/Miniforge3-${MINIFORGE_VERSION}-Linux-${MINIFORGE_ARCH}.sh" -o /tmp/Miniforge3.sh \
    && curl -fsSL "https://github.com/conda-forge/miniforge/releases/download/${MINIFORGE_VERSION}/Miniforge3-${MINIFORGE_VERSION}-Linux-${MINIFORGE_ARCH}.sh.sha256" -o /tmp/Miniforge3.sh.sha256 \
    && echo "$(cat /tmp/Miniforge3.sh.sha256 | awk '{ print $1; }')  /tmp/Miniforge3.sh" | sha256sum -c - \
    && rm /tmp/Miniforge3.sh.sha256 \
    && /bin/bash /tmp/Miniforge3.sh -b -f -p ${CONDA_DIR} \
    && rm /tmp/Miniforge3.sh \
    && conda config --system --set auto_update_conda false \
    && conda config --system --set show_channel_urls true \
    && conda config --add envs_dirs ${PERSISTENT_DIR}/.conda/envs \
    && conda config --add pkgs_dirs ${PERSISTENT_DIR}/.conda/pkgs \
    && conda config --add channels https://mirrors.sustech.edu.cn/anaconda/pkgs/free/ \
    && conda config --add channels https://mirrors.sustech.edu.cn/anaconda/pkgs/main/ \
    && conda config --set show_channel_urls yes \
    && echo "python ==${PYTHON_VERSION}" >> ${CONDA_DIR}/conda-meta/pinned \
    && conda install -y -q \
    python=${PYTHON_VERSION} \
    pip=${PIP_VERSION} \
    && conda update -y -q --all \
    && conda clean -a -f -y
   
WORKDIR ${PERSISTENT_DIR}

RUN chown -R ${NB_USER}:${NB_GID} ${HOME} \
    && chown -R ${NB_USER}:${NB_GID} ${HOME_TMP}
RUN cp -p -r -T "${HOME}" "${HOME_TMP}" \
    # give group same access as user (needed for OpenShift)
    && chmod -R g=u "${HOME_TMP}"

RUN cp /etc/skel/.bashrc ${HOME_TMP}/.bashrc \
 && cp /etc/skel/.profile ${HOME_TMP}/.profile 

ENTRYPOINT ["/init"]
