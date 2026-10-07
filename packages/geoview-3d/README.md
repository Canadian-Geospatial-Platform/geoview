# geoview-3d

A deck.gl-based 3D Tiles viewer plugin for GeoView.

## What is it about

The **geoview-3d** package adds an AppBar toggle that opens a deck.gl-owned canvas
rendering an [OGC 3D Tiles 1.1](https://www.ogc.org/standard/3dtiles/) tileset. It
is a self-contained spike: it lives entirely under `packages/geoview-3d` and makes
no changes to `geoview-core` source.

> Phase 1 (this skeleton) registers the plugin and its config/schema. The deck.gl
> canvas and `Tile3DLayer` rendering are added in Phase 2.

## How to configure

Add `geoview-3d` to the map config so GeoView loads the package:

```json
{
  "appBar": {
    "tabs": {
      "core": ["geoview-3d"]
    }
  }
}
```

The package reads its options from a config file named
`"<map config name>"-geoview-3d.json`, matching the default config below.

### Options

- **isOpen** (`boolean`): open the 3D panel on load. Default `false`.
- **tilesetUrl** (`string`): URL of the 3D Tiles 1.1 `tileset.json` to render. Use
  `REPLACE_ME` as a placeholder until a real tileset is provided.
- **version** (`string`): schema version. `"1.0"`.

### Default config

```json
{
  "isOpen": false,
  "tilesetUrl": "REPLACE_ME",
  "version": "1.0"
}
```
