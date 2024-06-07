import axios from 'axios';

import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import { Cast, TypeJsonObject } from '@config/types/config-types';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeStyleGeometry } from '@config/types/map-schema-types';
import { layerEntryIsAbstractBaseLayerEntryConfig, layerEntryIsGroupLayer } from '@config/types/type-guards';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-layer-entry-config';

import { generateId } from '@/app';
import { getXMLHttpRequest } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

/** The ESRI dynamic geoview layer class. */
export abstract class EsriCommon extends AbstractGeoviewLayerConfig {
  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @param {EsriDynamicLayerConfig | EsriFeatureLayerConfig} geoviewLayerConfig The ESRI layer configuration.
   *
   * @returns {Promise<TypeJsonObject>} A promise that resolve when the JSON metadata are read..
   */
  protected async fetchEsriMetadata(): Promise<TypeJsonObject> {
    const propagateErrorToAllLayers = (listOfLayerEntryConfig: ConfigBaseClass[]): void => {
      listOfLayerEntryConfig.forEach((layerEntry) => {
        layerEntry.propagateError();
        if (layerEntryIsGroupLayer(layerEntry)) propagateErrorToAllLayers(layerEntry.listOfLayerEntryConfig);
      });
    };

    try {
      const metadataString = await getXMLHttpRequest(`${this.metadataAccessPath}?f=json`);
      if (metadataString !== '{}') {
        const jsonMetadata = JSON.parse(metadataString) as TypeJsonObject;
        if ('error' in jsonMetadata) logger.logError('Error detected while reading ESRI metadata.', jsonMetadata.error);
        else return jsonMetadata;
      }
    } catch (error) {
      logger.logError('Error detected in fetchEsriMetadata while reading service metadata.', error);
    }
    propagateErrorToAllLayers(this.listOfLayerEntryConfig);
    return {};
  }

  /**
   * Get the service metadata from the metadataAccessPath and store it in a protected property of the geoview layer.
   */
  override getServiceMetadata(): void {
    this.fetchEsriMetadata()
      .then((metadata) => {
        this.metadata = metadata;
        if (this.isValid) {
          this.metadataLayerTree = this.createLayerTree(this.metadata.layers as TypeJsonObject[]);
          logger.logInfo(this.metadataLayerTree);
          this.#fetchListOfLayerMetadata(this.metadataLayerTree)
            .then(() => {
              this.resolveLayer();
            })
            .catch((error) => {
              this.propagateError();
              this.rejectLayer(error);
            });
        }
        logger.logInfo(this.metadata);
      })
      .catch((error) => {
        this.propagateError();
        this.rejectLayer(error);
      });
  }

  protected createLayerTree(layers: TypeJsonObject[]): ConfigBaseClass[] {
    if (layers.length === 1) {
      const layerConfig = Cast<TypeJsonObject>({
        layerId: layers[0].id.toString(),
        layerName: { en: layers[0].name },
        geometryType: EsriCommon.convertEsriGeometryTypeToOLGeometryType(layers[0].geometryType as string),
      });
      return [this.createLeafNode(layerConfig, this.initialSettings, this.language, this)!];
    }

    let jsonConfig = this.#createGroupNode(layers, -1, this.metadata.mapName as string);
    if (jsonConfig?.listOfLayerEntryConfig?.length === 1) [jsonConfig] = jsonConfig.listOfLayerEntryConfig as TypeJsonObject[];
    return [new GroupLayerEntryConfig(jsonConfig, this.initialSettings, this.language, this)];
  }

  #createGroupNode = (layers: TypeJsonObject[], parentId: number, groupName: string): TypeJsonObject => {
    const listOfLayerEntryConfig = layers.reduce((accumulator, layer) => {
      if (layer.parentLayerId === parentId) {
        if (layer.type === 'Group Layer') accumulator.push(this.#createGroupNode(layers, layer.id as number, layer.name as string));
        else {
          accumulator.push(
            Cast<TypeJsonObject>({
              layerId: layer.id.toString(),
              layerName: { en: layer.name },
              geometryType: EsriCommon.convertEsriGeometryTypeToOLGeometryType(layer.geometryType as string),
            })
          );
        }
      }
      return accumulator;
    }, [] as TypeJsonObject[]);

    return Cast<TypeJsonObject>({
      layerId: generateId(),
      initialSettings: this.initialSettings,
      layerName: { en: groupName },
      isLayerGroup: true,
      listOfLayerEntryConfig,
    });
  };

