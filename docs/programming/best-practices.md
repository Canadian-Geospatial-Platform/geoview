# Best Practices

In the VS Code development environment, many of the coding rules are imposed by the prettier and eslint code checkers. However, the
configuration of some rules is not easily done for these checkers. We must therefore, for these particular cases, rely on the
goodwill of our programmers. Here are some additional rules that you must follow.

## 1- Clearly identify the types of data you are using.

The decision to use typescript to code the GeoView application implies that we define the type of everything we declare in our
code. Otherwise, we would not have imposed this constraint on ourselves. Declaring types allows us to detect inconsistencies
in the code at the time of writing, which saves us from difficult debugging sessions when switching to runtime mode.

Never use `any` if you can define the type of the data used. The use of the `any` type is only allowed if it is impossible
to do otherwise. If you must use it, disable eslint detection on the previous line and insert a comment above the disable line
to explain why. It is strongly discouraged to disable the `any` type detection for the whole file because programmers who edit
the file in the future will not be warned if they use the type `any` without realizing it. Believe me, it can happen.

When using react hooks, define the data type they use, even if it's trivial. This way of doing things allows the correct data
type to be associated with the hook so that typescript features can perform code validation. Type definition is done using the
brackets '<' and '>' as follows:

```ts
const [basemapList, setBasemapList] = useState<TypeBasemapProps[]>([]);
```

Every function and method must declare its return type explicitly — do not rely on type inference. Use `: void` for functions that do not return a value. This applies to standalone functions, class methods, arrow functions in `useCallback`/`useMemo`, and component functions:

```ts
// ❌ Bad: missing return type
function processLayer(layerPath: string) {
export function MyComponent() {

// ✅ Good: explicit return type
function processLayer(layerPath: string): void {
export function MyComponent(): JSX.Element {
override onHook(): void {
async fetchMetadata(id: string): Promise<void> {
const handleClick = useCallback((): void => { ... }, []);
```

Prefer optional property syntax (`?:`) for class attributes and type/interface properties that may be absent. In most cases, this is clearer than using an explicit `| undefined` union.

```ts
// Preferred in most cases
class LayerInfo {
  layerName?: string;
}

type TypeLayerConfig = {
  sourceUrl?: string;
};

// Use only when presence-vs-absence must be distinguished
class LayerState {
  // Property is always present, but value can be undefined
  sourceUrl: string | undefined;
}
```

Use `property: Type | undefined` only when that distinction is intentional and required by behavior (for example: serialization differences, merge semantics, or APIs that depend on checking whether a key exists).

## 2- Avoid using variable names that are too short.

It is difficult to know what a variable with the name `e` refers to. Is it an `element`, an `event` or anything else whose name starts
with 'e'. In some cases, the name of the referred element does not even begin with 'e'. Don't hesitate to use long names like
`elementOfTheList`. This way, we know that the variable contains an element that comes from a list and if we know the type of the
list, we can even deduce the type of the `elementOfTheList` variable. The use of long variable names contributes to the
self-documentation of our code. This rule may seem to require more time to write our code, but the gain in clarity makes it much
faster to understand what the code does. Moreover, with the cut and paste and auto-completion features provided by the editor,
it doesn't take much longer to enter the code.

## 3- Avoid using existing names in third party libraries to declare elements of the GeoView code.

The OpenLayers library has a base class named Layer. If we use the identifier Layer to define a class in our code and at the same
time we use the Layer class of OpenLayers (`import { Layer } from 'ol/layer';`), it will be difficult to know at first sight the
type of a variable named `layer`. On the other hand, if we define our class as `GVlayer` and we use the OpenLayers `Layer` class
at the same time by associating the `layer` variable with the `Layer` type and `gvLayer` with the `GVlayer` type, the confusion
is thus cleared up.

## 4- Use inheritance whenever possible.

