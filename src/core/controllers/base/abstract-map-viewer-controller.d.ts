import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import type { TypeMapMouseInfo } from '@/api/types/map-schema-types';
import { AbstractController } from './abstract-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { TypeFeatureInfoResultSet } from '@/core/stores/states/feature-info-state';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';
import type { BasemapApi } from '@/geo/layer/basemap/basemap';
/**
 * Base class for controllers that operate on a specific map instance.
 *
 * Extends `AbstractController` with convenient access to the `MapViewer`,
 * the map identifier, and the `ControllerRegistry` for cross-controller
 * communication.
 */
export declare class AbstractMapViewerController extends AbstractController {
    #private;
    /**
     * Creates an instance of AbstractMapViewerController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller
     * @param controllerRegistry - The controller registry for accessing sibling controllers
     */
    constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry);
    /**
     * Gets the map viewer instance.
     *
     * @returns The map viewer associated with this controller
     */
    getMapViewer(): MapViewer;
    /**
     * Gets the map identifier.
     *
     * @returns The unique identifier of the map
     */
    getMapId(): string;
    /**
     * Gets the controller registry for accessing sibling controllers.
     *
     * @returns The controller registry owned by the map viewer
     */
    getControllersRegistry(): ControllerRegistry;
    /**
     * Gets the basemap API from the map viewer.
     *
     * @returns The basemap API instance
     */
    getBasemapApi(): BasemapApi;
    /**
     * Gets the geometry API from the map viewer.
     *
     * @returns The geometry API instance
     */
    getGeometryApi(): GeometryApi;
    /**
     * Performs the map click action by setting the clicked coordinates in the map controller and querying layers at that location.
     *
     * @param coordinates - The coordinates of the map click event
     * @param abortSignal - Optional signal to abort the operation
     */
    performMapClickAction(coordinates: TypeMapMouseInfo, abortSignal?: AbortSignal): Promise<TypeFeatureInfoResultSet>;
    /**
     * Generates an array of layer paths for the ordered layer list.
     *
     * @param geoviewLayerConfig - The config to get the info from
     * @returns The array of ordered layer paths
     */
    static generateOrderedLayerPaths(geoviewLayerConfig: TypeGeoviewLayerConfig | ConfigBaseClass): string[];
}
//# sourceMappingURL=abstract-map-viewer-controller.d.ts.map