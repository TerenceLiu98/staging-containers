# openvscode-server/python/Dockerfile

ARG TARGETPLATFORM
ARG REGISTRY_PREFIX

FROM --platform=$TARGETPLATFORM $REGISTRY_PREFIX/openvscode-server:latest-base

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
		wget \
        python3 \
        python3-pip \
        python3-venv \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN wget -qO- https://pixi.sh/install.sh | sh \
    && echo 'export PATH="$HOME/.pixi/bin:$PATH"' >> /etc/profile.d/pixi.sh

USER jovyan