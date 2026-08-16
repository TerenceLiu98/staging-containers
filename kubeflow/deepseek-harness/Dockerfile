ARG TARGETPLATFORM
ARG REGISTRY_PREFIX
ARG PROJECT_NAME
ARG BASE_IMAGE_TAG

FROM --platform=$TARGETPLATFORM ${REGISTRY_PREFIX}/${PROJECT_NAME}:${BASE_IMAGE_TAG}

ARG TARGETPLATFORM
ARG NODE_VERSION
ARG DEEPSEEK_HARNESS_VERSION
ARG DEEPSEEK_HARNESS_IMAGE_REVISION

LABEL org.opencontainers.image.source="https://github.com/deepseek-ai/deepseek-harness" \
      org.opencontainers.image.version="${DEEPSEEK_HARNESS_VERSION}" \
      org.opencontainers.image.description="DeepSeek Harness Web with a Kubeflow prefix proxy" \
      io.github.staging-containers.image-revision="${DEEPSEEK_HARNESS_IMAGE_REVISION}"

USER root

RUN export DEBIAN_FRONTEND=noninteractive \
 && apt-get -yq update \
 && apt-get -yq install --no-install-recommends nginx \
 && nginx -V 2>&1 | grep -q -- '--with-http_sub_module' \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

RUN case "${TARGETPLATFORM}" in \
      linux/amd64) NODE_ARCH="x64" ;; \
      linux/arm64) NODE_ARCH="arm64" ;; \
      *) echo "Unsupported DeepSeek Harness target platform: ${TARGETPLATFORM}" >&2; exit 1 ;; \
    esac \
 && NODE_ARCHIVE="node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" \
 && curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/${NODE_ARCHIVE}" -o "/tmp/${NODE_ARCHIVE}" \
 && curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt" -o /tmp/SHASUMS256.txt \
 && grep "  ${NODE_ARCHIVE}$" /tmp/SHASUMS256.txt | sha256sum -c - \
 && tar -xJf "/tmp/${NODE_ARCHIVE}" --strip-components=1 -C /usr/local \
 && rm -f "/tmp/${NODE_ARCHIVE}" /tmp/SHASUMS256.txt \
 && node --version \
 && npm --version

RUN mkdir -p /opt/deepseek-harness \
 && npm install \
      --prefix /opt/deepseek-harness \
      --omit=dev \
      --no-audit \
      --no-fund \
      "@deepseek-ai/dsh@${DEEPSEEK_HARNESS_VERSION}" \
 && ln -s /opt/deepseek-harness/node_modules/.bin/dsh /usr/local/bin/dsh \
 && node -e 'const p = require("/opt/deepseek-harness/node_modules/@deepseek-ai/dsh/package.json"); if (p.version !== process.argv[1]) process.exit(1)' "${DEEPSEEK_HARNESS_VERSION}" \
 && dsh --version

ENV DSH_HOME=${PERSISTENT_DIR}/.state/deepseek-harness

COPY --chown=${NB_USER}:${NB_GID} --chmod=755 s6/ /etc
COPY --chown=${NB_USER}:${NB_GID} nginx.conf.template /etc/deepseek-harness/nginx.conf.template

USER ${NB_UID}
WORKDIR ${PERSISTENT_DIR}

EXPOSE 8888
