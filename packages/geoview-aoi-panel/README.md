# geoview-Area-of-interest

A package that allows a user to display a collection of areas to visit on the map.

# Area of Interest for GeoView

## What is it about

The **Area of Interest** or **AOI** package for GeoView allows users to define, visualize, and interact with specific geographic areas within a map. This tool is particularly useful for applications where users need to focus on or analyze specific regions, such as environmental studies, urban planning, and resource management.

## How to Configure

### Prerequisites

1. **GeoView**: Ensure you have GeoView installed and properly configured.
2. **Dependencies**: Install necessary dependencies for the package (if any).

### Installation

The installation process is not done using npm as in a traditional way. It involves running the JavaScript files that dynamicaly adds the package, installing the AOI package, which allows you to use it in your project.

### Configuration

The user can add its own configuration by creating a config file that will replace the default one used on the map. To do so the new config file must have the same file name as the config file used by the map and append the package name to it.

The map config file could be named **myMap.json** and it content is something similar to the following:

```
{
  "map": {
    "interaction": "dynamic",
    "viewSettings": {
      "projection": 3978
    },
    "basemapOptions": {
      "basemapId": "transport",
      "shaded": false,
      "labeled": true
    }
  },
  "theme": "geo.ca",
  "components": ["north-arrow", "overview-map"],
  "corePackages": [],
  "appBar": {
    "tabs": {
      "core": ["aoi-panel"] // This is were Geoview knows it needs to load the package
    }
  }
}
```

The file containing the AOI must use the following patern: "config file name"-aoi-panel.json (i.e.: myMapId-aoi-panel.json where myMapId is the ID of the map).

## How to link Area of Interests to a map

### Adding an Area of Interest

To add an AOI to your map, you need to create a file as mentioned above containing the following information:

```
{
  "isOpen": true,
  "aoiList": [
    {
      "imageUrl": "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcSbleN5tjC2Dilx77SCBJD9f3CxlnDEEGx5qY786BpVlu4JLzUd1ixjIOfO1WX5mJjUQLmSSg4JFuNWgqGZJZDV7LBH8y3QBz3KrjuHdg",
      "aoiTitle": "CN Tower",
      "extent": [-79.3881, 43.6416, -79.3861, 43.6436]
    },
    {
      "imageUrl": "https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTCSU8D4pV4fY9MfYa6NZvpcMrCDhxE-ySOSzbxqSCC67_loNeJ9WI-2Ki7zCfU36M0Iwt7-4aw0y3_Vg8t_8sxo86xS6HVewQdYjOOXA",
      "aoiTitle": "Parliament Hill",
      "extent": [-75.7019, 45.4226, -75.6999, 45.4246]
    }
  ],
  "version": "1.0"
}
```
Where the definition of the different properties are as followed:
- **IsOpen**: is a flag that open the side panel if the value is true.
- **aoiList**: is an array of AOI.
  - **imageURL**: The URL link to the image of your choice that represent the **AOI**.
  - **aoiTitle**: The name of the **AOI**.
  - **extent**: The geographic coordinates for the **AOI**.
- **version**: is an optional version number of the AOI schema.

### Removing an Area of Interest

The curent only way to remove the **AOI** is by manualy deleting the entry in the file for the concerned AOI. However, if you want to delete the package from your project, you can use the API as follow:

```
cgpv.api.plugin.removePlugin('aoi-panel', 'myMap');
```

### Links
For more details, please refer to the official documentation or reach out to our support team. You can also try our [demo page](https://canadian-geospatial-platform.github.io/geoview/public/demos-navigator.html?config=./configs/navigator/26-package-area-of-interest.json)