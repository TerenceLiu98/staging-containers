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
make -C kubeflow build-opencode
make -C kubeflow build-opencode-cuda-pytorch
make -C kubeflow build-kubecode
make -C kubeflow build-kubecode-cuda-pytorch
make -C kubeflow build-code-server-llm
make -C kubeflow build-jupyter-cuda-pytorch
```

Override a version locally:

```bash
make -C kubeflow build-code-server CODESERVER_VERSION=4.103.2
make -C kubeflow build-opencode OPENCODE_VERSION=1.17.20-kubeflow.2
make -C kubeflow build-opencode-cuda-pytorch CUDA_VERSION=13.0 PYTORCH_VERSION=2.10.0 PYTORCH_CUDA_INDEX=cu130
make -C kubeflow build-kubecode KUBECODE_VERSION=0.1.1
make -C kubeflow build-kubecode-cuda-pytorch CUDA_VERSION=13.0 PYTORCH_VERSION=2.10.0 PYTORCH_CUDA_INDEX=cu130
make -C kubeflow build-code-server-llm VLLM_VERSION=0.19.1 XFORMERS_VERSION=0.0.34
make -C kubeflow build-jupyter-cuda-pytorch CUDA_VERSION=13.0 PYTORCH_VERSION=2.10.0 PYTORCH_CUDA_INDEX=cu130
```

GitHub Actions:

- `.github/workflows/kubeflow-images.yml` builds the complete Kubeflow image set
  on matching pushes to `master`, including changes under `kubeflow/**`,
  `versions/**`, `scripts/**`, the workflow file, and this README.
- The workflow can be run manually with overrides for code-server, OpenCode,
  Kubecode, Jupyter, Python, CUDA, PyTorch, torchaudio, torchvision, vLLM,
  xFormers, and DeepSpeed versions.
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

Both code-server images carry a temporary WebKit workaround for
coder/code-server#7801 by patching VSBuffer slicing in the bundled workbench.
This avoids blank webviews for Safari/iPad users until the fix lands upstream.

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

## Kubeflow OpenCode Image

The `kubeflow/opencode` image runs the forked OpenCode Web server on port 8888.
It passes Kubeflow's `NB_PREFIX` to `opencode serve --base-path`, so the Web UI,
API, SSE, and terminal WebSocket endpoints work behind the Notebook reverse
proxy. The default workspace is `/home/jovyan/srv`.

OpenCode is published in two variants:

- `latest-opencode` is the lightweight base image with Python and conda.
- `latest-opencode-cuda-pytorch` extends the same OpenCode image with the pinned
  CUDA builds of PyTorch, torchaudio, and torchvision. It declares NVIDIA
  `compute` and `utility` capabilities so GPU-enabled Kubeflow pods can expose
  the GPU and `nvidia-smi` through the NVIDIA Container Runtime.

The versioned GPU image tag includes the OpenCode, CUDA, and PyTorch versions:

```text
docker.io/terencelau/kubeflow:kubeflow-ubuntu-24.04-opencode-1.17.20-kubeflow.2-cuda-13.0-pytorch-2.10.0
```

The GPU device and host driver utilities are supplied at runtime, so the
Notebook pod must request an NVIDIA GPU. Verify the environment inside such a
pod with:

```bash
nvidia-smi
python3 -c 'import torch; print(torch.__version__, torch.version.cuda, torch.cuda.is_available())'
```

The image downloads the Linux x64 baseline archive from
`TerenceLiu98/opencode` at the version pinned by `OPENCODE_VERSION`, then checks
it against the checksum asset from the same release. The first image release is
therefore limited to `linux/amd64`.

Mount the user PVC at `/home/jovyan/srv`. OpenCode's data, credentials, config,
cache, and state are linked into one persistent subtree:

```text
/home/jovyan/.local/share/opencode -> /home/jovyan/srv/.state/opencode/data
/home/jovyan/.config/opencode      -> /home/jovyan/srv/.state/opencode/config
/home/jovyan/.cache/opencode       -> /home/jovyan/srv/.state/opencode/cache
/home/jovyan/.local/state/opencode -> /home/jovyan/srv/.state/opencode/state
```

Users can edit `~/.config/opencode/opencode.json` normally; it persists at
`/home/jovyan/srv/.state/opencode/config/opencode.json`. On first startup the
image creates a minimal configuration with session sharing disabled.

## Kubeflow Kubecode Images

The `kubeflow/kubecode` image packages the pinned standalone release from
`Bayes-Cluster/kubecode` and runs its project-oriented AI coding workspace on
port 8888. It inherits the regular OpenCode image, disables the standalone
OpenCode Web service, and bundles pinned OpenCode, Codex, and Claude Code
provider CLIs as immediately available ACP Agents inside Kubecode.

Kubecode receives Kubeflow's `NB_PREFIX` through `--base-path`, restricts the
project picker to `/home/jovyan/srv`, and stores its SQLite database and private
worktrees under `/home/jovyan/srv/.state/kubecode`. Its unauthenticated
non-loopback listener is intended to be exposed only through the authenticated
Kubeflow Notebook proxy.

Kubecode is published in two variants:

- `latest-kubecode` is the lightweight Python/conda image with Kubecode,
  OpenCode, Codex, and Claude Code.
- `latest-kubecode-cuda-pytorch` adds the pinned CUDA builds of PyTorch,
  torchaudio, and torchvision, plus NVIDIA `compute` and `utility` runtime
  capabilities.

Versioned tags include Kubecode and all three bundled provider CLI versions:

```text
docker.io/terencelau/kubeflow:kubeflow-ubuntu-24.04-kubecode-0.1.1-opencode-1.17.20-kubeflow.2-codex-0.144.6-claude-2.1.215
docker.io/terencelau/kubeflow:kubeflow-ubuntu-24.04-kubecode-0.1.1-opencode-1.17.20-kubeflow.2-codex-0.144.6-claude-2.1.215-cuda-13.0-pytorch-2.10.0
```

Mount the user PVC at `/home/jovyan/srv`. The initialization step keeps
Kubecode, OpenCode, Codex, and Claude state under the persistent `.state`
subtree:

```text
/home/jovyan/srv/.state/kubecode
/home/jovyan/srv/.state/opencode
/home/jovyan/srv/.state/codex
/home/jovyan/srv/.state/claude
```

The standalone Kubecode release contains the Codex and Claude ACP adapters.
This image adds the matching provider CLIs as verified native Linux binaries at
`/usr/local/bin/codex` and `/usr/local/bin/claude`; Node.js and npm are not
required. CLI versions are pinned in `versions/kubeflow.env`, and their
credentials and configuration persist through the `.codex` and `.claude`
state links above.

The image exposes `/healthz` and `/readyz` for liveness and readiness probes.
The current downstream image remains `linux/amd64` because the inherited
OpenCode release is amd64-only, even though upstream Kubecode also publishes an
arm64 standalone archive.

Kubecode is distributed under AGPL-3.0-or-later. The image retains the upstream
standalone archive's license and third-party notices under `/opt/kubecode`.

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
