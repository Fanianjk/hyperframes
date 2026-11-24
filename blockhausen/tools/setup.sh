#!/bin/sh
# Fetch the pinned browser libraries into lib/ (kept out of git: too large).
set -e
cd "$(dirname "$0")/.."
mkdir -p lib
tmp="$(mktemp -d)"
(cd "$tmp" && npm pack --silent three@0.170.0 gsap@3.12.5 >/dev/null && tar xzf three-0.170.0.tgz && mv package three && tar xzf gsap-3.12.5.tgz)
cp "$tmp/three/build/three.module.min.js" lib/
cp "$tmp/package/dist/gsap.min.js" lib/
rm -rf "$tmp"
echo "lib/ ready"
