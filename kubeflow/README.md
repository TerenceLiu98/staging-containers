# Kubeflow Containers Images

## Architecture


## Variants

```mermaid
graph TD
    base[base] --> jupyter[jupyter]
    jupyter --> jupyter_cuda[jupyter-cuda-pytorch]
    base --> opencode[opencode]
    opencode --> opencode_cuda[opencode-cuda-pytorch]
    opencode --> kubecode[kubecode]
    kubecode --> kubecode_cuda[kubecode-cuda-pytorch]
    code_server[code-server]
    code_server_arch[code-server-arch]
    code_server_llm[code-server-llm]
```

- `base` - the Ubuntu 24.04 base image with s6, kubectl, conda/miniforge and the
  `jovyan` user. Everything below it inherits from this image.
- `jupyter` - JupyterLab + Notebook on top of `base`.
- `jupyter-cuda-pytorch` - `jupyter` plus the pinned CUDA builds of PyTorch,
  torchaudio and torchvision. An alternate `Dockerfile.openvscode-server` in the
  same directory additionally bundles OpenVSCode Server.
- `opencode` - the forked OpenCode Web server on top of `base`.
- `opencode-cuda-pytorch` - `opencode` plus the pinned CUDA PyTorch stack.
- `kubecode` - `opencode` with Kubecode and bundled OpenCode, Codex and Claude
  Code CLIs as ACP agents.
- `kubecode-cuda-pytorch` - `kubecode` plus the pinned CUDA PyTorch stack.
- `code-server`, `code-server-arch`, `code-server-llm` - standalone images built
  directly from external base images (Ubuntu, Arch Linux and NVIDIA CUDA
  respectively); they do not share the repo base image.

Version pins live in `../versions/kubeflow.env`. The `code-server-llm` image is
built as a matrix from `../versions/code-server-llm-matrix.json`.

## Build

```bash
make -C . build-base
make -C . build-jupyter-cuda-pytorch
make -C . build-opencode
make -C . build-opencode-cuda-pytorch
make -C . build-kubecode
make -C . build-kubecode-cuda-pytorch
make -C . build-kubecode-edge
make -C . build-kubecode-edge-cuda-pytorch
make -C . build-code-server
make -C . build-code-server-arch
make -C . build-code-server-llm
```

See the repo root `README.md` and the GitHub Actions workflows
(`.github/workflows/kubeflow-images.yml`, `kubeflow.yaml`) for the full image
set, tag naming and CI behavior.
