# Makefile
REGISTRY_PREFIX ?=terencelau
PROJECT_NAME := openvscode-server
VSCODE_VERSION ?= openvscode-server-v1.102.3
MINIFORGE_VERSION ?= 25.3.1-0
TARGETPLATFORM ?= linux/amd64

# base-image
BASE_IMAGE_NAME := $(REGISTRY_PREFIX)/$(PROJECT_NAME)
BASE_IMAGE_TAG ?= $(VSCODE_VERSION)-base

# python-image
PYTHON_IMAGE_NAME := $(REGISTRY_PREFIX)/$(PROJECT_NAME)
PYTHON_IMAGE_TAG ?= $(VSCODE_VERSION)-python

# miniforge-image
MINIFORGE_IMAGE_NAME := $(REGISTRY_PREFIX)/$(PROJECT_NAME)
MINIFORGE_IMAGE_TAG ?= $(VSCODE_VERSION)-miniforge

# build arguments
BASE_BUILD_ARGS := \
    --build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
    --build-arg VSCODE_VERSION=$(VSCODE_VERSION)

PYTHON_BUILD_ARGS := \
    --build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
	--build-arg REGISTRY_PREFIX=$(REGISTRY_PREFIX)

MINIFORGE_BUILD_ARGS := \
	--build-arg TARGETPLATFORM=$(TARGETPLATFORM) \
	--build-arg REGISTRY_PREFIX=$(REGISTRY_PREFIX) \
	--build-arg MINIFORGE_VERSION=$(MINIFORGE_VERSION)

# Dockerfile's path
BASE_DOCKERFILE := openvscode-server/base/Dockerfile
PYTHON_DOCKERFILE := openvscode-server/python/Dockerfile
MINIFORGE_DOCKERFILE := openvscode-server/miniforge/Dockerfile

.PHONY: all base python miniforge clean push

all: base python miniforge

# build openvscode-server-base
base:
	@echo "Building $(BASE_IMAGE_NAME):$(BASE_IMAGE_TAG)..."
	docker build \
		-f $(BASE_DOCKERFILE) \
		-t $(BASE_IMAGE_NAME):$(BASE_IMAGE_TAG) \
		$(BASE_BUILD_ARGS) \
		openvscode-server/base
	docker tag $(BASE_IMAGE_NAME):$(BASE_IMAGE_TAG) $(BASE_IMAGE_NAME):latest-base 

# build openvscode-server-python
python:
	@echo "Building $(PYTHON_IMAGE_NAME):$(PYTHON_IMAGE_TAG)..."
	docker build \
		-f $(PYTHON_DOCKERFILE) \
		-t $(PYTHON_IMAGE_NAME):$(PYTHON_IMAGE_TAG) \
		$(PYTHON_BUILD_ARGS) \
		openvscode-server/python
	docker tag $(PYTHON_IMAGE_NAME):$(PYTHON_IMAGE_TAG) $(PYTHON_IMAGE_NAME):latest-python

# build openvscode-server-miniforge
miniforge:
	@echo "Building $(MINIFORGE_IMAGE_NAME):$(MINIFORGE_IMAGE_TAG)..."
	docker build \
		-f $(MINIFORGE_DOCKERFILE) \
		-t $(MINIFORGE_IMAGE_NAME):$(MINIFORGE_IMAGE_TAG) \
		$(MINIFORGE_BUILD_ARGS) \
		openvscode-server/miniforge
	docker tag $(MINIFORGE_IMAGE_NAME):$(MINIFORGE_IMAGE_TAG) $(MINIFORGE_IMAGE_NAME):latest-miniforge

# push to registry
push: push-base push-python

push-base:
	@echo "Pushing $(BASE_IMAGE_NAME):-$(BASE_IMAGE_TAG)..."
	docker push $(BASE_IMAGE_NAME):$(BASE_IMAGE_TAG)
	docker push $(BASE_IMAGE_NAME):latest-base

push-python:
	@echo "Pushing $(PYTHON_IMAGE_NAME):$(PYTHON_IMAGE_TAG)..."
	docker push $(PYTHON_IMAGE_NAME):$(PYTHON_IMAGE_TAG)
	docker push $(PYTHON_IMAGE_NAME):latest-python

push-miniforge:
	@echo "Pushing $(MINIFORGE_IMAGE_NAME):$(MINIFORE_IMAGE_TAG)..."
	docker push $(MINIFOGE_IMAGE_NAME):$(MINIFORGE_IMAGE_TAG)
	docker push $(MINIFOGE_IMAGE_NAME):latest-miniforge


# help info
help:
	@echo "Usage:"
	@echo "  make                            - Build all images (base, python)"
	@echo "  make base                       - Build only the base image"
	@echo "  make python                     - Build only the python image (depends on base)"
	@echo "  make clean                      - Remove built Docker images"
	@echo "  make push                       - Push all built images to registry"
	@echo "  make push-base                  - Push only the base image"
	@echo "  make push-python                - Push only the python image"
	@echo "  make push-minifoge              - Push only the miniforge image"
	@echo ""
	@echo "Parameters (can be overridden on command line):"
	@echo "  REGISTRY_PREFIX=<your_registry>/ - Docker registry prefix (e.g., 'myregistry.com/myorg/')"
	@echo "  VSCODE_VERSION=<tag>               - OpenVSCode Server release tag (default: $(VSCODE_VERSION))"
	@echo "  TARGETPLATFORM=<platform>       - Target platform (e.g., 'linux/amd64', 'linux/arm64')"
	@echo "  BASE_IMAGE_TAG=<tag>            - Tag for the base image (default: $(BASE_IMAGE_TAG))"
	@echo "  PYTHON_IMAGE_TAG=<tag>          - Tag for the python image (default: $(PYTHON_IMAGE_TAG))"
	@echo "  MINIFOGE_IMAGE_TAG=<tag>        - Tag for the minifoge image (default: $(MINIFORGE_IMAGE_TAG))"
	@echo ""
	@echo "Example:"
	@echo "  make VSCODE_VERSION=v1.87.0 PIXI_VERSION=0.51.0 TARGETPLATFORM=linux/arm64"
	@echo "  make python REGISTRY_PREFIX=myregistry.com/myorg/"
