import { OSM, VectorTile, XYZ } from 'ol/source';
import { Extent } from 'ol/extent';
/**
 * interface used to define a new basemap.
 */
export type TypeBasemapProps = {
    basemapId?: string;
    name: string;
    type: string;
    description: string;
    descSummary: string;
    altText: string;
    thumbnailUrl: string | Array<string>;
    layers: TypeBasemapLayer[];
    attribution: string[];
    zoomLevels: {
        min: number;
        max: number;
    };
    defaultOrigin?: number[];
    defaultExtent?: Extent;
    defaultResolutions?: number[];
};
/**
 * interface used to define a new basemap layer
 */
export type TypeBasemapLayer = {
    basemapId: string;
    url?: string;
    jsonUrl?: string;
    styleUrl?: string;
    source: OSM | XYZ | VectorTile;
    type: string;
    opacity: number;
    resolutions: number[];
    origin: number[];
    minScale: number;
    maxScale: number;
    extent: Extent;
    copyright?: string;
};
