ARG TARGETPLATFORM
ARG REGISTRY_PREFIX

FROM --platform=$TARGETPLATFORM $REGISTRY_PREFIX/openvscode-server:latest-base

USER root

ARG RUST_VERSION

ENV CARGO_HOME=/usr/local/cargo \
    RUSTUP_HOME=/usr/local/rustup \
    PATH=/usr/local/cargo/bin:$PATH

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y --no-modify-path \
    && rustup component add rustfmt clippy \
    && chmod -R a+w /usr/local/cargo /usr/local/rustup

RUN echo 'export CARGO_HOME=/usr/local/cargo' > /etc/profile.d/rust.sh \
    && echo 'export RUSTUP_HOME=/usr/local/rustup' >> /etc/profile.d/rust.sh \
    && echo 'export PATH=/usr/local/cargo/bin:$PATH' >> /etc/profile.d/rust.sh \
    && chmod +x /etc/profile.d/rust.sh

USER jovyan
