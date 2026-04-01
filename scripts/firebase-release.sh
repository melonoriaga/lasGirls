#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Building site"
npm run firebase:build:site

echo "==> Deploying backend (Firestore rules/indexes + Storage rules)"
npm run firebase:deploy:backend

echo "==> Deploying hosting (Firebase App Hosting backend)"
npm run firebase:deploy:hosting

echo "==> Release complete"
