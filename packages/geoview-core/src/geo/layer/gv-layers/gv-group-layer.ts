import LayerGroup from 'ol/layer/Group';

import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';

/**
 * Manages a Group Layer.
 *
 * @exports
 * @class GVGroupLayer
 */
export class GVGroupLayer extends AbstractBaseLayer {
  /**
   * Constructs a Group layer to manage an OpenLayer Group Layer.
   * @param {string} mapId - The map id
   * @param {LayerGroup} olLayerGroup - The OpenLayer group layer.
   * @param {GroupLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olLayerGroup: LayerGroup, layerConfig: GroupLayerEntryConfig) {
    super(mapId, layerConfig);
    this.olLayer = olLayerGroup;

    // Set extreme zoom settings to group layer so sub layers can load
    this.olLayer.setMaxZoom(50);
    this.olLayer.setMinZoom(0);
  }

  /**
   * Gets the layer configuration associated with the layer.
   * @returns {GroupLayerEntryConfig} The layer configuration
   */
  override getLayerConfig(): GroupLayerEntryConfig {
    return super.getLayerConfig() as GroupLayerEntryConfig;
  }

  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {Layer} The OpenLayers Layer
   */
  override getOLLayer(): LayerGroup {
    // Call parent and cast
    return super.getOLLayer() as LayerGroup;
  }

  /**
   * Gets the layer attributions of all layers in the group
   * @returns {string[]} The layer attributions
   */
  override getAttributions(): string[] {
    // For each layer in the group
    const totalAttributions: string[] = [];
    this.olLayer.getLayersArray().forEach((olLayer) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let attributionsAsRead = olLayer.getSource()?.getAttributions()?.({} as any); // This looks very weird, but it's as documented in OpenLayers..
      // Depending on the internal formatting
      if (!attributionsAsRead) attributionsAsRead = [];
      if (typeof attributionsAsRead === 'string') attributionsAsRead = [attributionsAsRead];

      // Add them
      totalAttributions.push(...attributionsAsRead);
    });

    // Return the total attributions
    return totalAttributions;
  }
}
