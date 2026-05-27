# Staging Container


## To Build 

1. To build the image in local environment, please follow the `Makefile`
2. To build the image with github action, please check `./.github/workflows/`

## Kubeflow Image Versions

Kubeflow image versions are pinned in `versions/kubeflow.env`. The local
`kubeflow/Makefile` and the GitHub Actions workflow both read this file.

Local build example:

```bash
make -C kubeflow build-code-server
make -C kubeflow build-jupyter-cuda-pytorch
```

Override a version locally:

```bash
make -C kubeflow build-code-server CODESERVER_VERSION=4.103.2
make -C kubeflow build-jupyter-cuda-pytorch CUDA_VERSION=12.4 PYTORCH_VERSION=2.5.1
```

GitHub Actions:

- `.github/workflows/kubeflow-images.yml` builds on pushes to `kubeflow/**`,
  `versions/kubeflow.env`, and the workflow file.
- The workflow can be run manually with overrides for code-server, Jupyter,
  Python, CUDA, PyTorch, torchaudio, and torchvision versions.
- Its scheduled run rebuilds the currently pinned versions.
- Images are pushed to Docker Hub by default as `docker.io/terencelau/kubeflow`.
  Configure repository secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.
  To push to a different Docker Hub namespace, run the workflow manually with
  `registry_prefix=docker.io/<namespace>` or change the workflow default.
- `.github/workflows/update-kubeflow-versions.yml` can update
  `versions/kubeflow.env` and open a PR. Its scheduled run checks the latest
  `coder/code-server` release.
- CUDA and PyTorch remain explicit pins because those versions must stay
  compatible with each other.
