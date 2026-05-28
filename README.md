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
make -C kubeflow build-code-server-llm
make -C kubeflow build-jupyter-cuda-pytorch
```

Override a version locally:

```bash
make -C kubeflow build-code-server CODESERVER_VERSION=4.103.2
make -C kubeflow build-code-server-llm VLLM_VERSION=0.19.1 XFORMERS_VERSION=0.0.34
make -C kubeflow build-jupyter-cuda-pytorch CUDA_VERSION=13.0 PYTORCH_VERSION=2.10.0 PYTORCH_CUDA_INDEX=cu130
```

GitHub Actions:

- `.github/workflows/kubeflow-images.yml` builds on pushes to `kubeflow/**`,
  `versions/kubeflow.env`, and the workflow file.
- The workflow can be run manually with overrides for code-server, Jupyter,
  Python, CUDA, PyTorch, torchaudio, torchvision, vLLM, xFormers, and DeepSpeed
  versions.
- Its scheduled run rebuilds the currently pinned versions.
- Images are pushed to Docker Hub by default as `docker.io/terencelau/kubeflow`.
  Configure repository secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.
  To push to a different Docker Hub namespace, run the workflow manually with
  `registry_prefix=docker.io/<namespace>` or change the workflow default.
- `.github/workflows/update-kubeflow-versions.yml` can update
  `versions/kubeflow.env` and open a PR. Its scheduled run uses
  `scripts/update-kubeflow-versions.py` to resolve the latest compatible
  code-server, vLLM, PyTorch, CUDA wheel index, xFormers, DeepSpeed, and related
  Python package versions. It also refreshes
  `versions/code-server-llm-matrix.json`.
- CUDA and PyTorch remain explicit pins because those versions must stay
  compatible with each other.
- If a failed GitHub Actions run used an old commit, start a new run from the
  latest `master` instead of re-running the old job.

## Kubeflow VS Code Images

The standard `kubeflow/code-server` image is the lightweight VS Code image. It
does not use conda; it uses `uv` and installs its default Python environment
under `/opt/code-server`.

The `kubeflow/code-server-llm` image is the all-in-one LLM development image. It
does not use conda. Its CUDA base image is pinned by `LLM_BASE_IMAGE` in
`versions/kubeflow.env`; it uses `uv` and installs a single `/opt/llm` Python
environment with PyTorch, vLLM, xFormers, DeepSpeed, Transformers, Accelerate,
PEFT, TRL, bitsandbytes, OpenAI, Anthropic, FastAPI, and Jupyter tooling.

The image also includes system tools commonly needed for GPU/LLM development:
`tmux`, `htop`, `jq`, `ripgrep`, `fd`, `tree`, `less`, `lsof`, `iproute2`,
`net-tools`, `dnsutils`, `pciutils`, `numactl`, `procps`, `psmisc`, `git-lfs`,
OpenMPI development packages, `cmake`, and `ninja-build`.

For Kubeflow or JupyterHub, mount each user's PVC at `/home/jovyan/srv`, not at
`/home/jovyan`. The image keeps code-server configuration and default home files
under `/home/jovyan`, while `/home/jovyan/srv` is the persistent workspace.
At startup, the image initializes persistent user state under
`/home/jovyan/srv/.state` and links selected directories back into the home
directory:

```text
/home/jovyan/.local/share/code-server/User       -> /home/jovyan/srv/.state/code-server/User
/home/jovyan/.local/share/code-server/extensions -> /home/jovyan/srv/.state/code-server/extensions
/home/jovyan/.config/code-server                 -> /home/jovyan/srv/.state/code-server/config
/home/jovyan/.claude                             -> /home/jovyan/srv/.state/claude
/home/jovyan/.codex                              -> /home/jovyan/srv/.state/codex
```

`code-server-llm` is built as a version matrix from
`versions/code-server-llm-matrix.json`. Each entry is a compatible tuple of CUDA
wheel index, NVIDIA CUDA base image, PyTorch, vLLM, and xFormers. GitHub Actions
pushes one tag per tuple, for example:

```text
docker.io/terencelau/kubeflow:kubeflow-code-server-llm-cuda13.0-torch2.10.0-vllm0.19.1
docker.io/terencelau/kubeflow:kubeflow-code-server-llm-cuda12.6-torch2.10.0-vllm0.19.1
docker.io/terencelau/kubeflow:kubeflow-code-server-llm-cuda12.4-torch2.6.0-vllm0.8.5.post1
```

Only the first matrix entry with `"latest": true` also receives:

```text
docker.io/terencelau/kubeflow:code-server-llm-latest
```
