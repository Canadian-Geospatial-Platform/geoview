# geoview-swiper

a package that enable a swiper control to tooggle visibility of layers from one side to the other side of the swiper bar. This package is based on the following sample:

- https://viglino.github.io/ol-ext/examples/control/map.control.swipe.html
- https://openlayers.org/en/latest/examples/layer-swipe.html

## Configuration

| Property         | Type      | Default      | Description                                                                                                                                    |
| ---------------- | --------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `orientation`    | string    | `"vertical"` | Orientation of the swiper bar. One of `"vertical"` or `"horizontal"`.                                                                           |
| `keyboardOffset` | number    | `10`         | The offset value when the swiper is moved from the keyboard.                                                                                    |
| `interactive`    | boolean   | `false`      | When `true`, users can add/remove layers from the swiper and choose the revealed side directly from the layer settings panel. When `false`, the swiper stays static (author-defined). |
| `layers`         | object\[] | `[]`         | The layers participating in the swiper. Each entry is `{ "layerPath": string, "side": "left" \| "right" \| "up" \| "down" }`.                   |

### Per-layer side

Each layer entry declares which side of the bar the layer is revealed on. The `side` value names the **visible** portion of the layer:

- Vertical orientation → `"left"` or `"right"`
- Horizontal orientation → `"up"` or `"down"`

### Example

```json
{
  "orientation": "vertical",
  "interactive": true,
  "layers": [{ "layerPath": "myLayerId/sublayer", "side": "left" }]
}
```

