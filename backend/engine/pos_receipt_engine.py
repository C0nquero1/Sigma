import httpx
import logging
import asyncio
from typing import Dict, Any, List, Optional
from engine.llm_router import llm_router
from engine.live_occupancy_browser import live_occupancy_browser

logger = logging.getLogger("StreetAI.POSReceiptEngine")


class RealLifePOSReceiptEngine:
    """
    Zero-Hardware Real-Life POS Receipt & Checkout Telemetry Engine (Zero Simulation / Zero Fake Math).
    Fuses strictly empirical checkout records:
      1. Open Prices API (`/api/v1/locations/nearby` & `/api/v1/proofs?type=RECEIPT`):
         Real photographed paper POS receipts (`receipt_price_total`, `receipt_price_count`).
      2. Google Maps Shopper-Reported Spend Midpoints & Recent Review Momentum (reuses cached payload).
      3. National Public Payment Switch Open Data (e.g., BCB Pix OData for Brazil).
    Returns `None` / `verified: False` for any metric not empirically observed on the ground.
    """
    OPEN_PRICES_BASE = "https://prices.openfoodfacts.org/api/v1"

    def __init__(self):
        self.headers = {
            "User-Agent": "StreetAI-POSReceiptEngine/1.0 (https://streetai.io; contact@streetai.io)",
            "Accept": "application/json",
        }

    async def _fetch_open_prices_receipt_baskets(
        self, client: httpx.AsyncClient, lat: float, lon: float, currency: str, country_code: str
    ) -> Dict[str, Any]:
        c_up = currency.upper().strip()
        cc_up = (country_code or "").upper().strip()
        nearby_location_ids: List[int] = []

        # 1. Geospatial lookup for physical stores near (lat, lon) with community POS receipt uploads
        try:
            r_loc = await client.get(
                f"{self.OPEN_PRICES_BASE}/locations/nearby",
                params={"lat": round(lat, 5), "lon": round(lon, 5), "radius": 2500, "size": 10},
                timeout=5.0,
            )
            if r_loc.status_code == 200:
                for item in r_loc.json().get("items", []) or []:
                    if item.get("id") and int(item.get("proof_count") or 0) > 0:
                        nearby_location_ids.append(int(item["id"]))
        except Exception as e:
            logger.debug(f"Open Prices nearby locations pivot: {e}")

        # 2. Pull verified RECEIPT proofs (prefer nearby stores; fall back to currency-matched country receipts)
        receipt_totals: List[float] = []
        receipt_item_counts: List[int] = []
        scope_tag = "NONE"

        try:
            query_params: Dict[str, Any] = {
                "type": "RECEIPT",
                "currency": c_up,
                "size": 30,
                "order_by": "-date",
            }
            if nearby_location_ids:
                query_params["location_id"] = nearby_location_ids[0]
                scope_tag = "LOCAL_STORE_RECEIPTS_2.5KM"
            else:
                scope_tag = f"NATIONAL_CURRENCY_RECEIPTS_{c_up}"

            r_pr = await client.get(f"{self.OPEN_PRICES_BASE}/proofs", params=query_params, timeout=5.5)
            if r_pr.status_code == 200:
                for pr in r_pr.json().get("items", []) or []:
                    loc_obj = pr.get("location") or {}
                    pr_cc = str(loc_obj.get("osm_address_country_code") or "").upper()
                    if cc_up and pr_cc and pr_cc != cc_up:
                        continue
                    tot = pr.get("receipt_price_total")
                    cnt = pr.get("receipt_price_count")
                    if isinstance(tot, (int, float)) and float(tot) > 0:
                        receipt_totals.append(float(tot))
                    if isinstance(cnt, int) and 1 <= cnt <= 60:
                        receipt_item_counts.append(cnt)
        except Exception as e:
            logger.debug(f"Open Prices receipt proofs pivot ({c_up}): {e}")

        receipt_totals.sort()
        receipt_item_counts.sort()
        med_total = round(receipt_totals[len(receipt_totals) // 2], 2) if receipt_totals else None
        med_items = round(sum(receipt_item_counts) / len(receipt_item_counts), 2) if receipt_item_counts else None

        return {
            "nearby_receipt_stores": len(nearby_location_ids),
            "receipt_proofs_count": len(receipt_totals),
            "median_receipt_basket_local": med_total,
            "avg_items_per_receipt": med_items,
            "receipt_scope": scope_tag if receipt_totals else "NO_PUBLIC_RECEIPTS",
        }

    async def _fetch_public_payment_switch_macro(
        self, client: httpx.AsyncClient, country_code: str, city_name: str
    ) -> Optional[Dict[str, Any]]:
        """Queries real public central-bank instant-payment open APIs where published (e.g. Brazil BCB Pix OData)."""
        cc_up = (country_code or "").upper().strip()
        if cc_up != "BR" or not city_name:
            return None
        try:
            safe_city = city_name.upper().replace("'", "")
            url = (
                "https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata/"
                "TransacoesPixPorMunicipio(DataBase=@DataBase)"
            )
            r = await client.get(
                url,
                params={
                    "@DataBase": "'202609'",
                    "$filter": f"contains(Municipio,'{safe_city}')",
                    "$top": "5",
                    "$format": "json",
                },
                timeout=6.0,
            )
            if r.status_code == 200:
                vals = r.json().get("value") or []
                if vals:
                    row = vals[0]
                    vol = float(row.get("VL_PagadorPF", 0) or 0) + float(row.get("VL_PagadorPJ", 0) or 0)
                    txs = int(row.get("QT_PagadorPF", 0) or 0) + int(row.get("QT_PagadorPJ", 0) or 0)
                    if vol > 0 and txs > 0:
                        return {
                            "switch_name": "BCB_PIX_MUNICIPAL_ODATA",
                            "municipality": row.get("Municipio"),
                            "monthly_tx_count": txs,
                            "monthly_volume_local": round(vol, 2),
                            "empirical_avg_tx_ticket_local": round(vol / txs, 2),
                        }
        except Exception as e:
            logger.debug(f"BCB Pix OData pivot: {e}")
        return None

    async def capture_empirical_pos_telemetry(
        self,
        lat: float,
        lon: float,
        venue_name: str,
        city_name: str,
        currency: str,
        country_code: str,
        local_hour: int = 12,
    ) -> Dict[str, Any]:
        ck = f"pos_emp_v1:{round(lat, 3)}:{round(lon, 3)}:{currency.upper()}:{venue_name.lower()[:30]}"
        cached = llm_router.get_cached(ck)
        if isinstance(cached, dict):
            return cached

        async with httpx.AsyncClient(timeout=6.5, headers=self.headers, follow_redirects=True) as client:
            receipts, gmaps_meta, switch_macro = await asyncio.gather(
                self._fetch_open_prices_receipt_baskets(client, lat, lon, currency, country_code),
                live_occupancy_browser.fetch_live_place_telemetry(lat, lon, venue_name, city_name, local_hour),
                self._fetch_public_payment_switch_macro(client, country_code, city_name),
            )

        gmaps_spend = gmaps_meta.get("reported_spend_midpoint_local")
        receipt_basket = receipts.get("median_receipt_basket_local")
        observed_basket = gmaps_spend if gmaps_spend is not None else receipt_basket
        basket_source = (
            "GMAPS_SHOPPER_REPORTED_SPEND"
            if gmaps_spend is not None
            else (receipts["receipt_scope"] if receipt_basket is not None else "UNOBSERVED_NO_PUBLIC_POS")
        )
        verified = observed_basket is not None or switch_macro is not None

        payload = {
            "pos_anchor_verified": verified,
            "observed_basket_total_local": observed_basket,
            "observed_items_per_receipt": receipts.get("avg_items_per_receipt"),
            "basket_source": basket_source,
            "open_prices_receipts_count": receipts.get("receipt_proofs_count", 0),
            "open_prices_nearby_stores": receipts.get("nearby_receipt_stores", 0),
            "gmaps_reported_spend_samples": gmaps_meta.get("reported_spend_samples", 0),
            "gmaps_recent_review_mentions": gmaps_meta.get("recent_review_mentions", 0),
            "national_payment_switch_macro": switch_macro,
        }

        if verified:
            logger.info(
                f"🧾 Empirical POS Anchor Locked [{venue_name}]: Basket={currency.upper()} {observed_basket} "
                f"({basket_source} | OpenPrices Receipts: {payload['open_prices_receipts_count']} | "
                f"Avg Items/Receipt: {payload['observed_items_per_receipt']})"
            )

        llm_router.set_cached(ck, payload, ttl_seconds=3600 if verified else 900)
        return payload


pos_receipt_engine = RealLifePOSReceiptEngine()