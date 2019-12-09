#!/usr/bin/env bash
set -exuo pipefail

NODE_VERSION=${1:?Nodejs version missing NODE_VERSION is not set}
USER_ID="$(id -u):$(id -g)"

docker run --rm -t \
  -v $(pwd):/src \
  -w /src \
  -u "${USER_ID}" \
  -e HOME=/tmp \
  -e CI=true \
  --name "node-${NODE_VERSION}" \
  node:${NODE_VERSION} \
  /bin/bash -c """
  node --version
  npm --version
  npm install
  npm test | tee test-suite-output.tap
  """
