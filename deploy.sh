#!/usr/bin/env bash
set -e # halt script on error

# If this is the deploy branch, push it up to gh-pages
if [ "$TRAVIS_BRANCH" == "v0__1" ]; then
  cd app
  git init
  git config user.name "Travis-CI"
  git config user.email "travis@somewhere.com"
  git add .
  git commit -m "CI deploy to gh-pages"
  git push --force --quiet --set-upstream https://-:${GH_TOKEN}@${GH_REF} master > /dev/null 2>&1
else
  echo "Not a publishable branch so we're all done here"
fi
