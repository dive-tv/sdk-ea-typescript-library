#!/bin/bash
set -o nounset
set -o errexit

REPO_ROOT=$(git rev-parse --show-toplevel)
echo "Git repo is at $REPO_ROOT"

BRANCH=$(git branch | cut -d' ' -f2)

if [ "$BRANCH" == "master" ]; then

    REMOTE=$(git branch -r | xargs)
    SITE_CHANGES=$(git diff "$BRANCH".."$REMOTE" | wc -l)

    echo "Detected $SITE_CHANGES changes"

    if [ "$SITE_CHANGES" -gt "0" ]; then
    VERSION_CHANGED=$(git diff "$BRANCH".."$REMOTE" -G '"version":' -- $REPO_ROOT/package.json | wc -l)

    if [ "$VERSION_CHANGED" -gt "0" ]; then
        echo "Version updated in package.json, go ahead.."
    else
        echo "*** ERROR Library version not updated in package.json :( Aborting push ***"
        exit 1
    fi
    fi
fi