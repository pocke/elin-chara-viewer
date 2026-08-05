# The Node version here and .node-version are checked against each other by CI.
FROM node:24.11.1-trixie-slim

# git for next.config.ts's `git log`, and the certificates its https needs.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

ENV NPM_CONFIG_CACHE=/npm-cache
ENV NEXT_TELEMETRY_DISABLED=1

# An empty named volume takes its owner from the image's directory, and one
# Docker has to create itself is owned by root, which npm cannot write to.
RUN mkdir -p /app/node_modules /npm-cache \
  && chown node:node /app/node_modules /npm-cache

WORKDIR /app
USER node
