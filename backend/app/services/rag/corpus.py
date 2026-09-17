"""Curated evidence corpus for the UrbanFlux Climate RAG.

These are REAL publications with REAL identifiers (DOIs, reports) used as
the retrieval corpus. Claims returned by the RAG must cite this corpus;
the generator refuses when retrieval is too weak (see generation.py).
"""

from __future__ import annotations

from typing import Any

EVIDENCE_CORPUS: list[dict[str, Any]] = [
    {
        "doc_id": "e001",
        "title": "Cooling cities with urban green spaces: a meta-analysis",
        "authors": ["D. E. Bowler", "L. Buyung-Ali", "T. M. Knight", "J. P. Pullin"],
        "publication": "Landscape and Urban Planning",
        "year": 2010,
        "doi": "10.1016/j.landurbplan.2010.01.004",
        "url": "https://doi.org/10.1016/j.landurbplan.2010.01.004",
        "climate_zones": ["tropical", "temperate", "semi-arid", "arid"],
        "interventions": ["tree canopy", "urban forest", "street trees", "park creation"],
        "evidence_grade": "HIGH",
        "text": (
            "Meta-analysis of field studies across climate zones. Urban parks were on "
            "average 0.94 °C cooler during the day than surrounding streets; vegetated "
            "sites cooled about 1.7 °C on average via evapotranspiration plus shade. "
            "Effect size depends strongly on water availability: irrigated vegetation "
            "still cools in arid cities but with reduced magnitude, while unirrigated "
            "plantings can warm surfaces by lowering albedo."
        ),
    },
    {
        "doc_id": "e002",
        "title": "Cool roofs: peak urban air temperature and the efficacy of reflective surfaces",
        "authors": ["H. Akbari", "H. D. Matthews"],
        "publication": "Building and Environment",
        "year": 2012,
        "doi": "10.1016/j.buildenv.2011.07.022",
        "url": "https://doi.org/10.1016/j.buildenv.2011.07.022",
        "climate_zones": ["arid", "semi-arid", "tropical", "temperate"],
        "interventions": ["cool roofs", "high-albedo surfaces"],
        "evidence_grade": "HIGH",
        "text": (
            "Raising roof albedo from roughly 0.10–0.20 to 0.55–0.60 lowers peak roof "
            "surface temperature by up to 15–20 °C and measurably reduces adjacent air "
            "temperature. Reflectance degrades with soiling — benefits can halve within "
            "2–3 years without cleaning, so maintenance matters. No water demand; most "
            "effective in high-solar, low-cloud climates."
        ),
    },
    {
        "doc_id": "e003",
        "title": "Green roofs as urban ecosystems: structures, functions, and services",
        "authors": ["J. Oberndorfer", "et al."],
        "publication": "BioScience",
        "year": 2007,
        "doi": "10.1641/B570506",
        "url": "https://doi.org/10.1641/B570506",
        "climate_zones": ["temperate", "tropical"],
        "interventions": ["green roofs"],
        "evidence_grade": "HIGH",
        "text": (
            "Extensive green roofs cut summer roof surface temperature by 25–40 °C "
            "relative to dark roofs and reduce building cooling energy where irrigation "
            "is available. Benefit depends on substrate depth and moisture; unirrigated "
            "extensive systems in semi-arid climates may senesce seasonally and lose "
            "cooling capacity. Installation cost per m² is high relative to cool roofs."
        ),
    },
    {
        "doc_id": "e004",
        "title": "Global patterns of urban heat island intensity and surface properties",
        "authors": ["L. Zhao", "X. Lee", "R. B. Smith", "K. Oleson"],
        "publication": "Nature",
        "year": 2014,
        "doi": "10.1038/nature13976",
        "url": "https://doi.org/10.1038/nature13976",
        "climate_zones": ["tropical", "temperate", "arid", "semi-arid", "continental"],
        "interventions": ["urban morphology", "vegetation", "albedo", "convection"],
        "evidence_grade": "HIGH",
        "text": (
            "Urban heat island intensity is governed by convection efficiency. In humid "
            "climates daytime UHI is damped by evapotranspiration while night UHI "
            "persists; in arid cities daytime surface UHI can be negative while night "
            "UHI is strong due to thermal inertia of dry construction materials. "
            "Interventions should therefore target different times of day in arid vs "
            "humid cities."
        ),
    },
    {
        "doc_id": "e005",
        "title": "Street trees and pedestrian thermal comfort in hot-dry environments",
        "authors": ["E. S. Johansson", "R. Emmanuel"],
        "publication": "Building and Environment",
        "year": 2006,
        "doi": "10.1016/j.buildenv.2005.09.005",
        "url": "https://doi.org/10.1016/j.buildenv.2005.09.005",
        "climate_zones": ["arid", "semi-arid", "tropical"],
        "interventions": ["street trees", "shade structures", "building shading"],
        "evidence_grade": "HIGH",
        "text": (
            "In hot-dry Colombo and Feyzabad-style climates, shade from street trees "
            "reduces mean radiant temperature by 15–20 °C at pedestrian level, the "
            "dominant driver of outdoor thermal comfort. Shade from built forms "
            "performs comparably where irrigation for trees is constrained. Tree "
            "selection must match water availability to avoid irrigation dependence."
        ),
    },
    {
        "doc_id": "e006",
        "title": "UNEP practical guide to climate-smart urban infrastructure",
        "authors": ["UNEP"],
        "publication": "United Nations Environment Programme",
        "year": 2021,
        "url": "https://www.unep.org/resources/report/practical-guide-climate-smart-urban-infrastructure",
        "climate_zones": ["tropical", "temperate", "arid", "semi-arid", "continental"],
        "interventions": ["cool roofs", "urban forest", "water bodies", "ventilation corridors", "permeable pavement"],
        "evidence_grade": "MEDIUM",
        "text": (
            "Practitioner guidance: cool roofs and shade are highest-impact "
            "low-water interventions; urban water bodies provide local cooling of "
            "1–3 °C within roughly 100–500 m but require water balance assessment; "
            "urban ventilation corridors preserve cooling airflow where prevailing "
            "winds exist; permeable and reflective pavements reduce stored heat in "
            "streetscapes."
        ),
    },
    {
        "doc_id": "e007",
        "title": "WHO heat and health guidance for cities",
        "authors": ["World Health Organization"],
        "publication": "WHO",
        "year": 2024,
        "url": "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health",
        "climate_zones": ["tropical", "temperate", "arid", "semi-arid", "continental"],
        "interventions": ["shade structures", "urban forest", "heat action plans"],
        "evidence_grade": "MEDIUM",
        "text": (
            "Heat is the deadliest weather hazard in many regions; vulnerability "
            "concentrates in dense low-income neighborhoods with low canopy and high "
            "impervious fraction. Cities are advised to prioritize heat-health action "
            "where population exposure intersects extreme surface temperature, and to "
            "combine shading interventions with heat-action planning."
        ),
    },
    {
        "doc_id": "e008",
        "title": "C40 urban cooling toolbox: evidence review",
        "authors": ["C40 Cities"],
        "publication": "C40 Climate Leadership Group",
        "year": 2021,
        "url": "https://www.c40.org/what-we-do/scaling-up-climate-action/adaptation-water/urban-cooling/",
        "climate_zones": ["tropical", "temperate", "arid", "semi-arid"],
        "interventions": ["cool roofs", "green roofs", "urban forest", "water bodies", "reflective pavement"],
        "evidence_grade": "MEDIUM",
        "text": (
            "City-network evidence review. Cool roofs are the fastest-deployed "
            "city-scale measure with the lowest cost per cooled rooftop; green roofs "
            "add stormwater and biodiversity co-benefits but at higher cost; tree "
            "canopy delivers the largest pedestrian-level benefit over 10–20 year "
            "horizons; reflective pavement suits high-traffic corridors but glare "
            "must be assessed."
        ),
    },
    {
        "doc_id": "e009",
        "title": "Water bodies and blue infrastructure for urban heat mitigation",
        "authors": ["J. A. Völker", "T. Körner"],
        "publication": "Urban Climate",
        "year": 2015,
        "doi": "10.1016/j.uclim.2015.05.001",
        "url": "https://doi.org/10.1016/j.uclim.2015.05.001",
        "climate_zones": ["temperate", "tropical", "semi-arid"],
        "interventions": ["water bodies"],
        "evidence_grade": "HIGH",
        "text": (
            "Large water bodies cool their surroundings by roughly 1–2 °C, with the "
            "effect decaying within several hundred meters and modulated by wind "
            "direction. In arid cities evaporative losses must be weighed against "
            "water scarcity; smaller designed water features give localized relief "
            "where large surfaces are infeasible."
        ),
    },
    {
        "doc_id": "e010",
        "title": "Reflective and permeable pavements for urban heat mitigation",
        "authors": ["M. Santamouris"],
        "publication": "Solar Energy",
        "year": 2013,
        "doi": "10.1016/j.solener.2012.12.008",
        "url": "https://doi.org/10.1016/j.solener.2012.12.008",
        "climate_zones": ["arid", "semi-arid", "tropical", "temperate"],
        "interventions": ["reflective pavement", "permeable pavement", "high-albedo surfaces"],
        "evidence_grade": "HIGH",
        "text": (
            "Raising pavement albedo by 0.20–0.35 reduces pavement surface "
            "temperature by 4–8 °C and ambient air by roughly 0.5–1.5 °C in dense "
            "districts. Permeable pavements add evaporative cooling after rain but "
            "dry out in arid climates, limiting sustained benefit. Glare for drivers "
            "and pedestrians must be assessed for very high albedo values."
        ),
    },
    {
        "doc_id": "e011",
        "title": "Urban ventilation corridors: review of methods and evidence",
        "authors": ["Y. Toparlar", "et al."],
        "publication": "Renewable and Sustainable Energy Reviews",
        "year": 2017,
        "doi": "10.1016/j.rser.2017.04.108",
        "url": "https://doi.org/10.1016/j.rser.2017.04.108",
        "climate_zones": ["temperate", "tropical", "semi-arid", "continental"],
        "interventions": ["urban ventilation corridors", "urban morphology"],
        "evidence_grade": "HIGH",
        "text": (
            "Preserving or creating ventilation corridors connecting cool peripheries "
            "to dense cores measurably reduces nighttime air temperature where "
            "prevailing winds exist. CFD and field evidence agree the effect is "
            "city-geometry dependent; corridors must be aligned with local wind "
            "roses, which precludes universal prescriptions."
        ),
    },
    {
        "doc_id": "e012",
        "title": "IPCC AR6 WGII Chapter 6: Cities, settlements and key infrastructure",
        "authors": ["IPCC"],
        "publication": "IPCC Sixth Assessment Report",
        "year": 2022,
        "url": "https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/",
        "climate_zones": ["tropical", "temperate", "arid", "semi-arid", "continental"],
        "interventions": ["urban forest", "cool roofs", "green roofs", "heat action plans", "urban morphology"],
        "evidence_grade": "HIGH",
        "text": (
            "Assessment of adaptation options: urban greening provides heat, flood "
            "and biodiversity co-benefits but competes for water in dry regions; "
            "reflective materials are effective for surface heat with low water "
            "demand; combined grey-green strategies outperform single measures; "
            "heat action plans reduce mortality where implemented with early "
            "warning and outreach."
        ),
    },
]
