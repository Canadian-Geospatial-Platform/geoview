# Loading maps

There are multiple ways to load maps on your projects

- [**By providing parameters in the URL**](#by-providing-parameters-in-the-url)
- [**By providing a json file url in the div in the data-config-url attribute**](#by-providing-a-json-file-url-in-the-div-in-the-data-config-url-attribute)
- [**By providing the config object inline in the div in the data-config attribute**](#by-providing-the-config-object-inline-in-the-div-in-the-data-config-attribute)
- [**By providing the config object in a function call in the init function**](#by-providing-the-config-object-in-a-function-call-in-the-init-function)

### By providing parameters in the URL

You can provide a URL with search parameters for the config properties. This is useful for sharing links of certain configurations. An example link will look like

https://canadian-geospatial-platform.github.io/geoview/public/default-config.html?p=3857&z=4&c=-100,40&l=en&t=dark&b={id:transport,shaded:false,labeled:true}&i=dynamic&cc=overview-map&keys=12acd145-626a-49eb-b850-0a59c9bc7506,ccc75c12-5acc-4a6a-959f-ef6f621147b9#HLCONF5

```
z is for zoom level
p is for projection (currently supported values: 3857 and 3978)
c is for center (an array of two elements, represents latitude and longtitude)
l is for language (currently supported values: en, fr
t is for theme (currently supported values: dark, light)
b is for basemap options (an object with three properties, id, shaded, labeled)
cp is for core packages to be loaded (array of strings) supported values: "details-panel", "layers-panel", "basemap-panel", "footer-panel"
keys is for layer uuid keys (the keys will match keys in the catalog, can be comma seperated)
```

When the page loads with the provided URL search parameters, the app will look for a map with the **llwp-map** class. If a map is found, it will check if the map div element contains **data-shared="true"**. If the **data-shared** value is true, it means that the map will load the configurations from the url search parameters, if **multiple maps** are loaded in the page and all of them have the **data-shared** attribute then all of those maps will use the same URL parameters config.

### By providing a json file url in the div in the data-config-url attribute

You can also provide a URL for a json file with the config object and pass it in the map div element in the **data-config-url** attribute. An example of this

```js
<div
  id="mapWM"
  class="llwp-map"
  data-lang="en"
  data-config-url="https://canadian-geospatial-platform.github.io/geoview/public/configs/my-config.json"
></div>
```

The content of the config must match the schema, an example of the object in the json file:

```json
{
  "map": {
    "interaction": "dynamic",
    "viewSettings": {
      "zoom": 12,
      "center": [45, 75],
      "projection": 3978
    },
    "basemapOptions": {
      "id": "transport",
      "shaded": true,
      "labeled": true
    },
    "listOfGeoviewLayerConfig": []
  },
  "theme": "dark",
  "components": ["north-arrow"],
  "corePackages": [
    "basemap-panel",
    "layers-panel",
    "details-panel",
    "geolocator"
  ],
  "externalPackages": [],
  "suportedLanguages": ["en", "fr"]
}
```

### By providing the config object inline in the div in the data-config attribute

You can also provide the same config above in the **data-config** attribute of the map div element as inline

An example of this:

```html
<div
  id="UC1"
  class="llwp-map"
  data-lang="en"
  data-config="{
                    'map': {
                        'interaction': 'dynamic',
                        'viewSettings': {
                            'zoom': 12,
                            'center': [45,75],
                            'projection': 3978
                        },
                        'basemapOptions': {
                            'basemapId': 'transport',
                            'shaded': true,
                            'labeled': true
                        },
                        'listOfGeoviewLayerConfig': [
                        {
                          'geoviewLayerId': 'wmsLYR1',
                          'geoviewLayerName': {
                            'en': 'Première Nation / First Nation',
                            'fr': 'Première Nation / First Nation'
                          },
                          'metadataAccessPath': {
                            'en': 'https://services.aadnc-aandc.gc.ca/geomatics/services/Donnees_Ouvertes-Open_Data/Premiere_Nation_First_Nation/MapServer/WMSServer',
                            'fr': 'https://services.aadnc-aandc.gc.ca/geomatics/services/Donnees_Ouvertes-Open_Data/Premiere_Nation_First_Nation/MapServer/WMSServer'
                          },
                          'geoviewLayerType': 'ogcWms',
                          'listOfLayerEntryConfig': [{ 'layerId': '0' }]
                        }
                      ],
                    },
                    'theme': 'dark',
                    'components': ['north-arrow', 'overview-map'],
                    'corePackages': ['basemap-panel', 'layers-panel', 'details-panel', 'geolocator'],
                    'externalPackages': [],
                    'suportedLanguages': ['en', 'fr']
                }'
></div>
```

_Note: if you provides both **data-config** and **data-config-url**, in the same div element then the **data-config** configurations will overwrite the config coming from the json file_

### By providing the config object in a function call in the init function

You can also provide the same config object in a function call after the **init** function has been called

An example of this:

```js

<div
    id="mapWM"
    class="llwp-map"
    data-lang="en"
></div>

<script>
cgpv.init(function() {
    cgpv.api.maps['mapWM'].loadConfig({
        map: {
            interaction: 'dynamic',
            viewSettings: {
                zoom: 12,
                center: [45, 75],
                projection: 3978
            },
            basemapOptions: {
                basemapId: 'transport',
                shaded: true,
                labeled: true,
            },
            listOfGeoviewLayerConfig: [],
        },
        theme: 'dark',
        components: ['north-arrow', 'overview-map'],
        corePackages: ['basemap-panel', 'layers-panel', 'details-panel'],
        externalPackages: [],
        suportedLanguages: ['en', 'fr'],
    });
});
</script>

```
