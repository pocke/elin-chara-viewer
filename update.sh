#!/bin/bash

git fetch origin
git checkout origin/master

if git diff --name-only | grep versions/nightly > /dev/null; then
  build=Nightly
elif git diff --name-only | grep versions/EA > /dev/null; then
  build=Stable
fi

git add .
version="$(git diff --cached --name-only | grep db/EA | head -1 | cut -d / -f 2)"

ruby script/sync_version.rb
git add .

git commit -m "$version $build"
git new-br
git push -u origin
gh pr create 
gh pr merge --auto --merge --delete-branch
