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
ARCHLINUX_BASE_IMAGE ?= archlinux
ARCHLINUX_BASE_IMAGE_VERSION ?= base-20260726.0.562117
CODESERVER_ARCH_IMAGE_REVISION ?= 1
NODE_VERSION ?= 22.23.2
RUST_VERSION ?= stable
OPENCODE_VERSION ?= 1.17.20-kubeflow.2
KUBECODE_VERSION ?= 0.1.2
KUBECODE_IMAGE_REVISION ?= 4
KUBECODE_EDGE_IMAGE_REVISION ?= 1
CODEX_CLI_VERSION ?= 0.144.6
CODEX_CLI_SHA256_AMD64 ?= 6a9def51a0ad8cea6684d8eb3bf033c89f33e3bc5cfe492f1a1e0a718451a1c6
CODEX_CLI_SHA256_ARM64 ?= 8eddae5e6c009dff9ba51ae1bfe3bdd9ff4c1ccc93a48cc6860db1cd9fdf11be
CLAUDE_CODE_VERSION ?= 2.1.215
CLAUDE_CODE_SHA256_AMD64 ?= c1efffaaf370aa187cb6a09dd93d4e511c646899b0078476f83791b664bde7fe
CLAUDE_CODE_SHA256_ARM64 ?= 2b43a3d5b0787217e5d7381fad42c7314292546fe9db9eb8b9b379de90509b30
EDGE_OPENCODE_VERSION ?= 1.17.20-kubeflow.2
EDGE_CODEX_CLI_VERSION ?= 0.146.0
EDGE_CODEX_CLI_SHA256_AMD64 ?= 5ba3b9405543953081f661d0854d266f76e2abbe51d41349355a36de7673776a
EDGE_CODEX_CLI_SHA256_ARM64 ?= 975bac91562abeedeb8f79636d51a86649b31f34a9de6a3bcb059565b6cf1f87
EDGE_CLAUDE_CODE_VERSION ?= 2.1.220
EDGE_CLAUDE_CODE_SHA256_AMD64 ?= 674f61f20ff306f3100cf9200e4c36c4b70278b5bef2884549819b942a89c863
EDGE_CLAUDE_CODE_SHA256_ARM64 ?= 159e4a51d796f3bf14677577100f7efb845611b1ceaf0c30cbd8d4650d942185
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
CODESERVER_ARCH_IMAGE_TAG := $(PROJECT_NAME)-$(ARCHLINUX_BASE_IMAGE)-code-server-$(CODESERVER_VERSION)-r$(CODESERVER_ARCH_IMAGE_REVISION)
OPENCODE_IMAGE_TAG := $(PROJECT_NAME)-$(BASE_IMAGE)-$(BASE_IMAGE_VERSION)-opencode-$(OPENCODE_VERSION)
OPENCODE_CUDA_PYTORCH_IMAGE_TAG := $(PROJECT_NAME)-$(BASE_IMAGE)-$(BASE_IMAGE_VERSION)-opencode-$(OPENCODE_VERSION)-cuda-$(CUDA_VERSION)-pytorch-$(PYTORCH_VERSION)
OPENCODE_EDGE_IMAGE_TAG := $(PROJECT_NAME)-$(BASE_IMAGE)-$(BASE_IMAGE_VERSION)-opencode-edge-$(EDGE_OPENCODE_VERSION)
KUBECODE_IMAGE_TAG := $(PROJECT_NAME)-$(BASE_IMAGE)-$(BASE_IMAGE_VERSION)-kubecode-$(KUBECODE_VERSION)-r$(KUBECODE_IMAGE_REVISION)
KUBECODE_CUDA_PYTORCH_IMAGE_TAG := $(KUBECODE_IMAGE_TAG)-cuda-$(CUDA_VERSION)-pytorch-$(PYTORCH_VERSION)
KUBECODE_EDGE_IMAGE_TAG := $(PROJECT_NAME)-$(BASE_IMAGE)-$(BASE_IMAGE_VERSION)-kubecode-$(KUBECODE_VERSION)-edge-r$(KUBECODE_EDGE_IMAGE_REVISION)
KUBECODE_EDGE_CUDA_PYTORCH_IMAGE_TAG := $(KUBECODE_EDGE_IMAGE_TAG)-cuda-$(CUDA_VERSION)-pytorch-$(PYTORCH_VERSION)
CODESERVER_LLM_IMAGE_TAG := $(PROJECT_NAME)-code-server-llm-cuda-$(CUDA_VERSION)-torch-$(PYTORCH_VERSION)-vllm-$(VLLM_VERSION)

