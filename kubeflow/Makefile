# Makefile for building and pushing Kubeflow images.

ifneq ("$(wildcard ../versions/kubeflow.env)","")
include ../versions/kubeflow.env
export
endif

CONTAINER_CLI ?= nerdctl
REGISTRY_PREFIX ?= terencelau
TARGETPLATFORM ?= linux/amd64
PROJECT_NAME ?= kubeflow
BASE_IMAGE ?= ubuntu
BASE_IMAGE_VERSION ?= 24.04
IMAGE_NAME ?= $(REGISTRY_PREFIX)/$(PROJECT_NAME)
JUPYTER_VERSION ?= 7.3.2
JUPYTERLAB_VERSION ?= 4.3.5
NODE_MAJOR_VERSION ?= 20
MINIFORGE_VERSION ?= 25.3.1-0
PIP_VERSION ?= 24.3.1
PYTHON_VERSION ?= 3.11.11
CUDA_VERSION ?= 13.0
PYTORCH_VERSION ?= 2.10.0
TORCHAUDIO_VERSION ?= 2.10.0
TORCHVISION_VERSION ?= 0.25.0
CODESERVER_VERSION ?= 4.121.0
UV_VERSION ?= 0.11.16
LLM_BASE_IMAGE ?= nvidia/cuda:13.0.3-devel-ubuntu22.04
PYTORCH_CUDA_INDEX ?= cu130
LLM_PYTORCH_CUDA_INDEX ?= cu130
VLLM_VERSION ?= 0.19.1
XFORMERS_VERSION ?= 0.0.34
DEEPSPEED_VERSION ?= 0.19.0
TRANSFORMERS_VERSION ?= 5.9.0
ACCELERATE_VERSION ?= 1.13.0
DATASETS_VERSION ?= 4.8.5
PEFT_VERSION ?= 0.19.1
TRL_VERSION ?= 1.5.1
BITSANDBYTES_VERSION ?= 0.49.2
SENTENCEPIECE_VERSION ?= 0.2.1


# Dynamic image tags
BASE_IMAGE_TAG := $(PROJECT_NAME)-$(BASE_IMAGE)-$(BASE_IMAGE_VERSION)
JUPYTER_BASE_IMAGE_TAG := $(PROJECT_NAME)-$(BASE_IMAGE)-$(BASE_IMAGE_VERSION)-jupyter-$(JUPYTER_VERSION)
JUPYTER_CUDA_PYTORCH_IMAGE_TAG := $(PROJECT_NAME)-$(BASE_IMAGE)-$(BASE_IMAGE_VERSION)-jupyter-$(JUPYTER_VERSION)-cuda-$(CUDA_VERSION)-pytorch-$(PYTORCH_VERSION)
CODESERVER_IMAGE_TAG := $(PROJECT_NAME)-$(BASE_IMAGE)-$(BASE_IMAGE_VERSION)-code-server-$(CODESERVER_VERSION)
CODESERVER_LLM_IMAGE_TAG := $(PROJECT_NAME)-code-server-llm-cuda-$(CUDA_VERSION)-torch-$(PYTORCH_VERSION)-vllm-$(VLLM_VERSION)

.PHONY: all build-base push-base build-jupyter-base push-jupyter-base build-jupyter-cuda-pytorch push-jupyter-cuda-pytorch build-code-server build-code-server-llm push-code-server push-code-server-llm

# Default target
build-all: build-base build-jupyter-base build-jupyter-cuda-pytorch build-code-server build-code-server-llm
push-all: push-base push-jupyter-base push-jupyter-cuda-pytorch push-code-server push-code-server-llm

