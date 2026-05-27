ARG PROJECT_NAME
ARG BASE_IMAGE_TAG
ARG REGISTRY_PREFIX
ARG TARGETPLATFORM

FROM --platform=$TARGETPLATFORM $REGISTRY_PREFIX/$PROJECT_NAME:$BASE_IMAGE_TAG

USER root

ARG JUPYTER_VERSION
ARG JUPYTERLAB_VERSION
ARG NODE_MAJOR_VERSION

# install -- node.js
RUN export DEBIAN_FRONTEND=noninteractive \
 && curl -sL "https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key" | apt-key add - \
 && echo "deb https://deb.nodesource.com/node_${NODE_MAJOR_VERSION}.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
 && apt-get -yq update \
 && apt-get -yq install --no-install-recommends \
    nodejs \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

 # install - usefull linux packages
RUN apt-get clean && rm -rf /var/lib/apt/lists/* \
 && apt-get -yq update --fix-missing \
 && apt-get -yq install --no-install-recommends \
    # for latex
    cm-super \
    dvipng \
    # for matplotlib
    ffmpeg \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# create the SYSTEM_CONFIG_PATH for jupyter, and make it owned by NB_USER
# this is needed for jupyter to write `--level=system` configs
RUN mkdir -pv /usr/local/etc/jupyter \
 && chown -R ${NB_USER}:${NB_GID} /usr/local/etc/jupyter

# switch to NB_UID for installs
USER $NB_UID

# install - jupyter
RUN echo "jupyterlab ==${JUPYTERLAB_VERSION}" >> ${CONDA_DIR}/conda-meta/pinned \
 && echo "notebook ==${JUPYTER_VERSION}" >> ${CONDA_DIR}/conda-meta/pinned \
 && conda install -y -q \
    jupyterlab==${JUPYTERLAB_VERSION} \
    notebook==${JUPYTER_VERSION} \
 && conda clean -a -f -y

# install - requirements.txt
COPY --chown=${NB_USER}:${NB_GID} requirements.txt /tmp
RUN python3 -m pip install -r /tmp/requirements.txt --quiet --no-cache-dir \
 && rm -f /tmp/requirements.txt

# s6 - copy scripts
COPY --chown=${NB_USER}:${NB_GID} --chmod=755 s6/ /etc

# configure - jupyter
RUN mkdir -p /opt/conda/share/jupyter/lab/settings && \
    echo '{ "@jupyterlab/apputils-extension:announcements": { "enabled": false } }' \
    > /opt/conda/share/jupyter/lab/settings/overrides.json

# s6 - 01-copy-tmp-home
# NOTE: the contents of $HOME_TMP are copied to $HOME at runtime
#       this is a workaround because a PVC will be mounted at $HOME
#       and the contents of $HOME will be hidden
RUN cp -p -r -T "${HOME}" "${HOME_TMP}" \
    # give group same access as user (needed for OpenShift)
 && chmod -R g=u "${HOME_TMP}"

EXPOSE 8888
