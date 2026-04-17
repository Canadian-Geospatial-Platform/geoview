import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import type { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { AbstractController } from './abstract-controller';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
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
     */
    constructor(mapViewer: MapViewer);
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
     * Generates an array of layer info for the orderedLayerList.
     *
     * @param geoviewLayerConfig - The config to get the info from
     * @returns The array of ordered layer info
     */
    static generateArrayOfLayerOrderInfo(geoviewLayerConfig: TypeGeoviewLayerConfig | ConfigBaseClass): TypeOrderedLayerInfo[];
}
//# sourceMappingURL=abstract-map-viewer-controller.d.ts.map