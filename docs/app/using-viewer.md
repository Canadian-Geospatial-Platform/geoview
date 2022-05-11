# Using the core viewer

## Building the project

First clone the project
`git clone https://github.com/Canadian-Geospatial-Platform/GeoView.git`

Then go to the GeoView folder
`cd GeoView`

To install the project, run
`npm install`

If you want to run the project type
`npm run serve` and GeoView will be serve from http://localhost:8080/

To build the project type
`npm run build`

## Creating a new page to display a map

We'll go through the simplest way to use the Canadian Geospatial Platform Viewer.

First, grab the most recent release from the [github releases](https://github.com/Canadian-Geospatial-Platform/GeoView/releases). Place the files cgpv-main.js and cgpv-styles.css within your webpage's folder structure. Place also the img and locales folder at the same place. We usually put.

Then you want to include those files on your html page

Within head

```html
<link rel="stylesheet" href="/cgpv-styles.css" />
```

Within head, should be before including any other libraries

```html
<script src="/cgpv-main.js"></script>
```

Now that you have the required files on your page we should add the map element.

-   Map div element
    ```html
    <div
        id="mapLCC"
        class="llwp-map"
        data-leaflet="{ 'projection': 3978, 'zoom': 12, 'center': [45,-75], 'language': 'fr-CA', 'basemapOptions': { 'id': 'transport', 'shaded': true, 'labeled': true }, layers:[] }"
    ></div>
    ```

#### Parameters

-   projection: The basemap projection to use for the map. Accepted values are 3857 (Web Mercator) or 3978 (LCC)
-   zoom: The basemap zomm level. Accepted value is a number between 0 and 20
-   center: The default center extent when the map loads. Accepted value is a pair of coordinates [lattitude, longitude]
-   language: The map language for labels and tooltips. Accepted values are en-CA and fr-CA
-   basemapOptions: Options to display a basemap, currently builtin basemaps are `transport`, `shaded`, and `labeled`
    -   id: An id to select the main basemap, it should be either `transport`, `shaded` or `simple`
    -   shaded: a boolean value to enable or disable shaded basemap (if id is set to `shaded` then this should be false)
    -   labeled: a boolean value to enable or disable labels
-   layers: Array of layers to add to the map
    -   name: the layer's name
    -   url: The service url
    -   type: The layer type. Accepted values are esriFeature, esriDynamic, ogcWMS
    -   entries: For esriDynamic and ogcWMS a list of entries must be specified

    ```
        'layers':[
            { 'name': 'Census', 'url': 'https://webservices.maps.canada.ca/arcgis/services/StatCan/census_subdivisions_2016_en/MapServer/WMSServer', 'type': 'ogcWMS', 'entries': '0' },
            { 'name': 'Energy', 'url': 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/NRCAN/Investing_Energy_Canada_en/MapServer', 'type': 'esriDynamic', 'entries': '0, 2' },
            { 'name': 'Geochron', 'url': 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/GSCC/Geochronology/MapServer', 'type': 'esriDynamic', 'entries': '0' },
            { 'name': 'Geomet', 'url': 'https://geo.weather.gc.ca/geomet', 'type': 'ogcWMS', 'entries': 'RAQDPS-FW.CE_PM2.5-DIFF-YAvg' }
        ]
    ```

Now to display the map need to call the init function, create a script tag before the closing body tag

### Note

Only one init function should be called per page, you can't have multiple init functions on the same page

```js
<script>cgpv.init(function () {})</script>
```

Please see `public/templates` for sample pages
