# Packages Documentation

This section contains comprehensive documentation for GeoView's package system, including core packages, development guides, and architecture.

## 📚 Documentation Structure

### Core Package Reference

- **[Core Packages](./geoview-core-packages.md)** - Complete reference for all built-in packages (time-slider, geochart, swiper, drawer, aoi-panel, custom-legend)

### Development Guides

- **[Creating Core Packages](./core-packages.md)** - Rush.js monorepo setup and TypeScript package development
- **[Creating JavaScript Packages](./javascript-packages.md)** - Vanilla JavaScript package development guide (legacy)

## 🔌 Core Packages

GeoView includes six built-in packages that extend the viewer's functionality:

| Package           | Description                                | Location    |
| ----------------- | ------------------------------------------ | ----------- |
| **time-slider**   | Time dimension support for WMS/ESRI layers | Footer bar  |
| **geochart**      | Interactive data visualization charts      | Footer bar  |
| **swiper**        | Layer comparison with swipe control        | Map overlay |
| **drawer**        | Drawing and geometry editing tools         | Nav bar     |
| **aoi-panel**     | Area of Interest selection and management  | App bar     |
| **custom-legend** | Advanced legend customization              | App bar     |

**See:** [Core Packages Reference](./geoview-core-packages.md) for detailed documentation.

## 📦 Package Types

### Components vs Packages

**Components** are basic, reusable building blocks (e.g., legends, data tables) that are part of geoview-core.

**Packages** are collections of components that extend functionality:

- **Core Packages**: Maintained by GeoView team (time-slider, geochart, swiper, etc.)
- **External Packages**: Third-party packages developed outside the GeoView repository

### Loading Packages

**Map Packages (swiper):**

```json
{
  "corePackages": ["swiper"]
}
```

**App Bar Packages (aoi-panel):**

```json
{
  "appBar": {
    "tabs": {
      "core": ["aoi-panel"]
    }
  }
}
```

**Footer Bar Packages (time-slider, geochart):**

```json
{
  "footerBar": {
    "tabs": {
      "core": ["time-slider", "geochart"]
    }
  }
}
```

**Nav Bar Packages (drawer):**

```json
{
  "navBar": ["drawer"]
}
```

## 🛠️ Development

### Quick Start

**TypeScript Package (Recommended):**

1. Create package structure in `packages/`
2. Update `rush.json` with package entry
3. Update `webpack.common.js` with bundle config
4. Create plugin class extending `AppBarPlugin`, `FooterPlugin`, or `NavBarPlugin`
5. Create React component using GeoView hooks
6. Export package and register

**JavaScript Package (Legacy):**

1. Create IIFE-wrapped class
2. Implement `onAdd()` and `onRemove()` lifecycle methods
3. Export class via `window.geoviewPlugins`
4. Load via `cgpv.api.plugin.addPlugin()`

### Development Guides

- **[Core Package Development](./core-packages.md)** - TypeScript, Rush.js, Webpack setup
- **[JavaScript Package Development](./javascript-packages.md)** - Vanilla JS package creation (legacy)

## 🔗 Related Documentation

- **[Controllers API](app/events/controllers.md)** - Controllers for performing actions
- **[Configuration Reference](app/config/configuration-reference.md)** - Package configuration options
- **[API Reference](app/api/api.md)** - Core API methods
- **[State Management](programming/using-store.md)** - Zustand store architecture

## 📋 Quick Reference

### Common Tasks

| Task                      | Documentation                                                    |
| ------------------------- | ---------------------------------------------------------------- |
| Use a core package        | [Core Packages Reference](./geoview-core-packages.md)            |
| Create TypeScript package | [Core Package Development](./core-packages.md)                   |
| Create JavaScript package | [JavaScript Package Development](./javascript-packages.md)       |
| Configure package         | [Configuration Reference](app/config/configuration-reference.md) |

---

**Navigation:** [Main Documentation](README.md) | [API Documentation](app/api/README.md) | [Layer Documentation](app/layers/README.md)