.PHONY: all build-base push-base build-jupyter-base push-jupyter-base build-jupyter-cuda-pytorch push-jupyter-cuda-pytorch build-code-server build-code-server-arch build-opencode build-opencode-cuda-pytorch build-opencode-edge build-kubecode build-kubecode-cuda-pytorch build-kubecode-edge build-kubecode-edge-cuda-pytorch build-code-server-llm push-code-server push-code-server-arch push-opencode push-opencode-cuda-pytorch push-opencode-edge push-kubecode push-kubecode-cuda-pytorch push-kubecode-edge push-kubecode-edge-cuda-pytorch push-code-server-llm

# Default target
build-all: build-base build-jupyter-base build-jupyter-cuda-pytorch build-code-server build-code-server-arch build-opencode build-opencode-cuda-pytorch build-opencode-edge build-kubecode build-kubecode-cuda-pytorch build-kubecode-edge build-kubecode-edge-cuda-pytorch build-code-server-llm
push-all: push-base push-jupyter-base push-jupyter-cuda-pytorch push-code-server push-code-server-arch push-opencode push-opencode-cuda-pytorch push-opencode-edge push-kubecode push-kubecode-cuda-pytorch push-kubecode-edge push-kubecode-edge-cuda-pytorch push-code-server-llm

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

