
# Pull base image.
FROM ubuntu:20.04

LABEL maintainer="Ryan Lee" \
      email="gxlhybh@gmail.com"

# Install Node.js
ENV DEBIAN_FRONTEND=noninteractive
RUN set -xe && \
    apt-get update && \
    apt-get install --yes curl git vim build-essential gnupg && \
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get update && \
    apt-get install --yes nodejs && \
    node -v && npm -v && \
    mkdir -p /backend

WORKDIR /backend

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build && \
    mkdir -p /config && \
    ln -sf /config/config.json /backend/config.json

CMD ["sh", "-c", "echo 'Base image built successfully!'"]
