import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { TypeGeoviewLayerConfig, TypeLayerEntryConfig } from '@/api/types/layer-schema-types';
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
export class AbstractMapViewerController extends AbstractController {
  /** The map viewer instance associated with this controller */
  #mapViewer: MapViewer;

  /**
   * Creates an instance of AbstractMapViewerController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   */
  constructor(mapViewer: MapViewer) {
    super();
    this.#mapViewer = mapViewer;
  }

  /**
   * Gets the map viewer instance.
   *
   * @returns The map viewer associated with this controller
   */
  getMapViewer(): MapViewer {
    return this.#mapViewer;
  }

  /**
   * Gets the map identifier.
   *
   * @returns The unique identifier of the map
   */
  getMapId(): string {
    return this.getMapViewer().mapId;
  }

  /**
   * Gets the controller registry for accessing sibling controllers.
   *
   * @returns The controller registry owned by the map viewer
   */
  getControllersRegistry(): ControllerRegistry {
    return this.getMapViewer().controllers;
  }

  /**
   * Gets the basemap API from the map viewer.
   *
   * @returns The basemap API instance
   */
  getBasemapApi(): BasemapApi {
    return this.getMapViewer().basemap;
  }

  /**
   * Gets the geometry API from the map viewer.
   *
   * @returns The geometry API instance
   */
  getGeometryApi(): GeometryApi {
    return this.getMapViewer().geometry;
  }

  // #region STATIC METHODS

  /**
   * Generates an array of layer info for the orderedLayerList.
   *
   * @param geoviewLayerConfig - The config to get the info from
   * @returns The array of ordered layer info
   */
  static generateArrayOfLayerOrderInfo(geoviewLayerConfig: TypeGeoviewLayerConfig | ConfigBaseClass): TypeOrderedLayerInfo[] {
    const newOrderedLayerInfos: TypeOrderedLayerInfo[] = [];

    const addSubLayerPathToLayerOrder = (layerEntryConfig: TypeLayerEntryConfig, layerPath: string): void => {
      const subLayerPath = layerPath.endsWith(`/${layerEntryConfig.layerId}`) ? layerPath : `${layerPath}/${layerEntryConfig.layerId}`;

      const settings = ConfigBaseClass.getClassOrTypeInitialSettings(layerEntryConfig);
      const featureInfo = AbstractBaseLayerEntryConfig.getClassOrTypeFeatureInfo(layerEntryConfig);

      const layerInfo: TypeOrderedLayerInfo = {
        layerPath: subLayerPath,
        visible: settings?.states?.visible ?? true, // default: true
        queryableSource: featureInfo?.queryable ?? true, // default: true
        queryableState: settings?.states?.queryable ?? true, // default: true
        hoverable: settings?.states?.hoverable ?? true, // default: true
        legendCollapsed: settings?.states?.legendCollapsed ?? false, // default: false
        inVisibleRange: true,
      };

      newOrderedLayerInfos.push(layerInfo);
      if (layerEntryConfig.listOfLayerEntryConfig?.length) {
        layerEntryConfig.listOfLayerEntryConfig?.forEach((subLayerEntryConfig) => {
          addSubLayerPathToLayerOrder(subLayerEntryConfig, subLayerPath);
        });
      }
    };

    // TODO: REFACTOR listOfLayerEntryConfig types - This function has issues with the expected types and what it's truly doing.
    // TO.DOCONT: Sometimes, geoviewLayerConfig is a ConfigBaseClass instance and sometimes a regular json object
    // GV: The old code was doing `if (theGeoviewLayerConfig.geoviewLayerId)` which condition is only possible when `geoviewLayerId` is a property of the class instance.
    // GV: However, since that it's not a property anymore, that code was only being executed when the objet was a json object. For a while now...
    // GV: Attempting to fix it by supporting both the class instance and the json object by doing something like:
    // GV: const theGeoviewLayerConfig = ConfigBaseClass.getClassOrTypeGeoviewLayerConfig(geoviewLayerConfig);
    // GV: was actually making it worse. Therefore, I'm assuming the correct condition check is to check if the variable is a
    // GV: json object (not a class instance), so I'm changing it for clarity. However, I'm not sure what the whole intention is here.

    if (!(geoviewLayerConfig instanceof ConfigBaseClass)) {
      if (geoviewLayerConfig.listOfLayerEntryConfig?.length > 1) {
        const layerPath = `${geoviewLayerConfig.geoviewLayerId}/base-group`;
        // Using as any, because even a TypeGeoviewLayerConfig can have initialSettings? To confirm...
        const settingsGVLC = ConfigBaseClass.getClassOrTypeInitialSettings(geoviewLayerConfig)?.states;

        const layerInfo: TypeOrderedLayerInfo = {
          layerPath,
          legendCollapsed: settingsGVLC?.legendCollapsed ?? false, // default: false
          visible: settingsGVLC?.visible ?? true, // default: true
          inVisibleRange: true,
        };

        newOrderedLayerInfos.push(layerInfo);
        geoviewLayerConfig.listOfLayerEntryConfig.forEach((layerEntryConfig) => {
          addSubLayerPathToLayerOrder(layerEntryConfig, layerPath);
        });
      } else {
        const layerEntryConfig = geoviewLayerConfig.listOfLayerEntryConfig[0];
        addSubLayerPathToLayerOrder(layerEntryConfig, layerEntryConfig.layerPath);
      }
    } else {
      addSubLayerPathToLayerOrder(geoviewLayerConfig as TypeLayerEntryConfig, geoviewLayerConfig.layerPath);
    }

    return newOrderedLayerInfos;
  }

  // #endregion STATIC METHODS
}
