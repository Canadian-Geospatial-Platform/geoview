# GeoView Terminology

This glossary defines terms used across GeoView's developer documentation and source code. Definitions
are grouped by topic; follow the linked guides for implementation details.

## Contents

- [1- Packages and configuration](#1--packages-and-configuration)
- [2- Layers and visibility](#2--layers-and-visibility)
- [3- Viewer and geographic concepts](#3--viewer-and-geographic-concepts)
- [4- Controllers, domains, events, and state](#4--controllers-domains-events-and-state)
- [5- AI assistance and documentation](#5--ai-assistance-and-documentation)
- [6- Review and release terminology](#6--review-and-release-terminology)

## 1- Packages and configuration

See the [package reference](../app/packages/geoview-core-packages.md) and
[configuration reference](../app/config/configuration-reference.md).

| Term                  | Meaning                                                                                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package**           | A separately maintained and built unit in the Rush monorepo. `geoview-core` provides the foundation; other packages use supported APIs rather than another package's private implementation.         |
| **Plugin package**    | A package that extends or integrates with core, such as Swiper or time slider. Plugin packages consume core APIs; core does not depend on their private implementation details.                      |
| **Plugin lifecycle**  | The initialization, addition, and removal of a plugin instance, including configuration, UI setup, subscriptions, and cleanup. Plugin lifecycle is distinct from the map's initialization lifecycle. |
| **Map configuration** | Declarative settings for a map's view, basemap, layers, UI, and packages. Configuration is distinct from state that changes while the map is running.                                                |
| **Schema**            | A definition of valid configuration structure and values. Schema default annotations are not necessarily the authoritative runtime defaults.                                                         |
| **Runtime defaults**  | Values applied when configuration omits a setting. Core map defaults come from `DEFAULT_MAP_FEATURE_CONFIG`; packages have their own default configuration.                                          |

## 2- Layers and visibility

See the [layers guide](../app/layers/layers.md),
[runtime invariants](./adding-layer-types.md#runtime-invariants), and
[layer-set architecture](./layerset-architecture.md).

| Term                                | Meaning                                                                                                                                                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GeoView layer configuration**     | Declarative configuration for a service or layer, containing one or more layer entry configurations.                                                                                                                                                |
| **Layer entry configuration**       | Configuration for an individual layer-tree entry, including its source, initial settings, and child entries when it is a group.                                                                                                                     |
| **GeoView layer**                   | A core object responsible for configuration and lifecycle, including metadata validation and creating runtime GV layers. It is not the configuration object or an OpenLayers layer.                                                                 |
| **GV layer**                        | GeoView's runtime wrapper around an OpenLayers layer, providing rendering, querying, and interaction behavior.                                                                                                                                      |
| **Layer path**                      | The hierarchical identifier used to resolve a layer entry. It includes its root and nested entry IDs; a bare entry ID may be ambiguous.                                                                                                             |
| **Layer state**                     | Runtime values such as visibility, opacity, selection, and style-item visibility, distinct from declarative configuration.                                                                                                                          |
| **Layer set**                       | A reactive collection tracking layers and derived information for a purpose such as legends, details, or feature queries.                                                                                                                           |
| **Own visibility**                  | A layer's individual visibility setting, independent of whether a parent group hides it.                                                                                                                                                            |
| **Effective visibility**            | Visibility after accounting for the layer and its ancestors. Scale/range constraints also affect whether it actually renders.                                                                                                                       |
| **Visible range**                   | The resolution/scale range in which a layer can display. Being out of range differs from being switched off.                                                                                                                                        |
| **Hidden-layer panel presentation** | UI grouping of visibility-hidden entries in panels such as details and data table. This is a panel/controller/store concern, not behavior owned by the layer domain. See [panel presentation](./best-practices.md#hidden-layer-panel-presentation). |

## 3- Viewer and geographic concepts

See [controller architecture](./controller-architecture.md) and the
[accessibility guide](../app/accessibility.md).

| Term                                               | Meaning                                                                                                                                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GeoView viewer / viewer shell**                  | The outer UI containing the map element, controls, panels, and notifications. Its dimensions and keyboard behavior are not identical to those of the map element.                   |
| **Map element**                                    | The DOM element hosting the OpenLayers viewport, distinct from the outer viewer shell.                                                                                              |
| **MapViewer**                                      | The runtime object coordinating a map instance, its OpenLayers map, configuration, layers, and controllers. React components use controllers rather than access MapViewer directly. |
| **Static / dynamic interaction**                   | Map interaction modes. Static mode disables map interaction and reduces available controls; it does not make the entire viewer non-interactive.                                     |
| **Extent**                                         | An axis-aligned bounding box `[minX, minY, maxX, maxY]` in a known coordinate reference system. It is not inherently longitude/latitude.                                            |
| **Projection / coordinate reference system (CRS)** | The spatial reference used to interpret coordinates and extents. Map and data projections can differ, requiring transformations.                                                    |

## 4- Controllers, domains, events, and state

See [controller responsibilities](./controller-architecture.md#design-principles),
[event delegates](./event-helper.md), and [store access](./using-store.md).

| Term                          | Meaning                                                                                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Controller**                | The application-level coordinator for actions, validation, side effects, domain operations, and UI state synchronization. Components call controllers for mutations.             |
| **Domain**                    | A backend model owning domain objects and behavior and emitting changes. It has no knowledge of controllers or the store; controllers operate on it and subscribe to its events. |
| **Domain event**              | A notification emitted by a domain when something changes. It is not a direct domain call to a controller.                                                                       |
| **Delegate / event handler**  | A typed callback registered to receive an event. The subscriber owns the callback and its subscription lifecycle.                                                                |
| **Hook / unhook**             | Controller lifecycle methods that establish and remove subscriptions. These are distinct from React hooks such as `useEffect`.                                                   |
| **Controller registry**       | The per-map collection through which controllers and consumers access the appropriate controller instances.                                                                      |
| **Store state / state slice** | Reactive Zustand state used by the UI. A slice groups related values and thin update actions; it is not an owner of domain workflows.                                            |
| **Selector hook**             | A React hook selecting store values and subscribing the component to relevant changes, typically named `useStore*`.                                                              |
| **Store getter**              | A `getStore*` function reading a point-in-time value without subscribing a React component.                                                                                      |
| **Store setter / adaptor**    | A thin `setStore*` function updating state through store actions. Controllers call these rather than components mutating the store directly.                                     |
| **Batch synchronization**     | Explicit reconciliation of store state after an operation suppresses individual change handlers to avoid redundant updates.                                                      |

## 5- AI assistance and documentation

These are definitions, not agent execution instructions. See [Using AI Assistants](./using-ai.md)
for the repository's AI setup.

| Term                           | Meaning                                                                                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scoped instruction**         | AI guidance applied to matching files through an `applyTo` pattern.                                                                                             |
| **AI reference**               | An on-demand `.github/ai/` document providing source navigation, AI-specific procedures, and links to canonical public guidance.                                |
| **Workflow agent**             | A custom agent handling a defined end-to-end task, such as branch review or test authoring.                                                                     |
| **Specialist agent**           | An agent focused on a domain, often delegated a bounded task by the main agent.                                                                                 |
| **Architecture adviser**       | A specialist evaluating design, dependencies, and trade-offs without implementing the recommendation. GeoViewArchitect has this role.                           |
| **Skill**                      | A reusable, on-demand task recipe, discoverable from its description or invoked with a slash command such as `/draft-pr`.                                       |
| **Canonical documentation**    | The authoritative explanation of a topic. Shared developer/user guidance is public; AI-only procedures remain in AI customization files.                        |
| **AI summary**                 | An optional, explicitly marked operational summary linked to a canonical public section. It must preserve that section's meaning and is not a second authority. |
| **Bounded reading**            | Reading the relevant section or source range first, expanding only when needed rather than loading an entire document by default.                               |
| **Repository memory / gotcha** | A short, verified project fact or pitfall worth retaining. Memory is not an exhaustive copy of architecture or API documentation.                               |

## 6- Review and release terminology

See the [issue-to-PR workflow](./using-ai.md#recommended-issue-to-pr-workflow) and
[release-testing guide](./release-testing/README.md).

| Term                                         | Meaning                                                                                                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Merge-base diff**                          | A comparison of a branch head with its common ancestor with the base, expressed as `git diff <base>...<head>`. It differs from comparing the two tips directly. |
| **Changed-scope review**                     | Review of modified declarations and their necessary context, rather than every unrelated declaration in a changed file.                                         |
| **Full-file review**                         | An explicitly broader audit of entire changed files, separating existing debt from new issues.                                                                  |
| **Read-only review**                         | An assessment that reports findings and proposed changes without editing repository files.                                                                      |
| **Source verification / runtime validation** | Checking implementation against source versus executing behavior in a running viewer. Neither implies the other was performed.                                  |
| **Release candidate tracker**                | The cumulative record of completed changes for the active release cycle, used to prepare release notes and relevant PR descriptions.                            |

When a term is ambiguous in a particular subsystem, prefer that subsystem's architecture
documentation and current source types over inferring behavior from the glossary alone.
