import type VectorSource from 'ol/source/Vector';
import type WKBObject from 'ol/format/WKB';
import type { Projection as OLProjection } from 'ol/proj';
import type { WkbLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
/**
 * Manages a WKB layer.
 */
export declare class GVWKB extends AbstractGVVector {
    #private;
    /**
     * Constructs a GVWKB layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    constructor(olSource: VectorSource, layerConfig: WkbLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): WkbLayerEntryConfig;
    /**
     * Overrides the refresh to reload the WKB object in the layer source once the refresh completes.
     *
     * @param projection - Optional projection to refresh to.
     */
    onRefresh(projection: OLProjection | undefined): void;
    /**
     * Loads a WKB object as the layer source features, overriding the current features if any.
     *
     * @param wkb - The WKB object.
     * @param projection - The output projection.
     * @returns A promise that resolves once the source has been updated with the new features.
     */
    setWkbSource(wkb: WKBObject | string, projection: OLProjection): Promise<void>;
    /**
     * Updates the WKB object, if any, to reproject the features into the new provided projection.
     *
     * @param projection - The projection to project the wkb source features into.
     * @returns A promise that resolves once the source has been updated with the reprojected features, or immediately if no wkb source is defined.
     */
    updateWkbSource(projection: OLProjection): Promise<void>;
}
//# sourceMappingURL=gv-wkb.d.ts.map