ARG TARGETPLATFORM
ARG REGISTRY_PREFIX
ARG PROJECT_NAME
ARG BASE_IMAGE_TAG

FROM --platform=$TARGETPLATFORM ${REGISTRY_PREFIX}/${PROJECT_NAME}:${BASE_IMAGE_TAG}

ARG TARGETPLATFORM
ARG OPENCODE_VERSION
ARG OPENCODE_REPOSITORY=TerenceLiu98/opencode

LABEL org.opencontainers.image.source="https://github.com/${OPENCODE_REPOSITORY}" \
      org.opencontainers.image.version="${OPENCODE_VERSION}" \
      org.opencontainers.image.description="OpenCode Web for Kubeflow with URL base-path support"

USER root

RUN export DEBIAN_FRONTEND=noninteractive \
 && apt-get -yq update \
 && apt-get -yq install --no-install-recommends gh \
 && gh --version \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

RUN case "${TARGETPLATFORM}" in \
      linux/amd64) OPENCODE_ASSET="opencode-linux-x64-baseline.tar.gz" ;; \
      *) echo "Unsupported OpenCode target platform: ${TARGETPLATFORM}" >&2; exit 1 ;; \
    esac \
 && OPENCODE_RELEASE="https://github.com/${OPENCODE_REPOSITORY}/releases/download/v${OPENCODE_VERSION}" \
 && curl -fsSL "${OPENCODE_RELEASE}/${OPENCODE_ASSET}" -o "/tmp/${OPENCODE_ASSET}" \
 && curl -fsSL "${OPENCODE_RELEASE}/${OPENCODE_ASSET}.sha256" -o "/tmp/${OPENCODE_ASSET}.sha256" \
 && cd /tmp \
 && sha256sum -c "${OPENCODE_ASSET}.sha256" \
 && tar -xzf "${OPENCODE_ASSET}" -C /usr/local/bin opencode \
 && chmod 0755 /usr/local/bin/opencode \
 && rm -f "/tmp/${OPENCODE_ASSET}" "/tmp/${OPENCODE_ASSET}.sha256"

COPY --chown=${NB_USER}:${NB_GID} --chmod=755 s6/ /etc

USER ${NB_UID}
WORKDIR ${PERSISTENT_DIR}

EXPOSE 8888
