ifneq ("$(wildcard ../versions/meta-bundle.env)","")
include ../versions/meta-bundle.env
export
endif

CONTAINER_CLI ?= docker
REGISTRY_PREFIX ?= docker.io/terencelau
TARGETPLATFORM ?= linux/amd64
IMAGE_NAME ?= $(REGISTRY_PREFIX)/meta-bundle

MIHOMO_VERSION ?= v1.19.29
ZASHBOARD_VERSION ?= v3.16.0
ZASHBOARD_SHA256 ?= d103652ee04e9d73017230f483e0cb8875bf4bdf2c139faae47300ba7f5dfd16

MIHOMO_TAG_VERSION := $(patsubst v%,%,$(MIHOMO_VERSION))
ZASHBOARD_TAG_VERSION := $(patsubst v%,%,$(ZASHBOARD_VERSION))
IMAGE_TAG := core-$(MIHOMO_TAG_VERSION)-ui-$(ZASHBOARD_TAG_VERSION)

BUILD_ARGS := \
	--build-arg MIHOMO_VERSION=$(MIHOMO_VERSION) \
	--build-arg ZASHBOARD_VERSION=$(ZASHBOARD_VERSION) \
	--build-arg ZASHBOARD_SHA256=$(ZASHBOARD_SHA256)

.PHONY: build push help

build:
	$(CONTAINER_CLI) build \
		--platform=$(TARGETPLATFORM) \
		$(BUILD_ARGS) \
		-t $(IMAGE_NAME):$(IMAGE_TAG) \
		-t $(IMAGE_NAME):latest \
		.

push: build
	$(CONTAINER_CLI) push $(IMAGE_NAME):$(IMAGE_TAG)
	$(CONTAINER_CLI) push $(IMAGE_NAME):latest

help:
	@echo "Targets:"
	@echo "  build  Build $(IMAGE_NAME):$(IMAGE_TAG) and :latest"
	@echo "  push   Build and push both tags"
	@echo ""
	@echo "Overrides:"
	@echo "  CONTAINER_CLI=docker|nerdctl|podman"
	@echo "  REGISTRY_PREFIX=docker.io/namespace"
	@echo "  TARGETPLATFORM=linux/amd64|linux/arm64"
	@echo "  MIHOMO_VERSION=vX.Y.Z"
	@echo "  ZASHBOARD_VERSION=vX.Y.Z"
	@echo "  ZASHBOARD_SHA256=<sha256>"
