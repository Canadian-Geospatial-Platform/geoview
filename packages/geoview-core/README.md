# geoview-core

geoview-core is a package that manages the core viewer functionalities. Among those functionalities:

- An [API](src/api) that is exported to be used for internal and external packages
  - APIs to manage [events](src/api/events)
  - APIs to manage [plugins](src/api/plugin.ts)
  - APIs to control maps
- Main rendering of maps and [core](src/core) components
- Layers and [Geospacial](src/geo) functionalities
- [User Interface](src/ui) elements

### The viewer is the loader

As GeoView is now a **monorepo**, it needs one **starter project** (an app). **geoview-core** is the starter project that manages all internal packages. It uses **webpack** to compile, build and bundle the packages.
