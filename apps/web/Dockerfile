# SPDX-FileCopyrightText: 2026 OpenCivic Contributors
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Web-Container (Standard-Profil, ADR-0002). SvelteKit SSR via adapter-node.
# TODO (ADR-0027): Basis-Images auf Digest pinnen.
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @opencivic/web build

FROM node:22-slim AS run
WORKDIR /app
# adapter-node bündelt die Server-Abhängigkeiten in build/ — nur dieses Verzeichnis wird benötigt.
COPY --from=build /app/apps/web/build ./build
ENV HOST=0.0.0.0
ENV PORT=3000
ENV OPENCIVIC_API_URL=http://api:3001
EXPOSE 3000
CMD ["node", "build"]
