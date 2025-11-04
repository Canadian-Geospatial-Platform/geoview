# geoview-core

geoview-core is a package that manages the core viewer functionalities. Among those functionalities:

- An [API](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages/geoview-core/src/api) that is exported to be used for internal and external packages
  - APIs to manage [events](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages/geoview-core/src/api/events)
  - APIs to manage [plugins(packages)](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages/geoview-core/src/api/plugin)
  - APIs to control maps
- Main rendering of maps and [core](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages/geoview-core/src/core) components
- Layers and [Geospatial](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages/geoview-core/src/geo) functionalities
- [User Interface](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages/geoview-core/src/ui) elements

### The viewer is the loader

As GeoView is now a **monorepo**, it needs one **starter project** (an app). **geoview-core** is the starter project that manages all internal packages. It uses **webpack** to compile, build and bundle the packages.
