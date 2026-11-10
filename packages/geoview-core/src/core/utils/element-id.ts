import { CONTAINER_TYPE } from '@/core/utils/constant';

/**
 * Builds a map-scoped element identifier without accessing the DOM.
 *
 * @param mapId - The map identifier
 * @param suffix - The map-relative identifier
 * @returns The map-scoped identifier
 */
export function buildGVElementId(mapId: string, suffix: string): string {
  return `${mapId}-${suffix}`;
}

/**
 * Builds a tab identifier, also used as the footer panel's focus owner.
 *
 * @param mapId - The map identifier
 * @param tabId - The tab identifier
 * @returns The map-scoped tab identifier
 */
export function buildTabId(mapId: string, tabId: string): string {
  return buildGVElementId(mapId, `tab-${tabId}`);
}

/**
 * Builds an AppBar panel's logical focus-owner identifier.
 *
 * @param mapId - The map identifier
 * @param panelId - The panel identifier, omitted for an unnamed standalone panel
 * @returns The focus-owner identifier
 */
export function buildAppBarFocusTrapId(mapId: string, panelId?: string): string {
  return buildGVElementId(mapId, `${CONTAINER_TYPE.APP_BAR}${panelId ? `-${panelId}` : ''}-focus-trap`);
}

/**
 * Identifies named or unnamed AppBar panel focus owners within a map.
 *
 * @param mapId - The map identifier
 * @param id - The possible focus-owner identifier
 * @returns Whether the identifier belongs to an AppBar panel in this map
 */
export function isAppBarFocusTrapId(mapId: string, id: string | false | undefined): boolean {
  if (!id) return false;
  const prefix = buildGVElementId(mapId, CONTAINER_TYPE.APP_BAR);
  return id === buildAppBarFocusTrapId(mapId) || (id.startsWith(`${prefix}-`) && id.endsWith('-focus-trap'));
}