# Build base image
build-base:
	$(CONTAINER_CLI) build \
		-f base/Dockerfile \
		-t $(IMAGE_NAME):$(BASE_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg BASE_IMAGE=$(BASE_IMAGE) \
		--build-arg BASE_IMAGE_VERSION=$(BASE_IMAGE_VERSION) \
		--build-arg MINIFORGE_VERSION=$(MINIFORGE_VERSION) \
		--build-arg PIP_VERSION=$(PIP_VERSION) \
		--build-arg PYTHON_VERSION=$(PYTHON_VERSION) \
		base
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(BASE_IMAGE_TAG) $(IMAGE_NAME):latest-base

# Push base image
push-base:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(BASE_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest-base

# Build jupyter-base image
build-jupyter-base: build-base
	$(CONTAINER_CLI) build \
		-f jupyter/Dockerfile \
		-t $(IMAGE_NAME):$(JUPYTER_BASE_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg BASE_IMAGE_TAG=$(BASE_IMAGE_TAG) \
		--build-arg PROJECT_NAME=$(PROJECT_NAME) \
		--build-arg REGISTRY_PREFIX=$(REGISTRY_PREFIX) \
		--build-arg JUPYTER_VERSION=$(JUPYTER_VERSION) \
		--build-arg JUPYTERLAB_VERSION=$(JUPYTERLAB_VERSION) \
		--build-arg MINIFORGE_VERSION=$(MINIFORGE_VERSION) \
		--build-arg NODE_MAJOR_VERSION=$(NODE_MAJOR_VERSION) \
		--build-arg PIP_VERSION=$(PIP_VERSION) \
		--build-arg PYTHON_VERSION=$(PYTHON_VERSION) \
		jupyter
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(JUPYTER_BASE_IMAGE_TAG) $(IMAGE_NAME):latest-jupyter-base

# Push jupyter-base image
push-jupyter-base:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(JUPYTER_BASE_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest-jupyter-base

# Build jupyter-cuda-pytorch image
build-jupyter-cuda-pytorch: build-jupyter-base
	$(CONTAINER_CLI) build \
		-f jupyter-cuda-torch/Dockerfile \
		-t $(IMAGE_NAME):$(JUPYTER_CUDA_PYTORCH_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg BASE_IMAGE_TAG=$(JUPYTER_BASE_IMAGE_TAG) \
		--build-arg PROJECT_NAME=$(PROJECT_NAME) \
		--build-arg REGISTRY_PREFIX=$(REGISTRY_PREFIX) \
		--build-arg CUDA_VERSION=$(CUDA_VERSION) \
		--build-arg PYTORCH_VERSION=$(PYTORCH_VERSION) \
		--build-arg TORCHAUDIO_VERSION=$(TORCHAUDIO_VERSION) \
		--build-arg TORCHVISION_VERSION=$(TORCHVISION_VERSION) \
		--build-arg PYTORCH_CUDA_INDEX=$(PYTORCH_CUDA_INDEX) \
		jupyter-cuda-torch
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(JUPYTER_CUDA_PYTORCH_IMAGE_TAG) $(IMAGE_NAME):latest-jupyter-cuda-pytorch

# Push jupyter-cuda-pytorch image
push-jupyter-cuda-pytorch:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(JUPYTER_CUDA_PYTORCH_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest-jupyter-cuda-pytorch

build-code-server:
	$(CONTAINER_CLI) build \
		-f code-server/Dockerfile \
		-t $(IMAGE_NAME):$(CODESERVER_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg BASE_IMAGE=$(BASE_IMAGE) \
		--build-arg BASE_IMAGE_VERSION=$(BASE_IMAGE_VERSION) \
		--build-arg CUDA_VERSION=$(CUDA_VERSION) \
		--build-arg CODESERVER_VERSION=$(CODESERVER_VERSION) \
		--build-arg UV_VERSION=$(UV_VERSION) \
		--build-arg PYTHON_VERSION=$(PYTHON_VERSION) \
		--build-arg PYTORCH_VERSION=$(PYTORCH_VERSION) \
		--build-arg TORCHAUDIO_VERSION=$(TORCHAUDIO_VERSION) \
		--build-arg TORCHVISION_VERSION=$(TORCHVISION_VERSION) \
		--build-arg PYTORCH_CUDA_INDEX=$(PYTORCH_CUDA_INDEX) \
		code-server
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(CODESERVER_IMAGE_TAG) $(IMAGE_NAME):latest-code-server

push-code-server:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(CODESERVER_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest-code-server

build-code-server-llm:
	$(CONTAINER_CLI) build \
		-f code-server-llm/Dockerfile \
		-t $(IMAGE_NAME):$(CODESERVER_LLM_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg LLM_BASE_IMAGE=$(LLM_BASE_IMAGE) \
		--build-arg CODESERVER_VERSION=$(CODESERVER_VERSION) \
		--build-arg UV_VERSION=$(UV_VERSION) \
		--build-arg PYTHON_VERSION=$(PYTHON_VERSION) \
		--build-arg PYTORCH_VERSION=$(PYTORCH_VERSION) \
		--build-arg TORCHAUDIO_VERSION=$(TORCHAUDIO_VERSION) \
		--build-arg TORCHVISION_VERSION=$(TORCHVISION_VERSION) \
		--build-arg LLM_PYTORCH_CUDA_INDEX=$(LLM_PYTORCH_CUDA_INDEX) \
		--build-arg VLLM_VERSION=$(VLLM_VERSION) \
		--build-arg XFORMERS_VERSION=$(XFORMERS_VERSION) \
		--build-arg DEEPSPEED_VERSION=$(DEEPSPEED_VERSION) \
		--build-arg TRANSFORMERS_VERSION=$(TRANSFORMERS_VERSION) \
		--build-arg ACCELERATE_VERSION=$(ACCELERATE_VERSION) \
		--build-arg DATASETS_VERSION=$(DATASETS_VERSION) \
		--build-arg PEFT_VERSION=$(PEFT_VERSION) \
		--build-arg TRL_VERSION=$(TRL_VERSION) \
		--build-arg BITSANDBYTES_VERSION=$(BITSANDBYTES_VERSION) \
		--build-arg SENTENCEPIECE_VERSION=$(SENTENCEPIECE_VERSION) \
		code-server-llm
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(CODESERVER_LLM_IMAGE_TAG) $(IMAGE_NAME):code-server-llm-latest

push-code-server-llm:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(CODESERVER_LLM_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):code-server-llm-latest
