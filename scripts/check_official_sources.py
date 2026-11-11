#!/usr/bin/env python3
"""SS-013: lightweight official-source reachability audit; no scraping or publishing."""
import datetime as dt
import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from scripts.eurlex_candidates import parse_feed
from xml.etree import ElementTree as ET

SOURCES = [
 ("US","OFAC list updates","https://ofac.treasury.gov/recent-actions/sanctions-list-updates"),
 ("US","OFAC general licences","https://ofac.treasury.gov/recent-actions/general-licenses"),
 ("US","OFAC enforcement","https://ofac.treasury.gov/recent-actions/enforcement-actions"),
 ("UK","UK Sanctions List","https://www.gov.uk/government/publications/the-uk-sanctions-list"),
 ("UK","OFSI enforcement","https://www.gov.uk/government/collections/enforcement-of-financial-sanctions"),
 ("UK","OFSI general licences","https://www.gov.uk/government/collections/ofsi-general-licences"),
 ("UN","UNSC consolidated list changes","https://main.un.org/securitycouncil/en/content/list-updates-unsc-consolidated-list"),
 ("UN","UNSC committee releases","https://main.un.org/securitycouncil/en/sanctions/1267/press-releases"),
 ("EU","EUR-Lex Official Journal L RSS","https://eur-lex.europa.eu/EN/display-feed.rss?rssId=222"),
]
def check(jurisdiction, name, url):
    checked = dt.datetime.now(dt.timezone.utc).isoformat()
    status, final_url, error = None, None, None
    feed_valid, feed_items, feed_error = None, None, None
    review_candidates = None
    try:
        request = urllib.request.Request(url, headers={"User-Agent":"SanctionsSignal-SourceAudit/0.1 (+https://github.com/toonvincke/sanctions-signal)","Accept":"text/html,application/xhtml+xml"})
        with urllib.request.urlopen(request, timeout=20) as response:
            status, final_url = response.status, response.url
            if 'display-feed.rss' in url:
                if status != 200:
                    feed_valid, feed_error = False, f'Expected RSS HTTP 200, received {status}'
                else:
                    try:
                        body = response.read(2_000_001)
                        if len(body) > 2_000_000:
                            raise ValueError('Feed exceeds 2 MB audit limit')
                        root = ET.fromstring(body)
                        if root.tag != 'rss' or root.attrib.get('version') != '2.0':
                            raise ValueError('Not an RSS 2.0 document')
                        channel = root.find('channel')
                        if channel is None or not channel.findtext('title'):
                            raise ValueError('RSS channel title missing')
                        items = channel.findall('item')
                        feed_items = len(items)
                        if not items:
                            raise ValueError('RSS feed contains no publication items')
                        if any(not (item.findtext('guid') or item.findtext('link')) for item in items):
                            raise ValueError('RSS item missing document identifier/link')
                        review_candidates = parse_feed(body)
                        feed_valid = True
                    except (ET.ParseError, ValueError) as exc:
                        feed_valid, feed_error = False, str(exc)
    except urllib.error.HTTPError as exc:
        status, final_url, error = exc.code, exc.url, str(exc)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        error = str(exc)
    return dict(jurisdiction=jurisdiction,name=name,url=url,checked_at=checked,http_status=status,final_url=final_url,error=error,reachable=status is not None and 200 <= status < 400, content_ready=status == 200,feed_valid=feed_valid,feed_items=feed_items,feed_error=feed_error,review_candidates=review_candidates)
def main():
    results = [check(*entry) for entry in SOURCES]
    dest = Path(os.environ.get("SOURCE_AUDIT_OUTPUT","source-audit.json"))
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps([{k:v for k,v in row.items() if k != 'review_candidates'} for row in results],indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    eu = next((r for r in results if r['name'].startswith('EUR-Lex')), None)
    if eu and eu['review_candidates'] is not None:
        candidate_file = Path(os.environ.get('EURLEX_CANDIDATES_OUTPUT','eurlex-candidates.json'))
        candidate_file.write_text(json.dumps(eu['review_candidates'], indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        print('EU RSS candidates: ' + str(len(eu['review_candidates'])) + ', review: ' + str(sum(x['requires_editorial_review'] for x in eu['review_candidates'])))
    print(f"Reachable: {sum(r['reachable'] for r in results)}/{len(results)}; report: {dest}")
    print('EU RSS valid: ' + str(next((r['feed_valid'] for r in results if r['name'].startswith('EUR-Lex')), None)))
    print('HTTP 200 responses: ' + str(sum(r['content_ready'] for r in results)) + '/' + str(len(results)))
    for result in results:
        print(f"{result['jurisdiction']:2} {str(result['http_status']):4} {result['name']} {result['error'] or ''}")
    # HTTP 202 is a response, not proof that the requested content was delivered.
    # For RSS, the audit additionally validates the XML shape and channel title.
    # An HTTP 200 from other HTML sources does not prove parseability.
if __name__ == "__main__":
    main()