  async #fetchListOfLayerMetadata(listOfLayerEntryConfig: ConfigBaseClass[]): Promise<void> {
    const listOfLayerMetadata: Promise<TypeJsonObject | void>[] = [];
    const listOfGroupFlag: boolean[] = [];
    listOfLayerEntryConfig.forEach((subLayerConfig) => {
      if (layerEntryIsGroupLayer(subLayerConfig)) {
        listOfGroupFlag.push(true);
        listOfLayerMetadata.push(this.#fetchListOfLayerMetadata(subLayerConfig.listOfLayerEntryConfig));
      } else if (layerEntryIsAbstractBaseLayerEntryConfig(subLayerConfig)) {
        listOfGroupFlag.push(false);
        listOfLayerMetadata.push(subLayerConfig.getLayerMetadata());
      }
    });

    const result = await Promise.allSettled(listOfLayerMetadata);
    logger.logInfo('listOfLayerMetadata', result);
  }

  /** ***************************************************************************************************************************
   * This method is used to process the metadata of the sub-layers. It will fill the empty properties of the configuration
   * (renderer, initial settings, fields and aliases).
   *
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The ESRI layer configuration.
   * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<TypeJsonObject>} A promise that resolve when the JSON metadata are read..
   */
  static async fetchEsriLayerMetadata(
    geoviewLayerConfig: AbstractGeoviewLayerConfig,
    subLayerConfig: AbstractBaseLayerEntryConfig
  ): Promise<TypeJsonObject> {
    const queryUrl = geoviewLayerConfig.metadataAccessPath.endsWith('/')
      ? `${geoviewLayerConfig.metadataAccessPath}${subLayerConfig.layerId}`
      : `${geoviewLayerConfig.metadataAccessPath}/${subLayerConfig.layerId}`;

    try {
      const { data } = await axios.get<TypeJsonObject>(`${queryUrl}?f=pjson`);
      if ('error' in data) logger.logError('Error detected while reading layer metadata.', data.error);
      else return data;
    } catch (error) {
      logger.logError('Error detected in fetchEsriLayerMetadata while reading ESRI metadata.', error);
    }
    subLayerConfig.propagateError();
    return {};

    /*
      try {
        const { data } = await axios.get<TypeJsonObject>(`${queryUrl}?f=pjson`);
        if (data?.error) {
          layerConfig.layerStatus = 'error';
          throw new Error(`Error code = ${data.error.code}, ${data.error.message}`);
        }
        layer.setLayerMetadata(layerPath, data);
        // The following line allow the type ascention of the type guard functions on the second line below
        const EsriLayerConfig = layerConfig;
        if (geoviewEntryIsEsriDynamic(EsriLayerConfig) || geoviewEntryIsEsriFeature(EsriLayerConfig)) {
          if (!EsriLayerConfig.style) {
            const renderer = Cast<EsriBaseRenderer>(data.drawingInfo?.renderer);
            if (renderer) EsriLayerConfig.style = getStyleFromEsriRenderer(renderer);
          }
          layer.processFeatureInfoConfig(
            layerConfig as EsriDynamicLayerEntryConfig & EsriFeatureLayerEntryConfig & EsriImageLayerEntryConfig
          );
          layer.processInitialSettings(layerConfig as EsriDynamicLayerEntryConfig & EsriFeatureLayerEntryConfig & EsriImageLayerEntryConfig);
        }
        commonProcessTemporalDimension(
          layer,
          data.timeInfo as TypeJsonObject,
          EsriLayerConfig as EsriDynamicLayerEntryConfig & EsriFeatureLayerEntryConfig & EsriImageLayerEntryConfig,
          layer.type === CONST_LAYER_TYPES.ESRI_IMAGE
        );
      } catch (error) {
        layerConfig.layerStatus = 'error';
        logger.logError('Error in commonProcessLayerMetadata', layerConfig, error);
      }
    }
    return layerConfig;
    */
  }

  /**
   * Converts an esri geometry type string to a TypeStyleGeometry.
   * @param {string} esriGeometryType - The esri geometry type to convert
   * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
   */
  protected static convertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry {
    switch (esriGeometryType) {
      case 'esriGeometryPoint':
      case 'esriGeometryMultipoint':
        return 'Point';

      case 'esriGeometryPolyline':
        return 'LineString';

      case 'esriGeometryPolygon':
      case 'esriGeometryMultiPolygon':
        return 'Polygon';

      default:
        throw new Error(`Unsupported geometry type: ${esriGeometryType}`);
    }
  }
}
