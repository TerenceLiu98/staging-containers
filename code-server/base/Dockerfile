ARG BASE=archlinux:latest
FROM scratch AS packages

FROM $BASE

ARG USER_NAME=nebula
ARG USER_UID=1000
ARG USER_GID=$USER_UID
ARG INSTALL_OPENAI_CHATGPT_EXTENSION=false
ARG INSTALL_CLAUDE_CODE_EXTENSION=false

RUN pacman -Syu --noconfirm \
    curl \
    git \
    git-lfs \
    btop \
    fastfetch \
    glibc \
    lsb-release \
    man-db \
    nano \
    openssh \
    procps-ng \
    sudo \
    vim \
    wget \
    zsh \
    make \
    cmake \
    base-devel \
    pixi \
    ffmpeg \
    ttf-jetbrains-mono-nerd \
    && git lfs install \
    && rm -rf /var/cache/pacman/pkg/*

RUN sed -i 's/#en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen \
    && locale-gen
ENV LANG=en_US.UTF-8

RUN useradd -m -G wheel -s /bin/zsh ${USER_NAME} \
    && echo "${USER_NAME} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/nopasswd \
    && mkdir -p /home/${USER_NAME}/srv \
    && chown -R ${USER_NAME}:${USER_NAME} /home/${USER_NAME}/srv

USER ${USER_NAME}
ENV USER=${USER_NAME}
WORKDIR /home/${USER_NAME}

RUN git clone https://aur.archlinux.org/yay.git \
  && cd yay \
  && makepkg -si --noconfirm \
  && cd .. \
  && rm -rf yay 

RUN yay -S code-server google-chrome --noconfirm

# Install Zim framework separately with proper environment sourcing
RUN curl -fsSL https://raw.githubusercontent.com/zimfw/install/master/install.zsh | zsh \
  && echo 'zmodule romkatv/powerlevel10k' >> /home/${USER_NAME}/.zimrc \
  && zsh -c "source /home/${USER_NAME}/.zshrc && zimfw install"

# Configure Powerlevel10k to use JetBrains Mono Nerd Font - Clean single line style
RUN echo '# Powerlevel10k configuration - Clean style' > /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_MODE=nerdfont-complete' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '# Single line prompt with no background colors' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_LEFT_PROMPT_ELEMENTS=(' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '  dir' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '  vcs' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '  prompt_char' >> /home/${USER_NAME}/.p10k.zsh && \
    echo ')' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS=()' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '# Remove all background colors' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_BACKGROUND=' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '# Directory configuration - no background' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_DIR_BACKGROUND=' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_DIR_FOREGROUND=blue' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_SHORTEN_STRATEGY=truncate_from_left' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_SHORTEN_DIR_LENGTH=2' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_DIR_ANCHOR_BOLD=false' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '# Git configuration - no background' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_VCS_BACKGROUND=' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_VCS_CLEAN_FOREGROUND=green' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_VCS_MODIFIED_FOREGROUND=yellow' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_VCS_UNTRACKED_FOREGROUND=cyan' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '# Prompt char configuration - simple arrows' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_PROMPT_CHAR_BACKGROUND=' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_PROMPT_CHAR_OK_{VIINS,VICMD,VIVIS}_FOREGROUND=green' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_PROMPT_CHAR_ERROR_{VIINS,VICMD,VIVIS}_FOREGROUND=red' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_PROMPT_CHAR_{OK,ERROR}_VIINS_CONTENT_EXPANSION="❯"' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '# Separators - clean style' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_LEFT_SUBSEGMENT_SEPARATOR=""' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_LEFT_SEGMENT_SEPARATOR=""' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_RIGHT_SUBSEGMENT_SEPARATOR=""' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'typeset -g POWERLEVEL9K_RIGHT_SEGMENT_SEPARATOR=""' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '# Enable Powerlevel10k instant prompt' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then' >> /home/${USER_NAME}/.p10k.zsh && \
    echo '  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"' >> /home/${USER_NAME}/.p10k.zsh && \
    echo 'fi' >> /home/${USER_NAME}/.p10k.zsh

# Add p10k configuration to .zshrc
RUN echo '' >> /home/${USER_NAME}/.zshrc && \
    echo '# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.' >> /home/${USER_NAME}/.zshrc && \
    echo '[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh' >> /home/${USER_NAME}/.zshrc

RUN /usr/bin/code-server --install-extension eamodio.gitlens && \
    /usr/bin/code-server --install-extension ms-python.python && \
    /usr/bin/code-server --install-extension antfu.browse-lite && \
    /usr/bin/code-server --install-extension ms-toolsai.jupyter && \
    if [ "${INSTALL_OPENAI_CHATGPT_EXTENSION}" = "true" ]; then \
      /usr/bin/code-server --install-extension openai.chatgpt; \
    fi && \
    if [ "${INSTALL_CLAUDE_CODE_EXTENSION}" = "true" ]; then \
      /usr/bin/code-server --install-extension Anthropic.claude-code; \
    fi && \
    /usr/bin/code-server --install-extension hediet.vscode-drawio && \
    /usr/bin/code-server --install-extension alexcvzz.vscode-sqlite && \
    /usr/bin/code-server --install-extension akamud.vscode-theme-onedark && \
    /usr/bin/code-server --install-extension emmanuelbeziat.vscode-great-icons

# Configure code-server settings
RUN mkdir -p /home/${USER_NAME}/.local/share/code-server/User && \
    echo '{' > /home/${USER_NAME}/.local/share/code-server/User/settings.json && \
    echo '  "terminal.integrated.fontFamily": "JetBrainsMono Nerd Font",' >> /home/${USER_NAME}/.local/share/code-server/User/settings.json && \
    echo '  "terminal.integrated.fontSize": 12,' >> /home/${USER_NAME}/.local/share/code-server/User/settings.json && \
    echo '  "terminal.integrated.fontWeight": "normal",' >> /home/${USER_NAME}/.local/share/code-server/User/settings.json && \
    echo '  "editor.fontFamily": "JetBrainsMono Nerd Font, monospace",' >> /home/${USER_NAME}/.local/share/code-server/User/settings.json && \
    echo '  "editor.fontSize": 12,' >> /home/${USER_NAME}/.local/share/code-server/User/settings.json && \
    echo '  "editor.fontLigatures": true,' >> /home/${USER_NAME}/.local/share/code-server/User/settings.json && \
    echo '  "workbench.colorTheme": "Atom One Dark",' >> /home/${USER_NAME}/.local/share/code-server/User/settings.json && \
    echo '  "workbench.iconTheme": "vscode-great-icons",' >> /home/${USER_NAME}/.local/share/code-server/User/settings.json && \
    echo '  "terminal.integrated.shell.linux": "/bin/zsh"' >> /home/${USER_NAME}/.local/share/code-server/User/settings.json && \
    echo '  "editor.minimap.enabled": false' >> /home/${USER_NAME}/.local/share/code-server/User/settings.json && \
    echo '}' >> /home/${USER_NAME}/.local/share/code-server/User/settings.json 


USER root
# remove the tmp file and create default powerlevel10k configuration
RUN mkdir -p /etc/skel-nebula && \
    cp -r /home/nebula/.config /etc/skel-nebula/ && \
    cp -r /home/nebula/.local /etc/skel-nebula/ && \
    cp /home/nebula/.zshrc /etc/skel-nebula/ 2>/dev/null || true && \
    cp /home/nebula/.zimrc /etc/skel-nebula/ 2>/dev/null || true && \
    cp /home/nebula/.p10k.zsh /etc/skel-nebula/ 2>/dev/null || true && \
    cp -r /home/nebula/.zim /etc/skel-nebula/ 2>/dev/null || true && \
    chmod -R 755 /etc/skel-nebula

RUN echo '#!/bin/bash' > /init-home.sh && \
    echo 'set -e' >> /init-home.sh && \
    echo 'if [ ! -f "/home/nebula/.initialized" ]; then' >> /init-home.sh && \
    echo '  echo "Initializing nebula home directory..."' >> /init-home.sh && \
    echo '  mkdir -p /home/nebula' >> /init-home.sh && \
    echo '  cp -r /etc/skel-nebula/.config /home/nebula/ 2>/dev/null || true' >> /init-home.sh && \
    echo '  cp -r /etc/skel-nebula/.local /home/nebula/ 2>/dev/null || true' >> /init-home.sh && \
    echo '  cp /etc/skel-nebula/.zshrc /home/nebula/ 2>/dev/null || true' >> /init-home.sh && \
    echo '  cp /etc/skel-nebula/.zimrc /home/nebula/ 2>/dev/null || true' >> /init-home.sh && \
    echo '  cp /etc/skel-nebula/.p10k.zsh /home/nebula/ 2>/dev/null || true' >> /init-home.sh && \
    echo '  cp -r /etc/skel-nebula/.zim /home/nebula/ 2>/dev/null || true' >> /init-home.sh && \
    echo '  mkdir -p /home/nebula/srv' >> /init-home.sh && \
    echo '  chown -R 1000:1000 /home/nebula' >> /init-home.sh && \
    echo '  touch /home/nebula/.initialized' >> /init-home.sh && \
    echo '  echo "Home directory initialized"' >> /init-home.sh && \
    echo 'else' >> /init-home.sh && \
    echo '  echo "Home directory already exists"' >> /init-home.sh && \
    echo 'fi' >> /init-home.sh && \
    chmod +x /init-home.sh

USER ${USER_NAME} 

EXPOSE 8888

CMD ["/usr/bin/code-server", "--bind-addr", "0.0.0.0:8888", "--disable-telemetry", \
        "--disable-update-check", "--disable-workspace-trust", "--disable-getting-started-override", \
        "--auth", "none", "--trusted-origins", "*", "/home/nebula/srv"]
