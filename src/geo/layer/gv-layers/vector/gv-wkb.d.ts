import type VectorSource from 'ol/source/Vector';
import type WKBObject from 'ol/format/WKB';
import type { Projection as OLProjection } from 'ol/proj';
import type { WkbLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
/**
 * Manages a WKB layer.
 *
 * @exports
 * @class GVWKB
 */
export declare class GVWKB extends AbstractGVVector {
    #private;
    /**
     * Constructs a GVWKB layer to manage an OpenLayer layer.
     * @param {VectorSource} olSource - The OpenLayer source.
     * @param {WkbLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: VectorSource, layerConfig: WkbLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {WkbLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): WkbLayerEntryConfig;
    /**
     * Overrides the refresh to reload the WKB object in the layer source once the refresh completes.
     * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
     * @override
     */
    onRefresh(projection: OLProjection | undefined): void;
    /**
     * Loads a WKB object as the layer source features, overriding the current features if any.
     * @param {WkbObject | string} wkb - The WKB object.
     * @param {OLProjection} projection - The output projection.
     */
    setWkbSource(wkb: WKBObject | string, projection: OLProjection): Promise<void>;
    /**
     * Updates the WKB object, if any, to reproject the features into the new provided projection.
     * @param {OLProjection} projection - The projection to project the wkb source features into.
     */
    updateWkbSource(projection: OLProjection): Promise<void>;
}
//# sourceMappingURL=gv-wkb.d.ts.map