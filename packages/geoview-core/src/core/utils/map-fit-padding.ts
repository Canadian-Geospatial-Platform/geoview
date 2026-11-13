import { DomHelper } from '@/core/utils/dom-helper';
import { OL_ZOOM_PIXEL_PADDING, type TypeMapFitPadding } from '@/core/utils/constant';

/** DOM measurements used to keep fitted extents out of the map areas covered by panels and map controls. */
export abstract class MapFitPadding {
  /**
   * Gets the default fixed fit padding shared by the feature zoom (Details, Data Table) and the STAC browser zoom.
   *
   * @returns Padding in map pixels ordered as top, right, bottom, left
   */
  static getDefaultPadding(): TypeMapFitPadding {
    return [OL_ZOOM_PIXEL_PADDING, OL_ZOOM_PIXEL_PADDING, OL_ZOOM_PIXEL_PADDING, OL_ZOOM_PIXEL_PADDING];
  }

  /**
   * Gets the default fit padding with the area covered by the right-side map controls (navigation bar and
   * overview map) added to the right side.
   *
   * The overlap between the controls and the map is measured from their actual positions and converted to map pixels
   * (so it keeps working with CSS scaling). The default padding is returned unchanged when no control is shown or
   * when the controls leave no room for the extent.
   *
   * @param mapId - The map identifier
   * @param mapSize - The OpenLayers map size in pixels
   * @returns Padding in map pixels ordered as top, right, bottom, left
   */
  static getMapControlsPadding(mapId: string, mapSize: number[] | undefined): TypeMapFitPadding {
    const padding = MapFitPadding.getDefaultPadding();
    const mapRect = MapFitPadding.#getMapRect(mapId, mapSize);
    if (!mapSize || !mapRect) return padding;

    // The navigation bar and the overview map are both anchored to the right edge of the map
    const controls = [DomHelper.getNavBar(mapId), ...DomHelper.getOverviewMapControls(mapId)];
    const overlap =
      Math.max(0, ...controls.map((control) => MapFitPadding.#getOverlap(control, mapRect, 'right'))) * (mapSize[0] / mapRect.width);
    if (mapSize[0] <= padding[3] + overlap + padding[1]) return padding;

    padding[1] += overlap;
    return padding;
  }

  /**
   * Gets the map controls fit padding with the area covered by an app-bar panel added to the left side.
   *
   * The overlap between the panel and the map is measured from their actual positions and converted to map pixels
   * (so it keeps working with CSS scaling). The map controls padding is returned unchanged when the panel is missing,
   * hidden, does not overlap the map (e.g. footer-bar panel) or leaves no room for the extent.
   *
   * The caller is responsible for knowing the panel is the open one.
   *
   * @param mapId - The map identifier
   * @param tabId - The app-bar tab identifier whose panel is measured
   * @param mapSize - The OpenLayers map size in pixels
   * @returns Padding in map pixels ordered as top, right, bottom, left
   */
  static getAppBarPanelPadding(mapId: string, tabId: string, mapSize: number[] | undefined): TypeMapFitPadding {
    const padding = MapFitPadding.getMapControlsPadding(mapId, mapSize);
    const [top, right, bottom, left] = padding;
    const mapRect = MapFitPadding.#getMapRect(mapId, mapSize);
    if (!mapSize || !mapRect) return padding;

    const panel = DomHelper.getAppBarPanel(mapId, tabId);
    if (!panel || panel.getAttribute('aria-hidden') === 'true') return padding;

    // Convert CSS overlap into map pixels, including when the host applies CSS scaling.
    const overlap = MapFitPadding.#getOverlap(panel, mapRect, 'left') * (mapSize[0] / mapRect.width);
    if (overlap <= 0 || mapSize[0] <= left + overlap + right || mapSize[1] <= top + bottom) return padding;

    padding[3] += overlap;
    return padding;
  }

  /**
   * Gets the bounding rectangle of the map target element, when the map has a usable size.
   *
   * @param mapId - The map identifier
   * @param mapSize - The OpenLayers map size in pixels
   * @returns The map target bounding rectangle, or undefined when the map or its size is unavailable
   */
  static #getMapRect(mapId: string, mapSize: number[] | undefined): DOMRect | undefined {
    if (!mapSize || mapSize[0] <= 0 || mapSize[1] <= 0) return undefined;

    const mapRect = DomHelper.getMapTargetElement(mapId)?.getBoundingClientRect();
    return mapRect && mapRect.width > 0 ? mapRect : undefined;
  }

  /**
   * Gets how far, in CSS pixels, an element covers the map from one of its sides.
   *
   * @param element - The element covering the map, if any
   * @param mapRect - The map target bounding rectangle
   * @param side - The map side the element is anchored to
   * @returns The covered width in CSS pixels, or 0 when the element is missing, hidden or does not overlap the map
   */
  static #getOverlap(element: HTMLElement | undefined, mapRect: DOMRect, side: 'left' | 'right'): number {
    const rect = element?.getBoundingClientRect();
    if (
      !rect ||
      rect.width <= 0 ||
      rect.bottom <= mapRect.top ||
      rect.top >= mapRect.bottom ||
      rect.left >= mapRect.right ||
      rect.right <= mapRect.left
    ) {
      return 0;
    }

    return Math.min(mapRect.width, side === 'left' ? rect.right - mapRect.left : mapRect.right - rect.left);
  }
}
