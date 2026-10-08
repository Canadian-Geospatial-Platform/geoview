# OGC Raster and Vector Interoperability

GeoView can connect raster map layers and vector feature services that describe the same data. This lets a WMS remain the layer drawn on the map while GeoView uses its WFS or OGC API Features counterpart for feature records, including feature information and the Data Table. In the other direction, a WFS or OGC API Features vector layer can use a related WMS style so its client-rendered features resemble the WMS map.

This is experimental interoperability, not a guarantee that every service pair will work. It depends on service availability, matching layer or collection identifiers, and style constructs GeoView can interpret.

## WMS With Vector Records

A WMS serves map images, not a complete client-side feature collection. When external vector discovery is enabled, GeoView attempts to initialize an associated vector layer for each WMS entry:

1. GeoView tries WFS first, using the configured WFS endpoint and feature type, or the WMS data access path and layer ID when those values are omitted.
2. If WFS cannot be initialized, GeoView tries the configured OGC API Features service and collection.
3. When a vector counterpart is available, GeoView uses its metadata and feature records for vector-based feature queries. If the WMS layer is queryable and the associated vector source is usable, GeoView can register it for all-record queries and the Data Table.

The WMS is still the rendered map layer. The associated vector service supplies records; it is not added as a second visible layer. If no vector counterpart can be initialized, the WMS still renders and may still support location-based feature information through its own GetFeatureInfo response, but it will not provide the vector-backed all-record Data Table query.

```json
{
  "geoviewLayerId": "zoning-wms",
  "geoviewLayerType": "ogcWms",
  "metadataAccessPath": "https://example.ca/geoserver/ows",
  "listOfLayerEntryConfig": [
    {
      "layerId": "planning:zoning",
      "wfsUrl": "https://example.ca/geoserver/ows",
      "wfsLayerId": "planning:zoning",
      "ogcApiFeaturesUrl": "https://example.ca/geoserver/ogcapi",
      "ogcApiFeaturesLayerId": "zoning",
      "vectorTimeField": "effective_date"
    }
  ]
}
```

The OGC API Features values are a fallback here: a successfully initialized WFS counterpart takes precedence. If the WMS and vector service use different names, configure the corresponding `wfsLayerId` or `ogcApiFeaturesLayerId`. If their service endpoints differ, configure `wfsUrl` or `ogcApiFeaturesUrl`. When omitted, GeoView uses the WMS layer's data access path and layer ID; for recognized WMS/WFS endpoint patterns, it can convert the service URL between the two endpoints. These automatic defaults are convenient when a service follows conventional naming, but explicit values are more reliable for unrelated endpoints.

External vector enrichment is best-effort and enabled by default. Set `fetchVectorsExternally` to `false` on the WMS GeoView layer configuration to disable it. The WMS layer will still render.

## Vector Features Styled From WMS

WFS and OGC API Features layers are rendered as client-side vector features. By default, GeoView attempts to retrieve the corresponding WMS SLD with `GetStyles`, convert supported symbolizers into GeoView renderer settings, and apply those settings to the vector data. This gives the vector counterpart styling consistent with the WMS representation while preserving vector interactions and attributes, including Data Table support.

```json
{
  "geoviewLayerId": "zoning-wfs",
  "geoviewLayerType": "ogcWfs",
  "metadataAccessPath": "https://example.ca/geoserver/ows",
  "listOfLayerEntryConfig": [
    {
      "layerId": "planning:zoning",
      "wmsUrl": "https://example.ca/geoserver/ows",
      "wmsLayerId": "planning:zoning"
    }
  ]
}
```

For an OGC API Features vector layer, use the same `wmsUrl` and `wmsLayerId` properties on its layer entry. If `wmsUrl` is omitted, GeoView uses the vector layer's data access path and attempts the recognized WFS-to-WMS endpoint conversion. If `wmsLayerId` is omitted, it uses the vector entry's `layerId`. At the GeoView layer level, `fetchStylesOnWMS` defaults to `true`; set it to `false` to opt out. Style retrieval is best-effort: a missing endpoint or unsupported SLD does not stop the vector layer from loading, though the WMS-equivalent appearance may not be reproduced.

## Time Filtering Across WMS and Vector Records

A WMS time dimension can use a field name that differs from the date attribute returned by its WFS or OGC API Features counterpart. `vectorTimeField` identifies the matching vector attribute. GeoView uses it when applying the WMS time selection to vector records in client-side filtering, including the Data Table; it does not alter the WMS `TIME` request itself.

If `vectorTimeField` is not configured or does not match a returned field, GeoView can infer a replacement only when the vector data has exactly one date-typed field. If there are multiple date fields or none, the time filter is omitted from the vector-side client filter; other applicable filters remain in effect.

## Configuration Properties

| Property | Used on | Purpose and default |
| --- | --- | --- |
| `wfsUrl` | WMS layer entry | Associated WFS service URL. Defaults to the WMS data access path, with known WMS-to-WFS endpoint conversion. WFS is attempted before OGC API Features. |
| `wfsLayerId` | WMS layer entry | WFS feature type name. Defaults to the WMS `layerId`; GeoView can retry with or without the MapServer `ms:` prefix. |
| `ogcApiFeaturesUrl` | WMS layer entry | OGC API Features service URL used if WFS initialization fails. Defaults to the WMS data access path. |
| `ogcApiFeaturesLayerId` | WMS layer entry | OGC API Features collection identifier. Defaults to the WMS `layerId`. |
| `vectorTimeField` | WMS layer entry | Date attribute used to apply the WMS time selection to associated vector records. |
| `wmsUrl` | WFS or OGC API Features vector entry | Associated WMS service URL for GetStyles. Defaults to the vector data access path; recognized WFS endpoints may be converted to WMS. |
| `wmsLayerId` | WFS or OGC API Features vector entry | WMS layer name for GetStyles. Defaults to the vector `layerId`. |
| `fetchVectorsExternally` | WMS GeoView layer | Enables WFS/OGC API Features enrichment. Defaults to `true`. |
| `fetchStylesOnWMS` | WFS or OGC API Features GeoView layer | Enables WMS GetStyles retrieval. Defaults to `true`. |

## Practical Limits

- The WMS, WFS, and OGC API Features entries must refer to the same underlying data. GeoView can use explicit URLs and IDs, but cannot reliably infer arbitrary relationships between unrelated services.
- For WMS feature records, WFS is tried first. OGC API Features is a fallback, not a competing source that is queried in parallel.
- WMS vector enrichment is optional. If the endpoint, collection/feature type, or metadata cannot be resolved, the WMS image layer remains usable without vector-backed all-record queries.
- WMS `GetStyles` may use SLD constructs GeoView cannot convert. A vector layer can load successfully without reproducing every detail of the WMS appearance.
- Data Table availability still depends on the layer's queryable settings and on the associated vector service returning usable feature records.
