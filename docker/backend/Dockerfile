FROM ryanlee2014/cupoj-backend-env:1.0.0

LABEL maintainer="Ryan Lee" \
      email="gxlhybh@gmail.com"
# Binds to port
EXPOSE 3000

#  Defines your runtime(define default command)
# These commands unlike RUN (they are carried out in the construction of the container) are run when the container
CMD ["sh", "-c", "cd /backend && NODE_ENV=production MODE=http node ./dist/bin/master.js"]
