import { DomHelper } from '@/core/utils/dom-helper';
import { OL_ZOOM_PIXEL_PADDING, type TypeMapFitPadding } from '@/core/utils/constant';

/** DOM measurements used to keep fitted extents out of the area covered by an app-bar panel. */
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
   * Gets the default fit padding with the area covered by an app-bar panel added to the left side.
   *
   * The overlap between the panel and the map is measured from their actual positions and converted to map pixels
   * (so it keeps working with CSS scaling). The default padding is returned unchanged when the panel is missing, hidden,
   * does not overlap the map (e.g. footer-bar panel) or leaves no room for the extent.
   *
   * The caller is responsible for knowing the panel is the open one.
   *
   * @param mapId - The map identifier
   * @param tabId - The app-bar tab identifier whose panel is measured
   * @param mapSize - The OpenLayers map size in pixels
   * @returns Padding in map pixels ordered as top, right, bottom, left
   */
  static getAppBarPanelPadding(mapId: string, tabId: string, mapSize: number[] | undefined): TypeMapFitPadding {
    const padding = MapFitPadding.getDefaultPadding();
    const [top, right, bottom, left] = padding;
    if (!mapSize || mapSize[0] <= 0 || mapSize[1] <= 0) return padding;

    const panel = DomHelper.getAppBarPanel(mapId, tabId);
    const mapTarget = DomHelper.getMapTargetElement(mapId);
    if (!panel || !mapTarget || panel.getAttribute('aria-hidden') === 'true') return padding;

    const panelRect = panel.getBoundingClientRect();
    const mapRect = mapTarget.getBoundingClientRect();
    if (
      mapRect.width <= 0 ||
      panelRect.width <= 0 ||
      panelRect.bottom <= mapRect.top ||
      panelRect.top >= mapRect.bottom ||
      panelRect.left >= mapRect.right ||
      panelRect.right <= mapRect.left
    ) {
      return padding;
    }

    // Convert CSS overlap into map pixels, including when the host applies CSS scaling.
    const overlap = Math.min(mapRect.width, panelRect.right - mapRect.left) * (mapSize[0] / mapRect.width);
    if (mapSize[0] <= left + overlap + right || mapSize[1] <= top + bottom) return padding;

    padding[3] += overlap;
    return padding;
  }
}
