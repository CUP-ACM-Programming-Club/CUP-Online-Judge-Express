
# Pull base image.
FROM ubuntu:20.04

LABEL maintainer="Ryan Lee" \
      email="gxlhybh@gmail.com"

# Install Node.js
RUN set -xe && \
    apt-get update && \
    apt-get install --yes curl git vim build-essential && \
    curl -sL https://deb.nodesource.com/setup_14.x | bash - && \
    apt-get update && \
    apt-get install --yes nodejs && \
    npm -g install n && \
    n latest && \
    export PATH="$PATH"
RUN set -xe && \
    git clone https://github.com/CUP-ACM-Programming-Club/CUP-Online-Judge-Express.git backend && \
    cd backend && \
    npm i && \
    npm run build && \
    ln -s /config/config.json /backend/config.json

CMD ["sh", "-c", "echo 'hello world!'"]
