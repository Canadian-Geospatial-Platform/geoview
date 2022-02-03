# GeoView

The Canadian Geospatial Platform intends to deploy new infrastructure, tools and web integration of GeoCore, a new geospatial metadata lake library capable of supporting multiple metadata standards. In recognition of these desired capabilities, it needs a lightweight viewer to incorporate in their infrastructure. The need is to have a simple and flexible viewer to display geospatial data from GeoCore metadata lake on a map with limited functionalities.

[Demo](https://jolevesq.github.io/GeoView/index.html)

## Solution

GeoView mapping capabilites are based on [Leafet](https://github.com/Leaflet/Leaflet) open source viewer. The overall project uses the latest [React](https://reactjs.org/) framework version 17+. With this in mind, here is the list of the main dependencies

-   [react-leaflet](https://react-leaflet.js.org/) version 3+ to make the link between Leafelt and React
-   [i18next](https://www.i18next.com/) to do localization in English and French
-   [material-ui](https://material-ui.com/) to do the layout

## Developpement

Developement is made with [Visual Studio Code](https://code.visualstudio.com/) and uses few extentions to help linting and formating

-   Prettier
-   ESLint
-   Better Comments

## Building the project

To install the project, just run
`npm install`

To serve the project, just run
`npm run serve` and GeoView will be serve from http://localhost:8080/

## Deploy to gh-pages

To deploy the project, just run
`npm run build`

Then push the dist folder to your gh-pages
`npm run deploy`

The project is now serve inside your GitHub gh-pages at
`https://[GITHUB-USERNAME].github.io/GeoView/index.html

_Make sure GitHub pages are active inside your origin repository_

## Usage

We'll go through the simplest way to use the Canadian Geospatial Platform Viewer.

First, grab the most recent release from the [github releases](https://github.com/Canadian-Geospatial-Platform/GeoView/releases). Place the files cgpv-main.js and cgpv-styles.css within your webpage's folder structure. Place also the img and locales folder at the same place. We usually put.

Then you want to include those files on your page

Within head, should be before including any other libraries

```html
<script src="/cgpv-main.js"></script>
```

Now that you have the required files on your page we should add the map element. There is 3 ways to do this

-   Map div element
    ```html
    <div
        id="mapLCC"
        class="llwp-map"
        data-leaflet="{ 'projection': 3978, 'zoom': 12, 'center': [45,-75], 'language': 'fr-CA', 'basemapOptions': { 'id': 'transport', 'shaded': true, 'labeled': true }, layers:[] }"
    ></div>
    ```
-   _Work in progress_ -> Url: The url will have parameters to setup the map. The map div, a div element with class **llwp-map**, must be on the page
    ```html
    <div id="mapLCC" class="llwp-map"></div>
    ```
-   _Work in progress_ -> Code: call the create map function from cgpv-main.js with needed parameters

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

## Contributing to the project

see our [wiki](https://github.com/Canadian-Geospatial-Platform/GeoView/wiki/Contributing-Guideline)
