from typing import Dict, Any, List

def build_overview_ui(plan, metrics: Dict[str, Any], currency_symbol: str = "$") -> Dict[str, Any]:
    """
    Transforms econometric metrics into a dynamic, intent-specific generative UI payload.
    Adapts metric cards, breakdown segments, and telemetry markers to the query context.
    """
    cadence_str = getattr(plan, "cadence", "DAILY").capitalize()
    cadence_unit = getattr(plan, "cadence", "DAILY").lower()
    commodity = getattr(plan, "target_commodity", "Commercial").title()
    region = getattr(plan, "target_region", "Active Corridor").title()
    objective = getattr(plan, "query_objective", "MACRO_VOLUME")
    focal_q = getattr(plan, "focal_question", f"Micro-economic assessment of {region}")
    sub_clusters = getattr(plan, "sub_clusters", []) or ["Core Axis", "Peripheral Ingress", "Consolidation Yard"]
    risk_vectors = getattr(plan, "risk_vectors", []) or ["Informal Currency Slippage", "Access Route Congestion"]

    # Quantitative baselines
    gross_vol = float(metrics.get("gross_volume", 14500.0))
    velocity = int(metrics.get("tx_velocity", 1200))
    digital_pct = float(metrics.get("digital_split_pct", 24.0))
    digital_cash = float(metrics.get("digital_cash", gross_vol * (digital_pct / 100.0)))
    physical_cash = float(metrics.get("physical_cash", gross_vol - digital_cash))
    unit_basket = float(metrics.get("unit_basket_usd", 2.50))
    active_buyers = int(metrics.get("active_buyers", int(velocity * 1.1)))

    gross_fmt = f"{currency_symbol}{gross_vol:,.2f}"
    phys_fmt = f"{currency_symbol}{physical_cash:,.2f}"
    dig_fmt = f"{currency_symbol}{digital_cash:,.2f}"
    vel_fmt = f"{velocity:,} tx/{cadence_unit}"

    # ---------------------------------------------------------
    # Card 1: Intent-Specific Hero KPI Engine
    # ---------------------------------------------------------
    if objective == "ARBITRAGE_PRICE":
        card_1 = {
            "card_1_title": f"{commodity} Price Arbitrage & Spread",
            "card_1_subtitle": f"Ground-level price delta vs. formal retail indices in {region}",
            "metric_1_label": f"Local Unit Clearing Price ({commodity})",
            "metric_1_value": f"{currency_symbol}{unit_basket:,.2f}",
            "metric_2_label": "Informal Margin Capture",
            "metric_2_value": f"{metrics.get('markup', 18.5):.1f}% Spread"
        }
    elif objective == "VENDOR_DENSITY":
        card_1 = {
            "card_1_title": f"{region} Spatial Footprint & Vendor Mass",
            "card_1_subtitle": f"Observable merchant density and cluster saturation ({cadence_str})",
            "metric_1_label": "Active Transacting Nodes",
            "metric_1_value": f"{active_buyers:,} vendors/buyers",
            "metric_2_label": "Pedestrian Absorption Rate",
            "metric_2_value": f"{vel_fmt}"
        }
    elif objective == "SUPPLY_FRICTION":
        card_1 = {
            "card_1_title": f"{region} Macro-Logistics Friction Index",
            "card_1_subtitle": f"Supply chain latency and unbanked inventory retention ({cadence_str})",
            "metric_1_label": "Terminal Throughput Exposure",
            "metric_1_value": gross_fmt,
            "metric_2_label": "Observed Route Friction",
            "metric_2_value": f"{metrics.get('acoustic_db', 68.2):.1f} dB (Acoustic Index)"
        }
    elif objective == "CASH_VELOCITY":
        card_1 = {
            "card_1_title": f"{region} Liquidity Settlement Rails",
            "card_1_subtitle": f"Physical cash vs. mobile money circulation velocity ({cadence_str})",
            "metric_1_label": "Direct Dark Cash Settlement",
            "metric_1_value": phys_fmt,
            "metric_2_label": "Alternative Digital Settlement (USSD/FinTech)",
            "metric_2_value": dig_fmt
        }
    else:  # MACRO_VOLUME default
        card_1 = {
            "card_1_title": f"{cadence_str} Informal Micro-Capital Volume",
            "card_1_subtitle": f"Gross unrecorded economic turnover mapped across {region}",
            "metric_1_label": f"Estimated {cadence_str} Gross Volume",
            "metric_1_value": gross_fmt,
            "metric_2_label": "Transaction Throughput",
            "metric_2_value": vel_fmt
        }

    # Universal aliases for frontend component bindings
    card_1.update({
        "currency_symbol": currency_symbol,
        "currency": "USD",
        "primary_value": card_1["metric_1_value"],
        "secondary_value": card_1["metric_2_value"],
        "digital_value": dig_fmt,
        "physical_value": phys_fmt,
        "digital_split": f"{digital_pct:.0f}%",
        "physical_split": f"{100 - digital_pct:.0f}%",
        "focal_question": focal_q
    })

    # ---------------------------------------------------------
    # Card 2: Intent-Specific Taxonomy & Breakdown Matrix
    # ---------------------------------------------------------
    if objective in ["ARBITRAGE_PRICE", "SUPPLY_FRICTION"]:
        breakdown_items = [
            {
                "label": "Consolidated Wholesale Bulk",
                "value": 0.52,
                "amount": f"{currency_symbol}{gross_vol * 0.52:,.2f}",
                "color": "#00e5ff"
            },
            {
                "label": "Capillary Street Distribution",
                "value": 0.33,
                "amount": f"{currency_symbol}{gross_vol * 0.33:,.2f}",
                "color": "#ff007f"
            },
            {
                "label": "Spontaneous Hawker Arbitrage",
                "value": 0.15,
                "amount": f"{currency_symbol}{gross_vol * 0.15:,.2f}",
                "color": "#ffcc00"
            }
        ]
        card_2_meta = {
            "card_2_title": f"{commodity} Supply-Chain Retainage",
            "card_2_subtitle": f"Capital absorption across distribution tiers in {region}"
        }
    elif objective == "VENDOR_DENSITY":
        cluster_a = sub_clusters[0] if len(sub_clusters) > 0 else "High-Density Core"
        cluster_b = sub_clusters[1] if len(sub_clusters) > 1 else "Spillover Flank"
        cluster_c = sub_clusters[2] if len(sub_clusters) > 2 else "Outer Ingress Perimeter"

        breakdown_items = [
            {
                "label": f"1. {cluster_a} (Primary)",
                "value": 0.48,
                "amount": f"{currency_symbol}{gross_vol * 0.48:,.2f}",
                "color": "#00e5ff"
            },
            {
                "label": f"2. {cluster_b}",
                "value": 0.32,
                "amount": f"{currency_symbol}{gross_vol * 0.32:,.2f}",
                "color": "#ff007f"
            },
            {
                "label": f"3. {cluster_c}",
                "value": 0.20,
                "amount": f"{currency_symbol}{gross_vol * 0.20:,.2f}",
                "color": "#ffcc00"
            }
        ]
        card_2_meta = {
            "card_2_title": "Spatial Concentration Hierarchy",
            "card_2_subtitle": f"Pedestrian and commercial capture across designated sectors in {region}"
        }
    else:  # Default Sectoral Split
        breakdown_items = [
            {
                "label": f"Primary {commodity} Transactions",
                "value": 0.46,
                "amount": f"{currency_symbol}{gross_vol * 0.46:,.2f}",
                "color": "#00e5ff"
            },
            {
                "label": "Direct Unbanked Retail",
                "value": 0.34,
                "amount": f"{currency_symbol}{gross_vol * 0.34:,.2f}",
                "color": "#ff007f"
            },
            {
                "label": "Ancillary Micro-Services",
                "value": 0.20,
                "amount": f"{currency_symbol}{gross_vol * 0.20:,.2f}",
                "color": "#ffcc00"
            }
        ]
        card_2_meta = {
            "card_2_title": "Market Flow & Network Distribution",
            "card_2_subtitle": f"Liquidity circulation across observable vendor networks in {region}"
        }

    # ---------------------------------------------------------
    # Card 3: Dynamic Telemetry & Risk Log
    # ---------------------------------------------------------
    primary_risk = risk_vectors[0] if risk_vectors else "Localized Cash Inelasticity"
    secondary_risk = risk_vectors[1] if len(risk_vectors) > 1 else "Informal Settlement Spread"

    card_3_meta = {
        "card_3_title": "Market Friction & Threat Vectors",
        "card_3_subtitle": f"Observable empirical friction points detected in {region}",
        "primary_risk_factor": primary_risk,
        "secondary_risk_factor": secondary_risk,
        "acoustic_index": f"{metrics.get('acoustic_db', 65.0):.1f} dB",
        "settlement_rail": f"Physical Cash ({100 - digital_pct:.0f}%) / USSD-FinTech ({digital_pct:.0f}%)"
    }

    # Merged label bundle for UI consumption
    merged_labels = {**card_1, **card_2_meta, **card_3_meta}

    return {
        "card_1": merged_labels,
        "card_2_meta": card_2_meta,
        "card_2_items": breakdown_items
    }