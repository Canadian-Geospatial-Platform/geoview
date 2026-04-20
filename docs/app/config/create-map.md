### Creating Maps in GeoView

There are two main approaches to create maps in GeoView:

1. **Declarative approach**: Using HTML div elements with special attributes
2. **Programmatic approach**: Using the `createMapFromConfig` API method

**IMPORTANT NOTE**
If you are using a framework to inject the cgpv-main.js script dynamically, you may end up with multiples version of cgpv window object and React version. If this happen you will have a console log that says **'Multiple instances of cgpv loaded. Make sure you only inject cgpv-main.js once.'**
If this happens, try to resolve the issue by injection cgpv script only one or unmount it properly betweeen the calls.

#### Declarative Approach (Using HTML)

When you call `cgpv.init()`, it scans the DOM for elements that are intended to host GeoView maps. It initializes all GeoView maps found in the DOM. Call this after registering your event handlers.

Specifically, it looks for `<div>` elements with the `geoview-map` class that identify them as GeoView map containers.

**Typical requirements for a GeoView map container:**

- The element is a `<div>`.
- It has the class attribute value `geoview-map`.
- It may include additional attributes such as `data-config`, `data-config-url`, `data-lang`, `data-footer-height`, `data-geocore-keys`, or `data-shared` to specify map configuration, language, footer height, GeoCore layers, or shared state.
- The `data-config` has precedence over `data-config-url` if both are provided.

**Example:**

```html
<div
  id="myMap"
  class="geoview-map"
  data-lang="en"
  data-config-url="path/to/config.json"
  data-footer-height="50vh"
  style="width: 100%; height: 400px;"
></div>
```

**How it works:**

- `cgpv.init()` finds all such elements in the DOM.
- For each, it reads the configuration and initializes a map viewer instance inside the div.
- The initialization process uses the provided attributes to determine map settings, language, and data sources.

**Tip:**
Make sure your map container divs are present in the DOM before calling `cgpv.init()`, and that they have the required attributes for your use case.

#### Configuration Attributes

GeoView maps can be configured using several HTML attributes:

##### `data-config`

The `data-config` attribute allows you to specify the map configuration directly as a JSON string.

```html
<div
  id="myMap"
  class="geoview-map"
  data-lang="en"
  data-config='{"layers":[{"id":"osm","name":"OpenStreetMap","url":"https://tile.openstreetmap.org/{z}/{x}/{y}.png","type":"osm"}],"initialView":{"zoom":4,"center":[-100,60]}}'
  style="width: 100%; height: 400px;"
></div>
```

##### `data-config-url`

The `data-config-url` attribute specifies a URL to a JSON configuration file. This is useful for larger configurations or when you want to reuse the same configuration across multiple maps.

```html
<div
  id="myMap"
  class="geoview-map"
  data-lang="en"
  data-config-url="configs/map-config.json"
  style="width: 100%; height: 400px;"
></div>
```

The JSON file should have the same structure as the inline `data-config` value.

#### `data-footer-height`

The `data-footer-height` attribute allows for manually setting the height of the footer bar so that it is not default 600px or the same height as the map. The value can be any css height value although pixels (px) and view height (vh) are recommended.

```html
<div
  id="myMap"
  class="geoview-map"
  data-lang="en"
  data-footer-height="450px"
  data-config-url="configs/map-config.json"
  style="width: 100%; height: 400px;"
></div>
```

##### `data-geocore-keys`

The `data-geocore-keys` attribute allows you to inject GeoCore layers by UUID directly on the div element, without including them in the main configuration object. Multiple UUIDs are separated by commas.

```html
<div
  id="myMap"
  class="geoview-map"
  data-lang="en"
  data-geocore-keys="12acd145-626a-49eb-b850-0a59c9bc7506,ccc75c12-5acc-4a6a-959f-ef6f621147b9"
  data-config-url="configs/map-config.json"
  style="width: 100%; height: 400px;"
></div>
```

The specified GeoCore layers are appended to any layers already defined in `data-config` or `data-config-url`.

##### `data-shared`

When set, the map will load configuration from URL parameters if they are present. This is especially useful for sharing specific map views or configurations via links.

> **Live demo:** [demo-share.html](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/public/templates/demos/demo-share.html)

When `data-shared` is used together with `data-config` or `data-config-url`, the base configuration from those attributes is preserved, and URL parameters selectively override specific properties:

- **Projection** (`p`) — overrides `viewSettings.projection`
- **Zoom and center** (`z`, `c`) — overrides `viewSettings.initialView.zoomAndCenter`
- **Basemap options** (`b`) — overrides `basemapOptions`
- **Layers** (`keys`) — **appended** to existing config layers, not replaced

```html
<div
  id="myMap"
  class="geoview-map"
  data-lang="en"
  data-shared
  style="width: 100%; height: 400px;"
></div>
```

With this setup, you can share a link with URL parameters to load a specific map configuration.

Example URL with parameters:

