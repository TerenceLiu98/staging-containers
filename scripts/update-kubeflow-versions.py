#!/usr/bin/env python3
import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser
from pathlib import Path


PYPI_URL = "https://pypi.org/pypi/{package}/json"
GITHUB_RELEASE_URL = "https://api.github.com/repos/{repo}/releases/latest"
CLAUDE_CODE_RELEASE_URL = "https://downloads.claude.ai/claude-code-releases"
PYTORCH_INDEX_URL = "https://download.pytorch.org/whl/{index}/torch/"
DOCKERHUB_CUDA_TAGS_URL = "https://hub.docker.com/v2/repositories/nvidia/cuda/tags/?page_size=100&name={prefix}."
CUDA_UBUNTU_BASES = ("ubuntu24.04", "ubuntu22.04")

PYTORCH_CUDA_INDEXES = ("cu130", "cu128", "cu126", "cu124")
CUDA_VERSION_BY_INDEX = {
    "cu130": "13.0",
    "cu128": "12.8",
    "cu126": "12.6",
    "cu124": "12.4",
}

LATEST_PYPI_PACKAGES = {
    "TRANSFORMERS_VERSION": "transformers",
    "ACCELERATE_VERSION": "accelerate",
    "DATASETS_VERSION": "datasets",
    "PEFT_VERSION": "peft",
    "TRL_VERSION": "trl",
    "BITSANDBYTES_VERSION": "bitsandbytes",
    "SENTENCEPIECE_VERSION": "sentencepiece",
    "UV_VERSION": "uv",
    "DEEPSPEED_VERSION": "deepspeed",
}

KUBECODE_BUNDLE_KEYS = (
    "KUBECODE_VERSION",
    "CODEX_CLI_VERSION",
    "CODEX_CLI_SHA256_AMD64",
    "CODEX_CLI_SHA256_ARM64",
    "CLAUDE_CODE_VERSION",
    "CLAUDE_CODE_SHA256_AMD64",
    "CLAUDE_CODE_SHA256_ARM64",
)


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        for key, value in attrs:
            if key == "href":
                self.links.append(value)


