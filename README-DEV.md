# GeoView

## Creating and Managing Map Configurations

To assist you in creating or customizing map configurations, we provide a dedicated [Map Configuration Repository on [GitHub]:(https://github.com/Canadian-Geospatial-Platform/geoview-demo). This repository contains a collection of sample configurations, documentation, API functions to help you get started quickly.

## Solution

GeoView mapping capabilities are based on [OpenLayers](https://openlayers.org/) open source viewer. The overall project uses the latest [React](https://reactjs.org/) framework version 19+. With this in mind, here is the list of the main dependencies

- [i18next](https://www.i18next.com/) to do localization in English and French

- [material-ui](https://mui.com/) to do the layout

## Project Structure

This project is now a monorepo and contains the following packages under the `packages` folder:

- [geoview-core](packages/geoview-core) - the core is responsible for managing APIs, layers, user interface and rendering the maps. The core will also expose API access to be used in internal, external packages and apps that uses the viewer.

- [geoview-details-panel](packages/geoview-details-panel) - a package that displays a panel with details when a location / feature is clicked on the map.

- [geoview-layers-panel](packages/geoview-layers-panel) - a package that displays a panel with a list of loaded layers and their legend.

- [geoview-swiper](packages/geoview-swiper) - a package that enable a swiper control to tooggle visibility of layers from one side to the other side of the swiper bar.

## Development

Our developers use [Visual Studio Code](https://code.visualstudio.com/) with a few extentions to help linting and formatting

- Prettier - Code formatter

- ESLint

- Better Comments

- We are using [React Dev Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)

### Documentation for GeoView

- [click here](https://canadian-geospatial-platform.github.io/geoview/public/docs/) to view generated typedoc for the GeoView core.
- [click here](./docs/README.md) to view best practicies and how to develop with GeoView.

### Contributing to the project

see our [contributing guide](CONTRIBUTING.md)

## Building the project

Use **Node.js 24 LTS, version 24.22.1 or a newer patched 24.x release**, with its bundled npm. Rush installs the repository-pinned pnpm automatically; no separate pnpm installation is needed. See the [contributing guide](CONTRIBUTING.md#tools) for prerequisites and portable Windows setup without administrator rights.

### First clone this repo

```
$ git clone https://github.com/Canadian-Geospatial-Platform/geoview.git
```

### Go to the directory of the cloned repo

```
$ cd geoview
```

### Install rush globally (optional)

```
$ npm install -g @microsoft/rush
```

Without a global installation, replace `rush` in the commands below with `node common/scripts/install-run-rush.js` from the repository root. Both use the versions pinned in `rush.json`, not the latest Rush/pnpm releases.

- Note: you can also use the included `shell.nix` to setup your dev environment if you are on Mac/Linux/WSL.

### Install dependencies

It's always recommended to run the below command if you pull any changes.

```
$ rush install
```

Use `rush update` when intentionally changing dependencies or regenerating the lockfile.

#### Upgrading an existing clone

When `rush.json` changes the Node, Rush, or pnpm version (for example, the move to
Node 24, Rush 5.181.0, and pnpm 11.1.1):

1. Install the required Node 24.x release with its bundled npm.
2. If you use a global launcher, update it to avoid an old-version warning:
   `npm install -g @microsoft/rush@5.181.0`.
3. Run `rush install` (not `rush update`). The lockfile and build-script approvals
   are committed.
4. If the install fails because of files left by the previous pnpm version, run
   `rush purge`, then `rush install` again.

#### Updating the pinned pnpm version

Change `pnpmVersion` in `rush.json`, then run `rush update` from the repository
root. Avoid `--full` for a package-manager upgrade: it re-resolves every dependency
and pulls newer versions within the declared ranges.

If the new pnpm cannot read the current lockfile format (pnpm 11 cannot read
format `6.0`), convert it with an intermediate pnpm release first (for example,
`9.15.9` for `6.0` → `9.0`), copy `common/temp/pnpm-lock.yaml` to
`common/config/rush/pnpm-lock.yaml`, then switch to the target version and run
`rush update` again.

pnpm 11 blocks dependency build scripts until approved. Approve trusted packages
with `rush-pnpm --subspace default approve-builds`; Rush stores them in
`globalAllowBuilds` in `common/config/rush/pnpm-config.json`.

Confirm the lockfile diff changes only its format, then verify:

```
node common/scripts/install-run-rush.js install
node common/scripts/install-run-rush.js build
```

If you need to re-download the modules you can run

```
$ rush purge
$ rush install
```

Avoid `rush update --full` unless you intend to re-resolve every dependency to
the newest version allowed by `package.json`.

### Build the project:

```
$ rush build
```

The build checks formatting and lint but does not change source files; it fails if
either check fails. Fix issues from `packages/` with `npm run format` and
`npm run fix`, or run `npm run check` to verify without building.

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
$ rush build
```

### Push the dist folder to your gh-pages

```
$ rush host
```

The project will now serve inside your GitHub gh-pages at

```
https://[GITHUB-USERNAME].github.io/geoview/index.html
```

_Make sure GitHub pages are active inside your origin repository_

## Usage

We'll go through the simplest way to use the Canadian Geospatial Platform Viewer.

### Using the viewer on your own project

For the moment, the developement bundle of the viewer is hosted under:

```
https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js
```

_As the viewer is still in development, this bundle will always contain the latest commits. We really recommand to use one of our release on your web server_

_To install an official release from the GeoView CDN or from a release zip file, see [Installing GeoView](./docs/app/config/create-map.md#installing-geoview)._

_Development builds (local `rush serve` / `rush build-dev` and the hosted gh-pages preview) display their version with a `-dev.<shortHash>` suffix in the app bar **Version** popover (e.g. `v.2.3.0-dev.a1b2c3d`), so you can tell them apart from an official release (clean `v.2.3.0`). See [docs/programming/release-workflow.md](./docs/programming/release-workflow.md#build-version-suffix-dev-vs-release) for details._

To use the viewer on your own project, you need to include the above script in a script tag in your **HTML** file

```html
<!DOCTYPE html>
<html>
  <body>
    ...
  </body>
  <script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
</html>
```

After including the viewer in your page, the viewer will allow you to load maps and draw them on your page.

There are multiple ways to load maps. Below we will show a basic usage of loading a map, if you want to see how you can load the map in all supported ways then [click here](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/docs/app/loading-maps.md).

#### Loading a map using a config passed in as inline to the map div element

The viewer allows you to load multiple maps on the page, you need to provide a **different id** for each map. Maps are added in the body tag of the **HTML** document. _You can also load maps inside any **JS** framework such as React, Angular, VueJS._

For the viewer to recognize that you are trying to render a map on the page, you need to have a **div element** with **class** "geoview-map".

It's **recommended** to pass in an **id attribute**, if an id is not passed then the viewer will auto generate an id for you. If you want to use APIs that control this map then you will need to view all created maps on the page and figure out the id of the created map.

_Tip: to view all maps on the page you can console out the maps using this function: console.log(cgpv.api.getMapViewerIds())_

Below is an example of a simple map, with an id **mapOne**. This map will be using LCC projection (EPSG:3978) and will have a zoom of 4, a center of 60 latitude and -100 longtitude. The interaction of the map will be dynamic (meaning that you can move around and zoom in/out). It will use the transport, shaded with labels as the basemap. It will display an esri dynamic layer with multiple sub layers. The language of the map will be English.

```html
<div
  id="mapOne"
  class="geoview-map"
  style="height: 100vh;"
  data-lang="en"
  data-config="{
      'map': {
        'interaction': 'dynamic',
        'viewSettings': {
          'projection': 3978
        },
        'basemapOptions': {
          'basemapId': 'transport',
          'shaded': true,
          'labeled': true
        },
        'listOfGeoviewLayerConfig': [
          {
            'geoviewLayerId': 'esriDynamicLYR2',
            'geoviewLayerName': 'Energy',
            'metadataAccessPath': 'https://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/MapServer',
            'geoviewLayerType': 'esriDynamic',
            'listOfLayerEntryConfig': [{ 'layerId': '0' }, { 'layerId': '6' }]
          }
        ]
      },
      'components': ['north-arrow', 'overview-map'],
      'corePackages': [],
      'theme': 'geo.ca'
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
  <body>
    <div
      id="mapOne"
      class="geoview-map"
      style="height: 100vh;"
      data-lang="en"
      data-config="{... insert your configuration ...}"
    ></div>
    <script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
    <script>
      // init functions, takes one parameter as a function callback. Any code inside the callback will run once map has finished rendering.
      cgpv.init(function () {});
    </script>
  </body>
</html>
```
