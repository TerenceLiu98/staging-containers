#!/bin/sh

set -eu

config_dir=/root/.config/mihomo
config_file="${config_dir}/config.yaml"

mkdir -p "${config_dir}"

if [ ! -e "${config_file}" ]; then
  cp /usr/share/meta-bundle/config.yaml "${config_file}"
  echo "Initialized default configuration at ${config_file}"
fi

exec /mihomo -d "${config_dir}" "$@"
