#!/bin/sh
# from https://chromium.googlesource.com/chromium/src/+/master/chrome/
# common/extensions/docs/examples/api/nativeMessaging/host/install_host.sh
set -e
DIR="$( cd "$( dirname "$0" )" && pwd )"
if [ "$(whoami)" = "root" ]; then
  TARGET_DIR="/Library/Application Support/Google/Chrome/NativeMessagingHosts"
else
  TARGET_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
fi
HOST_NAME=com.reddit.topic
BROWSER=Chrome
# Create directory to store native messaging host.
mkdir -p "$TARGET_DIR"
# Update host path in the manifest and copy to NativeMessaging folder
HOST_PATH="$(pwd)"/add-on/topics.py
ESCAPED_HOST_PATH=${HOST_PATH////\\/}
PATH_ARGUMENT="\t\"path\": \"$ESCAPED_HOST_PATH\","

awk -v insert="$PATH_ARGUMENT" '{print} NR==3{print insert}' "$DIR/$HOST_NAME.$BROWSER.json" > "$TARGET_DIR/$HOST_NAME.json"
# Set permissions for the manifest so that all users can read it.
chmod o+r "$TARGET_DIR/$HOST_NAME.json"
echo "Native messaging host $HOST_NAME has been installed for $BROWSER in $TARGET_DIR."