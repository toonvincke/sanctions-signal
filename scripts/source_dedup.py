"""Stable identities for published sanctions developments.

Keep jurisdiction + event type in identity, prefer official document reference.
Never strip meaningful URL query parameters (e.g. EU CELEX IDs).
"""
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

TRACKING_KEYS = {"fbclid", "gclid", "mc_cid", "mc_eid", "ref", "source"}

def normalize_url(url: str) -> str:
    parts = urlsplit(url.strip())
    if parts.scheme.lower() not in ("http", "https") or not parts.hostname:
        raise ValueError("Expected an absolute HTTP(S) URL")
    host = parts.hostname.lower()
    if parts.port:
        host += f":{parts.port}"
    query = sorted(
        (key, value) for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if key.lower() not in TRACKING_KEYS and not key.lower().startswith("utm_")
    )
    return urlunsplit((parts.scheme.lower(), host, parts.path.rstrip("/") or "/", urlencode(query), ""))

def event_identity(jurisdiction: str, category: str, url: str, official_id: str | None = None) -> tuple[str, str, str]:
    prefix = (jurisdiction.strip().upper(), category.strip().lower())
    if not all(prefix):
        raise ValueError("Jurisdiction and category are mandatory")
    if official_id and official_id.strip():
        return (*prefix, "document:" + official_id.strip().upper())
    return (*prefix, "url:" + normalize_url(url))
