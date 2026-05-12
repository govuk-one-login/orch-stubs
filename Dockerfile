FROM node:24.15.0-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS builder

WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build:bundle
RUN npm ci --omit=dev --ignore-scripts

FROM node:24.15.0-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS final

WORKDIR /app
COPY --chown=node:node --from=builder /app/build/* ./

ENV NODE_ENV="production"
ENV PORT=4401

EXPOSE $PORT
USER node

ENTRYPOINT ["node", "--enable-source-maps", "/app/server.js"]
