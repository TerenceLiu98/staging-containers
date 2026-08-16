ARG TARGETPLATFORM
ARG REGISTRY_PREFIX
ARG PROJECT_NAME
ARG DEEPSEEK_HARNESS_IMAGE_TAG

FROM --platform=$TARGETPLATFORM ${REGISTRY_PREFIX}/${PROJECT_NAME}:${DEEPSEEK_HARNESS_IMAGE_TAG}

ARG CUDA_VERSION
ARG PYTORCH_VERSION
ARG TORCHAUDIO_VERSION
ARG TORCHVISION_VERSION
ARG PYTORCH_CUDA_INDEX=cu124

ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility
ENV NVIDIA_REQUIRE_CUDA="cuda>=${CUDA_VERSION}"

USER ${NB_UID}

RUN python3 -m pip install --no-cache-dir \
      --index-url "https://download.pytorch.org/whl/${PYTORCH_CUDA_INDEX}" \
      "torch==${PYTORCH_VERSION}" \
      "torchaudio==${TORCHAUDIO_VERSION}" \
      "torchvision==${TORCHVISION_VERSION}" \
 && python3 -c 'import torch, torchaudio, torchvision; assert torch.version.cuda is not None; print(f"PyTorch {torch.__version__}, CUDA {torch.version.cuda}, torchaudio {torchaudio.__version__}, torchvision {torchvision.__version__}")'

WORKDIR ${PERSISTENT_DIR}