def fetch_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": "staging-container-version-updater"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def fetch_text(url):
    request = urllib.request.Request(url, headers={"User-Agent": "staging-container-version-updater"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def version_key(version):
    parts = re.split(r"[.+-]", version)
    key = []
    for part in parts:
        if part.isdigit():
            key.append((0, int(part)))
        else:
            key.append((1, part))
    return key


def is_stable(version):
    return not re.search(r"(a|alpha|b|beta|rc|dev)", version, re.IGNORECASE)


def latest_pypi_version(package):
    data = fetch_json(PYPI_URL.format(package=package))
    versions = [v for v in data["releases"] if is_stable(v) and data["releases"][v]]
    if not versions:
        raise RuntimeError(f"No stable PyPI releases found for {package}")
    return sorted(versions, key=version_key)[-1]


def latest_code_server_version():
    data = fetch_json(GITHUB_RELEASE_URL.format(repo="coder/code-server"))
    tag = data["tag_name"]
    return tag.removeprefix("v")


def latest_kubecode_release():
    release = fetch_json(GITHUB_RELEASE_URL.format(repo="Bayes-Cluster/kubecode"))
    tag = release["tag_name"]
    if not tag.startswith("v"):
        raise RuntimeError(f"Unexpected Kubecode release tag: {tag}")
    version = tag.removeprefix("v")
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version):
        raise RuntimeError(f"Invalid Kubecode version: {version}")
    return {"KUBECODE_VERSION": version}


def release_asset_sha256(release, asset_name):
    for asset in release.get("assets", []):
        if asset.get("name") != asset_name:
            continue
        digest = asset.get("digest", "")
        if not digest.startswith("sha256:"):
            raise RuntimeError(f"No SHA-256 digest found for release asset {asset_name}")
        checksum = digest.removeprefix("sha256:")
        if not re.fullmatch(r"[a-f0-9]{64}", checksum):
            raise RuntimeError(f"Invalid SHA-256 digest for release asset {asset_name}")
        return checksum
    raise RuntimeError(f"Release asset not found: {asset_name}")


def latest_codex_cli_release():
    release = fetch_json(GITHUB_RELEASE_URL.format(repo="openai/codex"))
    version = release["tag_name"].removeprefix("rust-v")
    return {
        "CODEX_CLI_VERSION": version,
        "CODEX_CLI_SHA256_AMD64": release_asset_sha256(
            release, "codex-x86_64-unknown-linux-musl.tar.gz"
        ),
        "CODEX_CLI_SHA256_ARM64": release_asset_sha256(
            release, "codex-aarch64-unknown-linux-musl.tar.gz"
        ),
    }


def latest_claude_code_release():
    version = fetch_text(f"{CLAUDE_CODE_RELEASE_URL}/latest").strip()
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+(?:-[^\s]+)?", version):
        raise RuntimeError(f"Invalid Claude Code version: {version}")
    manifest = fetch_json(f"{CLAUDE_CODE_RELEASE_URL}/{version}/manifest.json")
    platforms = manifest.get("platforms", {})
    checksums = {}
    for variable, platform in (
        ("CLAUDE_CODE_SHA256_AMD64", "linux-x64"),
        ("CLAUDE_CODE_SHA256_ARM64", "linux-arm64"),
    ):
        checksum = platforms.get(platform, {}).get("checksum", "")
        if not re.fullmatch(r"[a-f0-9]{64}", checksum):
            raise RuntimeError(f"Invalid Claude Code checksum for {platform}")
        checksums[variable] = checksum
    return {"CLAUDE_CODE_VERSION": version, **checksums}


def requires_dist_for(package, version):
    data = fetch_json(PYPI_URL.format(package=package))
    urls = data["releases"].get(version, [])
    if not urls:
        raise RuntimeError(f"No files found for {package}=={version}")
    release_url = f"https://pypi.org/pypi/{package}/{version}/json"
    release_data = fetch_json(release_url)
    return release_data["info"].get("requires_dist") or []


def torch_pin_from_requires(requires):
    for requirement in requires:
        if not requirement.startswith("torch"):
            continue
        match = re.search(r"torch\s*==\s*([0-9][^;,\s)]*)", requirement)
        if match:
            return match.group(1)
    return None


def xformers_pin_from_requires(requires):
    for requirement in requires:
        if not requirement.startswith("xformers"):
            continue
        match = re.search(r"xformers\s*==\s*([0-9][^;,\s)]*)", requirement)
        if match:
            return match.group(1)
    return None


def torchvision_for_torch(torch_version):
    match = re.match(r"^(\d+)\.(\d+)\.(\d+)", torch_version)
    if not match:
        raise RuntimeError(f"Cannot derive torchvision version from torch {torch_version}")
    major, minor, patch = map(int, match.groups())
    if major != 2:
        raise RuntimeError(f"Unsupported torch major version for torchvision mapping: {torch_version}")
    return f"0.{minor + 15}.{patch}"


def torch_exists_in_index(torch_version, cuda_index):
    html = fetch_text(PYTORCH_INDEX_URL.format(index=cuda_index))
    parser = LinkParser()
    parser.feed(html)
    needle = f"torch-{torch_version}%2B{cuda_index}"
    return any(needle in link for link in parser.links)


def choose_cuda_index(torch_version):
    for cuda_index in PYTORCH_CUDA_INDEXES:
        try:
            if torch_exists_in_index(torch_version, cuda_index):
                return cuda_index
        except urllib.error.HTTPError:
            continue
    raise RuntimeError(f"No supported CUDA wheel index found for torch=={torch_version}")


def cuda_indexes_for_torch(torch_version):
    indexes = []
    for cuda_index in PYTORCH_CUDA_INDEXES:
        try:
            if torch_exists_in_index(torch_version, cuda_index):
                indexes.append(cuda_index)
        except urllib.error.HTTPError:
            continue
    return indexes


def latest_cuda_devel_image(cuda_version):
    data = fetch_json(DOCKERHUB_CUDA_TAGS_URL.format(prefix=cuda_version))
    names = [result.get("name", "") for result in data.get("results", [])]
    for ubuntu_base in CUDA_UBUNTU_BASES:
        suffix = f"-devel-{ubuntu_base}"
        tags = [
            name
            for name in names
            if name.startswith(f"{cuda_version}.") and name.endswith(suffix)
        ]
        if tags:
            return f"nvidia/cuda:{sorted(tags, key=version_key)[-1]}"
    return f"nvidia/cuda:{cuda_version}.0-devel-ubuntu22.04"


def latest_xformers_for_torch(torch_version):
    data = fetch_json(PYPI_URL.format(package="xformers"))
    versions = sorted(
        [v for v in data["releases"] if is_stable(v) and data["releases"][v]],
        key=version_key,
        reverse=True,
    )
    for version in versions:
        try:
            requires = requires_dist_for("xformers", version)
        except Exception:
            continue
        required_torch = torch_pin_from_requires(requires)
        if required_torch == torch_version:
            return version
    raise RuntimeError(f"No xformers release found that pins torch=={torch_version}")


def read_env(path):
    values = {}
    for line in path.read_text().splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key] = value
    return values


