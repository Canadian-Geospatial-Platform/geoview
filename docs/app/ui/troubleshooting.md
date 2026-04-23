# Troubleshooting for Users & Power Users

This guide explains how GeoView communicates errors and what to do when something goes wrong.

## How GeoView Reports Problems

GeoView uses two main channels to inform you about issues:

### Notifications & Snackbar Messages (For You)

When something goes wrong that affects your experience — a layer fails to load, a service is unavailable, or a configuration is invalid — GeoView displays a **notification** or a **snackbar message** directly in the map interface.

- **Snackbar messages** appear briefly at the bottom of the map to inform you of transient issues (e.g., "Layer failed to load").
- **Notifications** are accessible via the notification bell icon in the app bar. They persist so you can review them later.

**These are the messages you should pay attention to.** They are written in plain language and describe what happened and, when possible, what you can do about it.

### Console Messages (For Core Developers Only)

The browser developer console (`F12` → Console tab) contains detailed technical logs — trace calls, debug information, internal state changes, and low-level error details. **These messages are intended for GeoView core developers**, not for end users or power users.

You do **not** need to monitor the console during normal use. The console output is verbose by design and most messages do not indicate problems.

## What to Do When Something Goes Wrong

### Step 1 — Check Notifications

Open the notification panel (bell icon in the app bar) and review any messages. They will tell you what went wrong and which layer or feature is affected.

### Step 2 — Verify Your Configuration

If you are a power user working with JSON configurations or the API, double-check your configuration for common issues:

- **Invalid layer URLs** — Ensure the service endpoint is reachable and returns valid data.
- **Wrong layer IDs** — Verify that `layerId` values match what the service actually exposes.
- **Projection mismatches** — Confirm that your layer supports the map's projection (3978 or 3857).
- **Missing required fields** — Use the sandbox page's "Validate" button to check your JSON before creating a map.

### Step 3 — Test Your Application

If you are building an application with GeoView's API (`cgpv.api`), test your integration thoroughly:

- Use `cgpv.onMapInit()` and `cgpv.onMapReady()` to ensure the map is initialized before calling API methods.
- Listen for layer error events (`mapViewer.layer.onLayerError()`) to catch and handle layer failures in your code.
- Verify that layers reach a "loaded" status using `mapViewer.layer.onLayerLoaded()`.

### Step 4 — Contact the GeoView Team

If something is clearly not working and **no notification or error message is displayed**, this is likely a bug in GeoView itself. Please report it to the GeoView team so we can fix it.

When reporting an issue, include:

- **What you expected** to happen
- **What actually happened** (or didn't happen)
- **Your configuration** (the JSON config or API calls you used)
- **The URL of the service** involved (if applicable)
- **Browser and version** you are using

You can open an issue on the [GeoView GitHub repository](https://github.com/Canadian-Geospatial-Platform/geoview/issues).

## Summary

| Channel                  | Audience                | Action                              |
| ------------------------ | ----------------------- | ----------------------------------- |
| Notifications & snackbar | Users & power users     | Read and act on these messages      |
| Browser console          | GeoView core developers | Ignore during normal use            |
| No message at all        | —                       | Report as a bug to the GeoView team |
