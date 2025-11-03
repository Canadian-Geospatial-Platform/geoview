### Creating Maps in GeoView

There are two main approaches to create maps in GeoView:

1. **Declarative approach**: Using HTML div elements with special attributes
2. **Programmatic approach**: Using the `createMapFromConfig` API method

**IMPORTANT NOTE**
If you are using a framework to inject the cgpv-main.js script dynamically, you may end up with multiples version of cgpv window object and React version. If this happen you will have a console log that says **'Multiple instances of cgpv loaded. Make sure you only inject cgpv-main.js once.'**
If this happens, try to resolve the issue by injection cgpv script only one or unmount it properly betweeen the calls.

#### Declarative Approach (Using HTML)

When you call `cgpv.init()`, it scans the DOM for elements that are intended to host GeoView maps. It initializes all GeoView maps found in the DOM. Call this after registering your event handlers.

Specifically, it looks for `<div>` elements with certain attributes that identify them as GeoView map containers. The most common attribute is `data-geoview-map`, but your implementation may support others.

**Typical requirements for a GeoView map container:**
- The element is a `<div>`.
- It has the class attribute value `geoview-map`.
- It may include additional attributes such as `data-config`, `data-config-url`, `data-lang`, or `data-shared` to specify map configuration, language, or shared state.
- The `data-config` has precedence over `data-config-url` if both are provided.

**Example:**
```html
<div
  id="myMap"
  class="geoview-map"
  data-lang="en"
  data-config-url="path/to/config.json"
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

##### `data-shared`

When set to `true`, the map will load configuration from URL parameters if they are present. This is especially useful for sharing specific map views or configurations via links.

```html
<div
  id="myMap"
  class="geoview-map"
  data-lang="en"
  data-shared="true"
  style="width: 100%; height: 400px;"
></div>
```

With this setup, you can share a link with URL parameters to load a specific map configuration.

Example URL with parameters:
```
https://example.com/geoview/default-config.html?p=3857&z=4&c=-100,40&l=en&t=dark&b={id:transport,shaded:false,labeled:true}&i=dynamic&cc=overview-map&keys=12acd145-626a-49eb-b850-0a59c9bc7506,ccc75c12-5acc-4a6a-959f-ef6f621147b9#HLCONF5
```

Supported URL parameters:

| Parameter | Description | Example Values |
|-----------|-------------|----------------|
| `z` | Zoom level | `4` |
| `p` | Projection | `3857`, `3978` |
| `c` | Center coordinates [longitude, latitude] | `-100,40` |
| `l` | Language | `en`, `fr` |
| `t` | Theme | `dark`, `light` |
| `b` | Basemap options | `{id:transport,shaded:false,labeled:true}` |
| `cp` | Core packages to load | `time-slider,swiper,geochart` |
| `keys` | Geocore layer UUID keys (comma separated) | `12acd145-626a-49eb-b850-0a59c9bc7506,ccc75c12-5acc-4a6a-959f-ef6f621147b9` |

**How it works:**
1. When the page loads with URL parameters, the app looks for map elements with the `geoview-map` class
2. For each map found, it checks if the element has `data-shared="true"`
3. If `data-shared` is true, the map will load the configuration from the URL parameters
4. If multiple maps on the page have `data-shared="true"`, all of them will use the same URL parameters configuration

#### Configuration Structure

The configuration object (whether provided via `data-config` or `data-config-url`) follows the general structure provided by the [geoview-core/schema.json](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/schema.json) file.

For detailed configuration options, refer to the GeoView configuration documentation or example configuration files in the project.

#### Programmatic Approach (Using createMapFromConfig)

You can also create maps programmatically using the `createMapFromConfig` method from the API. This is useful when you need to create maps dynamically or when you want more control over the creation process.

```typescript
/**
 * Create a new map in a given div id.
 *
 * @param {string} divId - id of the div to create map in
 * @param {string} mapConfig - config passed in from the function call (string or url of a config path)
 * @param {number} divHeight - height of the div to inject the map in (optional, mandatory if the map reloads)
 * @param {boolean} forceDeleteInApi - force a delete of the MapViewer from the maps array (default: false)
 * @returns {Promise<MapViewer>} The created map viewer
 */
