# GeoView

The Canadian Geospatial Platform intends to deploy new infrastructure, tools and web integration of GeoCore, a new geospatial metadata lake library capable of supporting multiple metadata standards. In recognition of these desired capabilities, it needs a lightweight viewer to incorporate in their infrastructure. The need is to have a simple and flexible viewer to display geospatial data from GeoCore metadata lake on a map with limited functionalities.

[Demo](https://yass0016.github.io/GeoView/index.html)

## Solution

GeoView mapping capabilites are based on [Leafet](https://github.com/Leaflet/Leaflet) open source viewer. The overall project uses the latest [React](https://reactjs.org/) framework version 17+. With this in mind, here is the list of the main dependencies

- [react-leaflet](https://react-leaflet.js.org/) version 3+ to make the link between Leafelt and React

- [i18next](https://www.i18next.com/) to do localization in English and French

- [material-ui](https://mui.com/) to do the layout

## Project Structure

This project is now a monorepo and contains the following packages under the `packages` folder:

- [geoview-core](packages/geoview-core) - the core is responsible for managing APIs, layers, user interface and rendering the maps. The core will also expose API access to be used in internal, external packages and apps that uses the viewer.

- [geoview-details-panel](packages/geoview-details-panel) - a package that displays a panel with details when a location / feature is clicked on the map.

- [geoview-basemap-panel](packages/geoview-basemap-panel) - a package that displays a panel with a list of basemaps that can be selected to switch the map's basemap.

- [geoview-layers-panel](packages/geoview-layers-panel) - a package that displays a panel with a list of loaded layers and their legend.

- [geoview-overview-map](packages/geoview-overview-map) a package that displays an overview map (mini-map)

## Developpement

Developement is made with [Visual Studio Code](https://code.visualstudio.com/) and uses few extentions to help linting and formating

- Prettier - Code formatter

- ESLint

- Better Comments

## Building the project

### First clone this repo

```
$ git clone https://github.com/Canadian-Geospatial-Platform/GeoView.git
```

### Go to the directory of the cloned repo

```
$ cd GeoView
```

### Install rush globally

```
$ npm install -g @microsoft/rush
```

### Install dependencies

It's always recommended to run the below command if you pull any changes.

```
$ rush update
```

If you need to re-download the modules you can run

```
$ rush update --full
```

### Build the project:

```
$ rush build:core
```

Output build files will be placed under

```
packages/geoview-core/dist
```

### Run/Serve the project

```
$ rush serve
```

GeoView will be serve from http://localhost:8080/

## Deploy to gh-pages

### Build the project:

```
$ rush build:core
```

### Push the dist folder to your gh-pages

```
$ rush host
```

The project will now serve inside your GitHub gh-pages at

```
https://[GITHUB-USERNAME].github.io/GeoView/index.html
```

_Make sure GitHub pages are active inside your origin repository_

## Usage

We'll go through the simplest way to use the Canadian Geospatial Platform Viewer.

### Using the viewer on your own project

For the moment, the released bundle of the viewer is hosted under:

```
https://yass0016.github.io/GeoView/cgpv-main.js
```

_As the viewer is still in development, this bundle will always contain the latest commits._

To use the viewer on your own project, you need to include the above script in a script tag in the header of your **HTML** file

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://yass0016.github.io/GeoView/cgpv-main.js"></script>
  </head>
  <body>
    ...
  </body>
</html>
```

After including the viewer in your page, the viewer will allow you to load maps and draw them on your page.

There are multiple ways to load maps. Below we will show a basic usage of loading a map, if you want to see how you can load the map in all supported ways then [click here](docs/loading-maps.md).

#### Loading a map using a config passed in as inline to the map div element

The viewer allows you to load multiple maps on the page, you need to provide a **different id** for each map. Maps are added in the body tag of the **HTML** document. _You can also load maps inside any **JS** framework such as React, Angular, VueJS._

For the viewer to recognize that you are trying to render a map on the page, you need to have a **div element** with **class** "llwp-map".

It's **recommended** to pass in an **id attribute**, if an id is not passed then the viewer will auto generate an id for you. If you want to use APIs that control this map then you will need to view all created maps on the page and figure out the id of the created map.

_Tip: to view all maps on the page you can console out the maps using this function `console.log(cgpv.api.maps)_

Below is an example of a simple map, with an id **mapOne**. This map will be using project 3978 and will have a zoom of 4, a center of 60 latitude and -100 longtitude. The interaction of the map will be dynamic (meaning that you can move around and zoom in/out). It will use the transport, shaded with labels as the basemap. It will display an esri dynamic layer with multiple sub layers. The language of the map will be English.

```html
<div
  id="mapOne"
  class="llwp-map"
  style="height: 100vh;"
  data-lang="en-CA"
  data-config="{
      'map': {
        'interaction': 'dynamic',
        'view': {
          'zoom': 4,
          'center': [60, -100],
          'projection': 3978
        },
        'basemapOptions': {
          'id': 'transport',
          'shaded': true,
          'labeled': true
        },
        'layers': [
          {
            'id': 'esriDynamicLYR3',
            'name': {
              'en': 'Energy Infrastructure of North America',
              'fr': 'Infrastructure énergétique d'Amérique du Nord'
            },
            'url': {
              'en': 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_en/MapServer',
              'fr': 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_fr/MapServer'
            },
            'layerType': 'esriDynamic',
            'layerEntries': [
              {
                'index': 4,
                'name': {
                  'en': 'Natural Gas Processing Plants - config',
                  'fr': 'Usines de traitement du gaz naturel - config'
                }
              },
              {
                'index': 5
              },
              {
                'index': 6
              }
            ]
          }
        ]
      },
      'languages': ['en-CA']
    }"
></div>
```

Once you add the above to the body of the html file. You must **call** the **init function** to allow the viewer to render the map.

```html
<script>
  // init functions, takes one parameter as a function callback. Any code inside the callback will run once map has finished rendering.
  cgpv.init(function () {});
</script>
```

Full example:

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://yass0016.github.io/GeoView/cgpv-main.js"></script>
  </head>
  <body>
    <div
      id="mapOne"
      class="llwp-map"
      style="height: 100vh;"
      data-lang="en-CA"
      data-config="{
	          'map': {
	            'interaction': 'dynamic',
	            'view': {
	              'zoom': 4,
	              'center': [60, -100],
  	            'projection': 3978
	            },
	            'basemapOptions': {
	              'id': 'transport',
	              'shaded': true,
	              'labeled': true
	            },
	            'layers': [
	              {
	                'id': 'esriDynamicLYR3',
	                'name': {
	                  'en': 'Energy Infrastructure of North America',
	                  'fr': 'Infrastructure énergétique d'Amérique du Nord'
	                },
	                'url': {
	                  'en': 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_en/MapServer',
	                  'fr': 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_fr/MapServer'
	                },
	                'layerType': 'esriDynamic',
	                'layerEntries': [
	                  {
	                    'index': 4,
	                    'name': {
	                      'en': 'Natural Gas Processing Plants - config',
	                      'fr': 'Usines de traitement du gaz naturel - config'
	                    }
	                  },
	                  {
	                    'index': 5
	                  },
	                  {
	                    'index': 6
	                  }
	                ]
	              }
	            ]
	          },
	          'theme': 'dark',
	          'languages': ['en-CA']
	        }"
    ></div>
    <script>
      // init functions, takes one parameter as a function callback. Any code inside the callback will run once map has finished rendering.
      cgpv.init(function () {});
    </script>
  </body>
</html>
```

## Typedoc Documentation for GeoView

[click here](https://yass0016.github.io/GeoView/docs/) to view generated typedoc for the GeoView core.

## Contributing to the project

see our [wiki](https://github.com/Canadian-Geospatial-Platform/GeoView/wiki/Contributing-Guideline)
