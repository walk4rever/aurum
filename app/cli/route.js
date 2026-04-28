export async function GET() {
  const script = `#!/usr/bin/env sh
set -eu

VERSION="\${AURUM_VERSION:-v0.5.2}"
PKG="github.com/walk4rever/aurum/cmd/aurum-agent@\${VERSION}"

if ! command -v go >/dev/null 2>&1; then
  echo "error: go is required to install aurum-agent via this script."
  echo "Install Go from https://go.dev/dl/ and re-run:"
  echo "  curl -fsSL https://aurum.air7.fun/cli | sh"
  exit 1
fi

echo "Installing aurum-agent (\${VERSION})..."
go install "\${PKG}"

BIN_DIR="$(go env GOPATH)/bin"
if ! command -v aurum-agent >/dev/null 2>&1; then
  echo
  echo "Installed, but 'aurum-agent' is not on PATH."
  echo "Add this to your shell profile:"
  echo "  export PATH=\\"\\$PATH:\${BIN_DIR}\\""
  echo
  echo "Then run:"
  echo "  aurum-agent version"
  exit 0
fi

aurum-agent version
`;

  return new Response(script, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
