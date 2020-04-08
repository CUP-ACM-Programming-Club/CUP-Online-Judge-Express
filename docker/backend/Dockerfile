
# Pull base image.
FROM ubuntu:18.04

# Install Node.js
RUN set -xe && \
    cp /etc/apt/sources.list /etc/apt/sources.list.bak && \
    apt-get update && \
    apt-get install --yes curl git vim npm build-essential && \
    npm -g install n && \
    n latest && \
    export PATH="$PATH"
RUN set -xe && \
    git clone https://github.com/CUP-ACM-Programming-Club/CUP-Online-Judge-Express.git backend && \
    cd backend && \
    npm i && \
    npm run build && \
    ln -s /config/config.json /backend/config.json

# Binds to port
EXPOSE 3000

#  Defines your runtime(define default command)
# These commands unlike RUN (they are carried out in the construction of the container) are run when the container
CMD ["sh", "-c", "cd /backend && NODE_ENV=production MODE=http node ./dist/bin/master.js"]