def write_env(path, values):
    lines = []
    seen = set()
    for line in path.read_text().splitlines():
        if not line or line.startswith("#") or "=" not in line:
            lines.append(line)
            continue
        key, _ = line.split("=", 1)
        if key in values:
            lines.append(f"{key}={values[key]}")
            seen.add(key)
        else:
            lines.append(line)
    for key, value in values.items():
        if key not in seen:
            lines.append(f"{key}={value}")
    path.write_text("\n".join(lines) + "\n")


def bump_kubecode_image_revision(current, updates):
    if not any(
        key in updates and updates[key] != current.get(key)
        for key in KUBECODE_BUNDLE_KEYS
    ):
        return

    revision = current.get("KUBECODE_IMAGE_REVISION", "")
    if not revision.isdigit():
        raise RuntimeError(f"Invalid KUBECODE_IMAGE_REVISION: {revision!r}")
    updates["KUBECODE_IMAGE_REVISION"] = str(int(revision) + 1)


def update_versions(current, include_code_server):
    updates = {}
    if include_code_server:
        updates["CODESERVER_VERSION"] = latest_code_server_version()
    updates.update(latest_kubecode_release())
    updates.update(latest_codex_cli_release())
    updates.update(latest_claude_code_release())

    vllm_data = fetch_json(PYPI_URL.format(package="vllm"))
    vllm_versions = sorted(
        [v for v in vllm_data["releases"] if is_stable(v) and vllm_data["releases"][v]],
        key=version_key,
        reverse=True,
    )

    selected = None
    errors = []
    for vllm_version in vllm_versions:
        try:
            vllm_requires = requires_dist_for("vllm", vllm_version)
            torch_version = torch_pin_from_requires(vllm_requires)
            if not torch_version:
                errors.append(f"vllm=={vllm_version}: no exact torch pin")
                continue
            cuda_index = choose_cuda_index(torch_version)
            xformers_version = (
                xformers_pin_from_requires(vllm_requires)
                or latest_xformers_for_torch(torch_version)
            )
            selected = (vllm_version, torch_version, cuda_index, xformers_version)
            break
        except Exception as exc:
            errors.append(f"vllm=={vllm_version}: {exc}")
            continue

    if selected is None:
        detail = "\n".join(errors[:20])
        raise RuntimeError(f"No compatible vLLM/PyTorch/CUDA/xFormers combination found.\n{detail}")

    vllm_version, torch_version, cuda_index, xformers_version = selected
    cuda_version = CUDA_VERSION_BY_INDEX[cuda_index]

    updates.update(
        {
            "VLLM_VERSION": vllm_version,
            "PYTORCH_VERSION": torch_version,
            "TORCHAUDIO_VERSION": torch_version,
            "TORCHVISION_VERSION": torchvision_for_torch(torch_version),
            "PYTORCH_CUDA_INDEX": cuda_index,
            "LLM_PYTORCH_CUDA_INDEX": cuda_index,
            "CUDA_VERSION": cuda_version,
            "LLM_BASE_IMAGE": latest_cuda_devel_image(cuda_version),
            "XFORMERS_VERSION": xformers_version,
        }
    )

    for variable, package in LATEST_PYPI_PACKAGES.items():
        updates[variable] = latest_pypi_version(package)

    return updates


