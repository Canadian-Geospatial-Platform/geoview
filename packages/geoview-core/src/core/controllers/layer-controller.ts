import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { useControllers } from '@/core/controllers/controller-manager';
import type { LayerDomain } from '@/core/domains/layer-domain';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';

/**
 * LayerController class that extends the AbstractMapViewerController and provides methods to interact with map layers.
 */
export class LayerController extends AbstractMapViewerController {
  /** The Layer Domain instance associated with this controller */
  #layerDomain: LayerDomain;

  /** The Layer State Adaptor used to interact with the layer state store */
  // TODO: STATE-ADAPTOR - TO BE IMPLEMENTED
  // #layerStateAdaptor: LayerStateAdaptor;

  /**
   * Creates an instance of LayerController.
   * @param mapViewer - The map viewer instance to associate with this controller.
   * @param layerDomain - The layer domain instance to associate with this controller.
   */
  constructor(mapViewer: MapViewer, layerDomain: LayerDomain) {
    super(mapViewer);

    // Keep the domain internally
    this.#layerDomain = layerDomain;

    // Keep the state adaptor internally
    // TODO: STATE-ADAPTOR - TO BE IMPLEMENTED
    //this.#layerStateAdaptor = new LayerStateAdaptor(layerDomain, mapViewer.mapId);
  }

  /**
   * Gets the GeoView Layer Ids / UUIDs.
   *
   * @returns The ids of the layers
   */
  getGeoviewLayerIds(): string[] {
    return this.#layerDomain.getGeoviewLayerIds();
  }

  /**
   * Gets the Layer Entry layer paths
   * @returns The GeoView Layer Paths
   */
  getLayerEntryLayerPaths(): string[] {
    return this.#layerDomain.getLayerEntryLayerPaths();
  }

  /**
   * Gets the Layer Entry Configs
   * @returns The GeoView Layer Entry Configs
   */
  getLayerEntryConfigs(): ConfigBaseClass[] {
    return this.#layerDomain.getLayerEntryConfigs();
  }

  /**
   * Gets the layer configuration of the specified layer path.
   * @param layerPath - The layer path.
   * @returns The layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   */
  getLayerEntryConfig(layerPath: string): ConfigBaseClass {
    return this.#layerDomain.getLayerEntryConfig(layerPath);
  }

  /**
   * Gets the layer configuration of the specified layer path.
   * @param layerPath - The layer path.
   * @returns The layer configuration or undefined if not found.
   */
  getLayerEntryConfigIfExists(layerPath: string): ConfigBaseClass | undefined {
    return this.#layerDomain.getLayerEntryConfigIfExists(layerPath);
  }

  /**
   *
   */
  // GV This function is missing logic still in the layer api that needs to be brough over here
  registerLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    return this.#layerDomain.registerLayerEntryConfig(layerConfig);
  }

  /**
   *
   */
  // GV This function is missing logic still in the layer api that needs to be brough over here
  deleteLayerEntryConfig(layerPath: string): void {
    this.#layerDomain.deleteLayerEntryConfig(layerPath);
  }
}

/**
 * Layer Controller hook to access the layer controller from the context.
 * @returns The layer controller instance from the context.
 * @throws Will throw an error if used outside of a ControllerProvider.
 */
export function useLayerController(): LayerController {
  return useControllers().layerController;
}
