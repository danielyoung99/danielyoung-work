#!/bin/sh
# Rebuild and mirror to the local preview folder (the preview server can't read Google Drive)
cd "$(dirname "$0")/.." && python3 _src/build.py >/dev/null && rsync -a --delete --exclude _src ./ /private/tmp/claude-501/dy-rebuild/