def build_llm_matrix(current, per_cuda):
    common = {}
    if "CODESERVER_VERSION" in current:
        common["CODESERVER_VERSION"] = current["CODESERVER_VERSION"]
    else:
        common["CODESERVER_VERSION"] = latest_code_server_version()
    for variable, package in LATEST_PYPI_PACKAGES.items():
        common[variable] = latest_pypi_version(package)

    vllm_data = fetch_json(PYPI_URL.format(package="vllm"))
    vllm_versions = sorted(
        [v for v in vllm_data["releases"] if is_stable(v) and vllm_data["releases"][v]],
        key=version_key,
        reverse=True,
    )

    records = []
    counts = {cuda_index: 0 for cuda_index in PYTORCH_CUDA_INDEXES}
    seen = set()

    for vllm_version in vllm_versions:
        if all(count >= per_cuda for count in counts.values()):
            break
        try:
            vllm_requires = requires_dist_for("vllm", vllm_version)
            torch_version = torch_pin_from_requires(vllm_requires)
            if not torch_version:
                continue
            xformers_version = (
                xformers_pin_from_requires(vllm_requires)
                or latest_xformers_for_torch(torch_version)
            )
            cuda_indexes = cuda_indexes_for_torch(torch_version)
            if not cuda_indexes:
                continue
        except Exception:
            continue

        for cuda_index in cuda_indexes:
            if counts[cuda_index] >= per_cuda:
                continue
            key = (cuda_index, torch_version, vllm_version)
            if key in seen:
                continue
            cuda_version = CUDA_VERSION_BY_INDEX[cuda_index]
            variant = f"cuda{cuda_version}-torch{torch_version}-vllm{vllm_version}"
            record = {
                "variant": variant,
                "cuda_version": cuda_version,
                "pytorch_cuda_index": cuda_index,
                "llm_pytorch_cuda_index": cuda_index,
                "llm_base_image": latest_cuda_devel_image(cuda_version),
                "pytorch_version": torch_version,
                "torchaudio_version": torch_version,
                "torchvision_version": torchvision_for_torch(torch_version),
                "vllm_version": vllm_version,
                "xformers_version": xformers_version,
                "latest": not records,
            }
            record.update(
                {
                    "code_server_version": common["CODESERVER_VERSION"],
                    "uv_version": common["UV_VERSION"],
                    "deepspeed_version": common["DEEPSPEED_VERSION"],
                    "transformers_version": common["TRANSFORMERS_VERSION"],
                    "accelerate_version": common["ACCELERATE_VERSION"],
                    "datasets_version": common["DATASETS_VERSION"],
                    "peft_version": common["PEFT_VERSION"],
                    "trl_version": common["TRL_VERSION"],
                    "bitsandbytes_version": common["BITSANDBYTES_VERSION"],
                    "sentencepiece_version": common["SENTENCEPIECE_VERSION"],
                }
            )
            records.append(record)
            seen.add(key)
            counts[cuda_index] += 1

    if not records:
        raise RuntimeError("No compatible code-server-llm matrix entries found")

    return {"include": records}


def main():
    parser = argparse.ArgumentParser(description="Update Kubeflow image versions.")
    parser.add_argument("--file", default="versions/kubeflow.env")
    parser.add_argument("--skip-code-server", action="store_true")
    parser.add_argument("--print-only", action="store_true")
    parser.add_argument("--write-llm-matrix")
    parser.add_argument("--llm-matrix-per-cuda", type=int, default=1)
    args = parser.parse_args()

    path = Path(args.file)
    current = read_env(path)
    updates = update_versions(current, include_code_server=not args.skip_code_server)
    bump_kubecode_image_revision(current, updates)

    if args.print_only:
        for key in sorted(updates):
            print(f"{key}={updates[key]}")
        return

    write_env(path, updates)
    for key in sorted(updates):
        old = current.get(key, "<unset>")
        new = updates[key]
        if old != new:
            print(f"{key}: {old} -> {new}")

    if args.write_llm_matrix:
        refreshed = read_env(path)
        matrix = build_llm_matrix(refreshed, per_cuda=args.llm_matrix_per_cuda)
        matrix_path = Path(args.write_llm_matrix)
        matrix_path.write_text(json.dumps(matrix, indent=2, sort_keys=True) + "\n")
        print(f"Wrote {len(matrix['include'])} code-server-llm matrix entries to {matrix_path}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
