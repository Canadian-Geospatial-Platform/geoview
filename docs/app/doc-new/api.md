# GeoView API Documentation

## Overview

The GeoView API provides a comprehensive interface for managing map viewers, handling events, and accessing various utilities within the GeoView application. This documentation covers the main API class and its functions.

## API Class

The `API` class is the main entry point for interacting with GeoView functionality. It provides methods for managing map viewers, handling events, and accessing utility functions.

```typescript
class API {
  config: ConfigApi;
  plugin: typeof Plugin;
  utilities: {
    core: typeof Utilities;
    geo: typeof GeoUtilities;
    projection: typeof Projection;
    date: typeof DateMgt;
  };
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `config` | `ConfigApi` | Access to configuration API (work in progress) |
| `plugin` | `typeof Plugin` | Access to plugin functionality |
| `utilities` | `Object` | Collection of utility functions |

## Utilities

The API provides access to various utility functions through the `utilities` property:

```typescript
utilities: {
  core: Utilities,      // Core utility functions
  geo: GeoUtilities,    // Geographic utility functions
  projection: Projection, // Projection utilities
  date: DateMgt,        // Date management utilities
}
```

For more information about utilities functions, see api-utilities.md