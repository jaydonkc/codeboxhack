#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -f .local/android-debug.jks ]; then
  echo 'Missing the local Android signing certificate. Configure a key for your certificate before running this build.' >&2
  exit 1
fi
npx expo prebuild --platform android
cp .local/android-debug.jks android/app/debug.keystore
npx expo run:android "$@"
