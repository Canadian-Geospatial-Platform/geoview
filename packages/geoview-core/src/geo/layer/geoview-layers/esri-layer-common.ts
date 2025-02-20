/* eslint-disable no-param-reassign */
// We have many reassign for layerPath-layerConfig. We keep it global..
import axios from 'axios';
import { Extent } from 'ol/extent';

import cloneDeep from 'lodash/cloneDeep';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { Cast, TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import { getXMLHttpRequest, getZoomFromScale } from '@/core/utils/utilities';
import { validateExtent, validateExtentWhenDefined } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { TimeDimensionESRI, DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import {
  CONST_LAYER_ENTRY_TYPES,
  TypeFeatureInfoEntryPartial,
  TypeLayerEntryConfig,
  TypeStyleGeometry,
  codedValueType,
  layerEntryIsGroupLayer,
  rangeDomainType,
} from '@/geo/map/map-schema-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  esriConvertEsriGeometryTypeToOLGeometryType,
  esriParseFeatureInfoEntries,
  esriQueryRecordsByUrl,
  esriQueryRelatedRecordsByUrl,
} from '@/geo/layer/gv-layers/utils';
import { EsriBaseRenderer, getStyleFromEsriRenderer } from '@/geo/utils/renderer/esri-renderer';
import { EsriDynamic, geoviewEntryIsEsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature, geoviewEntryIsEsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { TypeOutfields, TypeOutfieldsType } from '@/api/config/types/map-schema-types';

/** ***************************************************************************************************************************
 * This method reads the service metadata from the metadataAccessPath.
 *
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 *
 * @returns {Promise<void>} A promise that the execution is completed.
 */
export async function commonfetchServiceMetadata(layer: EsriDynamic | EsriFeature): Promise<void> {
  const metadataUrl = layer.metadataAccessPath;
  if (metadataUrl) {
    try {
      const metadataString = await getXMLHttpRequest(`${metadataUrl}?f=json`);
      if (metadataString === '{}') layer.setAllLayerStatusTo('error', layer.listOfLayerEntryConfig, 'Unable to read metadata');
      else {
        layer.metadata = JSON.parse(metadataString) as TypeJsonObject;
        if ('error' in layer.metadata) throw new Error(`Error code = ${layer.metadata.error.code}, ${layer.metadata.error.message}`);
        const copyrightText = layer.metadata.copyrightText as string;
        const attributions = layer.getAttributions();
        if (copyrightText && !attributions.includes(copyrightText)) {
          // Add it
          attributions.push(copyrightText);
          layer.setAttributions(attributions);
        }
      }
    } catch (error) {
      logger.logInfo('Unable to read metadata', error);
      layer.setAllLayerStatusTo('error', layer.listOfLayerEntryConfig, 'Unable to read metadata');
    }
  } else {
    layer.setAllLayerStatusTo('error', layer.listOfLayerEntryConfig, 'Unable to read metadata');
  }
}

/** ***************************************************************************************************************************
 * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
 * with a numeric layerId and creates a group entry when a layer is a group.
 *
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
 */
export function commonValidateListOfLayerEntryConfig(
  layer: EsriDynamic | EsriFeature,
  listOfLayerEntryConfig: TypeLayerEntryConfig[]
): void {
  listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig, i) => {
    if (layerConfig.layerStatus === 'error') return;
    const { layerPath } = layerConfig;

    if (layerEntryIsGroupLayer(layerConfig)) {
      // Use the layer name from the metadata if it exists and there is no existing name.
      if (!layerConfig.layerName)
        layerConfig.layerName = layer.metadata!.layers[layerConfig.layerId]?.name
          ? (layer.metadata!.layers[layerConfig.layerId].name as string)
          : '';

      layer.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);

      if (!(layerConfig as GroupLayerEntryConfig).listOfLayerEntryConfig.length) {
        layer.layerLoadError.push({
          layer: layerPath,
          loggerMessage: `Empty layer group (mapId:  ${layer.mapId}, layerPath: ${layerPath})`,
        });
        layerConfig.layerStatus = 'error';
      }

      return;
    }

    layerConfig.layerStatus = 'processing';

    let esriIndex = Number(layerConfig.layerId);
    if (Number.isNaN(esriIndex)) {
      layer.layerLoadError.push({
        layer: layerPath,
        loggerMessage: `ESRI layerId must be a number (mapId:  ${layer.mapId}, layerPath: ${layerPath})`,
      });
      layerConfig.layerStatus = 'error';
      return;
    }

    esriIndex = layer.metadata?.layers
      ? (layer.metadata.layers as TypeJsonArray).findIndex((layerInfo: TypeJsonObject) => layerInfo.id === esriIndex)
      : -1;

    if (esriIndex === -1) {
      layer.layerLoadError.push({
        layer: layerPath,
        loggerMessage: `ESRI layerId not found (mapId:  ${layer.mapId}, layerPath: ${layerPath})`,
      });
      layerConfig.layerStatus = 'error';
      return;
    }

    if (layer.metadata!.layers[esriIndex]?.subLayerIds?.length) {
      // We will create dynamically a group layer.
      const newListOfLayerEntryConfig: TypeLayerEntryConfig[] = [];
      const switchToGroupLayer = Cast<GroupLayerEntryConfig>(cloneDeep(layerConfig));
      switchToGroupLayer.entryType = CONST_LAYER_ENTRY_TYPES.GROUP;

      // Only switch the layer name by the metadata if there were none pre-set (config wins over metadata rule?)
      if (!switchToGroupLayer.layerName) switchToGroupLayer.layerName = layer.metadata!.layers[esriIndex].name as string;

      switchToGroupLayer.isMetadataLayerGroup = true;
      switchToGroupLayer.listOfLayerEntryConfig = newListOfLayerEntryConfig;

      const groupLayerConfig = new GroupLayerEntryConfig(switchToGroupLayer as GroupLayerEntryConfig);
      // Replace the old version of the layer with the new layer group
      listOfLayerEntryConfig[i] = groupLayerConfig;

      // TODO: Refactor: Do not do this on the fly here anymore with the new configs (quite unpredictable)...
      // Don't forget to replace the old version in the registered layers
      // TODO: TEST GROUP LAYER TEST Officially remove setLayerEntryConfigObsolete once passed testing
      MapEventProcessor.getMapViewerLayerAPI(layer.mapId).setLayerEntryConfigObsolete(groupLayerConfig);

      (layer.metadata!.layers[esriIndex].subLayerIds as TypeJsonArray).forEach((layerId) => {
        // Make sure to copy the layerConfig source before recycling it in the constructors. This was causing the 'source' value to leak between layer entry configs
        const layerConfigCopy = { ...layerConfig, source: { ...layerConfig.source } };

        let subLayerEntryConfig;
        if (geoviewEntryIsEsriDynamic(layerConfig)) {
          subLayerEntryConfig = new EsriDynamicLayerEntryConfig(layerConfigCopy as EsriDynamicLayerEntryConfig);
        } else {
          subLayerEntryConfig = new EsriFeatureLayerEntryConfig(layerConfigCopy as EsriFeatureLayerEntryConfig);
        }

        // TODO: Check - Instead of rewriting the attributes right after creating the instance, maybe create the instance
        // TO.DOCONT: with the correct values directly? Especially now that we copy the config to prevent leaking.
        subLayerEntryConfig.parentLayerConfig = groupLayerConfig;
        subLayerEntryConfig.layerId = `${layerId}`;
        subLayerEntryConfig.layerName = (layer.metadata!.layers as TypeJsonArray).filter((item) => item.id === layerId)[0].name as string;
        newListOfLayerEntryConfig.push(subLayerEntryConfig);

        // FIXME: Temporary patch to keep the behavior until those layer classes don't exist
        // TODO: Refactor: Do not do this on the fly here anymore with the new configs (quite unpredictable)... (standardizing this call with the other one above for now)
        // TODO: TEST GROUP LAYER TEST Officially remove setLayerEntryConfigObsolete once passed testing
        MapEventProcessor.getMapViewerLayerAPI(layer.mapId).setLayerEntryConfigObsolete(subLayerEntryConfig);
      });

      layer.validateListOfLayerEntryConfig(newListOfLayerEntryConfig);
      return;
    }

    if (layer.esriChildHasDetectedAnError(layerConfig, esriIndex)) {
      layerConfig.layerStatus = 'error';
      return;
    }

    if (!layerConfig.layerName) layerConfig.layerName = layer.metadata!.layers[esriIndex].name as string;
  });
}

