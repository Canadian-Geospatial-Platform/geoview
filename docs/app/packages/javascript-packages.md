# JavaScript Packages

> **⚠️ Legacy Approach:** This document describes vanilla JavaScript package development using an IIFE pattern and external script loading.
>
> **For Modern Development:** Use TypeScript and the monorepo structure described in [Core Package Development](./core-packages.md) for better type safety, tooling, and integration.

## Overview

External JavaScript packages allow you to extend GeoView without being part of the Rush monorepo. The package is loaded as a separate `<script>` tag and registered with the viewer at runtime.

## Creating a Package

A package is a JavaScript file written inside an [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE) (Immediately Invoked Function Expression). The class must be exported to `window.geoviewPlugins` so the viewer can find it.

### Minimal Structure

```js
// my-plugin.js
(function () {
  class MyPlugin {
    // Called when the plugin is added to a map
    onAdd() {
      console.log("Plugin added to map:", this.mapViewer.mapId);
    }

    // Called when the plugin is removed from a map
    onRemove() {
      console.log("Plugin removed from map:", this.mapViewer.mapId);
    }
  }

  // Export the plugin class — the key must match the plugin ID
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins["my-plugin"] = MyPlugin;
})();
```

### Available Properties

When the plugin is instantiated by the viewer, the following properties are available on `this`:

| Property           | Description                                      |
| ------------------ | ------------------------------------------------ |
| `this.pluginId`    | The unique plugin identifier                     |
| `this.mapViewer`   | The `MapViewer` instance for the map             |
| `this.pluginProps` | Properties passed when loading the plugin        |
| `this.react`       | React library (for `createElement`, hooks, etc.) |
| `this.createRoot`  | React DOM `createRoot` function                  |
| `this.translate`   | The `react-i18next` translation instance         |
| `this.useTheme`    | MUI `useTheme` hook                              |

### Translations

Override the `defaultTranslations()` method to add English and French translations:

```js
class MyPlugin {
  defaultTranslations() {
    return {
      en: {
        MyPlugin: { title: "My Plugin" },
      },
      fr: {
        MyPlugin: { title: "Mon Plugin" },
      },
    };
  }

  onAdd() {
    // Translations are merged into i18next automatically
  }

  onRemove() {}
}
```

### Creating a React Component

Use `this.react.createElement` to create React elements without JSX:

```js
// counter.js
(function () {
  class CounterPlugin {
    panel = null;

    defaultTranslations() {
      return {
        en: { CounterPlugin: { count: "Count" } },
        fr: { CounterPlugin: { count: "Compter" } },
      };
    }

    onAdd() {
      const { react, translate, mapViewer } = this;
      const h = react.createElement;
      const { useState } = react;

      // Create a functional React component
      const CounterComponent = () => {
        const [count, setCount] = useState(0);
        const { t } = translate.useTranslation();

        return h(
          "button",
          {
            onClick: () => setCount(count + 1),
          },
          `${t("CounterPlugin.count")} ${count}`,
        );
      };

      // Button properties for the app bar
      const buttonProps = {
        id: "counter-plugin",
        "aria-label": "CounterPlugin.count",
        tooltip: "Counter",
        children: h("span", null, "+"),
        visible: true,
      };

      // Panel properties
      const panelProps = {
        title: "Counter",
        content: CounterComponent,
        width: 300,
      };

      // Create a panel on the app bar
      this.panel = mapViewer.appBarApi.createAppbarPanel(
        buttonProps,
        panelProps,
      );
    }

    onRemove() {
      if (this.panel) {
        this.mapViewer.appBarApi.removeAppbarPanel(this.panel.buttonPanelId);
      }
    }
  }

  // Export the plugin
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins["counter"] = CounterPlugin;
})();
```

## Loading the Package

### Step 1: Include the Script

Add a `<script>` tag in the `<head>` of your HTML page:

```html
<script src="./counter.js"></script>
```

### Step 2: Register the Plugin

After the map is initialized, register the plugin using `cgpv.api.plugin.addPlugin`. The function takes 4 arguments:

```js
cgpv.api.plugin.addPlugin(pluginId, pluginClass, mapId, props);
```

| Argument      | Description                              |
| ------------- | ---------------------------------------- |
| `pluginId`    | Unique plugin name (string)              |
| `pluginClass` | The exported plugin class                |
| `mapId`       | The map ID to attach the plugin to       |
| `props`       | Optional properties passed to the plugin |

**Example:**

```js
cgpv.onMapInit((mapViewer) => {
  cgpv.api.plugin.addPlugin(
    "counter",
    window.geoviewPlugins["counter"],
    mapViewer.mapId,
    { someOption: true },
  );
});
```

### Removing a Plugin

```js
cgpv.api.plugin.removePlugin("counter", "mapId");
```

## Loading Bundled Core Packages

The viewer is bundled with core packages. Load them by adding their ID to the appropriate config array:

- **`corePackages`** — Map-level packages (e.g., `swiper`, `test-suite`)
- **`appBar.tabs.core`** — App bar packages (e.g., `aoi-panel`, `about-panel`, `custom-legend`)
- **`footerBar.tabs.core`** — Footer bar packages (e.g., `time-slider`, `geochart`)
- **`navBar`** — Nav bar packages (e.g., `drawer`)

```html
<div
  id="mapWM"
  class="geoview-map"
  data-lang="en"
  data-config="{
        'map': {
          'interaction': 'dynamic',
          'viewSettings': {
            'projection': 3857
          },
          'basemapOptions': {
            'basemapId': 'transport',
            'shaded': false,
            'labeled': true
          }
        },
        'components': ['north-arrow', 'overview-map'],
        'navBar': ['drawer'],
        'corePackages': ['swiper'],
        'appBar': {
          'tabs': {
            'core': ['aoi-panel']
          }
        },
        'footerBar': {
          'tabs': {
            'core': ['time-slider']
          }
        },
        'theme': 'geo.ca'
      }"
></div>
```

## See Also

- **[Core Package Development](./core-packages.md)** - Modern TypeScript package development (recommended)
- **[Core Packages Reference](./geoview-core-packages.md)** - API reference for all bundled packages
- **[Controllers API](app/events/controllers.md)** - Controllers for performing actions
- **[API Reference](app/api/api.md)** - Main API methods
