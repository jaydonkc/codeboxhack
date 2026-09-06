#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

# Expo SDK 57 otherwise launches the standalone macOS debugger during startup,
# even when nobody has opened DevTools. Headless startup skips that helper.
export EXPO_UNSTABLE_HEADLESS=1
# Preserve the usual project checks, web setup, and phone discovery defaults.
export EXPO_NO_DEPENDENCY_VALIDATION=0
export EXPO_NO_NEW_ARCH_COMPAT_CHECK=0
export EXPO_NO_WEB_SETUP=0
export EXPO_UNSTABLE_BONJOUR=1

exec npx expo start "$@"
