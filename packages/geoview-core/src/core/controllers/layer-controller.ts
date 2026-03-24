import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { useControllers } from '@/core/controllers/controller-manager';
import type { LayerDomain } from '@/core/domains/layer-domain';
import type { MapViewer } from '@/geo/map/map-viewer';

/**
 * LayerController class that extends the AbstractMapViewerController and provides methods to interact with map layers.
 */
export class LayerController extends AbstractMapViewerController {
  /** The Layer Domain instance associated with this controller */
  // #layerDomain: LayerDomain;

  /** The Layer State Adaptor used to interact with the layer state store */
  // TODO: STATE-ADAPTOR - TO BE IMPLEMENTED
  // #layerStateAdaptor: LayerStateAdaptor;

  /**
   * Creates an instance of LayerController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller.
   * @param layerDomain - The layer domain instance to associate with this controller.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(mapViewer: MapViewer, layerDomain: LayerDomain) {
    super(mapViewer);

    // Keep the domain internally
    // this.#layerDomain = layerDomain;

    // Keep the state adaptor internally
    // TODO: STATE-ADAPTOR - TO BE IMPLEMENTED
    //this.#layerStateAdaptor = new LayerStateAdaptor(layerDomain, mapViewer.mapId);
  }
}

/**
 * Layer Controller hook to access the layer controller from the context.
 *
 * @returns The layer controller instance from the context.
 * @throws {Error} When used outside of a ControllerContext.Provider.
 */
export function useLayerController(): LayerController {
  return useControllers().layerController;
}
