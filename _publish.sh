#!/bin/sh
# Build the site, back it up, and publish it to danielyoung.work.
#   sh _publish.sh
# Shows you what changed and asks before anything goes live.
cd "$(dirname "$0")" || exit 1

python3 _build.py || exit 1

if [ -z "$(git status --porcelain)" ]; then
  echo "Nothing has changed, so there is nothing to publish."
  exit 0
fi

echo
echo "These files changed:"
git status --short
echo
printf "Publish these changes to danielyoung.work? (y/n) "
read answer
[ "$answer" = "y" ] || { echo "Cancelled. Nothing was published."; exit 0; }

printf "A few words describing the change (e.g. Updated Colloide copy): "
read message
[ -n "$message" ] || message="Update site content"

# Back up first, next to the site folder
BACKUPS="../danielyoung-work Backups"
mkdir -p "$BACKUPS"
ZIP="$BACKUPS/danielyoung-work $(date +%Y-%m-%d_%H%M) before publish.zip"
zip -qr "$ZIP" . -x ".git/*" && echo "Backup saved: $ZIP"

git add -A
git commit -q -m "$message" || exit 1
git push https://github.com/danielyoung99/danielyoung-work.git main || {
  echo "The push did not go through. Your changes are saved locally; run this again to retry."
  exit 1
}
echo
echo "Published. The live site updates in about 3 minutes."
