#!/bin/sh

set -eu

config_dir="${MIHOMO_CONFIG_DIR:-/root/.config/mihomo}"
default_config_file="${META_BUNDLE_DEFAULT_CONFIG:-/usr/share/meta-bundle/config.yaml}"
mihomo_bin="${MIHOMO_BIN:-/mihomo}"
config_file="${config_dir}/config.yaml"
previous_config_file="${config_dir}/config.yaml.previous"
download_file="${config_dir}/config.yaml.download"
subscription_interval="${SUBSCRIPTION_INTERVAL:-21600}"
subscription_user_agent="${SUBSCRIPTION_USER_AGENT:-meta-bundle/mihomo}"
subscription_url="${SUBSCRIPTION_URL:-}"

mkdir -p "${config_dir}"

if [ -n "${SUBSCRIPTION_URL_FILE:-}" ]; then
  if [ -n "${subscription_url}" ]; then
    echo "SUBSCRIPTION_URL and SUBSCRIPTION_URL_FILE cannot both be set" >&2
    exit 1
  fi
  if [ ! -r "${SUBSCRIPTION_URL_FILE}" ]; then
    echo "Cannot read SUBSCRIPTION_URL_FILE: ${SUBSCRIPTION_URL_FILE}" >&2
    exit 1
  fi
  subscription_url=$(cat "${SUBSCRIPTION_URL_FILE}")
  if [ -z "${subscription_url}" ]; then
    echo "SUBSCRIPTION_URL_FILE is empty: ${SUBSCRIPTION_URL_FILE}" >&2
    exit 1
  fi
fi

update_subscription() {
  config_changed=false
  rm -f "${download_file}"

  echo "Downloading subscription configuration"
  if ! curl \
    --fail \
    --silent \
    --show-error \
    --location \
    --connect-timeout 15 \
    --max-time 120 \
    --retry 3 \
    --retry-all-errors \
    --user-agent "${subscription_user_agent}" \
    --output "${download_file}" \
    --url "${subscription_url}"; then
    rm -f "${download_file}"
    echo "Failed to download subscription configuration" >&2
    return 1
  fi

  if [ ! -s "${download_file}" ]; then
    rm -f "${download_file}"
    echo "Downloaded subscription configuration is empty" >&2
    return 1
  fi

  if ! "${mihomo_bin}" -t -d "${config_dir}" -f "${download_file}"; then
    rm -f "${download_file}"
    echo "Downloaded subscription configuration is invalid" >&2
    return 1
  fi

  if [ -e "${config_file}" ] && cmp -s "${download_file}" "${config_file}"; then
    rm -f "${download_file}"
    echo "Subscription configuration is unchanged"
    return 0
  fi

  if [ -e "${config_file}" ] && ! cp -p "${config_file}" "${previous_config_file}"; then
    rm -f "${download_file}"
    echo "Failed to back up the current configuration" >&2
    return 1
  fi

  if ! mv "${download_file}" "${config_file}"; then
    rm -f "${download_file}"
    echo "Failed to install subscription configuration" >&2
    return 1
  fi

  config_changed=true
  echo "Installed subscription configuration at ${config_file}"
}

if [ -n "${subscription_url}" ]; then
  case "${subscription_interval}" in
    ''|*[!0-9]*)
      echo "SUBSCRIPTION_INTERVAL must be a non-negative integer" >&2
      exit 1
      ;;
  esac

  if ! update_subscription && [ ! -e "${config_file}" ]; then
    echo "No cached configuration is available; refusing to start" >&2
    exit 1
  fi
fi

if [ ! -e "${config_file}" ]; then
  cp "${default_config_file}" "${config_file}"
  echo "Initialized default configuration at ${config_file}"
fi

if [ -n "${subscription_url}" ] && [ "${subscription_interval}" -gt 0 ]; then
  mihomo_pid=$$
  (
    while sleep "${subscription_interval}"; do
      if update_subscription && [ "${config_changed}" = true ]; then
        if kill -HUP "${mihomo_pid}"; then
          echo "Requested Mihomo configuration reload"
        else
          echo "Failed to request Mihomo configuration reload" >&2
          exit 1
        fi
      fi
    done
  ) &
fi

exec "${mihomo_bin}" -d "${config_dir}" "$@"