/** ***************************************************************************************************************************
 * Extract the domain of the specified field from the metadata. If the type can not be found, return 'string'.
 *
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 * @param {string} fieldName field name for which we want to get the domain.
 * @param {AbstractBaseLayerEntryConfig} layerConfig layer configuration.
 *
 * @returns {TypeOutfieldsType} The type of the field.
 */
export function commonGetFieldType(
  layer: EsriDynamic | EsriFeature | EsriImage,
  fieldName: string,
  layerConfig: AbstractBaseLayerEntryConfig
): TypeOutfieldsType {
  const esriFieldDefinitions = layer.getLayerMetadata(layerConfig.layerPath).fields as TypeJsonArray;
  const fieldDefinition = esriFieldDefinitions.find((metadataEntry) => metadataEntry.name === fieldName);
  if (!fieldDefinition) return 'string';
  const esriFieldType = fieldDefinition.type as string;
  if (esriFieldType === 'esriFieldTypeDate') return 'date';
  if (esriFieldType === 'esriFieldTypeOID') return 'oid';
  if (
    ['esriFieldTypeDouble', 'esriFieldTypeInteger', 'esriFieldTypeSingle', 'esriFieldTypeSmallInteger', 'esriFieldTypeOID'].includes(
      esriFieldType
    )
  )
    return 'number';
  return 'string';
}

