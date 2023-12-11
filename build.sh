#!/usr/bin/env bash

for folder in packages/*; do
  if [[ -f "$folder/package.json" ]]; then
    cd "$folder"
    bun run build
    cd -
  fi
done
