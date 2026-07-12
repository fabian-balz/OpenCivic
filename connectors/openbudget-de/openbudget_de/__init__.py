# SPDX-FileCopyrightText: 2026 OpenCivic Contributors
# SPDX-License-Identifier: Apache-2.0
"""OpenData-Connector für den (Beispiel-)Bundeshaushalt.

Erzeugt einen unveränderlichen Bronze-Snapshot (Rohbytes + Metadaten + sha-256-Hash) gemäß dem
JSON-Contract zwischen Node-Orchestrierung und Python-Connectors (ADR-0009 / ADR-0016). Der
Connector nutzt ausschließlich die Standardbibliothek — reproduzierbar und ohne Installations-
schritt lauffähig.
"""

__version__ = "0.1.0"
