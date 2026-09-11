import { logger } from '@/core/utils/logger';

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
