# Where GeoView fits: categories and choosing an approach

## At a glance

**GeoView combines support for a wide variety of spatial datasets with ready-made exploration tools.** Built on OpenLayers, it can be configured as a standalone map-focused website or embedded in an existing application or open-data portal. You configure an assembled viewer rather than develop its layer, legend, feature-details, and data-table workflows from a mapping SDK.

For GeoView highlights, supported formats, exploration tools, packages, customization, and documented limitations, see [GeoView capabilities](geoview-capabilities.md). To implement your map, follow its [developer starting points](geoview-capabilities.md#developer-starting-points).

This guide explains four product categories, their development and operating trade-offs, and when to use GeoView as a standalone viewer or within a portal. Product links are examples to explore, not a feature ranking or an exhaustive catalog.

## Four categories: what are you starting with?

| Category                                      | What it gives you                                                                                          | What remains your responsibility                                                                                                        | Examples                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **1. Mapping libraries and SDKs**             | Rendering, data layers, interactions, and reusable controls/components.                                    | Build and maintain the application: UI composition, coordinated workflows, configuration, localization, accessibility, and integration. | OpenLayers, Leaflet, ArcGIS Maps SDK for JavaScript.                                         |
| **2. Configurable web viewers and explorers** | An assembled exploration interface that can become a standalone curated map or an embedded viewer.         | Select compatible data, configure the interface, host it, and develop extensions only where needed.                                     | GeoView, TerriaJS through its TerriaMap starter; MapStore also supplies viewer capabilities. |
| **3. Portals and publishing platforms**       | Broader content publishing, discovery, administration, or managed services, with viewer as one component. | Operate the infrastructure or subscribe to a service; assess whether the viewer can be reused and customized independently.             | ArcGIS Online, CARTO, GeoNode, Lizmap/QGIS Server.                                           |
| **4. Desktop GIS and analysis tools**         | Authoring, editing, cartography, analysis, and data preparation.                                           | Turn the outputs into a public web experience through exports, published services, or a viewer.                                         | QGIS, ArcGIS Pro, GRASS GIS.                                                                 |

These categories describe different responsibilities, not rigid product labels. Open source versus proprietary, library versus application, and self-hosted versus managed are independent distinctions. Esri's SDK, ArcGIS Online, and ArcGIS Pro are different products; Mapbox GL JS is a library, while Mapbox Studio is style-authoring/publishing tooling. GeoView uses OpenLayers rather than replacing its rendering engine.

### 1. SDKs: develop the application around the map

A mapping SDK is the closest option to **starting the application from scratch**, not starting the rendering engine from scratch. A basic map can be quick to create, but assembling a polished layer browser, synchronized legend/details/table interactions, language handling, and accessible navigation can require substantial development and long-term maintenance. Some SDKs provide rich components; you still own their integration and your application's behavior.

Examples include [OpenLayers](https://openlayers.org/), [Leaflet](https://leafletjs.com/), [ArcGIS Maps SDK for JavaScript](https://developers.arcgis.com/javascript/latest/), [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/), [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/overview), and [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides/).

### 2. Viewers: configure a product instead of assembling every workflow

GeoView's starting point is an existing exploration interface. Load its script, provide a map container and configuration, and enable the panels/packages the audience needs. Small customizations can be scripted directly in the host HTML page through the viewer's APIs and events; custom packages can reuse the core viewer instead of reimplementing map, layer, and UI infrastructure.

Alongside shareable URLs, GeoView's API can capture selected current map state as a configuration that your application saves to JSON and reloads later. See [sharing and saved state](geoview-capabilities.md#data-exploration-and-sharing) for this richer map-persistence workflow.

Other examples include [TerriaJS](https://www.npmjs.com/package/terriajs), through its TerriaMap website starter, and [MapStore](https://docs.mapstore.geosolutionsgroup.com/), which also provides broader application capabilities.

### 3. Portals: more than a viewer

[ArcGIS Online](https://www.arcgis.com/home/) and [CARTO](https://docs.carto.com/) provide commercial platform services; [GeoNode](https://docs.geonode.org/) and [Lizmap/QGIS Server](https://docs.lizmap.com/current/en/) illustrate open-source publishing stacks that still have hosting and operating costs. These solutions cover more than viewing: adopting a publishing/catalog platform can be unnecessary infrastructure when you only need a curated map page. Their viewers may be coupled to platform services, accounts, or publishing workflows, making independent reuse and customization harder; embedding a platform-hosted map is not the same as extracting its viewer.

### 4. Desktop GIS: produce the data, then publish the experience

A desktop geographic information system (GIS) provides tools to create, edit, analyze, and prepare spatial data and maps. Examples include the open-source [QGIS](https://www.qgis.org/) and [GRASS GIS](https://grass.osgeo.org/), and the proprietary [ArcGIS Pro](https://pro.arcgis.com/en/pro-app/latest/get-started/get-started.htm). These tools complement a web viewer: sharing their outputs with the public in a browser generally requires an export, publishing, or viewer workflow.

## Standalone product or portal component?

**Standalone means a browser-based map page without a surrounding portal**, not offline operation or the absence of data/service dependencies. You do not need GEO.ca or GeoCore to create a curated GeoView map from compatible services and files.

| Use                        | What GeoView supplies                                                                                                        | What you supply                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Standalone curated map** | Configured layers, exploration panels, sharing, and enabled packages for a thematic map, dataset viewer, or project website. | Host page/assets, map configuration, data/service access, contextual content, and any custom workflows.                      |
| **Viewer inside a portal** | The same viewing tools, driven by the selected record or dataset.                                                            | Portal search/catalog, metadata pages, governance, publishing, permissions where required, and record-to-viewer integration. |

**GEO.ca and Open Maps Canada use GeoView as their viewer.** The same Historical Flood Events dataset appears in [GEO.ca's record-and-map page](https://app.geo.ca/en-ca/map-browser/record/fe83a604-aa5a-4e46-903c-685f8b0cc33c) and [Open Maps Canada's map page](https://open.canada.ca/openmap/en.html#fe83a604-aa5a-4e46-903c-685f8b0cc33c). These show how a viewer can be reused without being the entire portal.

## Which approach should I choose?

| Need                                                               | Starting point                                      | Trade-off                                                                                                          |
| ------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Bespoke visualization or interaction                               | A mapping SDK or visualization library.             | Greater application control, but more UI/workflow assembly and maintenance.                                        |
| A standalone curated spatial-data viewer                           | A configurable viewer such as **GeoView**.          | Reuse assembled exploration tools without adopting a portal solely to display a map; validate data compatibility.  |
| Viewing inside an existing website or open-data portal             | **GeoView's script/configuration/API integration**. | Keep the host's catalog/publishing responsibilities separate; implement the integration, not the whole viewing UI. |
| Content publishing, discovery, administration, or managed services | A portal/platform.                                  | Appropriate when you need the broader infrastructure; potentially more than needed for a viewer alone.             |
| Advanced authoring, editing, or analysis                           | Desktop GIS plus suitable outputs/services.         | Proprietary licensing may add cost; public browser delivery remains a separate step.                               |
