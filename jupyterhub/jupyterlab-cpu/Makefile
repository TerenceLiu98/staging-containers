OWNER?=bayes-cluster

ALL_IMAGES:= \
	foundation \
	base-notebook \
	mini-notebook \
	scipy-notebook \
	datascience-notebook 

help:
	@echo "bayes-cluster/staging-containers/jupyterhub - jupyterlab (cpu)"
	@echo "====================="
	@echo "Replace % with a stack directory name (e.g., make build/minimal-notebook)"
	@echo ""

build/%: IMAGE_NAME?=
build/%:
	docker build $(IMAGE_NAME) --rm --force-rm -t $(OWNER)/$(notdir $@):latest ./$(notdir $@) --build-arg OWNER=$(OWNER)

push/%: IMAGE_NAME?=
push/%:
	docker tag $(OWNER)/$(notdir $@) harbor.cklau.cc/$(OWNER)/$(notdir $@)
	docker push harbor.cklau.cc/$(OWNER)/$(notdir $@)

build-all: $(foreach I, $(ALL_IMAGES), build/$(I))

push-all: $(foreach I, $(ALL_IMAGES), push/$(I))