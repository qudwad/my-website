#!/bin/bash
set -e

INSTALL_DIR="/home/z/my-project"

# install bun if missing
if ! command -v bun &>/dev/null; then
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

mkdir -p "$INSTALL_DIR"
if [ -d "$INSTALL_DIR/.git" ]; then
  cd "$INSTALL_DIR" && git pull
else
  git clone https://github.com/qudwad/my-website.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi
bun install
bun run dev