/** ***************************************************************************************************************************
 * Return the type of the specified field.
 *
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 * @param {string} fieldName field name for which we want to get the type.
 * @param {AbstractBaseLayerEntryConfig} layerConfig layer configuration.
 *
 * @returns {null | codedValueType | rangeDomainType} The domain of the field.
 */
export function commonGetFieldDomain(
  layer: EsriDynamic | EsriFeature | EsriImage,
  fieldName: string,
  layerConfig: AbstractBaseLayerEntryConfig
): null | codedValueType | rangeDomainType {
  const esriFieldDefinitions = layer.getLayerMetadata(layerConfig.layerPath).fields as TypeJsonArray;
  const fieldDefinition = esriFieldDefinitions.find((metadataEntry) => metadataEntry.name === fieldName);
  return fieldDefinition ? Cast<codedValueType | rangeDomainType>(fieldDefinition.domain) : null;
}

/** ***************************************************************************************************************************
 * This method will create a Geoview temporal dimension if it exist in the service metadata
 *
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
 * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig The layer entry to configure
 * @param {boolean} singleHandle True for ESRI Image
 */
// TODO: Issue #2139 - There is a bug with the temporal dimension returned by service URL:
// TO.DOCONT:  https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/Temporal_Test_Bed_fr/MapServer/0
export function commonProcessTemporalDimension(
  layer: EsriDynamic | EsriFeature | EsriImage,
  esriTimeDimension: TypeJsonObject,
  layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig,
  singleHandle?: boolean
): void {
  if (esriTimeDimension !== undefined && esriTimeDimension.timeExtent) {
    layer.setTemporalDimension(
      layerConfig.layerPath,
      DateMgt.createDimensionFromESRI(Cast<TimeDimensionESRI>(esriTimeDimension), singleHandle)
    );
  }
}

/** ***************************************************************************************************************************
 * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
 *
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 * @param {EsriFeatureLayerEntryConfig |
 *         EsriDynamicLayerEntryConfig |
 *         EsriImageLayerEntryConfig} layerConfig The layer entry to configure.
 */
