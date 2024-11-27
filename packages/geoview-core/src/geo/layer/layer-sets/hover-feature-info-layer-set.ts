import debounce from 'lodash/debounce';

import { Coordinate } from 'ol/coordinate';
import { logger } from '@/core/utils/logger';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGVLayer } from '../gv-layers/abstract-gv-layer';
import { AbstractBaseLayer } from '../gv-layers/abstract-base-layer';
import { WMS } from '../geoview-layers/raster/wms';
import { GVWMS } from '../gv-layers/raster/gv-wms';
import { AbstractLayerSet, PropagationType } from './abstract-layer-set';
import { LayerApi } from '@/geo/layer/layer';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeHoverResultSet, TypeHoverResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';

/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user hovers on the map) with a store
 * for UI updates.
 * @class HoverFeatureInfoLayerSet
 */
export class HoverFeatureInfoLayerSet extends AbstractLayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeHoverFeatureInfoResultSet */
  declare resultSet: TypeHoverResultSet;

  /**
   * The class constructor that instanciate a set of layer.
   * @param {LayerApi} layerApi - The layer Api to work with.
   */
  constructor(layerApi: LayerApi) {
    super(layerApi);

    // Register a handler on the map pointer move
    layerApi.mapViewer.onMapPointerMove(
      debounce((mapViewer, payload) => {
        // Query all layers which can be queried
        this.queryLayers(payload.pixel);
      }, 750).bind(this)
    );
  }

  /**
   * Overrides the behavior to apply when a hover-feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
   * @returns {boolean} True when the layer should be registered to this hover-feature-info-layer-set.
   */
  protected override onRegisterLayerCheck(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): boolean {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    // Return if the layer is of queryable type and source is queryable
    return (
      super.onRegisterLayerCheck(layer, layerPath) &&
      AbstractLayerSet.isQueryableType(layer) &&
      !(layer instanceof WMS) &&
      !(layer instanceof GVWMS) &&
      AbstractLayerSet.isSourceQueryable(layer, layerPath)
    );
  }

  /**
   * Overrides the behavior to apply when a hover-feature-info-layer-set wants to register a layer in its set.
   * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): void {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    // Call parent
    super.onRegisterLayer(layer, layerPath);

    // Update the resultSet data
    this.resultSet[layerPath].eventListenerEnabled = true;
    this.resultSet[layerPath].queryStatus = 'processed';
    this.resultSet[layerPath].feature = undefined;
  }

  /**
   * Overrides the behavior to apply when propagating to the store
   * @param {TypeHoverResultSetEntry} resultSetEntry - The result set entry to propagate to the store
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onPropagateToStore(resultSetEntry: TypeHoverResultSetEntry, type: PropagationType): void {
    // Nothing to do here, hover's store only needs updating when a query happens
  }

  /**
   * Overrides the behavior to apply when deleting from the store
   * @param {string} layerPath - The layer path to delete from the store
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onDeleteFromStore(layerPath: string): void {
    // Nothing to do here, hover's store only needs updating when a query happens
  }

  /**
   * Queries the features at the provided coordinate for all the registered layers.
   * @param {Coordinate} pixelCoordinate - The pixel coordinate where to query the features
   */
  queryLayers(pixelCoordinate: Coordinate): void {
    // FIXME: Watch out for code reentrancy between queries!
    // FIX.MECONT: Consider using a LIFO pattern, per layer path, as the race condition resolution
    // FIX.MECONT: For this one, because there is only one at the time, we should even query first layer in order of visible layer that is query able
    // Query types of what we're doing
    const queryType = 'at_pixel';

    // Reinitialize the resultSet
    // Loop on each layer path in the resultSet
    Object.keys(this.resultSet).forEach((layerPath) => {
      // If event listener is disabled
      if (!this.resultSet[layerPath].eventListenerEnabled) return;

      // Get the layer config and layer associated with the layer path
      const layer = this.layerApi.getGeoviewLayer(layerPath);

      // If layer was found
      if (layer && (layer instanceof AbstractGeoViewLayer || layer instanceof AbstractGVLayer)) {
        // If state is not queryable
        if (!AbstractLayerSet.isStateQueryable(layer, layerPath)) return;

        // Flag processing
        this.resultSet[layerPath].feature = undefined;
        this.resultSet[layerPath].queryStatus = 'init';

        // Propagate to the store
        MapEventProcessor.setMapHoverFeatureInfo(this.getMapId(), this.resultSet[layerPath].feature);

        // Process query on results data
        AbstractLayerSet.queryLayerFeatures(this.resultSet[layerPath], layer, queryType, pixelCoordinate)
          .then((arrayOfRecords) => {
            if (arrayOfRecords === null) {
              this.resultSet[layerPath].queryStatus = 'error';
              this.resultSet[layerPath].feature = null;
            } else {
              if (arrayOfRecords?.length) {
                const nameField = arrayOfRecords![0].nameField || (Object.entries(arrayOfRecords![0].fieldInfo)[0] as unknown as string);
                const fieldInfo = arrayOfRecords![0].fieldInfo[nameField as string];

                this.resultSet[layerPath].feature = {
                  featureIcon: arrayOfRecords![0].featureIcon,
                  fieldInfo,
                  geoviewLayerType: arrayOfRecords![0].geoviewLayerType,
                  nameField,
                };
              } else {
                this.resultSet[layerPath].feature = undefined;
              }
              this.resultSet[layerPath].queryStatus = 'processed';
            }

            // Propagate to the store
            MapEventProcessor.setMapHoverFeatureInfo(this.getMapId(), this.resultSet[layerPath].feature);
          })
          .catch((error) => {
            // Log
            logger.logPromiseFailed('queryLayerFeatures in queryLayers in hoverFeatureInfoLayerSet', error);
          });
      } else {
        this.resultSet[layerPath].feature = null;
        this.resultSet[layerPath].queryStatus = 'error';

        // Propagate to the store
        MapEventProcessor.setMapHoverFeatureInfo(this.getMapId(), this.resultSet[layerPath].feature);
      }
    });
  }

  /**
   * Function used to enable listening of hover events. When a layer path is not provided,
   * hover events listening is enabled for all layers.
   * @param {string} layerPath - Optional parameter used to enable only one layer
   */
  enableHoverListener(layerPath?: string): void {
    if (layerPath) this.resultSet[layerPath].eventListenerEnabled = true;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].eventListenerEnabled = true;
      });
  }

  /**
   * Function used to disable listening of hover events. When a layer path is not provided,
   * hover events listening is disable for all layers.
   * @param {string} layerPath - Optional parameter used to disable only one layer
   */
  disableHoverListener(layerPath?: string): void {
    if (layerPath) this.resultSet[layerPath].eventListenerEnabled = false;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].eventListenerEnabled = false;
      });
  }

  /**
   * Function used to determine whether hover events are disabled for a layer. When a layer path is not provided,
   * the value returned is undefined if the map flags are a mixture of true and false values.
   * @param {string} layerPath - Optional parameter used to get the flag value of a layer.
   * @returns {boolean | undefined} The flag value for the map or layer.
   */
  isHoverListenerEnabled(layerPath?: string): boolean | undefined {
    if (layerPath) return !!this.resultSet?.[layerPath]?.eventListenerEnabled;

    let returnValue: boolean | undefined;
    Object.keys(this.resultSet).forEach((key: string, i) => {
      if (i === 0) returnValue = this.resultSet[key].eventListenerEnabled;
      if (returnValue !== this.resultSet[key].eventListenerEnabled) returnValue = undefined;
    });
    return returnValue;
  }
}
