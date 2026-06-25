#!/bin/bash
set -e

INSTALL_DIR="/home/z/my-project"

# install bun if missing
if ! command -v bun &>/dev/null; then
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

rm -rf "$INSTALL_DIR"
git clone https://github.com/qudwad/my-website.git "$INSTALL_DIR"
cd "$INSTALL_DIR"
bun install
bun run dev
