# SPDX-FileCopyrightText: 2026 OpenCivic Contributors
# SPDX-License-Identifier: Apache-2.0
"""Vertragstests für den Bronze-Envelope des OpenBudget-DE-Connectors."""
from __future__ import annotations

import base64
from pathlib import Path

from openbudget_de.cli import build_bronze

REPO_ROOT = Path(__file__).resolve().parents[3]
SAMPLE = REPO_ROOT / "data" / "samples" / "bundeshaushalt-2025-excerpt.csv"


def test_bronze_envelope_shape() -> None:
    bronze = build_bronze(SAMPLE, retrieved_at="2026-02-01T09:00:00+00:00")
    # Pflichtfelder des Contracts
    for key in (
        "connector",
        "connector_version",
        "source",
        "retrieved_at",
        "media_type",
        "byte_size",
        "content_hash",
        "content_base64",
    ):
        assert key in bronze, f"Pflichtfeld fehlt: {key}"
    assert bronze["connector"] == "openbudget-de"
    assert bronze["media_type"] == "text/csv"
    assert bronze["source"]["jurisdiction"] == "DE"
    assert bronze["content_hash"].startswith("sha256:")


def test_bronze_is_deterministic_and_roundtrips() -> None:
    a = build_bronze(SAMPLE, retrieved_at="2026-02-01T09:00:00+00:00")
    b = build_bronze(SAMPLE, retrieved_at="2026-02-01T09:00:00+00:00")
    # Reproduzierbarkeit: gleicher Input -> gleicher Hash & Inhalt
    assert a["content_hash"] == b["content_hash"]
    assert a["content_base64"] == b["content_base64"]
    # Rohbytes sind verlustfrei eingebettet
    decoded = base64.b64decode(a["content_base64"])
    assert decoded == SAMPLE.read_bytes()
    assert a["byte_size"] == len(decoded)
