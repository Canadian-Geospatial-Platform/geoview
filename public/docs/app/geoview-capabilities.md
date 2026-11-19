# GeoView capabilities

**Turn spatial data into an exploration experience—not another application to build from scratch.** GeoView brings a configurable OpenLayers-based viewer, ready-made tools, and a common layer API to your website, application, or open-data portal. Use it as a standalone curated map or embed it in an existing page.

## GeoView in one minute

- **[Publish a map with less application assembly](#customize-from-html-scripts-or-packages).** Start with a script, a map container, and configuration; customize from your page or through reusable packages.
- **[Connect diverse data](#data-exploration-and-sharing).** Bring together over 15 supported service/format types, including OGC, Esri, file-based data, and raster/vector tiles.
- **[Write less vendor-specific code](#one-layer-api-across-supported-sources).** Use common layer operations while GeoView handles supported source-specific behavior.
- **[Combine map images with feature exploration](#wms-rendering-with-vector-backed-exploration).** Experimental WMS/vector coupling adds records, tables, and supported class filters, with automatic discovery for compatible services.
- **[Give users tools ready to explore](#data-exploration-and-sharing).** Configure layers, legends, feature details, tables, search, navigation, and map downloads.
- **[Add the workflows you need](#optional-packages-extend-the-viewer-you-already-have).** Enable time navigation, charts, drawing, filters, AOI destinations, STAC browsing, and more.
- **[Share and resume a map](#sharing-and-saved-state).** Share supported view parameters by URL, or capture selected state as configuration for your application to save and reload.
- **[Adapt to your audience](#language-themes-accessibility-and-standards).** Use English/French UI, themes, and WCAG-oriented keyboard and screen-reader interactions, with documented limitations.
- **[Choose your delivery model](#hosting).** Load a versioned CDN build or self-host a release; retain responsibility for your data, services, and operations.

For product categories and help choosing an approach, see [Where GeoView fits](geoview-comparison.md). For implementation, jump to [Developer starting points](#developer-starting-points).

## Capabilities in depth

The sections below explain the benefits and link to specialized guides for configuration, API contracts, examples, and limits. **Built-in** features still depend on map settings and compatible data; **optional packages** must be enabled/configured; **custom integrations** require development. These capabilities are a combination of strengths, not a claim of exclusivity or measured superiority.

### One layer API across supported sources

**Build reusable map controls instead of separate integrations for every vendor.** GeoView's common layer operations cover visibility, opacity, feature queries, and supported filtering. After configuring the source type, application logic targets a GeoView layer rather than repeatedly handling Esri, WMS, WFS, and file-based request formats.

The benefit is less vendor-specific branching and duplicated integration code. Source capabilities still determine which expressions and queries work, whether filtering runs on the server or against loaded features, and how UI controls are synchronized.

**More information:** [Unified Layer Operations](layers/layers.md#unified-layer-operations), [Filtering Layers](layers/layers.md#filtering-layers), and the [Layer API](api/layer-api.md).

### WMS rendering with vector-backed exploration

**Keep server-rendered map images and add access to the underlying feature records.** GeoView can associate WMS with WFS or OGC API Features for feature information, Data Tables, and supported legend-class visibility/filtering. The WMS stays visible on the map; its counterpart supplies records. This offers a map-image-plus-query workflow similar to Esri Dynamic services, not guaranteed feature parity.

Discovery is enabled by default: a compatible WFS sharing the endpoint and layer name needs no explicit pairing properties, and recognized URL/name conventions are handled automatically. Override the pairing when the services differ. Try the **Cities** layer in the [experimental WMS navigator](https://canadian-geospatial-platform.github.io/geoview/public/layers-navigator.html?config=./configs/navigator/layers/wms-experimental.json).

This **experimental** capability depends on matching data, usable records, queryable settings, and supported styles/filters. Image rendering can avoid transferring and drawing a large geometry collection just to display the map, but record queries can still be large; performance is service- and dataset-dependent.

**More information:** [OGC Raster and Vector Interoperability](layers/ogc-raster-vector-interoperability.md) covers discovery, configuration overrides, fallback behavior, WMS-derived vector styling, and practical limits.

### Data, exploration, and sharing

**Assemble a useful data-exploration experience through configuration.** Core capabilities include:

- **Mixed data sources:** 17 service/format input types spanning OGC, Esri, files, raster/vector tiles, and static imagery—not 17 separate standards or a promise to read every variant. See the [layer families and full type list](layers/layers.md#layer-categories) and [source definitions](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/api/types/layer-schema-types.ts).
- **Layer and feature exploration:** groups, visibility, opacity, ordering, legends, feature details, attribute tables, layer zoom, and feature highlighting. See [Working with Layers](layers/layers.md#working-with-layers) and the [Layer API](api/layer-api.md).
- **Coordinated filtering:** supported layer filters bring together configuration, legend classes, table, time, and Filter package selections. See [Filtering Layers](layers/layers.md#filtering-layers) for syntax and source limitations.
- **Navigation and context:** zoom, home, fullscreen, rotation, location/measurement controls, overview map, north arrow, and configurable app/footer panels, including a user guide. See [navigation configuration](config/configuration-reference.md#navbar-optional) and [map components](config/configuration-reference.md#components-optional).
- **Location search:** find places through the configured geolocator service and zoom to a result. See [service configuration](config/configuration-reference.md#serviceurls-optional).
- **Map downloads:** export PNG, JPEG, or PDF with configurable layout elements such as a title and legend. Available imagery depends on cross-origin access. See the [viewer guide](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/public/locales/en/guide.md).
- **Projections and basemaps:** use supported reprojection, EPSG:3978/3857/3573 map views, and basemap selection/options where available. Not all sources or basemaps work in every projection; see the [Configuration Reference](config/configuration-reference.md) and [basemap constraints](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/api/types/map-schema-types.ts).
- **GeoCore discovery:** load supported data through GeoCore identifiers when useful, or configure services/files directly without a GeoCore backend. See [GeoCore map attributes](config/create-map.md#data-geocore-keys).

#### Sharing and saved state

**Support both a quick return link and a richer saved map configuration.** Shared URLs reproduce supported view parameters alongside a base configuration. The API can also capture selected current state as reusable configuration that your application saves as JSON and reloads later.

Neither is a complete session/data backup. The host provides file persistence, and external data/access must remain available. For captured state and exclusions, see [Saving and Restoring Map Configuration](api/map-viewer-api.md#saving-and-restoring-map-configuration); URL options are documented under [Shared URL Configuration](config/create-map.md#data-shared).

### Optional packages: extend the viewer you already have

**Add focused workflows without assembling a separate viewer.** Enable only the packages needed for the map and its data:

- **Time Slider:** navigate, animate, and filter supported time-enabled layers.
- **GeoChart:** add configured charts alongside the map.
- **Drawing (`drawer`):** create/edit geometries, measure, and import/export drawings.
- **Area of Interest (`aoi-panel`):** guide users to curated places and extents.
- **About (`about-panel`):** supply explanatory content, credits, and links.
- **Filter (`filter-panel`):** offer configured attribute-filter controls.
- **STAC Browser (`stac-browser`):** browse/filter compatible catalogs, inspect items, and add supported assets to the map.
- **Swiper and Custom Legend:** compare layer views and tailor legend presentation.

Availability depends on the build, package configuration, and source capabilities. The [Core Packages Reference](packages/geoview-core-packages.md) provides feature/configuration details.

### Customize from HTML, scripts, or packages

**Choose the smallest amount of development that meets your need.** A page can host multiple independent maps, and customization can grow without rebuilding the core viewer:

1. **Configure:** choose data, panels, language, theme, and packages from HTML attributes and configuration.
2. **Script:** connect page controls and viewer events through APIs/controllers; create, reload, or delete maps, or add geometries without enabling the drawing package.
3. **Package:** build reusable functionality on the existing map/layer APIs, UI components, localization, controllers, and plugin lifecycle.

**More information:** [Creating Maps](config/create-map.md), [API entry points](api/api.md), [Geometry API](api/geometry-api.md), [Events](events/event-system.md), and [package development](packages/core-packages.md). Component developers should follow [Controller Architecture](../programming/controller-architecture.md). Custom code remains responsible for cleanup, data handling, translations, and accessibility.

### Language, themes, accessibility, and standards

**Adapt the same viewer to your audience and presentation.** English/French UI and selectable themes accompany WCAG 2.1 AA-oriented keyboard/crosshair navigation, focus management, accessible control names, and screen-reader announcements. Host content and provider metadata still need localization and accessibility review.

This is not blanket WCAG certification. The [Accessibility guide](accessibility.md) explains interaction patterns and known gaps; [Theming](ui/theming.md) explains appearance customization. GeoView also connects to documented OGC services and uses ISO 8601 temporal conventions; see [Time Dimension Architecture](../programming/time-dimension.md), rather than treating this as general ISO certification.

### Hosting

**Deliver through a versioned CDN or your own hosting** see [Installing GeoView](config/create-map.md#installing-geoview). The [repository license](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/LICENSE.md) includes MIT terms, separate Canada branding restrictions, and third-party notices.

## Developer starting points

- **Create your first map:** [Installing GeoView](config/create-map.md#installing-geoview) and [Creating Maps](config/create-map.md).
- **Choose data and workflows:** [Layers](layers/layers.md), [Configuration Reference](config/configuration-reference.md), and [Core Packages](packages/geoview-core-packages.md).
- **Integrate or extend:** [API entry points](api/api.md), [Events](events/event-system.md), [package development](packages/core-packages.md), and the full [TypeDoc reference](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/).
