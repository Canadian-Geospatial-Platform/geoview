import { type TypeMapFitPadding } from '@/core/utils/constant';
/** DOM measurements used to keep fitted extents out of the area covered by an app-bar panel. */
export declare abstract class MapFitPadding {
    /**
     * Gets the default fixed fit padding shared by the feature zoom (Details, Data Table) and the STAC browser zoom.
     *
     * @returns Padding in map pixels ordered as top, right, bottom, left
     */
    static getDefaultPadding(): TypeMapFitPadding;
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
    static getAppBarPanelPadding(mapId: string, tabId: string, mapSize: number[] | undefined): TypeMapFitPadding;
}
//# sourceMappingURL=map-fit-padding.d.ts.map