#
# Ubuntu Node.js Dockerfile
#
# https://github.com/dockerfile/ubuntu/blob/master/Dockerfile
# https://docs.docker.com/examples/nodejs_web_app/
#

# Pull base image.
FROM ubuntu:18.04

# Install Node.js
RUN set -xe && \
    cp /etc/apt/sources.list /etc/apt/sources.list.bak && \
    sed -i 's/http:\/\/archive.ubuntu.com/http:\/\/mirrors.aliyun.com/g' /etc/apt/sources.list && \
    sed -i 's/http:\/\/security.ubuntu.com/http:\/\/mirrors.aliyun.com/g' /etc/apt/sources.list && \
    apt-get update && \
    apt-get install --yes curl && \
    curl -sL https://deb.nodesource.com/setup_13.x | bash - && \
    apt-get install -y nodejs git vim && \
    npm config set registry https://registry.npm.taobao.org && \
    npm i -g pm2
RUN set -xe && \
    git clone https://github.com/CUP-ACM-Programming-Club/CUP-Online-Judge-Express.git backend && \
    cd backend && \
    npm i && \
    npm run build && \
    ln -s /config/config.json /backend/config.json

# Binds to port
EXPOSE 3000 3300

#  Defines your runtime(define default command)
# These commands unlike RUN (they are carried out in the construction of the container) are run when the container
CMD ["sh", "-c", "cd /backend && npm start && NODE_ENV=production MODE=websocket node ./dist/bin/main.js"]