build-code-server-arch:
	$(CONTAINER_CLI) build \
		-f code-server-arch/Dockerfile \
		-t $(IMAGE_NAME):$(CODESERVER_ARCH_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg ARCHLINUX_BASE_IMAGE=$(ARCHLINUX_BASE_IMAGE) \
		--build-arg ARCHLINUX_BASE_IMAGE_VERSION=$(ARCHLINUX_BASE_IMAGE_VERSION) \
		--build-arg CODESERVER_VERSION=$(CODESERVER_VERSION) \
		--build-arg UV_VERSION=$(UV_VERSION) \
		--build-arg PYTHON_VERSION=$(PYTHON_VERSION) \
		--build-arg NODE_VERSION=$(NODE_VERSION) \
		--build-arg RUST_VERSION=$(RUST_VERSION) \
		code-server-arch
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(CODESERVER_ARCH_IMAGE_TAG) $(IMAGE_NAME):latest-code-server-arch

push-code-server-arch:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(CODESERVER_ARCH_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest-code-server-arch

build-opencode: build-base
	$(CONTAINER_CLI) build \
		-f opencode/Dockerfile \
		-t $(IMAGE_NAME):$(OPENCODE_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg BASE_IMAGE_TAG=$(BASE_IMAGE_TAG) \
		--build-arg PROJECT_NAME=$(PROJECT_NAME) \
		--build-arg REGISTRY_PREFIX=$(REGISTRY_PREFIX) \
		--build-arg OPENCODE_VERSION=$(OPENCODE_VERSION) \
		opencode
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(OPENCODE_IMAGE_TAG) $(IMAGE_NAME):latest-opencode

push-opencode:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(OPENCODE_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest-opencode

build-opencode-cuda-pytorch: build-opencode
	$(CONTAINER_CLI) build \
		-f opencode-cuda-pytorch/Dockerfile \
		-t $(IMAGE_NAME):$(OPENCODE_CUDA_PYTORCH_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg OPENCODE_IMAGE_TAG=$(OPENCODE_IMAGE_TAG) \
		--build-arg PROJECT_NAME=$(PROJECT_NAME) \
		--build-arg REGISTRY_PREFIX=$(REGISTRY_PREFIX) \
		--build-arg CUDA_VERSION=$(CUDA_VERSION) \
		--build-arg PYTORCH_VERSION=$(PYTORCH_VERSION) \
		--build-arg TORCHAUDIO_VERSION=$(TORCHAUDIO_VERSION) \
		--build-arg TORCHVISION_VERSION=$(TORCHVISION_VERSION) \
		--build-arg PYTORCH_CUDA_INDEX=$(PYTORCH_CUDA_INDEX) \
		opencode-cuda-pytorch
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(OPENCODE_CUDA_PYTORCH_IMAGE_TAG) $(IMAGE_NAME):latest-opencode-cuda-pytorch

push-opencode-cuda-pytorch:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(OPENCODE_CUDA_PYTORCH_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest-opencode-cuda-pytorch

build-opencode-edge: build-base
	$(CONTAINER_CLI) build \
		-f opencode/Dockerfile \
		-t $(IMAGE_NAME):$(OPENCODE_EDGE_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg BASE_IMAGE_TAG=$(BASE_IMAGE_TAG) \
		--build-arg PROJECT_NAME=$(PROJECT_NAME) \
		--build-arg REGISTRY_PREFIX=$(REGISTRY_PREFIX) \
		--build-arg OPENCODE_VERSION=$(EDGE_OPENCODE_VERSION) \
		opencode
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(OPENCODE_EDGE_IMAGE_TAG) $(IMAGE_NAME):latest-opencode-edge

push-opencode-edge:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(OPENCODE_EDGE_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest-opencode-edge

build-kubecode: build-opencode
	$(CONTAINER_CLI) build \
		-f kubecode/Dockerfile \
		-t $(IMAGE_NAME):$(KUBECODE_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg OPENCODE_IMAGE_TAG=$(OPENCODE_IMAGE_TAG) \
		--build-arg PROJECT_NAME=$(PROJECT_NAME) \
		--build-arg REGISTRY_PREFIX=$(REGISTRY_PREFIX) \
		--build-arg KUBECODE_VERSION=$(KUBECODE_VERSION) \
		--build-arg KUBECODE_IMAGE_REVISION=$(KUBECODE_IMAGE_REVISION) \
		--build-arg OPENCODE_VERSION=$(OPENCODE_VERSION) \
		--build-arg CODEX_CLI_VERSION=$(CODEX_CLI_VERSION) \
		--build-arg CODEX_CLI_SHA256_AMD64=$(CODEX_CLI_SHA256_AMD64) \
		--build-arg CODEX_CLI_SHA256_ARM64=$(CODEX_CLI_SHA256_ARM64) \
		--build-arg CLAUDE_CODE_VERSION=$(CLAUDE_CODE_VERSION) \
		--build-arg CLAUDE_CODE_SHA256_AMD64=$(CLAUDE_CODE_SHA256_AMD64) \
		--build-arg CLAUDE_CODE_SHA256_ARM64=$(CLAUDE_CODE_SHA256_ARM64) \
		kubecode
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(KUBECODE_IMAGE_TAG) $(IMAGE_NAME):latest-kubecode

push-kubecode:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(KUBECODE_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest-kubecode

build-kubecode-cuda-pytorch: build-kubecode
	$(CONTAINER_CLI) build \
		-f kubecode-cuda-pytorch/Dockerfile \
		-t $(IMAGE_NAME):$(KUBECODE_CUDA_PYTORCH_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg KUBECODE_IMAGE_TAG=$(KUBECODE_IMAGE_TAG) \
		--build-arg PROJECT_NAME=$(PROJECT_NAME) \
		--build-arg REGISTRY_PREFIX=$(REGISTRY_PREFIX) \
		--build-arg CUDA_VERSION=$(CUDA_VERSION) \
		--build-arg PYTORCH_VERSION=$(PYTORCH_VERSION) \
		--build-arg TORCHAUDIO_VERSION=$(TORCHAUDIO_VERSION) \
		--build-arg TORCHVISION_VERSION=$(TORCHVISION_VERSION) \
		--build-arg PYTORCH_CUDA_INDEX=$(PYTORCH_CUDA_INDEX) \
		kubecode-cuda-pytorch
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(KUBECODE_CUDA_PYTORCH_IMAGE_TAG) $(IMAGE_NAME):latest-kubecode-cuda-pytorch

push-kubecode-cuda-pytorch:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(KUBECODE_CUDA_PYTORCH_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest-kubecode-cuda-pytorch

build-kubecode-edge: build-opencode-edge
	$(CONTAINER_CLI) build \
		-f kubecode/Dockerfile \
		-t $(IMAGE_NAME):$(KUBECODE_EDGE_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg OPENCODE_IMAGE_TAG=$(OPENCODE_EDGE_IMAGE_TAG) \
		--build-arg PROJECT_NAME=$(PROJECT_NAME) \
		--build-arg REGISTRY_PREFIX=$(REGISTRY_PREFIX) \
		--build-arg KUBECODE_VERSION=$(KUBECODE_VERSION) \
		--build-arg KUBECODE_IMAGE_REVISION=$(KUBECODE_EDGE_IMAGE_REVISION) \
		--build-arg KUBECODE_CHANNEL=edge \
		--build-arg OPENCODE_VERSION=$(EDGE_OPENCODE_VERSION) \
		--build-arg CODEX_CLI_VERSION=$(EDGE_CODEX_CLI_VERSION) \
		--build-arg CODEX_CLI_SHA256_AMD64=$(EDGE_CODEX_CLI_SHA256_AMD64) \
		--build-arg CODEX_CLI_SHA256_ARM64=$(EDGE_CODEX_CLI_SHA256_ARM64) \
		--build-arg CLAUDE_CODE_VERSION=$(EDGE_CLAUDE_CODE_VERSION) \
		--build-arg CLAUDE_CODE_SHA256_AMD64=$(EDGE_CLAUDE_CODE_SHA256_AMD64) \
		--build-arg CLAUDE_CODE_SHA256_ARM64=$(EDGE_CLAUDE_CODE_SHA256_ARM64) \
		kubecode
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(KUBECODE_EDGE_IMAGE_TAG) $(IMAGE_NAME):latest-kubecode-edge

push-kubecode-edge:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(KUBECODE_EDGE_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest-kubecode-edge

build-kubecode-edge-cuda-pytorch: build-kubecode-edge
	$(CONTAINER_CLI) build \
		-f kubecode-cuda-pytorch/Dockerfile \
		-t $(IMAGE_NAME):$(KUBECODE_EDGE_CUDA_PYTORCH_IMAGE_TAG) \
		--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
		--build-arg KUBECODE_IMAGE_TAG=$(KUBECODE_EDGE_IMAGE_TAG) \
		--build-arg PROJECT_NAME=$(PROJECT_NAME) \
		--build-arg REGISTRY_PREFIX=$(REGISTRY_PREFIX) \
		--build-arg CUDA_VERSION=$(CUDA_VERSION) \
		--build-arg PYTORCH_VERSION=$(PYTORCH_VERSION) \
		--build-arg TORCHAUDIO_VERSION=$(TORCHAUDIO_VERSION) \
		--build-arg TORCHVISION_VERSION=$(TORCHVISION_VERSION) \
		--build-arg PYTORCH_CUDA_INDEX=$(PYTORCH_CUDA_INDEX) \
		kubecode-cuda-pytorch
	$(CONTAINER_CLI) tag $(IMAGE_NAME):$(KUBECODE_EDGE_CUDA_PYTORCH_IMAGE_TAG) $(IMAGE_NAME):latest-kubecode-edge-cuda-pytorch

push-kubecode-edge-cuda-pytorch:
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(KUBECODE_EDGE_CUDA_PYTORCH_IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest-kubecode-edge-cuda-pytorch

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
