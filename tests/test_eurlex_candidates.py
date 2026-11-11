"""SS-013: offline EUR-Lex RSS classification tests, no network or DB."""
import unittest
from scripts.eurlex_candidates import parse_feed

def rss(items):
    return ('<?xml version="1.0"?><rss version="2.0"><channel><title>OJ L</title>' +
            "".join('<item><title><![CDATA[' + title + ']]></title><description><![CDATA[' + desc +
                    ']]></description><link>' + url.replace("&", "&amp;") + '</link></item>'
                    for title, desc, url in items) +
            '</channel></rss>').encode()

class EurlexCandidateTests(unittest.TestCase):
    def test_restrictive_measures_flagged_with_own_celex(self):
        result = parse_feed(rss([("Council Decision concerning restrictive measures", "",
            "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026D1234")]))
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["celex"], "32026D1234")
        self.assertTrue(result[0]["requires_editorial_review"])

    def test_unrelated_legislation_not_flagged(self):
        row = parse_feed(rss([("Commission Regulation on food labelling", "technical standards",
            "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1235")]))[0]
        self.assertEqual(row["classification"], "not_flagged")

    def test_cited_celex_does_not_override_document_identity(self):
        row = parse_feed(rss([("Council Decision concerning restrictive measures", "amending Regulation 32014R0269",
            "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026D1236")]))[0]
        self.assertEqual(row["celex"], "32026D1236")

    def test_same_celex_deduplicates_across_query_reordering(self):
        data = [
            ("Restrictive measures", "", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1237&utm_source=news"),
            ("Restrictive measures", "", "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32026R1237"),
        ]
        self.assertEqual(len(parse_feed(rss(data))), 1)

    def test_different_celex_same_generic_url_not_same_id(self):
        data = [
            ("Council Decision on restrictive measures", "", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026D1238"),
            ("Council Decision on restrictive measures", "", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026D1239"),
        ]
        self.assertEqual(len(parse_feed(rss(data))), 2)

    def test_non_approved_domain_ignored(self):
        data = [("Restrictive measures", "", "https://example.org/?uri=CELEX:32026R1240")]
        self.assertEqual(parse_feed(rss(data)), [])

    def test_non_rss_rejected(self):
        with self.assertRaises(ValueError):
            parse_feed(b"<html><body>Request accepted</body></html>")

    def test_ambiguous_export_prohibition_review_only(self):
        row = parse_feed(rss([("Prohibition on export of certain goods", "",
            "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1241")]))[0]
        self.assertEqual(row["classification"], "review")
        self.assertTrue(row["requires_editorial_review"])

    def test_no_celex_uses_url_fallback(self):
        row = parse_feed(rss([("Council Decision concerning restrictive measures", "",
            "https://eur-lex.europa.eu/oj/direct-access.html")]))[0]
        self.assertIsNone(row["celex"])
        self.assertTrue(row["identity"][-1].startswith("url:"))

if __name__ == "__main__":
    unittest.main()
