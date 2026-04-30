FROM node:22.20.0-alpine@sha256:cb3143549582cc5f74f26f0992cdef4a422b22128cb517f94173a5f910fa4ee7 AS builder

WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build:bundle
RUN npm ci --omit=dev --ignore-scripts

FROM node:22.20.0-alpine@sha256:cb3143549582cc5f74f26f0992cdef4a422b22128cb517f94173a5f910fa4ee7 AS final

WORKDIR /app
COPY --chown=node:node --from=builder /app/build/* ./

ENV NODE_ENV="production"
ENV PORT=4401

EXPOSE $PORT
USER node

ENTRYPOINT ["node", "--enable-source-maps", "/app/server.js"]
