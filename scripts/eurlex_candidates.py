"""Conservative EU OJ L RSS -> review candidates (SS-013).

This code does NOT publish or insert rows. RSS metadata is insufficient for
final legal conclusions; 'review' means editorial inspection only.
"""
from __future__ import annotations

import html
import json
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

from scripts.source_dedup import event_identity, normalize_url

FEED_URL = "https://eur-lex.europa.eu/EN/display-feed.rss?rssId=222"
# Sector 3 legal acts, most common types R/D/L. A link may contain CELEX=...
CELEX_RE = re.compile(r"(?<![A-Z0-9])3\d{4}(?:R|D|L)\d{4,6}(?![A-Z0-9])", re.I)
RESTRICTIVE_MEASURES = re.compile(r"\brestrictive measures\b|\b(financial|economic|targeted) sanctions\b|\basset(?:s)? freez(?:e|ing)\b|\bfreezing of funds\b", re.I)
SUSPICIOUS_CONTEXT = re.compile(r"\b(embargo|sanction(?:s|ed)?|prohibition on (?:the )?(?:export|import)|dual.use|asset freeze)\b", re.I)


def clean_text(s: str | None) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(s or ""))).strip()


def identifier_from_item(item: ET.Element) -> str | None:
    """Prefer an identifier in item link/guid; never infer the act from a
    regulation mentioned in title/description (could be an amendment target).
    """
    for field in ("link", "guid"):
        raw = html.unescape(item.findtext(field) or "")
        if not raw:
            continue
        decoded = urllib.parse.unquote(raw)
        # CELEX value in uri=CELEX: or path /CELEX: or document URL
        found = re.search(r"\bCELEX\s*:\s*(3\d{4}[RDL]\d{4,6})\b", decoded, re.I)
        if found:
            return found.group(1).upper()
    return None


def parse_feed(xml: bytes) -> list[dict]:
    if len(xml) > 2_000_000:
        raise ValueError("RSS exceeds 2MB maximum")
    root = ET.fromstring(xml)
    if root.tag != "rss":
        raise ValueError("Not RSS XML")
    channel = root.find("channel")
    if channel is None:
        raise ValueError("Missing channel")
    output = []
    seen: set[tuple[str, str, str]] = set()
    for item in channel.findall("item"):
        title = clean_text(item.findtext("title"))
        description = clean_text(item.findtext("description"))
        raw_url = (item.findtext("link") or item.findtext("guid") or "").strip()
        if not title or not raw_url:
            continue
        parts = urllib.parse.urlsplit(raw_url)
        if parts.scheme not in ("https", "http") or parts.hostname not in ("eur-lex.europa.eu", "data.europa.eu"):
            continue
        celex = identifier_from_item(item)
        text = f"{title} {description}"
        if RESTRICTIVE_MEASURES.search(text):
            category = "review"
            reason = "explicit restrictive-measures terminology"
        elif SUSPICIOUS_CONTEXT.search(text):
            category = "review"
            reason = "possible sanctions context; verify legal text"
        else:
            category = "not_flagged"
            reason = "no sanctions signal in RSS metadata"
        # Do not confuse document identity with cited legislation; URL fallback
        # is still valid for a record with no CELEX from its own link/guid.
        identity = event_identity("EU", "legislation", raw_url, official_id=celex)
        if identity in seen:
            continue
        seen.add(identity)
        output.append({
            "source": "eu_eurlex_oj_l_rss",
            "title": title,
            "url": normalize_url(raw_url),
            "celex": celex,
            "identity": list(identity),
            "classification": category,
            "reason": reason,
            "requires_editorial_review": category == "review",
            "note": "RSS title/description screening only; verify actual legal act and scope before publication",
        })
    return output


def main() -> None:
    # Offline by design. The reachability job may save a separate RSS snapshot;
    # this parser does not require secrets or publish to the platform.
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python -m scripts.eurlex_candidates input.xml output.json")
    raw = Path(sys.argv[1]).read_bytes()
    candidates = parse_feed(raw)
    Path(sys.argv[2]).write_text(json.dumps(candidates, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"EUR-Lex feed items: {len(candidates)}; flagged for review: {sum(c['requires_editorial_review'] for c in candidates)}")


if __name__ == "__main__":
    main()
