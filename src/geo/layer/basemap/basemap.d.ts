import type { Extent } from 'ol/extent';
import type BaseLayer from 'ol/layer/Base';
import type OLMap from 'ol/Map';
import { OverviewMap as OLOverviewMap } from 'ol/control';
import type { TypeBasemapOptions, TypeValidMapProjectionCodes, TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { TypeBasemapProps, BasemapCreationList } from '@/geo/layer/basemap/basemap-types';
import type { MapController } from '@/core/controllers/map-controller';
import type { EventDelegateBase } from '@/api/events/event-helper';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import type { MapViewer } from '@/geo/map/map-viewer';
/**
 * A class to get a Basemap for a define projection and language. For the moment, a list maps are available and
 * can be filtered by projection (currently only WM and LCC projections are listed,
 * in case other projections needed, they need to be added to the list).
 */
export declare class BasemapApi {
    #private;
    /** The maximum delay to wait before we warn about the basemap taking a long time */
    static DEFAULT_WAIT_PERIOD_BASEMAP_WARNING: number;
    /** Indicates if the basemap has been created successfully */
    created: boolean;
    /** The active basemap */
    activeBasemap?: TypeBasemapProps;
    /** The default origin */
    defaultOrigin?: number[];
    /** The default resolutions */
    defaultResolutions?: number[];
    /** The default extent */
    defaultExtent?: Extent;
    /** The overview map basemap */
    overviewMap?: TypeBasemapProps;
    /** The overview map control */
    overviewMapCtrl?: OLOverviewMap;
    /** The basemap options passed from the map config */
    basemapOptions: TypeBasemapOptions;
    /**
     * Initializes the basemap API.
     *
     * @param mapViewer - The map viewer
     * @param mapController - The map controller
     * @param basemapOptions - The basemap option properties, passed in from map config
     */
    constructor(mapViewer: MapViewer, mapController: MapController, basemapOptions: TypeBasemapOptions);
    /** The basemap creation configuration list */
    basemapsList: BasemapCreationList;
    /**
     * Gets or creates the overview map control.
     *
     * @param olMap - The OpenLayers map instance
     * @param toggleButton - The toggle button element for the overview map
     * @returns The overview map control
     */
    initOverviewMapControl(olMap: OLMap, toggleButton: HTMLDivElement): OLOverviewMap;
    /**
     * Creates the layers for the overview map.
     *
     * @returns The array of base layers for the overview map
     */
    createOverviewMapLayers(): BaseLayer[];
    /**
     * Creates and sets the overview map basemap.
     *
     * @returns A promise that resolves when the overview map basemap has been created and set
     */
    setOverviewMap(): Promise<void>;
    /**
     * Gets the visibility state of the overview map control.
     *
     * @returns True if the overview map control is visible, false otherwise
     */
    getOverviewMapControlVisibility(): boolean;
    /**
     * Sets the visibility of the overview map control.
     *
     * @param olMap - The OpenLayers map instance
     * @param visible - Whether the overview map control should be visible
     */
    setOverviewMapControlVisibility(olMap: OLMap, visible: boolean): void;
    /**
     * Waits until the overview map visibility matches the expected state.
     *
     * Sync-checks first, then subscribes to the visibility-changed event until the condition is met.
     *
     * @param expectedVisible - The expected visibility state to wait for
     * @returns A promise that resolves once the visibility matches the expected state
     */
    waitForOverviewMapVisibility(expectedVisible: boolean): Promise<void>;
    /**
     * Creates the core basemap and adds the layers to it.
     *
     * @param basemapOptions - The basemap options
     * @param projection - Optional projection code
     * @param language - Optional display language
     * @returns A promise that resolves with the core basemap
     * @throws {CoreBasemapCreationError} When no basemap layers are created and the basemap is not 'nogeom'
     */
    createCoreBasemap(basemapOptions: TypeBasemapOptions, projection?: TypeValidMapProjectionCodes, language?: TypeDisplayLanguage): Promise<TypeBasemapProps>;
    /**
     * Loads the default basemap that was passed in the map config.
     *
     * @param projection - Optional projection code
     * @param language - Optional display language
     */
    loadDefaultBasemaps(projection?: TypeValidMapProjectionCodes, language?: TypeDisplayLanguage): Promise<void>;
    /**
     * Clears the basemap layers from the map.
     */
    clearBasemaps(): void;
    /**
     * Sets the current basemap and updates the basemap layers on the map.
     *
     * @param basemap - The basemap to set as active
     */
    setBasemap(basemap: TypeBasemapProps): void;
    /**
     * Refreshes the basemap layers
     */
    refreshBasemap(): void;
    /**
     * Registers a basemap changed event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onBasemapChanged(callback: BasemapChangedDelegate): void;
    /**
     * Unregisters a basemap changed event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offBasemapChanged(callback: BasemapChangedDelegate): void;
    /**
     * Registers a basemap error event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onBasemapError(callback: BasemapErrorDelegate): void;
    /**
     * Unregisters a basemap error event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offBasemapError(callback: BasemapErrorDelegate): void;
    /**
     * Registers a one-shot overview map control visibility changed event handler that resolves a promise.
     *
     * @param filter - Optional filter predicate to skip non-matching events without unsubscribing
     * @returns A promise that resolves with the overview map control visibility changed event
     */
    onceOverviewMapControlVisibilityChanged(filter?: (event: OverviewMapControlVisibilityChangedEvent) => boolean): Promise<OverviewMapControlVisibilityChangedEvent>;
    /**
     * Registers an overview map control visibility changed event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onOverviewMapControlVisibilityChanged(callback: OverviewMapControlVisibilityChangedDelegate): void;
    /**
     * Unregisters an overview map control visibility changed event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offOverviewMapControlVisibilityChanged(callback: OverviewMapControlVisibilityChangedDelegate): void;
}
/**
 * Define an event for the delegate.
 */
export interface BasemapChangedEvent {
    basemap: TypeBasemapProps;
}
/**
 * Define a delegate for the event handler function signature.
 */
type BasemapChangedDelegate = EventDelegateBase<BasemapApi, BasemapChangedEvent, void>;
/**
 * Define an event for the delegate.
 */
export interface BasemapErrorEvent {
    error: GeoViewError;
}
/**
 * Define a delegate for the event handler function signature.
 */
type BasemapErrorDelegate = EventDelegateBase<BasemapApi, BasemapErrorEvent, void>;
/**
 * Define an event for the delegate.
 */
export interface OverviewMapControlVisibilityChangedEvent {
    visible: boolean;
}
/**
 * Define a delegate for the event handler function signature.
 */
type OverviewMapControlVisibilityChangedDelegate = EventDelegateBase<BasemapApi, OverviewMapControlVisibilityChangedEvent, void>;
export {};
//# sourceMappingURL=basemap.d.ts.map