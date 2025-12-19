# Configuration Documentation

This section contains comprehensive documentation for configuring GeoView maps.

## 📚 Documentation Files

### Getting Started

- **[Creating Maps](./create-map.md)** - How to create maps using declarative (HTML) and programmatic approaches

  - Declarative approach with `data-` attributes
  - Programmatic approach with `createMapFromConfig()`
  - Map initialization and configuration loading
  - HTML attribute reference

- **[Configuration Reference](app/config/configuration-reference.md)** - Complete configuration schema and options
  - Map configuration properties
  - Layer configuration options
  - UI component settings (appBar, footerBar, navBar)
  - Core package configuration
  - Configuration examples for all layer types

## 🗺️ Quick Start

### Declarative Approach (HTML)

```html
<div
  id="mapId"
  class="geoview-map"
  data-lang="en"
  data-config-url="./path/to/config.json"
></div>

<script>
  cgpv.init();
</script>
```

### Programmatic Approach (JavaScript)

```javascript
const mapConfig = {
  map: {
    interaction: "dynamic",
    viewSettings: {
      zoom: 4,
      center: [-95, 60],
      projection: 3978,
    },
    basemapOptions: {
      basemapId: "transport",
      shaded: false,
    },
    listOfGeoviewLayerConfig: [
      // Layer configurations...
    ],
  },
};

cgpv.api.maps.createMapFromConfig("mapId", mapConfig);
```

## 🔍 Common Configuration Tasks

| Task                    | Documentation                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| Create a basic map      | [Creating Maps - Declarative Approach](./create-map.md#declarative-approach-using-html)         |
| Use programmatic API    | [Creating Maps - Programmatic Approach](./create-map.md#programmatic-approach-using-api)        |
| Configure basemap       | [Configuration Reference - Basemap Options](./configuration-reference.md#basemapoptions)        |
| Add layers              | [Configuration Reference - Layer Config](./configuration-reference.md#listofgeoviewlayerconfig) |
| Configure UI components | [Configuration Reference - UI Components](./configuration-reference.md#appbar-footerbar-navbar) |
| Set up packages          | [Configuration Reference - Core Packages](./configuration-reference.md#corepackages)            |

## 📋 Configuration Schema

The configuration follows a hierarchical structure:

```
Config
├── map
│   ├── interaction
│   ├── viewSettings (zoom, center, projection)
│   ├── basemapOptions
│   ├── listOfGeoviewLayerConfig[]
│   └── extraOptions
├── theme
├── language
├── appBar (tabs, buttons)
├── footerBar (tabs)
├── navBar (buttons)
├── corePackages[]
├── corePackagesConfig[]
└── components[]
```

## 🔗 Related Documentation

- **[Layer API](../api/layer-api.md)** - Programmatically managing layers
- **[Core Geoview Packagea](../packages/geoview-core-packages.md)** - Available packages and their configuration
- **[API Reference](../api/api.md)** - Core API methods
- **[Layers Guide](../layers/layers.md)** - Understanding layer types

---

**Navigation:** [Main Documentation](../../README.md) | [API Documentation](../api/README.md) | [Packages](../packages/README.md)
