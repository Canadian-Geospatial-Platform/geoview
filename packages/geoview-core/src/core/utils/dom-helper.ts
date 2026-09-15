import { logger } from '@/core/utils/logger';

/**
 * Canonical map-relative id suffixes for well-known GeoView landmark elements.
 *
 * Centralizing the suffix strings here keeps them out of scattered string literals, so both the
 * imperative getters (this file) and the reactive store hooks resolve the same element by one source of truth.
 */
export const GV_DOM_SUFFIX = {
  /** The shell container that wraps the whole viewer chrome. */
  shell: 'shell',
  /** The OpenLayers map target element (the canvas container). */
  mapTarget: 'mapTargetElement',
} as const;

/** CSS class marking the guide's scrollable content container. */
const GUIDEBOX_CONTAINER_CLASS = 'guidebox-container';

// #region GENERIC (id & root helpers)

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
export function buildGVElementId(mapId: string, suffix: string): string {
  return `${mapId}-${suffix}`;
}

/**
 * Resolves a map's root GeoView HTML element from the live DOM.
 *
 * The root element carries the map id as its DOM id. Resolving from the live DOM (instead of
 * the store) keeps this helper free of store/react dependencies and avoids circular imports.
 *
 * @param mapId - The map identifier
 * @returns The root GeoView HTML element, or undefined when the map is not yet mounted
 */
export function getGVRootElement(mapId: string): HTMLElement | undefined {
  return document.getElementById(mapId) ?? undefined;
}

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
export function getGVRootDataAttribute(mapId: string, dataAttribute: string): string | undefined {
  return getGVRootElement(mapId)?.getAttribute(dataAttribute) ?? undefined;
}

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
export function getGVElementById<T extends HTMLElement = HTMLElement>(mapId: string, suffix: string): T | undefined {
  const fullId = buildGVElementId(mapId, suffix);
  const root = getGVRootElement(mapId);

  // Scoped lookup within the map root (preferred).
  if (root) return root.querySelector<T>(`#${CSS.escape(fullId)}`) ?? undefined;

  // Fallback: not map-scoped — warn because it can resolve an element from another map.
  logger.logWarning(`getGVElementById: root element for map '${mapId}' not found, falling back to global document lookup`, fullId);
  return (document.getElementById(fullId) as T | null) ?? undefined;
}

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
export function getGVElementByFullId<T extends HTMLElement = HTMLElement>(mapId: string, fullId: string): T | undefined {
  const root = getGVRootElement(mapId);

  // Scoped lookup within the map root (preferred).
  if (root) return root.querySelector<T>(`#${CSS.escape(fullId)}`) ?? undefined;

  // Fallback: not map-scoped — warn because it can resolve an element from another map.
  logger.logWarning(`getGVElementByFullId: root element for map '${mapId}' not found, falling back to global document lookup`, fullId);
  return (document.getElementById(fullId) as T | null) ?? undefined;
}

// #endregion GENERIC (id & root helpers)

// #region CSS (scoped selector queries)

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
export function queryGVSelector<T extends Element = HTMLElement>(mapId: string, selector: string): T | undefined {
  const root = getGVRootElement(mapId);

  // Scoped query within the map root (preferred).
  if (root) return root.querySelector<T>(selector) ?? undefined;

  // Fallback: not map-scoped — warn because it can resolve an element from another map.
  logger.logWarning(`queryGVSelector: root element for map '${mapId}' not found, falling back to global document query`, selector);
  return document.querySelector<T>(selector) ?? undefined;
}

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
export function queryGVSelectorAll<T extends Element = HTMLElement>(mapId: string, selector: string): T[] {
  const root = getGVRootElement(mapId);

  // Scoped query within the map root (preferred).
  if (root) return Array.from(root.querySelectorAll<T>(selector));

  // Fallback: not map-scoped — warn because it can resolve elements from another map.
  logger.logWarning(`queryGVSelectorAll: root element for map '${mapId}' not found, falling back to global document query`, selector);
  return Array.from(document.querySelectorAll<T>(selector));
}

// #endregion CSS (scoped selector queries)

// #region SPECIFIC (named landmark getters)

/**
 * Resolves a map's OpenLayers map target element (the canvas container).
 *
 * Thin named getter over {@link getGVElementById} for the heavily-reused `mapTargetElement` landmark, so
 * call sites do not repeat the suffix string and get a typed result.
 *
 * @param mapId - The map identifier
 * @returns The map target element, or undefined when the map is not yet mounted
 */
export function getGVMapTargetElement<T extends HTMLElement = HTMLElement>(mapId: string): T | undefined {
  return getGVElementById<T>(mapId, GV_DOM_SUFFIX.mapTarget);
}

/**
 * Resolves a map's shell container element (the wrapper around the whole viewer chrome).
 *
 * Imperative counterpart to the reactive `useStoreAppShellContainer` hook, for non-React callers
 * (plugins, controllers, utils) that hold a `mapId` rather than the React context.
 *
 * @param mapId - The map identifier
 * @returns The shell container element, or undefined when the map is not yet mounted
 */
export function getGVShellElement<T extends HTMLElement = HTMLElement>(mapId: string): T | undefined {
  return getGVElementById<T>(mapId, GV_DOM_SUFFIX.shell);
}

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
export function getGVGuidebox(mapId: string): HTMLElement | undefined {
  // Map-scoped via data-map-id; intentionally global because the guide is portaled out of the map root in fullscreen.
  const containers = Array.from(document.querySelectorAll<HTMLElement>(`.${GUIDEBOX_CONTAINER_CLASS}[data-map-id="${mapId}"]`));

  // Prefer the visible copy — the hidden inline one reports no client rects.
  return containers.find((el) => el.getClientRects().length > 0) ?? containers[0];
}

// #endregion SPECIFIC (named landmark getters)
