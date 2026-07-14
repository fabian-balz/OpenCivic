# SPDX-FileCopyrightText: 2026 OpenCivic Contributors
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# API-Container (Standard-Profil, ADR-0002). Läuft die Fastify-API via tsx.
# TODO (ADR-0027): Basis-Image auf Digest pinnen statt Tag.
FROM node:22-slim

RUN corepack enable
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app

# Monorepo (pnpm-Workspaces) — für den MVP wird der gesamte Kontext kopiert.
COPY . .
RUN pnpm install --frozen-lockfile

ENV HOST=0.0.0.0
ENV PORT=3001
EXPOSE 3001
CMD ["pnpm", "--filter", "@opencivic/api", "start"]
