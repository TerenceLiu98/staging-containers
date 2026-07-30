# meta-bundle

`terencelau/meta-bundle` packages the Mihomo core and the zashboard static web
UI in one container. The bundled default configuration starts a mixed proxy on
port `7890` and serves the controller and dashboard on port `9090`.

## Quick start

```bash
docker run -d \
  --name meta-bundle \
  --restart unless-stopped \
  -p 7890:7890 \
  -p 9090:9090 \
  -v meta-bundle-data:/root/.config/mihomo \
  terencelau/meta-bundle:latest
```

Open `http://localhost:9090/ui/`. The default API secret is empty.

When the data volume does not contain `config.yaml`, the entrypoint initializes
it from the bundled default. Existing configuration is never overwritten.

## Docker Compose

```yaml
services:
  meta-bundle:
    image: terencelau/meta-bundle:latest
    container_name: meta-bundle
    restart: unless-stopped
    ports:
      - "7890:7890"
      - "9090:9090"
    volumes:
      - meta-bundle-data:/root/.config/mihomo

volumes:
  meta-bundle-data:
```

## Custom configuration

Mount a directory instead of the named volume:

```bash
docker run -d \
  --name meta-bundle \
  --restart unless-stopped \
  -p 7890:7890 \
  -p 9090:9090 \
  -v "$PWD/mihomo:/root/.config/mihomo" \
  terencelau/meta-bundle:latest
```

An empty directory is initialized automatically. A custom complete
configuration must keep these settings if the bundled dashboard should remain
available:

```yaml
external-controller: 0.0.0.0:9090
external-ui: /usr/share/zashboard
external-ui-url: https://github.com/Zephyruso/zashboard/releases/download/v3.16.0/dist.zip
```

The image also accepts additional Mihomo CLI flags after the image name.

## TUN mode

TUN requires a custom configuration that enables `tun`. A typical Linux launch
uses host networking and grants access to the TUN device:

```bash
docker run -d \
  --name meta-bundle \
  --restart unless-stopped \
  --network host \
  --cap-add NET_ADMIN \
  --device /dev/net/tun \
  -v meta-bundle-data:/root/.config/mihomo \
  terencelau/meta-bundle:latest
```

## Build

Pinned versions are stored in `../versions/meta-bundle.env`.

```bash
make build
make build TARGETPLATFORM=linux/arm64
make push REGISTRY_PREFIX=docker.io/your-name
```

When overriding `ZASHBOARD_VERSION`, also provide the matching
`ZASHBOARD_SHA256`.
