# GeoView capabilities

**GeoView combines a wide variety of spatial data sources with ready-made exploration tools, optional packages, and APIs for customization.** Configure it as a standalone curated map or embed it in your website, application, or open-data portal. GeoCore integration is available, but is not required for directly configured datasets and services.

This guide explains what GeoView can do and what you need to configure or develop. For product categories, alternatives, and the choice between an SDK, viewer, portal, or desktop GIS, see [Where GeoView fits](geoview-comparison.md).

**Source review: October 22, 2026.** Claims below link to GeoView documentation or source. **Built-in** means supplied by core, not enabled for every map; **configuration-dependent** requires compatible data and settings; **optional package** must be enabled/configured; **custom integration** is developer-owned work.

## Data, exploration, and sharing

- **Over 15 service and format types — built-in adapters/imports, configuration-dependent.** The [source type definitions](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/api/types/layer-schema-types.ts) identify 15 runtime layer types plus GeoPackage and Shapefile imports: OGC WMS, WMTS, WFS, OGC API Features; Esri map, feature, and image services; GeoJSON, CSV, KML, WKB, GeoTIFF, GeoPackage, Shapefile; XYZ raster tiles, MVT vector tiles, and static images. These are **17 service/format input types**, not 17 distinct standards or a promise to read every variant. See [Layers](layers/layers.md).
- **Layer, legend, feature-details, and table workflows — built-in, configuration-dependent.** These panels are present in the [default configuration](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/schema-default-config.json). You do not need to assemble their UI from individual SDK controls. Queries and attribute tables depend on source capabilities and configuration.
- **Time-series exploration and charts — optional packages.** Time Slider supports temporal navigation/filtering and animation for supported time-enabled layers; GeoChart supplies configured charting. Other packages add drawing, guided areas of interest, filters, explanatory content, and STAC discovery, as described below. Do not assume every service supplies usable time/chart data.
- **Reprojection and basemaps — built-in, configuration-dependent.** GeoView handles supported source-to-map transformations and map projections EPSG:3978, EPSG:3857, and EPSG:3573, with basemap switching and labelled/shaded options where available. Service CRS support and raster/vector behavior matter; not all sources can be arbitrarily reprojected. The [projection/basemap constraints](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/api/types/map-schema-types.ts) currently restrict EPSG:3573 to `nogeom` basemap selection.
- **Sharing and saved state — built-in APIs, configuration-dependent.** GeoView supports two complementary ways to return to a configured map:
  - **Shareable URLs:** [shared URL configuration](config/create-map.md#data-shared) supports view/projection/basemap parameters and GeoCore keys alongside the base map configuration.
  - **Saved configuration files:** the API can capture selected current map state as a reusable configuration, including view/basemap settings, layer order and appearance, UI settings, and supported package state. Your application can save it as JSON, then reload the saved configuration to recreate the map. This provides a richer persistence mechanism than the supported URL parameters alone. See [Saving and Restoring Map Configuration](api/map-viewer-api.md#saving-and-restoring-map-configuration).

  Neither mechanism is a full session or data backup: credentials, external datasets, drawings, arbitrary plugin state, and every transient interaction are not automatically preserved. The host application supplies file download/upload or other storage; the AOI package is not the state-saving API.

- **GeoCore integration — configuration-dependent, external service.** Resolve GeoCore UUIDs through [map attributes](config/create-map.md#data-geocore-keys) or the [layer API](api/layer-api.md). This is an additional way to connect data, not a mandatory catalog backend for every GeoView map.

## Optional packages: extend the viewer you already have

Enable and configure only the packages your map needs. These are optional extensions, not capabilities automatically active in every viewer:

- **Drawing (`drawer`):** draw and edit geometries, measure distances/areas, and import/export drawings. This is a drawing tool, not simply a collapsible content panel.
- **Area of Interest (`aoi-panel`):** present curated places or geographic extents so users can quickly visit the relevant areas of a map.
- **About (`about-panel`):** add explanatory map context, credits, links, and configurable Markdown/content for your audience.
- **Filter (`filter-panel`):** provide configured attribute filters using select, multiselect, numeric-range, and date controls for compatible layer data.
- **STAC Browser (`stac-browser`):** browse collections/items from a configured SpatioTemporal Asset Catalog API, filter by space/time and other supported criteria, preview items, inspect metadata/assets, and add supported items to the map. It depends on a compatible STAC service and item assets; it is not a bundled catalog server.
- **Time Slider and GeoChart:** explore supported time-enabled layers and display configured charts alongside the map.
- **Swiper and Custom Legend:** compare selected layer views and tailor legend organization/presentation.

See the [Core Packages Reference](packages/geoview-core-packages.md), [AOI package guide](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-aoi-panel/README.md), and [STAC Browser package guide](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-stac-browser/README.md) for capabilities and configuration. Availability depends on the deployed build and package configuration; third-party data/service terms still apply.

## Customize from HTML, scripts, or packages

1. **Configure from HTML:** set the map container's attributes and inline or URL-based configuration to select data, panels, language, theme, and packages. A curated map does not require a new application built from an SDK. See [Creating Maps](config/create-map.md).
2. **Script directly from your page:** after the documented initialization/readiness events, use JavaScript and the public APIs/controllers to connect page controls, change map behavior, or respond to viewer events. Small customizations can stay in the host page without creating a package or modifying core source.
3. **Develop a reusable package:** build on the existing plugin lifecycle, map/layer capabilities, UI components, localization, controllers, and events. This reduces the infrastructure you need to write; it does not remove the need to implement and test your own behavior. See [package development](packages/core-packages.md) and [Controller Architecture](../programming/controller-architecture.md).

The benefit is **reusing the core viewer's capacity at all three levels**, rather than assembling a separate viewer for each customization. Configure UI and layers, create maps dynamically, react to lifecycle/events, and connect host controls through the [API](api/api.md), [controllers](events/controllers.md), and [event system](events/event-system.md).

Custom scripts/packages remain responsible for lifecycle cleanup, data handling, translations, and accessibility; inheriting viewer components is not automatic WCAG compliance.

## Language, themes, accessibility, and standards

- **English/French UI and selectable themes — built-in, configuration-dependent.** See [Theming](ui/theming.md). Host-page content and provider metadata need their own localization; custom branding/layouts may require development and accessibility review.
- **WCAG-oriented support — built-in, configuration-dependent.** GeoView provides WCAG 2.1 AA-oriented keyboard/crosshair navigation, focus management, accessible control names, and screen-reader announcements. See [Accessibility](accessibility.md), including documented gaps involving imagery/symbol descriptions, language metadata, and focus indicators. Reuse these interaction patterns in custom work and assess the deployed host and viewer; this is not blanket WCAG certification.
- **Standards-based interoperability — specific, not blanket certification.** GeoView connects to the documented OGC services and uses **ISO 8601 date/time and duration conventions** in its [temporal handling](../programming/time-dimension.md). This does not establish general ISO certification or compliance with every ISO/OGC standard. GeoCore-backed metadata discovery is a separate service integration, not a bundled ISO metadata catalog.

## Hosting, costs, and boundaries

GeoView's [repository license](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/LICENSE.md) includes MIT terms, separate Canada branding restrictions, and third-party notices. Self-hosting the software does not require purchasing a proprietary GeoView seat license, but **hosting, integration, maintenance, support, and third-party services can cost money**.

- Review **software licensing separately from basemap/data/service terms**: API keys, accounts, usage charges, attribution, caching, and redistribution requirements depend on what you connect.
- Inventory external requests, including basemaps, data, CDNs, GeoCore/search, proxies, and packages. The [default service URLs](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/schema-default-config.json) are only a starting point. Self-hosting alone does not guarantee offline operation, data residency, or sovereignty.
- Test realistic data volumes, service availability, CORS/authentication, browser resources, and accessibility. No performance or compliance ranking has been established here.
- Optional drawing/measurement is not the same as authoritative multiuser GIS editing or desktop geoprocessing. Evaluate those requirements separately rather than assuming a viewer replaces enterprise GIS.
- A standalone viewer does not need a surrounding portal. If you integrate GeoView into one, the host still supplies catalog/search, metadata pages, publishing, permissions, and governance as needed. See [Standalone product or portal component?](geoview-comparison.md#standalone-product-or-portal-component).

## Developer starting points

1. [Creating Maps](config/create-map.md): script/container integration, configuration, shared URLs, and lifecycle.
2. [Layers](layers/layers.md) and [Configuration Reference](config/configuration-reference.md): sources, projections, queries, and enabled panels.
3. [Core Packages](packages/geoview-core-packages.md), the [STAC Browser guide](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-stac-browser/README.md), and [package development](packages/core-packages.md): drawing, AOI, About, filtering, time, charts, discovery, and custom extensions.
4. [API entry points](api/api.md), [Events](events/event-system.md), and [Controller Architecture](../programming/controller-architecture.md): extend through supported APIs/controllers rather than manipulating OpenLayers directly from components. Use [TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/) for full signatures.
