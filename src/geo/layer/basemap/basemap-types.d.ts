import { OSM, XYZ } from 'ol/source';
import { Extent } from 'ol/extent';
/** ******************************************************************************************************************************
 *  Definition of the basemap options type.
 */
export declare type TypeBasemapId = 'transport' | 'osm' | 'simple' | 'nogeom' | 'shaded';
/** ******************************************************************************************************************************
 *  Definition of the basemap options type.
 */
export declare const VALID_BASEMAP_ID: TypeBasemapId[];
/** ******************************************************************************************************************************
 *  Definition of the basemap options type.
 */
export declare type TypeBasemapOptions = {
    /** Id of the basemap to use. */
    basemapId: TypeBasemapId;
    /** Enable or disable shaded basemap (if basemap id is set to shaded then this should be false). */
    shaded: boolean;
    /** Enable or disable basemap labels. */
    labeled: boolean;
};
/** ******************************************************************************************************************************
 * interface used to define a new basemap.
 */
export declare type TypeBasemapProps = {
    basemapId?: string;
    name: string;
    type: string;
    description: string;
    descSummary: string;
    altText: string;
    thumbnailUrl: string | Array<string>;
    layers: TypeBasemapLayer[];
    attribution: string;
    zoomLevels: {
        min: number;
        max: number;
    };
    defaultOrigin?: number[];
    defaultExtent?: Extent;
    defaultResolutions?: number[];
};
/** ******************************************************************************************************************************
 * interface used to define a new basemap layer
 */
export declare type TypeBasemapLayer = {
    basemapId: string;
    url?: string;
    jsonUrl?: string;
    source: OSM | XYZ;
    type: string;
    opacity: number;
    resolutions: number[];
    origin: number[];
    minScale: number;
    maxScale: number;
    extent: Extent;
};