```
https://example.com/geoview/default-config.html?p=3857&z=4&c=-100,40&b=id:transport,s:off,l:on&i=dynamic&keys=12acd145-626a-49eb-b850-0a59c9bc7506,ccc75c12-5acc-4a6a-959f-ef6f621147b9
```

Supported URL parameters:

| Parameter | Description                               | Example Values                                                              |
| --------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| `z`       | Zoom level                                | `4`                                                                         |
| `p`       | Projection code                           | `3857`, `3978`                                                              |
| `c`       | Center coordinates [longitude, latitude]  | `-100,40`                                                                   |
| `b`       | Basemap options                           | `id:transport,s:off,l:on`                                                   |
| `i`       | Interaction type                          | `dynamic`, `static`                                                         |
| `keys`    | GeoCore layer UUID keys (comma separated) | `12acd145-626a-49eb-b850-0a59c9bc7506,ccc75c12-5acc-4a6a-959f-ef6f621147b9` |
| `v`       | Schema version                            | `1.0`                                                                       |

**How it works:**

1. When the page loads with URL parameters, the app looks for map elements with the `geoview-map` class
2. For each map found, it checks if the element has `data-shared`
3. If `data-shared` is present, the map will load the configuration from the URL parameters
4. If multiple maps on the page have `data-shared`, all of them will use the same URL parameters configuration

#### Configuration Structure

The configuration object (whether provided via `data-config` or `data-config-url`) follows the general structure provided by the [geoview-core/schema.json](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/schema.json) file.

For detailed configuration options, refer to the GeoView configuration documentation or example configuration files in the project.

#### Programmatic Approach (Using createMapFromConfig)

You can also create maps programmatically using the `createMapFromConfig` method from the API. This is useful when you need to create maps dynamically or when you want more control over the creation process.

> **Full API Reference:** [API — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/API.html)

**Important Note:** The div MUST NOT have a `geoview-map` class. If it does, an `InitMapWrongCallError` will be thrown. The class is added automatically by the framework.

**Example Usage:**

```typescript
// Create a div element
const mapDiv = document.createElement("div");
mapDiv.id = "dynamicMap";
document.body.appendChild(mapDiv);

// Configuration can be a JSON string or a URL to a config file
const mapConfig = JSON.stringify({
  // Your map configuration
});

// Create the map (awaits map ready by default)
const mapViewer = await cgpv.api.createMapFromConfig(
  "dynamicMap",
  mapConfig,
  500,
);
console.log("Map created successfully:", mapViewer.mapId);

// Or without waiting for map ready
const mapViewer2 = await cgpv.api.createMapFromConfig(
  "dynamicMap2",
  mapConfig,
  500,
  false,
);
```

**When to use this approach:**

- When you need to create maps dynamically at runtime
- When you want to load different configurations based on user actions
- When you need to manage the lifecycle of maps programmatically

#### Initialization Events

```typescript
// Register a handler when the map is initialized
cgpv.onMapInit((mapViewer) => {
  // This callback is executed when map is init. The layers have NOT been registered yet at this time.
  // If you want to track ALL status changes for ANY particular layer, use:
  // `mapViewer.layer.onLayerStatusChanged()`
  console.log("Map initialized:", mapViewer.mapId);

  // Listen to ANY/ALL layer status at ANY time (generic event catcher)
  mapViewer.layer.onLayerStatusChanged((sender, payload) => {
    console.log(
      `LayerApi: ${payload.config.layerPath} (generic event) status changed to ${payload.status}`,
    );
  });
});

// Register a handler when the map is ready (map and UI are fully loaded)
cgpv.onMapReady((mapViewer) => {
  // This callback is executed when map is ready / ALL layers have at least been registered.
  // NOTE: some layers can be further along in their individual status at the time this event is triggered(!)
  console.log("Map ready for interaction:", mapViewer.mapId);
});
```

These events are important for proper initialization sequencing:

- `onMapInit` — Fires when the map object is first initialized, but before layers are processed
- `onMapReady` — Fires when the map and UI are fully loaded and ready for interaction (**note**: layers might not be ready)

Using these events helps you properly sequence your application's initialization logic.

### Accessing a Created Map

> **Full API Reference:** [API — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/API.html)

The `cgpv.api.maps` property is private. Use the following methods to access and interact with maps:

```typescript
// Get a list of all active map IDs
const mapIds = cgpv.api.getMapViewerIds(); // string[]

// Check if a map exists
const exists = cgpv.api.hasMapViewer("Map1"); // boolean

// Get a map viewer by ID (throws MapViewerNotFoundError if not found)
const mapViewer = cgpv.api.getMapViewer("Map1");
mapViewer.layer.addGeoviewLayerByGeoCoreUUID(layer);

// Get a map viewer asynchronously (waits until available)
const mapViewer = await cgpv.api.getMapViewerAsync("Map1");

// Delete a map instance
// deleteContainer: true removes the div from the DOM, false keeps it for reuse
await cgpv.api.deleteMapViewer("Map1", false);
```