export function commonProcessFeatureInfoConfig(
  layer: EsriDynamic | EsriFeature | EsriImage,
  layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig
): void {
  const { layerPath } = layerConfig;
  const layerMetadata = layer.getLayerMetadata(layerPath);
  const queryable = (layerMetadata.capabilities as string).includes('Query');
  if (layerConfig.source.featureInfo) {
    // if queryable flag is undefined, set it accordingly to what is specified in the metadata
    if (layerConfig.source.featureInfo.queryable === undefined && layerMetadata.fields?.length)
      layerConfig.source.featureInfo.queryable = queryable;
    // else the queryable flag comes from the user config.
    else if (layerConfig.source.featureInfo.queryable && layerMetadata.type !== 'Group Layer') {
      layerConfig.layerStatus = 'error';
      throw new Error(
        `The config whose layer path is ${layerPath} cannot set a layer as queryable because it does not have field definitions`
      );
    }
  } else
    layerConfig.source.featureInfo =
      layerConfig.isMetadataLayerGroup || !layerMetadata.fields?.length ? { queryable: false } : { queryable };
  MapEventProcessor.setMapLayerQueryable(layer.mapId, layerPath, layerConfig.source.featureInfo.queryable);

  // dynamic group layer doesn't have fields definition
  if (layerMetadata.type !== 'Group Layer' && layerMetadata.fields) {
    // Process undefined outfields or aliasFields
    if (!layerConfig.source.featureInfo.outfields?.length) {
      if (!layerConfig.source.featureInfo.outfields) layerConfig.source.featureInfo.outfields = [];

      (layerMetadata.fields as TypeJsonArray).forEach((fieldEntry) => {
        if (layerMetadata.geometryField && fieldEntry?.name === layerMetadata.geometryField.name) return;
        const newOutfield: TypeOutfields = {
          name: fieldEntry.name as string,
          alias: (fieldEntry.alias as string) || (fieldEntry.name as string),
          type: commonGetFieldType(layer, fieldEntry.name as string, layerConfig),
          domain: commonGetFieldDomain(layer, fieldEntry.name as string, layerConfig),
        };

        layerConfig.source.featureInfo!.outfields!.push(newOutfield);
      });
    }

    layerConfig.source.featureInfo!.outfields.forEach((outfield) => {
      if (!outfield.alias) outfield.alias = outfield.name;
    });

    if (!layerConfig.source.featureInfo.nameField)
      if (layerMetadata.displayField) layerConfig.source.featureInfo.nameField = layerMetadata.displayField as string;
      else {
        layerConfig.source.featureInfo.nameField = layerConfig.source.featureInfo.outfields[0].name;
      }
  }
}

/** ***************************************************************************************************************************
 * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
 *
 * @param {EsriDynamic | EsriFeature | EsriImage} layer The ESRI layer instance pointer.
 * @param {EsriFeatureLayerEntryConfig |
 *         EsriDynamicLayerEntryConfig |
 *         EsriImageLayerEntryConfig} layerConfig The layer entry to configure.
 */
export function commonProcessInitialSettings(
  layer: EsriDynamic | EsriFeature | EsriImage,
  layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig
): void {
  // layerConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
  const layerMetadata = layer.getLayerMetadata(layerConfig.layerPath);
  if (layerConfig.initialSettings?.states?.visible === undefined)
    layerConfig.initialSettings!.states = { visible: !!layerMetadata.defaultVisibility };
  // GV TODO: The solution implemented in the following two lines is not right. scale and zoom are not the same things.
  if (layerConfig.minScale === undefined && layerMetadata.minScale !== 0) layerConfig.minScale = layerMetadata.minScale as number;
  if (layerConfig.maxScale === undefined && layerMetadata.maxScale !== 0) layerConfig.maxScale = layerMetadata.maxScale as number;

  layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);

  if (!layerConfig.initialSettings?.bounds) {
    const layerExtent = [
      layerMetadata.extent.xmin,
      layerMetadata.extent.ymin,
      layerMetadata.extent.xmax,
      layerMetadata.extent.ymax,
    ] as Extent;

    // Transform to latlon extent
    if (layerExtent) {
      const latlonExtent = Projection.transformExtentFromObj(
        layerExtent,
        layerMetadata.extent.spatialReference,
        Projection.PROJECTION_NAMES.LNGLAT
      );
      layerConfig.initialSettings!.bounds = latlonExtent;
    }
  }

  // Set zoom limits for max / min zooms
  // GV Note: minScale is actually the maxZoom and maxScale is actually the minZoom
  // GV As the scale gets smaller, the zoom gets larger
  if (layerConfig.minScale) {
    const maxScaleZoomLevel = getZoomFromScale(layer.mapId, layerConfig.minScale);
    if (maxScaleZoomLevel && (!layerConfig.initialSettings.maxZoom || maxScaleZoomLevel > layerConfig.initialSettings.maxZoom)) {
      layerConfig.initialSettings.maxZoom = maxScaleZoomLevel;
    }
  }

  if (layerConfig.maxScale) {
    const minScaleZoomLevel = getZoomFromScale(layer.mapId, layerConfig.maxScale);
    if (minScaleZoomLevel && (!layerConfig.initialSettings.minZoom || minScaleZoomLevel < layerConfig.initialSettings.minZoom)) {
      layerConfig.initialSettings.minZoom = minScaleZoomLevel;
    }
  }

  layerConfig.initialSettings!.bounds = validateExtent(layerConfig.initialSettings!.bounds || [-180, -90, 180, 90]);
}

