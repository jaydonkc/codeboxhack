#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
version=$(xcodebuild -version | awk '/^Xcode / {print $2}')
major=$(printf '%s' "$version" | cut -d. -f1)
minor=$(printf '%s' "$version" | cut -d. -f2)
if [ "$major" -lt 26 ] || { [ "$major" -eq 26 ] && [ "$minor" -lt 4 ]; }; then
  echo "Expo SDK 57 requires Xcode 26.4 or newer. Selected Xcode: $version." >&2
  echo 'Update Xcode, then rerun npm run ios -- --device with your trusted iPhone connected.' >&2
  exit 1
fi
npx expo run:ios "$@"
