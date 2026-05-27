ARG TARGETPLATFORM
ARG REGISTRY_PREFIX

FROM --platform=$TARGETPLATFORM $REGISTRY_PREFIX/openvscode-server:latest-base

ARG MINIFORGE_VERSION

USER root

RUN if [ -z "${MINIFORGE_VERSION}" ]; then \
        echo "The MINIFORGE_VERSION build arg must be set." >&2 && \
        exit 1; \
    fi && \
    arch=$(uname -m) && \
    if [ "${arch}" = "x86_64" ]; then \
        arch="${arch}"; \
    elif [ "${arch}" = "aarch64" ]; then \
        arch="${arch}"; \
    elif [ "${arch}" = "arm64" ]; then \
        arch="${arch}"; \
    fi && \
	wget https://github.com/conda-forge/miniforge/releases/download/${MINIFORGE_VERSION}/Miniforge3-${MINIFORGE_VERSION}-Linux-${arch}.sh -O /tmp/miniforge.sh \
    && bash /tmp/miniforge.sh -b -p /opt/conda \
    && rm /tmp/miniforge.sh \
    && ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh \
    && echo ". /opt/conda/etc/profile.d/conda.sh" >> /etc/bash.bashrc \
    && echo "conda activate base" >> /etc/bash.bashrc \
    && chown -R root:root /opt/conda

USER jovyan