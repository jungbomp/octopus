# The production image
FROM node:16-alpine

ARG NODE_ENV=production
ENV NODE_ENV={NODE_ENV}

WORKDIR /usr/src/app

COPY --chown=node:node . /usr/src/app

RUN npm ci --only=production && npm cache clean --force --logleven=error
RUN npm install pm2 -g
RUN npm install typescript -g

USER node

CMD ["pm2-runtime", "ecosystem.config.js", "--only", "octopus", "--env", "production"]