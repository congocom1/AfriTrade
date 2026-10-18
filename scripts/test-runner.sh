#!/usr/bin/env bash
# Test runner for gstack lanes: dispatches to node --test for unit tests,
# npx playwright test for Playwright E2E specs.
set -euo pipefail

FILES=()
for arg in "$@"; do
  case "$arg" in
    --*) ;;
    *) FILES+=("$arg") ;;
  esac
done

if [ ${#FILES[@]} -eq 0 ]; then
  echo "usage: $0 <test files...>" >&2
  exit 2
fi

UNIT=()
PLAYWRIGHT=()
for f in "${FILES[@]}"; do
  case "$f" in
    test/e2e/*.spec.js) PLAYWRIGHT+=("$f") ;;
    *) UNIT+=("$f") ;;
  esac
done

EXIT=0

if [ ${#UNIT[@]} -gt 0 ]; then
  node --test --import ./test/setup.mjs "${UNIT[@]}" || EXIT=$?
fi

if [ ${#PLAYWRIGHT[@]} -gt 0 ]; then
  npx playwright test "${PLAYWRIGHT[@]}" || EXIT=$?
fi

exit $EXIT
