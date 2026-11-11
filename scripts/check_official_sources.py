#!/usr/bin/env python3
"""SS-013: lightweight official-source reachability audit; no scraping or publishing."""
import datetime as dt
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

SOURCES = [
 ("US","OFAC list updates","https://ofac.treasury.gov/recent-actions/sanctions-list-updates"),
 ("US","OFAC general licences","https://ofac.treasury.gov/recent-actions/general-licenses"),
 ("US","OFAC enforcement","https://ofac.treasury.gov/recent-actions/enforcement-actions"),
 ("UK","UK Sanctions List","https://www.gov.uk/government/publications/the-uk-sanctions-list"),
 ("UK","OFSI enforcement","https://www.gov.uk/government/collections/enforcement-of-financial-sanctions"),
 ("UK","OFSI general licences","https://www.gov.uk/government/collections/ofsi-general-licences"),
 ("UN","UNSC consolidated list changes","https://main.un.org/securitycouncil/en/content/list-updates-unsc-consolidated-list"),
 ("UN","UNSC committee releases","https://main.un.org/securitycouncil/en/sanctions/1267/press-releases"),
 ("EU","EUR-Lex Official Journal direct access","https://eur-lex.europa.eu/oj/direct-access.html"),
]
def check(jurisdiction, name, url):
    checked = dt.datetime.now(dt.timezone.utc).isoformat()
    status, final_url, error = None, None, None
    try:
        request = urllib.request.Request(url, headers={"User-Agent":"SanctionsSignal-SourceAudit/0.1 (+https://github.com/toonvincke/sanctions-signal)","Accept":"text/html,application/xhtml+xml"})
        with urllib.request.urlopen(request, timeout=20) as response:
            status, final_url = response.status, response.url
    except urllib.error.HTTPError as exc:
        status, final_url, error = exc.code, exc.url, str(exc)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        error = str(exc)
    return dict(jurisdiction=jurisdiction,name=name,url=url,checked_at=checked,http_status=status,final_url=final_url,error=error,reachable=status is not None and 200 <= status < 400)
def main():
    results = [check(*entry) for entry in SOURCES]
    dest = Path(os.environ.get("SOURCE_AUDIT_OUTPUT","source-audit.json"))
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(results,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"Reachable: {sum(r['reachable'] for r in results)}/{len(results)}; report: {dest}")
    for result in results:
        print(f"{result['jurisdiction']:2} {str(result['http_status']):4} {result['name']} {result['error'] or ''}")
    # Audit failures should be visible in artifact, without breaking unrelated CI.
if __name__ == "__main__":
    main()
