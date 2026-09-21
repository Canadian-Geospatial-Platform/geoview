/**
 * Canonical map-relative id suffixes for well-known GeoView landmark elements.
 *
 * Centralizing the suffix strings here keeps them out of scattered string literals, so both the
 * imperative getters (this file) and the reactive store hooks resolve the same element by one source of truth.
 */
export declare const GV_DOM_SUFFIX: {
    /** The shell container that wraps the whole viewer chrome. */
    readonly shell: "shell";
    /** The OpenLayers map target element (the canvas container). */
    readonly mapTarget: "mapTargetElement";
};
/**
 * Builds a DOM id in the canonical `${mapId}-suffix` format (generic to specific).
 *
 * Every DOM id in GeoView must be map-scoped so that multiple maps on the same page
 * never collide. Always create ids through this helper instead of composing strings by hand.
 *
 * @param mapId - The map identifier
 * @param suffix - The specific, map-relative id portion (e.g. 'appBar', 'tabsContainer')
 * @returns The canonical id string `${mapId}-${suffix}`
 */
export declare function buildGVElementId(mapId: string, suffix: string): string;
/**
 * Resolves a map's root GeoView HTML element from the live DOM.
 *
 * The root element carries the map id as its DOM id. Resolving from the live DOM (instead of
 * the store) keeps this helper free of store/react dependencies and avoids circular imports.
 *
 * @param mapId - The map identifier
 * @returns The root GeoView HTML element, or undefined when the map is not yet mounted
 */
export declare function getGVRootElement(mapId: string): HTMLElement | undefined;
/**
 * Reads a `data-*` attribute from a map's root GeoView element.
 *
 * The root element is the host-provided `geoview-map` div, so consumers can set declarative hints on it
 * (e.g. `data-footer-height`). Centralizing the read here keeps every consumer using the same map-scoped
 * root lookup instead of composing `document`/`getAttribute` calls by hand.
 *
 * @param mapId - The map identifier
 * @param dataAttribute - The full attribute name, including the `data-` prefix (e.g. 'data-footer-height')
 * @returns The attribute value, or undefined when the root is not mounted or the attribute is absent
 */
export declare function getGVRootDataAttribute(mapId: string, dataAttribute: string): string | undefined;
/**
 * Finds an element by its map-relative suffix, scoped to the map's root element.
 *
 * The lookup is performed with the canonical `${mapId}-suffix` id inside the map's root element.
 * When the root is not mounted yet, it falls back to a global `document.getElementById` and logs a
 * warning, because a global lookup is not map-scoped and can resolve an element from another map.
 *
 * @param mapId - The map identifier
 * @param suffix - The map-relative id portion (without the `${mapId}-` prefix)
 * @returns The matching element, or undefined when none is found
 */
export declare function getGVElementById<T extends HTMLElement = HTMLElement>(mapId: string, suffix: string): T | undefined;
/**
 * Finds an element by its FULL DOM id, scoped to the map's root element.
 *
 * Use this for the many focus-restore call sites that already hold a complete DOM id (built with the
 * `${mapId}-` prefix) rather than a bare suffix. Scoping to the root keeps the lookup map-safe.
 *
 * @param mapId - The map identifier
 * @param fullId - A complete DOM id (already prefixed with `${mapId}-`)
 * @returns The matching element, or undefined when none is found
 */
export declare function getGVElementByFullId<T extends HTMLElement = HTMLElement>(mapId: string, fullId: string): T | undefined;
/**
 * Runs a CSS selector scoped inside a map's root element.
 *
 * When the root is not mounted yet, it falls back to a global `document.querySelector` and logs a
 * warning, because a global query is not map-scoped and can resolve an element from another map.
 *
 * @param mapId - The map identifier
 * @param selector - Any valid CSS selector, evaluated within the map's root element
 * @returns The first matching element, or undefined when none is found
 */
export declare function queryGVSelector<T extends Element = HTMLElement>(mapId: string, selector: string): T | undefined;
/**
 * Runs a CSS selector scoped inside a map's root element and returns all matches.
 *
 * When the root is not mounted yet, it falls back to a global `document.querySelectorAll` and logs a
 * warning, because a global query is not map-scoped and can resolve elements from another map.
 *
 * @param mapId - The map identifier
 * @param selector - Any valid CSS selector, evaluated within the map's root element
 * @returns An array of matching elements (empty when none are found)
 */
export declare function queryGVSelectorAll<T extends Element = HTMLElement>(mapId: string, selector: string): T[];
/**
 * Resolves a map's OpenLayers map target element (the canvas container).
 *
 * Thin named getter over {@link getGVElementById} for the heavily-reused `mapTargetElement` landmark, so
 * call sites do not repeat the suffix string and get a typed result.
 *
 * @param mapId - The map identifier
 * @returns The map target element, or undefined when the map is not yet mounted
 */
export declare function getGVMapTargetElement<T extends HTMLElement = HTMLElement>(mapId: string): T | undefined;
/**
 * Resolves a map's shell container element (the wrapper around the whole viewer chrome).
 *
 * Imperative counterpart to the reactive `useStoreAppShellContainer` hook, for non-React callers
 * (plugins, controllers, utils) that hold a `mapId` rather than the React context.
 *
 * @param mapId - The map identifier
 * @returns The shell container element, or undefined when the map is not yet mounted
 */
export declare function getGVShellElement<T extends HTMLElement = HTMLElement>(mapId: string): T | undefined;
/**
 * Resolves a map's guide box container element.
 *
 * The guide box is portaled out of the map root when the viewer is fullscreen, so it cannot be resolved by a
 * root-scoped query. It is matched globally by its `data-map-id` attribute (which keeps the lookup map-scoped),
 * and when both an inline-hidden and a portaled-visible copy exist, the visible one is returned.
 *
 * @param mapId - The map identifier
 * @returns The visible guide box container, the first match, or undefined when none exists
 */
export declare function getGVGuidebox(mapId: string): HTMLElement | undefined;
//# sourceMappingURL=dom-helper.d.ts.map