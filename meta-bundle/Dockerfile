# syntax=docker/dockerfile:1

ARG MIHOMO_VERSION=v1.19.29
ARG ZASHBOARD_VERSION=v3.16.0
ARG ZASHBOARD_SHA256=d103652ee04e9d73017230f483e0cb8875bf4bdf2c139faae47300ba7f5dfd16

FROM docker.io/alpine:3.22 AS zashboard

ARG MIHOMO_VERSION
ARG ZASHBOARD_VERSION
ARG ZASHBOARD_SHA256

RUN apk add --no-cache ca-certificates curl unzip

RUN set -eux; \
    curl -fsSL \
      "https://github.com/Zephyruso/zashboard/releases/download/${ZASHBOARD_VERSION}/dist.zip" \
      -o /tmp/zashboard.zip; \
    echo "${ZASHBOARD_SHA256}  /tmp/zashboard.zip" | sha256sum -c -; \
    mkdir -p /tmp/zashboard /out/zashboard /out/licenses; \
    unzip -q /tmp/zashboard.zip -d /tmp/zashboard; \
    cp -a /tmp/zashboard/dist/. /out/zashboard/; \
    test -f /out/zashboard/index.html; \
    curl -fsSL \
      "https://raw.githubusercontent.com/MetaCubeX/mihomo/${MIHOMO_VERSION}/LICENSE" \
      -o /out/licenses/mihomo-LICENSE; \
    curl -fsSL \
      "https://raw.githubusercontent.com/Zephyruso/zashboard/${ZASHBOARD_VERSION}/LICENSE" \
      -o /out/licenses/zashboard-LICENSE

FROM docker.io/metacubex/mihomo:${MIHOMO_VERSION}

ARG MIHOMO_VERSION
ARG ZASHBOARD_VERSION

LABEL org.opencontainers.image.title="meta-bundle" \
      org.opencontainers.image.description="Mihomo core bundled with the zashboard web UI" \
      org.opencontainers.image.source="https://github.com/TerenceLiu98/staging-containers" \
      org.opencontainers.image.licenses="GPL-3.0 AND MIT" \
      org.opencontainers.image.version="${MIHOMO_VERSION}-${ZASHBOARD_VERSION}" \
      io.meta-bundle.mihomo.version="${MIHOMO_VERSION}" \
      io.meta-bundle.zashboard.version="${ZASHBOARD_VERSION}"

ENV SAFE_PATHS=/usr/share/zashboard

COPY --from=zashboard /out/zashboard/ /usr/share/zashboard/
COPY --from=zashboard /out/licenses/ /usr/share/licenses/meta-bundle/
COPY config.yaml /usr/share/meta-bundle/config.yaml
COPY NOTICE /usr/share/licenses/meta-bundle/NOTICE
COPY entrypoint.sh /usr/local/bin/meta-bundle-entrypoint

RUN set -eux; \
    sed -i "s/@ZASHBOARD_VERSION@/${ZASHBOARD_VERSION}/g" /usr/share/meta-bundle/config.yaml; \
    chmod 0755 /usr/local/bin/meta-bundle-entrypoint

VOLUME ["/root/.config/mihomo"]

EXPOSE 7890 9090

ENTRYPOINT ["/usr/local/bin/meta-bundle-entrypoint"]
