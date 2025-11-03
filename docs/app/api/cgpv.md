# CGPV API: Functions and Events

This document lists and describes the main functions and event hooks available on the `cgpv` global object, which is the entry point for interacting with GeoView maps and their lifecycle.

---

## Overview

The `cgpv` object provides methods to:
- Initialize maps
- Listen for map lifecycle events
- Access the API and map viewers
- Access resources like ui components and react framework (for customization)

---

## Core Functions

---

## Map Lifecycle Events

These methods allow you to register callbacks for key map lifecycle events.

### `cgpv.onMapInit(callback)`
Registers a callback that fires when a map is initialized (but before layers are processed).

```typescript
cgpv.onMapInit((mapViewer) => {
  // Map is initialized, but layers are not yet registered
});

cgpv.init();
```

---

### `cgpv.onMapReady(callback)`
Registers a callback that fires when the map and UI are fully loaded and ready for interaction (**note** layers might not be ready).

```typescript
cgpv.onMapReady((mapViewer) => {
  // Map and UI are fully loaded
});

cgpv.init();
```
---

## Notes

- Always register your event handlers before calling `cgpv.init()`.
- For layer-specific events, use the `mapViewer.layer` API (see the Layer Events documentation).

---

## Example: Typical Usage

```typescript
cgpv.onMapInit((mapViewer) => {
  // Register map and layer events here
});

cgpv.onLayersLoaded((mapViewer) => {
  // All layers are loaded
});

cgpv.init();
```

---

## Event Structure

All GeoView events follow a consistent pattern:

```typescript
// Register an event handler
object.onEventName((sender, payload) => {
  // Handle the event
  console.log(`Event triggered by ${sender} with data:`, payload);
});
```

Where:
- object is the object that emits the event (e.g., mapViewer, mapViewer.layer)
- onEventName is the event name (e.g., onMapZoomEnd, onLayerLoaded)
- sender is the object that triggered the event
- payload contains event-specific data

---

This document provides a quick reference for the main functions and event hooks on the `cgpv` object. For more details, see the full GeoView documentation.
