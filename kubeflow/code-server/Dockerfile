ARG PROJECT_NAME
ARG BASE_IMAGE_TAG
ARG REGISTRY_PREFIX
ARG TARGETPLATFORM

FROM --platform=$TARGETPLATFORM $REGISTRY_PREFIX/$PROJECT_NAME:$BASE_IMAGE_TAG

ARG CODESERVER_VERSION
ARG CUDA_VERSION
ARG PYTORCH_VERSION
ARG TORCHAUDIO_VERSION
ARG TORCHVISION_VERSION
ARG PYTORCH_CUDA_INDEX=cu124

ENV NVIDIA_VISIBLE_DEVICES all
ENV NVIDIA_DRIVER_CAPABILITIES compute,utility
ENV NVIDIA_REQUIRE_CUDA "cuda>=${CUDA_VERSION}"

USER root

ARG TARGETPLATFORM
RUN TARGETARCH=$(echo "$TARGETPLATFORM" | cut -d '/' -f2) \
    && case "${TARGETARCH}" in \
      amd64) MINIFORGE_ARCH="x86_64" ;; \
      arm64) MINIFORGE_ARCH="aarch64" ;; \
      ppc64le) MINIFORGE_ARCH="ppc64le" ;; \
      *) echo "Unsupported architecture: ${TARGETARCH}"; exit 1 ;; \
    esac \
    && curl -fsSL "https://github.com/coder/code-server/releases/download/v${CODESERVER_VERSION}/code-server_${CODESERVER_VERSION}_${TARGETARCH}.deb" -o /tmp/code-server.deb \
    && dpkg -i /tmp/code-server.deb \
    && rm -f /tmp/code-server.deb

# s6 - copy scripts
COPY --chown=${NB_USER}:${NB_GID} --chmod=755 s6/ /etc

# setup environment for conda
ENV CONDA_DIR /opt/conda
ENV PATH "${CONDA_DIR}/bin:${PATH}"
RUN mkdir -pv ${CONDA_DIR} \
 && chmod 2775 ${CONDA_DIR} \
 && echo ". /opt/conda/etc/profile.d/conda.sh" >> ${HOME}/.bashrc \
 && echo ". /opt/conda/etc/profile.d/conda.sh" >> /etc/profile \
 && echo "conda activate base" >> ${HOME}/.bashrc \
 && echo "conda activate base" >> /etc/profile \
 && chown -R ${NB_USER}:${NB_GID} ${CONDA_DIR} \
 && chown -R ${NB_USER}:${NB_GID} ${HOME}

USER $NB_UID

RUN python3 -m pip install --index-url https://download.pytorch.org/whl/${PYTORCH_CUDA_INDEX} \
    torch==${PYTORCH_VERSION} \
    torchaudio==${TORCHAUDIO_VERSION} \
    torchvision==${TORCHVISION_VERSION}

RUN /usr/bin/code-server --install-extension ms-python.python \
    && /usr/bin/code-server --install-extension ms-toolsai.jupyter \
    && /usr/bin/code-server --install-extension akamud.vscode-theme-onedark \
    && /usr/bin/code-server --install-extension emmanuelbeziat.vscode-great-icons \
    && /usr/bin/code-server --install-extension alexcvzz.vscode-sqlite \
    && /usr/bin/code-server --install-extension eamodio.gitlens \
    && /usr/bin/code-server --install-extension openai.chatgpt \
    && /usr/bin/code-server --install-extension Anthropic.claude-code

USER $NB_UID

RUN cp -r ${HOME}/.local/ ${HOME_TMP}/ -r \
    && cp -r ${HOME}/.config/* ${HOME_TMP}/.config/ -r 

EXPOSE 8888
