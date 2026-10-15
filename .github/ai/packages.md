# Package integration and runtime routing

Public documentation is canonical. Read only the linked section for the package/task; expand only
when needed (`AGENTS.md` → Reading linked docs). This index routes package-specific work, including
behavior implemented in core controllers/stores, rather than duplicating shared architecture rules.

## Shared integration

| Topic                                                         | Canonical section                                                                                               |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Rush/webpack package registration                             | [Creating a core package](../../docs/app/packages/core-packages.md#creating-a-core-package)                     |
| Plugin lifecycle and package development                      | [Creating a custom package](../../docs/app/packages/geoview-core-packages.md#creating-a-custom-package)         |
| Loading through app bar, footer bar, nav bar, or corePackages | [Package configuration methods](../../docs/app/config/configuration-reference.md#package-configuration-methods) |
| Component/controller/store ownership                          | [Controller relationships](../../docs/programming/controller-architecture.md#the-controller-paradigm)           |
| UI wrappers, styles, and translation conventions              | [UI reference](ui-style-a11y-i18n.md#source-navigation-and-translation-workflow)                                |

For a selected package, start with `packages/geoview-<name>/src/index.tsx`: inspect its plugin base,
`schema()`, `defaultConfig()`, `defaultTranslations()`, and lifecycle overrides when present.
Follow their actual imports to the schema, default config, components, and translations; do not
assume every package uses the same filenames or core's translation JSON files. Trace initialization
and cleanup into core controllers/stores where applicable. Use [test-suite routing](test-suite.md)
for automated tests rather than treating the test engine as a normal viewer plugin.

## Package-specific sections

| Package       | Canonical section                                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Time slider   | [Time slider](../../docs/app/packages/geoview-core-packages.md#1-geoview-time-slider), [Time dimension overrides](../../docs/programming/time-dimension.md#plugin-config-override) |
| Geochart      | [Geochart](../../docs/app/packages/geoview-core-packages.md#2-geoview-geochart)                                                                                                    |
| Swiper        | [Swiper](../../docs/app/packages/geoview-core-packages.md#3-geoview-swiper)                                                                                                        |
| Drawer        | [Drawer](../../docs/app/packages/geoview-core-packages.md#4-geoview-drawer)                                                                                                        |
| AOI panel     | [AOI panel](../../docs/app/packages/geoview-core-packages.md#5-geoview-aoi-panel)                                                                                                  |
| Custom legend | [Custom legend](../../docs/app/packages/geoview-core-packages.md#6-geoview-custom-legend)                                                                                          |
| About panel   | [About panel](../../docs/app/packages/geoview-core-packages.md#7-geoview-about-panel)                                                                                              |
| Filter panel  | [Filter panel](../../docs/app/packages/geoview-core-packages.md#8-geoview-filter-panel)                                                                                            |

For packages without a dedicated public section, inspect their entry point and record verified
shared behavior in the appropriate public doc before adding a routing link here.

### Swiper runtime

Read [Swiper runtime integration](../../docs/app/packages/geoview-core-packages.md#swiper-runtime-integration).
Entry points: SwiperController render listeners/registration, LayerSetController pointer-stop gating,
and swiper component drag cleanup. Verify selected descendant handlers, non-target independence,
progressive loading, hover hit bands, diagonal drag and resize/unmount restoration.
