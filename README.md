# GeoView

This project is now a monorepo and contains the following repos under the `packages` folder:

- geoview-core (the core is responsible for rendering the maps and exposing API access to the outside)
- geoview-details-panel (a plugin that displays a panel with details when a location / feature is clicked on the map)
- geoview-overview-map (a plugin that displays an overview map)
- geoview-loader (the loader that compiles, builds and serves the project with all the packages)

## Building the project

### First clone this repo

```
$ git clone https://github.com/Canadian-Geospatial-Platform/GeoView.git
```

### Go to the directory of the cloned repo

```
cd GeoView
```

### Install rush globally

```
$ npm install -g @microsoft/rush
```

### Install dependencies

```
$ rush update
```

### Build the project:

```
$ rush build:core
```

### Serve the project

```
$ rush serve
```

### Deploy the project

```
$ rush host
```