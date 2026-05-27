# JupyterHub Dockerfiles

Based on [docker-stacks](https://github.com/jupyter/docker-stacks)

## jupyterlab-cpu

1. "System": change to SUSTech's mirrors; change default username from `jovyan` to `bayes`
2. "Julia": Change to SUSTech's mirrors
3. "WebIDE": Add code-server as the built-in webIDE

## jupyterlab-gpu
1. "System": the `BASE_CONTAINER` change to 