# GeoView Filter Panel

A customizable filter panel plugin for GeoView that allows users to filter map layers based on attribute values.

## Disclaimer / Future Improvements

The Filter Panel does not currently sync with other components like the layer list / legend and the data-table. 
- **Layer List / Legend**: When a layer is using the attribute for displaying unique values, the value will still be showing in the UI and showing as enabled. Also, disabling a unique class in the layer list or legend will not remove it from the filter panel.
- **Data Table**: When a layer is filtered in the Filter Panel, the filtered items are hidden in the data-table. However, if a filter is applied to a field in the data table that is present in the filter panel, the unique values in the filter panel are not updated.

## Features

- **Multiple Filter Types**: Support for select, multiselect, range, and date filters
- **Theme-Aware**: Automatically adapts to GeoView's theme (geo.ca, light, dark)
- **Auto-Apply or Manual**: Configure whether filters apply automatically or require user action
- **Layer Organization**: Collapsible layer sections for clean UI
- **Real-Time Updates**: Filters update the map in real-time using GeoView's LayerFilters system

## Configuration

Add the filter panel to your map configuration:

```json
{
  "corePackages": ["filter-panel"],
  "corePackagesConfig": [
    {
      "filter-panel": {
        "enabled": true,
        "isOpen": false,
        "layers": [
          {
            "layerId": "my-layer-path",
            "layerName": "My Layer",
            "enabled": true,
            "attributes": [
              {
                "fieldName": "category",
                "displayLabel": "Category",
                "filterType": "multiselect",
                "enabled": true,
                "defaultValues": []
              },
              {
                "fieldName": "population",
                "displayLabel": "Population",
                "filterType": "range",
                "enabled": true,
                "defaultValues": { "min": null, "max": null }
              },
              {
                "fieldName": "date_created",
                "displayLabel": "Date Created",
                "filterType": "date",
                "enabled": true,
                "defaultValues": { "start": null, "end": null }
              }
            ]
          }
        ],
        "settings": {
          "title": "Filter Layers",
          "collapsible": true,
          "defaultCollapsed": false,
          "showApplyButton": false,
          "showResetButton": true,
          "autoApply": true,
          "showFeatureCount": true
        }
      }
    }
  ]
}
```

## Filter Types

### Select
Single-value dropdown selection

```json
{
  "fieldName": "status",
  "displayLabel": "Status",
  "filterType": "select",
  "enabled": true
}
```

### Multiselect
Multiple-value checkbox list

```json
{
  "fieldName": "category",
  "displayLabel": "Category",
  "filterType": "multiselect",
  "enabled": true,
  "defaultValues": []
}
```

### Range
Numeric min/max range

```json
{
  "fieldName": "population",
  "displayLabel": "Population",
  "filterType": "range",
  "enabled": true,
  "defaultValues": { "min": null, "max": null }
}
```

### Date
Date range selection

```json
{
  "fieldName": "date_created",
  "displayLabel": "Date Created",
  "filterType": "date",
  "enabled": true,
  "defaultValues": { "start": null, "end": null }
}
```

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `title` | string | "Filter Layers" | Panel title |
| `collapsible` | boolean | true | Allow collapsing layer sections |
| `defaultCollapsed` | boolean | false | Default collapsed state |
| `showApplyButton` | boolean | false | Show apply button |
| `showResetButton` | boolean | true | Show reset button |
| `autoApply` | boolean | true | Auto-apply filters on change |
| `showFeatureCount` | boolean | true | Show feature count after filtering |

## Usage

The filter panel integrates directly with GeoView's LayerFilters system. When filters are applied:

1. SQL-like filter expressions are generated based on user selections
2. Filters are applied via `AbstractGVLayer.setLayerFiltersData()`
3. The map updates in real-time to show only filtered features
4. Data table and other UI components automatically sync with filtered data

## Development

```bash
# Build the plugin
rush build

# Development mode
rush serve
```

## License

MIT
