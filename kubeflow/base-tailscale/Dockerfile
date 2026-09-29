# syntax=docker/dockerfile:1

ARG TARGETPLATFORM=linux/amd64
ARG BASE_IMAGE=ubuntu
ARG BASE_IMAGE_VERSION=24.04

FROM --platform=$TARGETPLATFORM ${BASE_IMAGE}:${BASE_IMAGE_VERSION}

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    HOME=/home/ubuntu \
    TS_STATE_DIR=/var/lib/tailscale \
    TS_SOCKET=/var/run/tailscale/tailscaled.sock \
    TS_USERSPACE=true \
    TS_AUTH_ONCE=true

RUN apt-get update \
 && apt-get install --no-install-recommends -y \
      bash \
      ca-certificates \
      curl \
      iproute2 \
      iptables \
      nodejs \
      npm \
      openssh-server \
      procps \
      sudo \
      bubblewrap \
 && curl -fsSL https://tailscale.com/install.sh | sh \
 && useradd --create-home --shell /bin/bash --groups sudo ubuntu \
 && echo 'ubuntu:ubuntu' | chpasswd \
 && printf '%s\n' \
      'PasswordAuthentication yes' \
      'KbdInteractiveAuthentication no' \
      'PermitRootLogin no' \
      'UsePAM yes' \
    > /etc/ssh/sshd_config.d/99-container.conf \
 && mkdir -p /var/lib/tailscale /var/run/tailscale /run/sshd \
 && chmod 700 /var/lib/tailscale \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY --chmod=755 entrypoint.sh /usr/local/bin/base-tailscale-entrypoint

WORKDIR /home/ubuntu
EXPOSE 22
VOLUME ["/var/lib/tailscale"]
STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/local/bin/base-tailscale-entrypoint"]
CMD ["sleep", "infinity"]
