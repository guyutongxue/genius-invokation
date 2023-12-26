#!/usr/bin/env bash

PACKAGES=("typings" "core" "data" "standalone")

for folder in "${PACKAGES[@]}"; do
  pushd "packages/$folder"
  bun run build
  popd
done
