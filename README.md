# GeoView – Viewer / Visualisateur

**La version française suit.**

Natural Resources Canada / Ressources naturelles Canada
Part of **GEO.ca**

---

## Overview

The Canadian Geospatial Platform intends to deploy new infrastructure, tools and web integration of GeoCore, a new geospatial metadata lake library capable of supporting multiple metadata standards. In recognition of these desired capabilities, it needs a lightweight viewer to incorporate in their infrastructure. The need is to have a flexible viewer to display geospatial data from the GeoCore metadata lake on a map with customizable functionalities.

GeoView is built with **React**, **TypeScript**, and **OpenLayers**, and is structured as a **Rush monorepo**. It can be embedded into any web page with a single script tag and configured declaratively via HTML attributes or programmatically through a rich JavaScript/TypeScript API.

Use GeoView as a standalone web viewer with support for a wide variety of spatial datasets and extensive built-in exploration tools, or integrate it into a website or open-data portal, as GEO.ca and Open Maps Canada do. See [Where GeoView fits](docs/app/geoview-comparison.md) for product categories and alternatives, and [GeoView capabilities](docs/app/geoview-capabilities.md) for features, packages, and customization **(both guides are English only)**.

### Demo

See [GeoView in Action](https://canadian-geospatial-platform.github.io/geoview/public/index.html) **(English only)**.

![GeoView viewer screenshot](https://user-images.githubusercontent.com/3472990/233729101-89cc4196-915d-4d6e-a353-4fb70cbb566e.PNG)

### Key Capabilities

- **Explore diverse spatial data** — view supported OGC and Esri services, files, and raster/vector tiles with consistent layer controls.
- **Inspect and filter information** — use interactive legends, feature details, and data tables to understand the map and focus on relevant records.
- **Find places and navigate maps** — search locations, switch basemaps and supported projections, and use familiar navigation and map-reference tools.
- **Explore changes and patterns** — navigate time-enabled data, view charts, and compare layers with optional extensions.
- **Draw, measure, and discover** — create and edit drawings, measure distances and areas, visit curated areas of interest, and browse compatible STAC catalogs when enabled.
- **Share and download maps** — share map links and export PNG, JPEG, or PDF maps with supporting elements such as legends and scale bars.
- **Use an adaptable, bilingual interface** — English/French UI, themes, keyboard navigation, and screen-reader support, with [documented accessibility limitations](docs/app/accessibility.md).

Available tools depend on the map configuration, enabled extensions, and data source.

## Related Resources

- **GitHub Repository**: Canadian-Geospatial-Platform/geoview
- **GEO.ca**: [geo.ca](https://app.geo.ca)
- **Installing GeoView**: [Add GeoView to a web page](docs/app/config/create-map.md#installing-geoview) (CDN or self-hosted release)
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

The [repository license](LICENSE.md) includes MIT terms, separate Canada branding restrictions, and third-party licensing conditions.

---

# GeoView – Visualisateur / Viewer

Ressources naturelles Canada / Natural Resources Canada
Fait partie de **GEO.ca**

---

## Aperçu

La Plateforme géospatiale canadienne vise à déployer une nouvelle infrastructure, de nouveaux outils et une intégration web de GeoCore, une nouvelle bibliothèque de lac de métadonnées géospatiales capable de prendre en charge plusieurs normes de métadonnées. Pour répondre à ces besoins, il faut un visualiseur léger à intégrer dans cette infrastructure. L'objectif est d'avoir un visualiseur flexible pour afficher des données géospatiales provenant du lac de métadonnées GeoCore sur une carte avec des fonctionnalités personnalisables.

GeoView est construit avec **React**, **TypeScript** et **OpenLayers**, et est structuré en **monorepo Rush**. Il peut être intégré dans n'importe quelle page web à l'aide d'une seule balise script et configuré de manière déclarative via des attributs HTML ou par programmation via une API JavaScript/TypeScript.

Utilisez GeoView comme visualisateur web autonome prenant en charge une grande variété de jeux de données spatiales et offrant de nombreux outils d'exploration intégrés, ou intégrez-le à un site web ou à un portail de données ouvertes, comme le font GEO.ca et Cartes ouvertes Canada. Consultez [Où se situe GeoView](docs/app/geoview-comparison.md) pour les catégories de produits et les autres solutions, et [Les capacités de GeoView](docs/app/geoview-capabilities.md) pour les fonctionnalités, les plugiciels et la personnalisation **(les deux guides sont en anglais seulement)**.

### Démo

Consultez [GeoView en action](https://canadian-geospatial-platform.github.io/geoview/public/index.html) **(en anglais seulement)**.

![Capture d'écran du visualisateur GeoView](https://user-images.githubusercontent.com/3472990/233729101-89cc4196-915d-4d6e-a353-4fb70cbb566e.PNG)

### Capacités principales

- **Explorez des données spatiales variées** — consultez les services OGC et Esri, les fichiers et les tuiles matricielles/vectorielles pris en charge à l'aide de contrôles de couches cohérents.
- **Examinez et filtrez l'information** — utilisez les légendes interactives, les détails des entités et les tableaux de données pour comprendre la carte et cibler les enregistrements pertinents.
- **Trouvez des lieux et parcourez les cartes** — recherchez des lieux, changez de fond de carte et de projection prise en charge, et utilisez des outils de navigation et de repérage familiers.
- **Explorez les changements et les tendances** — parcourez les données temporelles, affichez des graphiques et comparez les couches à l'aide de plugiciels optionnels.
- **Dessinez, mesurez et découvrez** — créez et modifiez des dessins, mesurez des distances et des superficies, visitez des zones d'intérêt prédéfinies et parcourez des catalogues STAC compatibles lorsque ces outils sont activés.
- **Partagez et téléchargez des cartes** — partagez des liens vers les cartes et exportez-les en PNG, JPEG ou PDF avec des éléments comme la légende et la barre d'échelle.
- **Utilisez une interface adaptable et bilingue** — interface en français et en anglais, thèmes, navigation au clavier et prise en charge des lecteurs d'écran, avec des [limites d'accessibilité documentées](docs/app/accessibility.md) (en anglais seulement).

Les outils disponibles dépendent de la configuration de la carte, des plugiciels activés et de la source de données.

## Ressources connexes

- **Dépôt GitHub** : Canadian-Geospatial-Platform/geoview
- **GEO.ca** : [geo.ca](https://app.geo.ca)
- **Installer GeoView** : [Ajouter GeoView à une page web](docs/app/config/create-map.md#installing-geoview) (CDN ou version hébergée) (En anglais seulement)
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

La [licence du dépôt](LICENSE.md) comprend les conditions de la licence MIT, des restrictions distinctes concernant l'identité visuelle du Canada et les conditions de licence des composants tiers.
