"""Deterministic offline SS-013 de-duplication regression tests."""
import unittest
from scripts.source_dedup import event_identity, normalize_url

class DedupTests(unittest.TestCase):
    def test_same_document_different_tracking_urls(self):
        a = event_identity("EU", "case_law", "https://curia.europa.eu/juris/liste.jsf?utm_source=news", "C-72/15")
        b = event_identity("eu", "CASE_LAW", "https://example.org/alternate", "c-72/15")
        self.assertEqual(a, b)

    def test_distinct_court_cases_same_generic_index(self):
        a = event_identity("EU", "case_law", "https://curia.europa.eu/juris/liste.jsf", "C-72/15")
        b = event_identity("EU", "case_law", "https://curia.europa.eu/juris/liste.jsf", "C-351/22")
        self.assertNotEqual(a, b)

    def test_parameter_reordering_and_tracking_ignored(self):
        a = normalize_url("https://Example.org/path/?b=2&utm_campaign=x&a=1#fragment")
        b = normalize_url("https://example.org/path?a=1&b=2")
        self.assertEqual(a, b)

    def test_meaningful_query_parameters_retained(self):
        a = event_identity("EU", "legislation", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R0001")
        b = event_identity("EU", "legislation", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R0002")
        self.assertNotEqual(a, b)

    def test_different_event_categories_are_distinct(self):
        url = "https://ofac.treasury.gov/recent-actions/example"
        self.assertNotEqual(event_identity("US", "guidance", url), event_identity("US", "enforcement", url))

    def test_same_url_normalizes_to_same_identity(self):
        self.assertEqual(event_identity("US", "enforcement", "https://OFAC.treasury.gov/recent-actions/example/?utm_source=email"),
                         event_identity("US", "enforcement", "https://ofac.treasury.gov/recent-actions/example"))
if __name__ == "__main__":
    unittest.main()
