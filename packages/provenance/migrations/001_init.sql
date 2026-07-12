-- SPDX-FileCopyrightText: 2026 OpenCivic Contributors
-- SPDX-License-Identifier: Apache-2.0
--
-- OpenCivic Provenance-Kernschema (materialisiert ADR-0006 W3C-PROV-Subset,
-- ADR-0007 Bitemporalität/Append-only/Lifecycle, ADR-0008 Jurisdiktions-Achse).
-- PostgreSQL 16 (ADR-0014). Kein pgvector nötig (erst Phase 4).

BEGIN;

-- PROV Agent: Publisher / Pipeline / Kurator. Keine Endnutzer-PII (Leitprinzip 6).
CREATE TABLE agent (
    id          text PRIMARY KEY,
    kind        text NOT NULL CHECK (kind IN ('software', 'organization', 'person')),
    name        text NOT NULL,
    identifier  text
);

-- Codierte, hierarchische Jurisdiktion (ADR-0008): ISO 3166 + nationale Schlüssel.
CREATE TABLE jurisdiction (
    code         text PRIMARY KEY,
    parent_code  text REFERENCES jurisdiction (code),
    level        text NOT NULL CHECK (level IN ('country', 'state', 'district', 'municipality')),
    name         text NOT NULL
);

-- Stabile, zitierbare Herkunft (PROV Entity).
CREATE TABLE source (
    id                 text PRIMARY KEY,
    name               text NOT NULL,
    type               text NOT NULL,
    publisher_id       text NOT NULL REFERENCES agent (id),
    canonical_uri      text,
    default_license    text,               -- SPDX-Identifier
    jurisdiction_code  text NOT NULL REFERENCES jurisdiction (code),
    created_at         timestamptz NOT NULL DEFAULT now()
);

-- Konkreter Abruf = Bronze-Snapshot. Unveränderlich (append-only, ADR-0007).
CREATE TABLE source_version (
    id                      text PRIMARY KEY,
    source_id               text NOT NULL REFERENCES source (id),
    retrieved_at            timestamptz NOT NULL,
    content_hash            text NOT NULL,          -- sha256:…  (Integrität, R11)
    storage_ref             text NOT NULL,          -- Objektspeicher-/Dateiverweis auf die Rohbytes
    media_type              text NOT NULL,
    byte_size               bigint NOT NULL,
    upstream_version_label  text,
    license                 text,                   -- SPDX-Override der Quelle
    revision_of             text REFERENCES source_version (id)
);

CREATE TABLE dataset (
    id      text PRIMARY KEY,
    module  text NOT NULL,           -- z. B. 'openbudget'
    name    text NOT NULL
);

-- Abgeleitete Silver/Gold-Version (PROV Entity, wasDerivedFrom source_version).
CREATE TABLE dataset_version (
    id             text PRIMARY KEY,
    dataset_id     text NOT NULL REFERENCES dataset (id),
    layer          text NOT NULL CHECK (layer IN ('silver', 'gold')),
    schema_version text NOT NULL,
    produced_at    timestamptz NOT NULL DEFAULT now(),
    pipeline_run_id text NOT NULL,
    code_version   text NOT NULL,    -- git-sha / Digest (Reproduzierbarkeit, Leitprinzip 4)
    content_hash   text
);

-- n:m dataset_version ↔ source_version (Lineage: woraus wurde abgeleitet).
CREATE TABLE dataset_version_input (
    dataset_version_id  text NOT NULL REFERENCES dataset_version (id),
    source_version_id   text NOT NULL REFERENCES source_version (id),
    PRIMARY KEY (dataset_version_id, source_version_id)
);

-- Atomare, zitierbare Aussage (das Herz). Bitemporal + Lifecycle (ADR-0007).
CREATE TABLE statement (
    id                 text PRIMARY KEY,
    subject_ref        text NOT NULL,          -- Domänenschlüssel, z. B. titel:0601-68501
    subject_label      text NOT NULL,          -- menschenlesbar (Suche/Anzeige)
    aspect             text NOT NULL,          -- Prädikat, z. B. 'ansatz'
    value              jsonb NOT NULL,         -- typisierter Wert
    unit               text,                   -- ISO 4217 bei Beträgen (z. B. 'EUR')
    valid_time         daterange NOT NULL,     -- Realwelt-Gültigkeit
    sys_from           timestamptz NOT NULL DEFAULT now(),  -- System-/Transaktionszeit …
    sys_to             timestamptz,            -- … NULL = aktuell gültige Fassung
    jurisdiction_code  text NOT NULL REFERENCES jurisdiction (code),
    nature             text NOT NULL CHECK (nature IN ('primary', 'derived')),
    dataset_version_id text NOT NULL REFERENCES dataset_version (id),  -- Quellenzwang: NOT NULL
    record_locator     text NOT NULL,          -- Position im Datensatz
    lifecycle          text NOT NULL DEFAULT 'active'
                       CHECK (lifecycle IN ('active', 'superseded', 'retracted')),
    lifecycle_reason   text,
    revision_of        text REFERENCES statement (id),
    -- Volltext-Suchvektor (Postgres-FTS, ADR-0015), aus den Textfeldern generiert.
    search_vector      tsvector GENERATED ALWAYS AS (
        to_tsvector('german', coalesce(subject_label, '') || ' ' || coalesce(aspect, ''))
    ) STORED
);

CREATE INDEX statement_search_idx     ON statement USING gin (search_vector);
CREATE INDEX statement_current_idx    ON statement (dataset_version_id) WHERE sys_to IS NULL;
CREATE INDEX statement_subject_idx    ON statement (subject_ref);
CREATE INDEX dvi_source_version_idx   ON dataset_version_input (source_version_id);

-- QUELLENZWANG, technisch erzwungen (Leitprinzip 2, QA1):
-- Ein Statement darf nur existieren, wenn seine dataset_version mindestens einen
-- source_version-Input hat — d. h. jede Aussage ist bis zu einer Quelle auflösbar.
CREATE FUNCTION assert_statement_has_source() RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM dataset_version_input
        WHERE dataset_version_id = NEW.dataset_version_id
    ) THEN
        RAISE EXCEPTION
            'Quellenzwang verletzt: dataset_version % hat keine source_version (Statement %)',
            NEW.dataset_version_id, NEW.id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER statement_requires_source
    AFTER INSERT ON statement
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION assert_statement_has_source();

COMMIT;
