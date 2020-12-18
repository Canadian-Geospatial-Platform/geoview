# GeoView

The Canadian Geospatial Platform intends to deploy new infrastructure, tools and web integration of GeoCore, a new geospatial metadata lake library capable of supporting multiple metadata standards. In recognition of these desired capabilities, it needs a lightweight viewer to incorporate in their infrastructure. The need is to have a simple and flexible viewer to display geospatial data from GeoCore metadata lake on a map with limited functionalities.

[Demo](https://jolevesq.github.io/GeoView/index.html)

## Solution

GeoView mapping capabilites are based on [Leafet](https://github.com/Leaflet/Leaflet) open source viewer. The overall project uses the latest [React](https://reactjs.org/) framework version 17+. With this in mind, here is the list of the main dependencies
* [react-leaflet](https://react-leaflet.js.org/) version 3+ to make the link between Leafelt and React
* [i18next](https://www.i18next.com/) to do localization in English and French
* [material-ui](https://material-ui.com/) to do the layout

## Developpement

Developement is made with VisualStudio Code and uses few extentions to help linting and formating
* Prettier
* ESLint
* Better Comments

## Building the project

To install the project, just run
`npm install`

To serve the project, just run
`npm run serve` and GeoView will be serve from http://localhost:8080/

## Contributing to the project
_Work in progress_