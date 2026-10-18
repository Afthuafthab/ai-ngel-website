#!/bin/bash
# One-command manual deploy (the GitHub Action does this automatically on every push to main).
set -e
cd "$(dirname "$0")"
rm -rf .deploy && mkdir .deploy
cp -r index.html thanks.html robots.txt sitemap.xml netlify.toml favicon.ico manifest.webmanifest css js vendor fonts assets .deploy/
netlify deploy --prod --dir .deploy --site d323fc89-a832-4061-80b5-d7d7b67eb5b7 --message "Manual deploy"
rm -rf .deploy
