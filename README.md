# GeoView – Viewer / Visualisateur

**La version française suit.**

Natural Resources Canada / Ressources naturelles Canada
Part of **GEO.ca**

---

## Overview

The Canadian Geospatial Platform intends to deploy new infrastructure, tools and web integration of GeoCore, a new geospatial metadata lake library capable of supporting multiple metadata standards. In recognition of these desired capabilities, it needs a lightweight viewer to incorporate in their infrastructure. The need is to have a flexible viewer to display geospatial data from the GeoCore metadata lake on a map with customizable functionalities.

GeoView is built with **React**, **TypeScript**, and **OpenLayers**, and is structured as a **Rush monorepo**. It can be embedded into any web page with a single script tag and configured declaratively via HTML attributes or programmatically through a rich JavaScript/TypeScript API.

### Key Capabilities

**Extensive Layer Support**

GeoView supports a wide range of geospatial data sources out of the box:

- **Raster**: OGC WMS, ESRI Dynamic, ESRI Image, static images, XYZ tiles, WMTS
- **Vector**: OGC API Features, WFS, ESRI Feature Service, GeoJSON, CSV, KML, WKB, GeoPackage, Shapefile
- **Vector Tiles**: Mapbox Vector Tiles (MVT)

Layers can be organized in hierarchies, filtered, styled, and controlled individually through a consistent API.

**Multiple Map Projections**

Maps can be rendered in Lambert Conformal Conic (EPSG:3978), Web Mercator (EPSG:3857), and North Pole LAEA Canada (EPSG:3573) projections.

**Plugin Architecture**

A plugin system allows functionality to be extended without modifying the core. Official plugins include:

- **Time Slider** – temporal navigation and animation for time-enabled layers
- **Swiper** – side-by-side layer comparison
- **GeoChart** – charting of geospatial attribute data
- **Drawer** – collapsible side panel for custom content
- **AOI Panel** – area-of-interest selection
- **Custom Legend** – user-defined legend rendering
- **About Panel** – configurable about/information panel

**Map Interaction & UI**

- Interactive legend with visibility and opacity controls
- Feature details panel (click/hover queries)
- North arrow, scale bar, and overview map
- Map rotation support
- Basemap switching
- Full-screen mode and responsive layout
- Export to PNG and PDF with legend, scale bar, and attribution
- Customizable theming (light, dark, and custom color palettes)

**Developer Experience**

- Declarative (HTML `data-config`) and programmatic (`createMapFromConfig`) map creation
- Shareable map state via URL parameters
- Zustand-based state management with a clear three-layer architecture (UI → Controllers → Store)
- Comprehensive event system for map, layer, and interaction events
- Bilingual support (English and French)
- WCAG 2.1 accessibility compliance
- TypeDoc-generated API documentation

## Related Resources

- **GitHub Repository**: Canadian-Geospatial-Platform/geoview
- **GEO.ca**: [geo.ca](https://app.geo.ca)
- **Developement**: [Code](README-DEV.md)

---

## Support & Contributions

- Report bugs or request features via **GitHub Issues**
- Contributions are welcome following Government of Canada open-source guidelines

**Contact**:
`geo@nrcan-rncan.gc.ca`

---

## License & Attribution

© His Majesty the King in Right of Canada, as represented by the Minister of Natural Resources.

This project is released under the applicable Government of Canada open-source license.

---

# GeoView – Visualisateur / Viewer

Ressources naturelles Canada / Natural Resources Canada
Fait partie de **GEO.ca**

---

## Aperçu

La Plateforme géospatiale canadienne vise à déployer une nouvelle infrastructure, de nouveaux outils et une intégration web de GeoCore, une nouvelle bibliothèque de lac de métadonnées géospatiales capable de prendre en charge plusieurs normes de métadonnées. Pour répondre à ces besoins, il faut un visualiseur léger à intégrer dans cette infrastructure. L'objectif est d'avoir un visualiseur flexible pour afficher des données géospatiales provenant du lac de métadonnées GeoCore sur une carte avec des fonctionnalités personnalisables.

GeoView est construit avec **React**, **TypeScript** et **OpenLayers**, et est structuré en **monorepo Rush**. Il peut être intégré dans n'importe quelle page web à l'aide d'une seule balise script et configuré de manière déclarative via des attributs HTML ou par programmation via une API JavaScript/TypeScript.

### Capacités principales

**Prise en charge étendue des couches**

GeoView prend en charge un large éventail de sources de données géospatiales :

- **Matricielles** : OGC WMS, ESRI Dynamic, ESRI Image, images statiques, tuiles XYZ, WMTS
- **Vectorielles** : OGC API Features, WFS, ESRI Feature Service, GeoJSON, CSV, KML, WKB, GeoPackage, Shapefile
- **Tuiles vectorielles** : Mapbox Vector Tiles (MVT)

**Projections cartographiques multiples**

Les cartes peuvent être rendues en projection conique conforme de Lambert (EPSG:3978), Web Mercator (EPSG:3857) et LAEA pôle Nord Canada (EPSG:3573).

**Architecture de plugiciels**

Un système de plugiciels permet d'étendre les fonctionnalités sans modifier le cœur de l'application. Les plugiciels officiels comprennent : le curseur temporel, le comparateur par balayage (swiper), GeoChart, le tiroir, le panneau de zone d'intérêt, la légende personnalisée et le panneau À propos.

**Interaction et interface utilisateur**

- Légende interactive avec contrôles de visibilité et d'opacité
- Panneau de détails des entités
- Flèche du nord, barre d'échelle et carte de survol
- Exportation en PNG et PDF avec légende, barre d'échelle et attribution
- Thématisation personnalisable (palettes claires, sombres et personnalisées)
- Support bilingue (anglais et français)
- Conformité à l'accessibilité WCAG 2.1

## Ressources connexes

- **Dépôt GitHub** : Canadian-Geospatial-Platform/geoview
- **GEO.ca** : [geo.ca](https://app.geo.ca)
- **Documentation** : [Code](README-DEV.md) (En anglais seulement)

---

## Soutien et contributions

- Signalez des bogues ou proposez des fonctionnalités via les **issues GitHub**
- Les contributions sont les bienvenues conformément aux lignes directrices open source du gouvernement du Canada

**Contact**:
`geo@nrcan-rncan.gc.ca`

---

## Licence et attribution

© Sa Majesté le Roi du chef du Canada, représenté par le ministre des Ressources naturelles.

Ce projet est publié sous la licence open source applicable du gouvernement du Canada.
