#!/bin/sh
# Copyright 2013 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

#from https://chromium.googlesource.com/chromium/src/+/
#master/chrome/common/extensions/docs/examples/api/
#nativeMessaging/host/uninstall_host.sh

set -e
if [ "$(whoami)" = "root" ]; then
  TARGET_DIR="/Library/Application Support/Google/Chrome/NativeMessagingHosts"
else
  TARGET_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
fi
HOST_NAME=com.reddit.topic
rm "$TARGET_DIR/$HOST_NAME.json"
echo "Native messaging host $HOST_NAME has been uninstalled for Chrome from $TARGET_DIR."