createMapFromConfig(divId: string, mapConfig: string, divHeight?: number, forceDeleteInApi: boolean = false): Promise<MapViewer>
```

**Important Note:** The div MUST NOT have a geoview-map class or a warning will be shown when the map is initialized.

**Example Usage:**

```typescript
// Create a div element
const mapDiv = document.createElement('div');
mapDiv.id = 'dynamicMap';
document.body.appendChild(mapDiv);

// Configuration can be a JSON string or a URL to a config file
const mapConfig = JSON.stringify({
  // Your map configuration
});

// Create the map
cgpv.api.createMapFromConfig('dynamicMap', mapConfig, 500)
  .then(mapViewer => {
    console.log('Map created successfully:', mapViewer.id);
    // You can now interact with the map viewer
  })
  .catch(error => {
    console.error('Error creating map:', error);
  });
```

**When to use this approach:**
- When you need to create maps dynamically at runtime
- When you want to load different configurations based on user actions
- When you need to manage the lifecycle of maps programmatically

```typescript
// Register a handler when the map is initialized
cgpv.onMapInit((mapViewer) => {
  // This callback is executed when map is init. The layers have NOT been registered yet at this time.
  // Note: Layers have NOT been registered yet at this time. If you really want to make sure to track ALL
  // status changes for ANY particular layer, you can use a hook such as:
  // `mapViewer.layer.onLayerStatusChanged()`
  console.log('Map initialized:', mapViewer.id);

  // Listen to ANY/ALL layer status at ANY time (generic event catcher)
  mapViewer.layer.onLayerStatusChanged((sender, payload) => {
    console.log(`LayerApi: ${payload.config.layerPath} (generic event) status changed to ${payload.status}`);
  });
});

// Register a handler when the map is ready (map and UI are fully loaded)
cgpv.onMapReady((mapViewer) => {
  // This callback is executed when map is ready / ALL layers have at least been registered.
  // NOTE: some layers can be further along in their individual status at the time this event is triggered(!).
  console.log('Map ready for interaction:', mapViewer.id);
});
```
These events are important for proper initialization sequencing:
- onMapInit - Fires when the map object is first initialized, but before layers are processed
- onMapReady - Fires when the map and UI are fully loaded and ready for interaction (**note** layers might not be ready)

Using these events helps you properly sequence your application's initialization logic.

### Accessing a created map

The api.maps array is now private and only accessible from the api. The ```cgpv.api.maps``` is not available anymore. To access and interact with the maps, new functions have been added.

- How to get a list of maps available

```typescript
/**
 * Gets the list of all map IDs currently in the collection.
 *
 * @returns {string[]} Array of map IDs
 */
getMapViewerIds(): string[]
```

- How to know if a map exist

```typescript
/**
 * Return true if a map id is already registered.
 *
 * @param {string} mapId - The unique identifier of the map to retrieve
 * @returns {boolean} True if map exist
 */
hasMapViewer(mapId: string): boolean
```

- How to access a map by id

```typescript
/**
 * Gets a map viewer instance by its ID.
 *
 * @param {string} mapId - The unique identifier of the map to retrieve
 * @returns {MapViewer} The map viewer instance if found
 * @throws {Error} If the map with the specified ID is not found
 */
getMapViewer(mapId: string): MapViewer
```
_Implementation_
```typescripts
const myMap = cgpv.api.getMapViewer('Map1');
myMap.layer.addGeoviewLayerByGeoCoreUUID(layer)
```

- How to delete a map instance

```typescript
/**
 * Delete a map viewer instance by its ID.
 *
 * @param {string} mapId - The unique identifier of the map to delete
 * @param {boolean} deleteContainer - True if we want to delete div from the page
 * @returns {Promise<HTMLElement} The Promise containing the HTML element
 */
deleteMapViewer(mapId: string, deleteContainer: boolean): Promise<HTMLElement | void> {
```
_Implementation_
```typescript
if (cgpv.api.hasMapViewer(map)) {
  cgpv.api.deleteMapViewer(map, false).then(() => {
    resolve();
  });
} else {
  resolve();
}
```
