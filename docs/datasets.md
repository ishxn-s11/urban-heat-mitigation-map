# Datasets

Full provenance (mission → spacecraft → sensor → dataset → product) is required
for every dataset, per the master spec §85.

## Remote sensing catalog

| Dataset | Platform | Sensor | Variables | Native res. | Revisit | Earliest | Provider |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Landsat Collection 2 Level-2 ST | Landsat 4/5/7/8/9 | TM / ETM+ / TIRS / TIRS-2 | LST, surface reflectance | 30 m (thermal 100–120 m, resampled) | 16-day | 1982 | USGS / NASA |
| Sentinel-2 Level-2A | S2A / S2B / S2C | MSI | NDVI, NDWI, NDBI, reflectance | 10 m | 5-day | 2015 | Copernicus / ESA |
| Sentinel-3 Level-2 LST | S3A / S3B | SLSTR | LST | 1 km | daily | 2016 | Copernicus / ESA |
| MOD11 / MYD11 / MOD21 / MYD21 | Terra / Aqua | MODIS | LST, emissivity, vegetation | 1 km | daily / 8-day | 2000 / 2002 | NASA |
| VNP21 / VJ121 | Suomi NPP, NOAA-20/21 | VIIRS | LST, emissivity, nighttime | 1 km | daily | 2011 | NASA / NOAA |
| ECO2LSTE | **ISS** (instrument platform) | ECOSTRESS radiometer | high-res LST | 70 m | ISS orbit | 2018 | NASA / JPL |

**Integrity rules encoded in the catalog:**

- Sentinel-2 MSI has **no thermal band** — it is never presented as an LST source.
- ECOSTRESS is **not a satellite**; its platform is the ISS and its orbit makes
  availability dynamic, so it is checked per-AOI/per-date.
- ERA5 is **reanalysis, not satellite imagery** and is always labelled as such.

## Meteorology

| Dataset | Producer | Variables | Resolution | Earliest |
| --- | --- | --- | --- | --- |
| ERA5 / ERA5-Land | ECMWF (Copernicus C3S) | T2M, dew point, RH, wind u/v, surface radiation, precipitation, pressure | ~31 km (9 km land) | 1940 |
| CPCB ground stations (where available) | Central Pollution Control Board, India | T, RH, wind | station | variable |

## Urban form

| Dataset | Provider | Variables | Access |
| --- | --- | --- | --- |
| OpenStreetMap | © OSM contributors (ODbL) | buildings, roads, parks, waterways, land use | Overpass / Geofabrik extracts |
| GHSL | EC JRC | built-up surface, settlement classes, population | raster tiles |
| UT-GLOBUS | UT Austin | global urban morphology (building height) | adapter-gated |

## Data modes

`DATA_MODE=live` (Earth Engine configured) · `cached` (preprocessed COGs on
object storage) · `test` (fixtures, explicitly non-scientific). Production
deployments must run `live` or scientifically valid `cached` data.

## Ingestion contracts (live mode)

- Landsat C2 L2: `ST_B10 × 0.00341802 + 149 − 273.15` → °C; `QA_PIXEL` bit 3 cloud mask.
- Sentinel-2 L2A: `SCL` classes 3/8/9/10 masked; normalized differences for indices.
- ERA5: monthly means via `ECMWF/ERA5/MONTHLY`, Kelvin → °C at 2 m.
- All outputs: EPSG:4326, native resolution preserved in provenance, never
  upsampled silently (display native resolution alongside any display grid).
