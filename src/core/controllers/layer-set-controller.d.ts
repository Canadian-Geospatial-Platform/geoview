import type { Coordinate } from 'ol/coordinate';
import type { TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { LayerDomain } from '@/core/domains/layer-domain';
import { type TypeFeatureInfoResultSet } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import type { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import type { MapViewer } from '@/geo/map/map-viewer';
import { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import { type TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';
/**
 * LayerSetController class that extends the AbstractMapViewerController and provides methods to interact with map layers.
 */
export declare class LayerSetController extends AbstractMapViewerController {
    #private;
    /** Legends layer set associated to the map */
    legendsLayerSet: LegendsLayerSet;
    /** Hover feature info layer set associated to the map */
    hoverFeatureInfoLayerSet: HoverFeatureInfoLayerSet;
    /** All feature info layer set associated to the map */
    allFeatureInfoLayerSet: AllFeatureInfoLayerSet;
    /** Feature info layer set associated to the map */
    featureInfoLayerSet: FeatureInfoLayerSet;
    /** All the layer sets */
    allLayerSets: AbstractLayerSet[];
    /**
     * Creates an instance of LayerSetController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller.
     * @param layerDomain - The layer domain instance to associate with this controller.
     */
    constructor(mapViewer: MapViewer, layerDomain: LayerDomain);
    /**
     * Hooks the controller into action.
     */
    protected onHook(): void;
    /**
     * Unhooks the controller from the action.
     */
    protected onUnhook(): void;
    /**
     * Queries all feature info for a given layer path.
     *
     * @param layerPath - The layer path to query the features from
     * @returns A promise that resolves with the feature info result
     */
    triggerGetAllFeatureInfo(layerPath: string): Promise<TypeFeatureInfoResult>;
    /**
     * Resets the data-table features for a given layer path.
     *
     * Clears the queried features and resets the selected layer path in the store.
     *
     * @param layerPath - The layer path to reset the features for
     */
    triggerResetFeatureInfo(layerPath: string): void;
    /**
     * Resets the feature info result set for a specific layer path.
     *
     * Clears features from the result set and propagates the change to the store.
     * Also removes highlighted features and the click marker when the layer path
     * matches the currently selected details layer path.
     *
     * @param layerPath - The layer path to clear features for
     */
    resetResultSet(layerPath: string): void;
    /**
     * Clears the feature info query results for a specific layer path.
     *
     * @param layerPath - The layer path to clear results for
     */
    clearFeatureInfoLayerResults(layerPath: string): void;
    /**
     * Performs a details query at the provided longitude/latitude.
     * This call will also open the details panel if not already open.
     *
     * @param longlat - The longitude/latitude coordinates to query
     */
    queryAtLonLat(longlat: Coordinate): Promise<TypeFeatureInfoResultSet>;
    /**
     * Repeats the last feature info query.
     * This method waits for the map viewer layers to be rendered before performing the query.
     *
     * @returns A promise that resolves with the result of the query
     * @throws {LayerNoLastQueryToPerformError} When there's no last query to perform.
     */
    repeatLastQuery(): Promise<TypeFeatureInfoResultSet>;
    /**
     * Repeats the last feature info query, if any.
     * This method waits for the map viewer layers to be rendered before performing the query.
     *
     * @returns A promise that resolves with the result of the query or undefined when no query to repeat
     */
    repeatLastQueryIfAny(): Promise<TypeFeatureInfoResultSet | undefined>;
    /**
     * Clears all vector features from every layer in the All Feature Info Layer Set.
     */
    clearVectorFeaturesFromAllFeatureInfoLayerSet(): void;
    /**
     * Switches the open panel to the details tab when a map click occurs.
     *
     * If the current footer-bar tab is neither 'details' nor 'geochart', the footer bar
     * switches to 'details'. Also opens the app-bar details tab with focus trap when available.
     */
    openDetailsPanelOnMapClick(): void;
    /**
     * Propagates the information stored in the legend layer set to the store.
     *
     * @param legendResultSetEntry - The legend result set entry that triggered the propagation
     * @deprecated This function should be replaced, it's called too often and does too many things, see TODO.
     */
    propagateLegendToStore(legendResultSetEntry: TypeLegendResultSetEntry): void;
}
/**
 * Layer Controller hook to access the layer controller from the context.
 *
 * @returns The layer controller instance from the context.
 * @throws {Error} When used outside of a ControllerContext.Provider.
 */
export declare function useLayerSetController(): LayerSetController;
//# sourceMappingURL=layer-set-controller.d.ts.map