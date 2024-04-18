#!/bin/bash

# Automated Release Flow Script for Axiom SDK Client

# Exit script on any error
set -e

# Check if it's a dry run
DRY_RUN=${DRY_RUN:-false}

# Function to execute a command or echo it if dry run
execute() {
  if [ "$DRY_RUN" = "true" ]; then
    echo "Dry run: $@"
  else
    "$@"
  fi
}

# Ensure we're on the develop branch
execute git checkout develop

# Pull the latest changes
execute git pull origin develop

# Bump version number across all packages
# The version number should be passed as an argument to the script
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <version-number>"
    exit 1
fi

VERSION=$1

# Update versions using pnpm
execute pnpm versions $VERSION

# Build the packages
execute pnpm run build

# Run tests to ensure stability
execute pnpm run test

# Commit the version bump
execute git commit -am "chore: bump version to $VERSION"

# Create a new git tag for the release
execute git tag -a "v$VERSION" -m "Release $VERSION"

# Push the changes and tags to GitHub
execute git push origin develop --tags

# Publish the packages to npmjs in the specified order
execute pnpm publish-all

# Create a GitHub release with the new version number and changelog
# Requires GH CLI to be configured
execute gh release create "v$VERSION" --title "Release $VERSION" --notes "Release notes for version $VERSION"

echo "Release $VERSION completed successfully."
