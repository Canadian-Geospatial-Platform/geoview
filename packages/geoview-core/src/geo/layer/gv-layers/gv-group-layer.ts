import LayerGroup from 'ol/layer/Group';
import { Projection as OLProjection } from 'ol/proj';

import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { LayerNotFoundError } from '@/core/exceptions/layer-exceptions';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';

/**
 * Manages a Group Layer.
 *
 * @exports
 * @class GVGroupLayer
 */
export class GVGroupLayer extends AbstractBaseLayer {
  /** The layers in the group */
  #layers: AbstractBaseLayer[] = [];

  /**
   * Constructs a Group layer to manage an OpenLayer Group Layer.
   * @param {LayerGroup} olLayerGroup - The OpenLayer group layer.
   * @param {GroupLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(olLayerGroup: LayerGroup, layerConfig: GroupLayerEntryConfig) {
    super(layerConfig);
    this.setOLLayer(olLayerGroup);
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {GroupLayerEntryConfig} The strongly-typed layer configuration specific to this group layer.
   */
  override getLayerConfig(): GroupLayerEntryConfig {
    return super.getLayerConfig() as GroupLayerEntryConfig;
  }

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {LayerGroup} The strongly-typed OpenLayers type.
   */
  override getOLLayer(): LayerGroup {
    // Call parent and cast
    return super.getOLLayer() as LayerGroup;
  }

  /**
   * Overrides the way the attributions are retrieved.
   * @override
   * @returns {string[]} The layer attributions.
   */
  override onGetAttributions(): string[] {
    // For each layer in the group
    const totalAttributions: string[] = [];
    this.getLayers().forEach((layer) => {
      // Compile the attributions
      totalAttributions.push(...layer.getAttributions());
    });

    // Return the total attributions
    return totalAttributions;
  }

  /**
   * Overrides the refresh function to refresh each layer in the group.
   * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
   * @override
   */
  override onRefresh(projection: OLProjection | undefined): void {
    // Loops on each layer in the group
    this.getLayers().forEach((layer) => {
      // Refresh it
      layer.refresh(projection);
    });
  }

  /**
   * Gets the layers in the group.
   * @returns {AbstractBaseLayer[]} The layers in the group.
   */
  getLayers(): AbstractBaseLayer[] {
    return this.#layers;
  }

  /**
   * Adds a layer to the group layer.
   * @param {AbstractBaseLayer} layer - The layer to add.
   */
  addLayer(layer: AbstractBaseLayer): void {
    // Officially add it to the OL object
    this.getOLLayer().getLayers().push(layer.getOLLayer());

    // Add the layer to our list
    this.#layers.push(layer);
  }

  /**
   * Removes a layer from the group layer.
   * @param {AbstractBaseLayer} layer - The layer to remove.
   */
  removeLayer(layer: AbstractBaseLayer): void {
    // Try to find it
    const idx = this.#layers.findIndex((lyr) => lyr === layer);

    // If not found
    if (idx < 0) throw new LayerNotFoundError(layer.getLayerPath());

    // Officially remove it from the OL object
    this.getOLLayer().getLayers().remove(layer.getOLLayer());

    // Remove it from our list
    this.#layers.splice(idx, 1);
  }
}