/** ***************************************************************************************************************************
 * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
 * initial settings, fields and aliases).
 *
 * @param {EsriDynamic | EsriFeature | EsriImage} layer The ESRI layer instance pointer.
 * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
 *
 * @returns {Promise<TypeLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
 */
export async function commonProcessLayerMetadata<
  T extends EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig,
>(layer: EsriDynamic | EsriFeature | EsriImage, layerConfig: T): Promise<T> {
  // User-defined groups do not have metadata provided by the service endpoint.
  if (layerEntryIsGroupLayer(layerConfig) && !layerConfig.isMetadataLayerGroup) return layerConfig;
  const { layerPath } = layerConfig;

  let queryUrl = layer.metadataAccessPath;
  if (queryUrl) {
    if (layerConfig.geoviewLayerConfig.geoviewLayerType !== CONST_LAYER_TYPES.ESRI_IMAGE)
      queryUrl = queryUrl.endsWith('/') ? `${queryUrl}${layerConfig.layerId}` : `${queryUrl}/${layerConfig.layerId}`;

    try {
      const { data } = await axios.get<TypeJsonObject>(`${queryUrl}?f=json`);
      if (data?.error) {
        layerConfig.layerStatus = 'error';
        throw new Error(`Error code = ${data.error.code}, ${data.error.message}`);
      }
      layer.setLayerMetadata(layerPath, data);
      // The following line allow the type ascention of the type guard functions on the second line below
      const EsriLayerConfig = layerConfig;
      if (geoviewEntryIsEsriDynamic(EsriLayerConfig) || geoviewEntryIsEsriFeature(EsriLayerConfig)) {
        if (!EsriLayerConfig.layerStyle) {
          const renderer = Cast<EsriBaseRenderer>(data.drawingInfo?.renderer);
          if (renderer) EsriLayerConfig.layerStyle = getStyleFromEsriRenderer(renderer);
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
}

/**
 * Transforms the query results of an Esri service response - when not querying on the Layers themselves (giving a 'reduced' FeatureInfoEntry).
 * The transformation reads the Esri formatted information and return a list of `TypeFeatureInfoEntryPartial` records.
 * In a similar fashion and response object as the "Query Feature Infos" functionalities done via the Layers.
 *
 * @param results TypeJsonObject The Json Object representing the data from Esri.
 *
 * @returns TypeFeatureInfoEntryPartial[] an array of relared records of type TypeFeatureInfoEntryPartial
 */
export function parseFeatureInfoEntries(records: TypeJsonObject[]): TypeFeatureInfoEntryPartial[] {
  // Redirect
  return esriParseFeatureInfoEntries(records);
}

/**
 * Asynchronously queries an Esri feature layer given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {string} url An Esri url indicating a feature layer to query
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export function queryRecordsByUrl(url: string): Promise<TypeFeatureInfoEntryPartial[]> {
  // Redirect
  return esriQueryRecordsByUrl(url);
}

/**
 * Asynchronously queries an Esri relationship table given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {url} string An Esri url indicating a relationship table to query
 * @param {recordGroupIndex} number The group index of the relationship layer on which to read the related records
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export function queryRelatedRecordsByUrl(url: string, recordGroupIndex: number): Promise<TypeFeatureInfoEntryPartial[]> {
  // Redirect
  return esriQueryRelatedRecordsByUrl(url, recordGroupIndex);
}

/**
 * Converts an esri geometry type string to a TypeStyleGeometry.
 * @param {string} esriGeometryType - The esri geometry type to convert
 * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
 */
export function convertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry {
  // Redirect
  return esriConvertEsriGeometryTypeToOLGeometryType(esriGeometryType);
}
