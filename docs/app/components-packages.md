# Components versus Packages
The main difference between a component and a package is their level of customization. A component is the basic item to build with and as no configuration options. In the other hand, a package is something build with one to many core components and custom one as well. We can see the component as a Lego block and a package as the resulting contructed structure.

## What is a components
Components are part of geoview-core package where we can find the barebone functionnalities of GeoView (api, events, translation, ...).
Some components like legend and data-grid can be reuse within another package or direclty from GeoView API as we can see in these demo:
- [legend](https://canadian-geospatial-platform.github.io/geoview/public/legend.html)
- [data-grid](https://canadian-geospatial-platform.github.io/geoview/public/package-footer-panel.html)

Other components can be added to the map from the configuration like this:

```js
'components': ['app-bar', 'nav-bar', 'north-arrow', 'overview-map']
```

In both cases these components are basic items on wich we can build bigger functionalities.


## What is a packages
Packages are a collection of components bundled together to extend the viewer's functionalities. There is two types of package, **Core Package** and **External Package**.

A **Core Package** is a package developed and maintained by the viewer team. The viewer supports few core packages such as a [basemap panel](https://canadian-geospatial-platform.github.io/geoview/public/package-basemap-panel.html), details panel, layers panel or [footer panel](https://canadian-geospatial-platform.github.io/geoview/public/package-footer-panel.html). Core package can be added by configuration like this:

```js
'corePackages': ['details-panel', 'layers-panel', 'basemap-panel', 'footer-panel'],
```

Each package is configurable, at some extent, as they have their own schema and default configuration. For exemple, the basemap panel has this [schema](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-basemap-panel/schema.json) and [default configuration](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-basemap-panel/default-config-basemap-panel.json). If needed, user can customize the package by providing a custom configuration file to initialize the package.

To use a custom configuration for a package, follow these steps:
- Provide a json configuration file to load to the map div
```html
<div id="mapLCC" class="llwp-map" data-lang="en" data-config-url="./configs/package-bp1-lcc-config.json"></div>
```
- Inside this file, add the core package to use
```js
'corePackages': ['basemap-panel'],
```
- Create a configuration for the package and name it <config-file-name>-<package-name>(i.e.  `package-bp1-lcc-config-basemap-panel.json`)
- Put both configuration files in the same folder

An **External Package** is a package developed outside of the GeoView repository and not maintain by the viewer team. You can se a demonstration in this [repository](https://github.com/Canadian-Geospatial-Platform/geoview-ce-demo).
**Currently there is no mechanism to reuse an external package inside another viewer instance, this is work in progress.**
