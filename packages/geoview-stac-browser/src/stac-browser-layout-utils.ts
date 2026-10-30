import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { StacBrowserController, type TypeStacZoomPadding } from 'geoview-core/core/controllers/stac-browser-controller';

/** Layout measurements for the STAC browser UI. */
export class StacBrowserLayoutUtils {
  /**
   * Gets map fit padding that keeps the visible STAC panel from obscuring the fitted extent.
   *
   * @param mapId - The map identifier
   * @param isStacPanelOpen - Whether the STAC app-bar panel is active
   * @param mapSize - The OpenLayers map size in pixels
   * @returns Padding in map pixels ordered as top, right, bottom, left
   */
  static getZoomPadding(mapId: string, isStacPanelOpen: boolean, mapSize: number[] | undefined): TypeStacZoomPadding {
    const [top, right, bottom, baseLeft] = StacBrowserController.ZOOM_PADDING;
    const padding: TypeStacZoomPadding = [top, right, bottom, baseLeft];
    if (!isStacPanelOpen || !mapSize || mapSize[0] <= 0 || mapSize[1] <= 0) return padding;

    const panel = DomHelper.getGVElementById(mapId, 'appBar-stac-browser-panel');
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
    if (mapSize[0] <= baseLeft + overlap + right || mapSize[1] <= top + bottom) return padding;

    padding[3] += overlap;
    return padding;
  }
}