Inheritance eliminates the repetitive code needed to create disjoint classes that have basically the same characteristics. A base
class, whether abstract or not, can be used as a parent at the root of the inheritance tree to provide a starting template for child
classes. Inheritance also allows to exploit polymorphism. To do this, you just need to define a variable with a base class as type,
whether it is abstract or not. This variable can then be assigned any object of a derived class without having to negotiate the type.
Polymorphism allows to expose the common characteristics of the different classes of the inheritance tree. When we want to use child
specific fields, typescript allows us to downcast to the child type allowing us to refer to the child properties. Before downcasting,
it is recommended to verify the actual object type by either using the [_instanceof_](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#instanceof-narrowing)
keyword or a [_type guard function_](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates).

## 5- Use the spreading operator only when necessary

When you spread two objects in the same object, sooner or later you run the risk of a collision. It is better to assign each
object to an attribute in order to partition their contents rather than cramming everything in the same level.

```ts
const object1 = { a: "a", collision: 1 };
const object2 = { b: "b", collision: 2 };

// Here, we have a collision and loose value of object1.collision
const spredingCollision = { ...object1, ...object2 };

// Here, value of attribute collision is preserved for both object
const noCollision = { object1, object2 };
```

In some cases, the spreading operator is used to create a duplicate that will not leak into the original property when modified. If the structure of the original object is deep, the spreading operator is not sufficient to avoid leakage. In such cases, use lodash's cloneDeep function.

## 6- Do not leave dead code in the source code

It is useless to comment old code segments in order to remember how the viewer used to work. This unduly pollutes the code and affects its readability. The code is kept in a github repository and it is possible to go back in time to see how the viewer was coded at a given date.

## 7- How we order the import statements

We do the import statement in the following order

- react
- react-dom
- react-i18n
- MUI (hooks/utilities only — UI components come from `@/ui`)
- OpenLayers
- other project dependecies (@/core, @/geo and @/api)

We add an empty line between each group of import from different category

```ts
import { useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { useTranslation } from "react-i18next";

import { useTheme } from "@mui/material/styles";

import View, { ViewOptions } from "ol/View";

import { Box, Card, CardHeader, CardContent, Divider, IconButton } from "@/ui";
import { CloseIcon } from "@/ui";
import { logger } from "@/core/utils/logger";
import type { EsriBaseRenderer } from "@/geo/utils/renderer/esri-renderer";
import { Plugin } from "@/api/plugin/plugin";
```

**Note:** MUI UI components (`Box`, `Typography`, `IconButton`, etc.) and icons must be imported from `@/ui`, never directly from `@mui/material` or `@mui/icons-material`. MUI hooks and utilities (`useTheme`, `useMediaQuery`) are imported directly from `@mui/material` or `@mui/material/styles`.

**Note:** For import from a packacge outside of core use

```ts
import { logger } from "geoview-core/core/utils/logger";
```

## 8- How we order code at the beginning of a component

We should follow a standard order when we create a component so it is easy to find the needed piece of code

- Props assignement
- Get context
- Translation
- Theme and style
- Store
- Internal state

```ts
const { myScale } = ...props

const mapId = useGeoViewMapId();

const { t } = useTranslation<string>();

const theme = useTheme();
const sxClasses = getSxClasses(theme);

// get the values from store
const expanded = useUIMapInfoExpanded();
const scale = useMapScale();

// internal component state
const [scaleMode, setScaleMode] = useState<number>(0);
```

## 9- How we format JSDOC

Golden Rule of JSDoc in TypeScript Projects

- Explain why
- Explain behavior
- Explain side effects
- Explain non-obvious constraints

It should NOT:

- Repeat type information already in the signature
- Replace TS visibility keywords
- Duplicate what the compiler already guarantees

```ts
/**
 * Fetches layer metadata from GeoCore.
 *
 * @param geoviewLayerId - UUID of the GeoView layer.
 * @param signal - Optional abort signal for request cancellation.
 * @returns Parsed layer metadata object.
 * @throws {LayerNotGeoJsonError} When an error to ...
 */
async function fetchMetadata(
  geoviewLayerId: string,
  signal?: AbortSignal,
): Promise<LayerMetadata> {}
```

Tags Worth Using

- @param
- @returns
- @throws (@throws {TheErrorType} (description)  e.g. @throws {LayerNotGeoJsonError} When...)
- @example
- @deprecated
- @see

Tags Usually Overkill in TS

- @private
- @protected
- @public
- @readonly
- @override
- @static

Advanced Best Practice
✔ Short title = one sentence
✔ Blank line
✔ Description text, behavior explanation (if applicable). Do not add the @description tag.
✔ Blank line (if explanation)
✔ Then @param list (parameter - description, Add Optional for optional parameter)
✔ Then @returns
✔ Then @throws (if applicable)

```ts
/**
 * Updates layer visibility state.
 *
 * Given the layerPath, this function retrieves a
 * layer from the domain and set its visibility.
 *
 * @param layerPath - Target layer path.
 * @param visible - New visibility state.
 * @throws {LayerNotFoundError} When a layer with the provided layer path cannot be found.
 */
```

## 10- How we order functions in component

In components, functions should be ordered in the following way:

- Core functions that are reusable without dependencies;
- Event handlers functions that may change the states and raise events/callbacks;
- Hooks section where we have the useEffect, useCallback methods grouped together (as the other those are defined is actually important - best to group them)
- Rendering methods used for rendering the JSX

## 11- How we order functions in classes

In classes, functions should be ordered in the following way:

- class name
- abstracts
- overrides
- public
- private
- events emits/hooks functions
- static public
- static private
- event types

Each group must be wrapped in `// #region` / `// #endregion` markers so that VS Code can collapse them. Use **UPPER CASE** labels that match the group:

```ts
export class MyController extends AbstractMapViewerController {
  // properties …

  // #region OVERRIDES
  override onHook(): void {
    /* … */
  }
  // #endregion OVERRIDES

  // #region PUBLIC METHODS
  doSomething(): void {
    /* … */
  }
  // #endregion PUBLIC METHODS

  // #region PROTECTED METHODS
  protected helperMethod(): void {
    /* … */
  }
  // #endregion PROTECTED METHODS

  // #region PRIVATE METHODS
  #internalWork(): void {
    /* … */
  }
  // #endregion PRIVATE METHODS

  // #region DOMAIN HANDLERS
  #handleLayerLoaded(sender: unknown, event: LayerLoadedEvent): void {
    /* … */
  }
  // #endregion DOMAIN HANDLERS

  // #region EVENTS
  #emitMyEvent(event: MyEvent): void {
    /* … */
  }
  onceMyEvent(): Promise<MyEvent> {
    /* … */
  }
  onMyEvent(callback: MyDelegate): void {
    /* … */
  }
  offMyEvent(callback: MyDelegate): void {
    /* … */
  }
  // #endregion EVENTS

  // #region STATIC METHODS
  static createConfig(): MyConfig {
    /* … */
  }
  // #endregion STATIC METHODS
}

// #region EVENT TYPES
type MyDelegate = EventDelegateBase<MyController, MyEvent, void>;
export type MyEvent = {
  /* … */
};
// #endregion EVENT TYPES
```

**Common region labels used in the codebase:**

| Region label                          | Contents                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `OVERRIDES`                           | Abstract / override methods                                                                  |
| `PUBLIC METHODS`                      | Public instance methods (may have sub-regions like `PUBLIC METHODS - DOMAIN SIMPLE GETTERS`) |
| `PROTECTED METHODS`                   | Protected instance methods                                                                   |
| `PRIVATE METHODS`                     | Private instance methods                                                                     |
| `DOMAIN HANDLERS`                     | Private handlers subscribed to domain events                                                 |
| `EVENTS`                              | Event emit/once/on/off methods (order: `#emit`, `once`, `on`, `off` per event)               |
| `STATIC METHODS`                      | Static public and private methods                                                            |
| `EVENT TYPES` or `EVENTS & DELEGATES` | Delegate types and event interfaces (outside the class body)                                 |

**Rules:**

- A region is only needed when the group has at least one member
- Sub-regions are allowed for large classes (e.g., `PUBLIC METHODS - UI RELATED`)
- The `// #endregion` comment should repeat the label for readability
- Delegate types and event interfaces live **outside** the class, in their own region

## 12- EventHelper handler parameter naming

When subscribing to events emitted through our `EventHelper` delegates, handler methods should use the parameter names `sender` and `event`.

This naming is required for consistency and readability across the codebase. These names are also treated as exceptions in our no-unused-parameter ESLint rule, so they should be used even when one of the arguments is not consumed in the implementation.

```ts
// ✅ Good: EventHelper delegate naming convention
this.getMapViewer().onMapMoveEnd((sender, event): void => {
  logger.logDebug("Map moved", event.lonlat);
});

// ✅ Also good when one parameter is intentionally unused
this.getMapViewer().onMapInit((sender, event): void => {
  initializeSomething();
});
```

## 13- Event delegate and payload type declarations

When defining EventHelper delegate types and their associated event payloads in the `// #region EVENT TYPES` section:

- **Delegates** (functions using `EventDelegateBase`) must always be declared with `type`
- **Event payloads** (the data objects carried by the event) must always be declared with `interface`

```ts
// #region EVENT TYPES

// ✅ Good: Event payload is an interface
export interface LayerApiLayerVisibleChangedEvent {
  /** The GV layer whose visibility changed. */
  layer: AbstractBaseGVLayer;
  /** The new visibility state. */
  visible: boolean;
}

// ✅ Good: Delegate is a type alias of EventDelegateBase
export type LayerApiLayerVisibleChangedDelegate = EventDelegateBase<LayerApi, LayerApiLayerVisibleChangedEvent, void>;

// ❌ Bad: Delegate as interface
export interface LayerApiLayerVisibleChangedDelegate { ... }

// ❌ Bad: Event payload as type
export type LayerApiLayerVisibleChangedEvent = { ... };

// #endregion EVENT TYPES
```

**Rationale:** Delegates are type aliases by nature (they alias a function signature via `EventDelegateBase<Sender, Event, Return>`). Event payloads are plain data shapes — `interface` gives them declaration merging capability, inheritance capabilities and clearer intent.

## 14- React Performance Patterns

### useMemo Naming Convention

When using `useMemo`, prefix the variable name with `memo` followed by camelCase to clearly indicate the variable is memoized:

```typescript
// ❌ Bad: Generic variable name doesn't indicate memoization
const filteredList = useMemo(() => {
  return items.filter((item) => item.active);
}, [items]);

// ✅ Good: Prefix with 'memo' to indicate memoized value
const memoFilteredList = useMemo(() => {
  return items.filter((item) => item.active);
}, [items]);

// ✅ Good: Even for computed objects
const memoSortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

const memoFormattedDate = useMemo(() => {
  return new Date(timestamp).toLocaleDateString();
}, [timestamp]);
```

**Key principles for useMemo:**

- Prefix with `memo` to indicate the variable is memoized
- Use camelCase for the rest of the name
- Only memoize expensive computations (filtering, sorting, complex calculations)
- Be cautious: `useMemo` has a cost—use only when profiling shows performance issues
- Always include proper dependencies array to ensure the memoized value updates correctly

## 15- Prefer `waitFor*` methods for awaiting async conditions

When you need to await an asynchronous condition that is signaled by a `once*` event, always expose it as a `waitFor*` method. These methods check the condition synchronously first (fast-path), and if not yet satisfied, subscribe to the appropriate `once*` event to resolve a Promise.

**Naming convention:** Use the prefix `waitFor` followed by a description of the condition being awaited.

**Implementation pattern:**

```ts
// In the class that owns the event:
waitForBounds(): Promise<Extent | undefined> {
  // Fast-path: already available
  if (this.#bounds !== undefined) return Promise.resolve(this.#bounds);

  // Subscribe to the once event
  return this.onceBoundsInitialized().then((event) => event.bounds);
}

waitForMapReady(): Promise<MapBaseEvent> {
  if (this.#mapReady) return Promise.resolve({});
  return this.onceMapReady();
}
```

**Existing examples:**

| Method                           | Class                 | Resolves when...                            |
| -------------------------------- | --------------------- | ------------------------------------------- |
| `waitForMapReady()`              | `MapViewer`           | The map is fully initialized                |
| `waitForMoveEnd()`               | `MapViewer`           | The current animation/interaction completes |
| `waitForRender()`                | `MapViewer`           | The next `rendercomplete` event fires       |
| `waitForBounds()`                | `AbstractBaseGVLayer` | The layer's bounds become available         |
| `waitForLoadedOnce()`            | `AbstractGVLayer`     | The layer reaches its first `loaded` state  |
| `waitForLayerToGetRegistered()`  | `AbstractLayerSet`    | A layer path is registered in the set       |
| `waitForAllLayersStatus()`       | `LayerController`     | All layers reach a given status             |
| `waitForLayersLoaded()`          | `LayerController`     | Map is ready + all layers are loaded        |
| `waitForOverviewMapVisibility()` | `MapController`       | Overview map reaches expected visibility    |

**Why prefer `waitFor*` over `whenThisThen` polling:**

- **Event-driven** — resolves immediately when the condition is met, no polling interval
- **Deterministic** — no risk of missing a short-lived state between poll intervals
- **Self-documenting** — the method name describes exactly what is being awaited
- **Composable** — callers can `await` or combine with `Promise.all`

Use `whenThisThen()` only as a last resort when no event exists for the condition you need to observe.

## 16- `once*` methods must always accept an optional `filter` parameter

Every `once*` method that wraps `EventHelper.onceEventPromise` must expose the optional `filter` parameter and pass it through. This allows callers to wait for a **specific** event occurrence rather than just the next one.

**Signature pattern:**

```ts
onceLayerQueried(filter?: (event: LayerQueriedEvent) => boolean): Promise<LayerQueriedEvent> {
  return EventHelper.onceEventPromise(this.#onLayerQueriedHandlers, filter);
}
```

**Why:** Without `filter`, callers who need to wait for a specific condition (e.g., a specific layer path) would have to subscribe via `on*`, check the condition manually, and unsubscribe — defeating the purpose of the one-shot helper.

**JSDoc must include:**

```ts
/**
 * Returns a promise that resolves the next time the [event name] event fires.
 *
 * @param filter - Optional filter predicate. When provided, only events passing the filter resolve the promise
 * @returns A promise that resolves with the event payload when [event name] fires (and passes the filter)
 */
```

**Checklist when adding a new event:** After writing the `#emit*`, `once*`, `on*`, `off*` group, verify that `once*` has `filter?: (event: EventType) => boolean` in its signature and passes it to `onceEventPromise`.

## <a id="accessibility"></a>17- Accessibility (WCAG 2.1 Level AA)

**For detailed patterns with code examples, see [accessibility.md Section 008](app/accessibility.md#code-review-checklist).**

**Note:** `IconButton` `aria-label` is TypeScript-enforced — the compiler prevents missing labels, no manual check needed.

**Quick reference — Common issues to check during code review:**

- `onClick` on `<div>`, `<span>`, `<Box>` without `role="button"` + `tabIndex={0}` + keyboard handler for Enter/Space
- Ternary operator in `aria-label` on toggle buttons (use stable label + `aria-pressed` instead)
- `disabled={state}` on buttons that toggle between enabled/disabled (use `aria-disabled` to prevent focus loss)
- Modal/Dialog/Drawer without `onKeyDown` handler calling `handleEscapeKey(event.key, onClose)` from `@/core/utils/utilities`
- Images without `alt` attribute (use `alt=""` for decorative, descriptive text for informative)
- `<Tooltip>` wrapping non-interactive elements like `ListItem`, `Box`, `Typography` (use `ListItemButton` or other interactive wrapper)
- Duplicate IDs in loops (add unique suffixes like `${mapId}-layer-${id}` or use `generateId(8)`)

**See [accessibility.md Section 008](app/accessibility.md#code-review-checklist) for:**

- Complete ❌ VIOLATION / ✅ CORRECT code examples
- Search patterns for each check
- "Why this matters" explanations
- TypeScript enforcement details
- Priority levels (HIGH/MEDIUM/ENHANCEMENT)

**For comprehensive WCAG 2.1 Level AA guidance, see [accessibility.md](app/accessibility.md).**
