ARG PROJECT_NAME
ARG BASE_IMAGE_TAG
ARG REGISTRY_PREFIX
ARG TARGETPLATFORM

FROM --platform=$TARGETPLATFORM $REGISTRY_PREFIX/$PROJECT_NAME:$BASE_IMAGE_TAG

ARG CUDA_VERSION
ARG PYTORCH_VERSION
ARG TORCHAUDIO_VERSION
ARG TORCHVISION_VERSION

ENV NVIDIA_VISIBLE_DEVICES all
ENV NVIDIA_DRIVER_CAPABILITIES compute,utility
ENV NVIDIA_REQUIRE_CUDA "cuda>=${CUDA_VERSION}"

USER $NB_UID

# install - pytorch (cuda)
RUN python3 -m pip install --index-url https://download.pytorch.org/whl/cu124 \
    torch==${PYTORCH_VERSION} \
    torchaudio==${TORCHAUDIO_VERSION} \
    torchvision==${TORCHVISION_VERSION}

# install - requirements.txt
COPY --chown=${NB_USER}:${NB_GID} requirements.txt /tmp
RUN python3 -m pip install -r /tmp/requirements.txt --no-cache-dir \
    && rm -f /tmp/requirements.txt


RUN pip install --extra-index-url https://pypi.anaconda.org/rapidsai-wheels-nightly/simple --pre jupyterlab_nvdashboard