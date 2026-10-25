# India map source

Retrieved 28 October 2026 from https://raw.githubusercontent.com/udit-001/india-maps-data/main/topojson/india.json

Repository: https://github.com/udit-001/india-maps-data — public GeoJSON/TopoJSON state and district data offered for map integration. The topology contains 36 state/UT geometries. District source properties mention 2011 census data; do not describe it as a certified current Survey of India boundary product.

The checked-in GeoJSON is decoded from its state object; client SVG paths use the same coordinates under a fixed projection. No AICTE jurisdiction is implied by geographic state boundaries. Six region colours use the app's demonstration classification. The UI retains its non-official boundary label. Rebuild with `python scripts/build-india-map.py` using the preserved input at `data/maps/india-topology.json`.
