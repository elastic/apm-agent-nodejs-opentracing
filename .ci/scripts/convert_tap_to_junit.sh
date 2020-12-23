#!/usr/bin/env bash
set -xueo pipefail

NODE_VERSION=12
USER_ID="$(id -u):$(id -g)"

docker run --rm \
  -v $(pwd):/usr/src/app \
  -w /usr/src/app \
  -u "${USER_ID}" \
  "node:${NODE_VERSION}" \
  sh -c 'export HOME=/tmp ; 
    mkdir ~/.npm-global; 
    npm config set prefix ~/.npm-global ; 
    npm install tap-xunit -g ; 
    for i in *-output.tap ; 
    do 
      cat ${i} | /tmp/.npm-global/bin/tap-xunit --package="Node.js" > ${i%.*}-junit.xml ; 
    done
    '

