import asyncio
import pytest
from engine.pricing_scraper import AbsolutePhysicalPricingEngine
from engine.live_occupancy_browser import scan_tree_for_popular_times_and_spend, _parse_place_node_fields


def test_pricing_schema_priority_blocks_spot_and_foreign_currency():
    eng = AbsolutePhysicalPricingEngine()
    html_sample = """
    <html><head>
      <script type="application/ld+json">
      {"@type":"Product","name":"Turkish Kilim","offers":{"@type":"Offer","price":"8500","priceCurrency":"TRY"}}
      </script>
    </head><body>Noise USD 50 TRY 150 cleaning fee</body></html>
    """
    pts = eng._extract_prices_priceghost_4layer(html_sample, "TRY", ["TRY", "₺"], fx_rate_per_usd=50.5)
    assert len(pts) == 1
    assert pts[0][0] == 8500.0


def test_pricing_rejects_bullion_page_without_product_schema():
    eng = AbsolutePhysicalPricingEngine()
    html_spot = "<html><body>Today Gold Rate — 24K Gold Price per Gram in Egypt: EGP 6,050</body></html>"
    pts = eng._extract_prices_priceghost_4layer(html_spot, "EGP", ["EGP"], fx_rate_per_usd=54.0)
    assert pts == []


def test_city_hygiene_strips_ambiguous_subdistricts():
    assert AbsolutePhysicalPricingEngine._extract_clean_city_name("Gamarra, La Victoria, Peru") == "Lima"
    assert AbsolutePhysicalPricingEngine._extract_clean_city_name("Alaba Market, Ojo, Nigeria") == "Lagos"
    assert AbsolutePhysicalPricingEngine._extract_clean_city_name("Grand Bazaar, Istanbul, Turkey") == "Istanbul"


def test_popular_times_recursive_scanner_finds_shifted_arrays():
    # Simulate Google shifting Popular Times off index [84] to an arbitrary nested slot
    shifted_payload = [
        None,
        "Grand Bazaar",
        [
            [
                [1, [[9, 35], [10, 55], [11, 80], [12, 95], [13, 90]]],
                [2, [[9, 30], [10, 50], [11, 75], [12, 85]]],
                [3, [[9, 30], [10, 50], [11, 70], [12, 80]]],
                [4, [[9, 30], [10, 50], [11, 70], [12, 80]]],
                [5, [[9, 40], [10, 60], [11, 85], [12, 95]]],
            ],
            None, None, None, None, None, None,
            ["Busier than usual", 88],
        ],
        "People typically spend 2 hr here",
        "Reported by 120 people: spend 400–800",
    ]
    res = scan_tree_for_popular_times_and_spend(shifted_payload, target_gmaps_day=1)
    assert res["observed_live_busyness_pct"] == 88
    assert res["hourly_histogram"][12] == 95
    assert res["observed_dwell_minutes"] == 120.0
    assert res["reported_spend_ranges"] == [(400.0, 800.0)]


def test_overnight_24h_badge_rejected_on_traditional_markets():
    fake_node = [None] * 205
    fake_node[203] = [None, [None, None, None, None, ["Open 24 hours"]]]
    parsed = _parse_place_node_fields(fake_node, local_hour=23, local_weekday_mon0=0)
    assert parsed["is_open_now"] is None


def test_popular_times_scanner_rejects_static_30_metadata_without_bars():
    # Google Maps metadata node with 5-element list at [0] and static 30 at [7][1], zero hour bars
    fake_meta_node = [
        [[1, "Monday"], [2, "Tuesday"], [3, "Wednesday"], [4, "Thursday"], [5, "Friday"]],
        None, None, None, None, None, None,
        ["meta", 30],
    ]
    res = scan_tree_for_popular_times_and_spend(fake_meta_node, target_gmaps_day=3)
    assert res["hourly_histogram"] == {}
    assert res["observed_live_busyness_pct"] is None