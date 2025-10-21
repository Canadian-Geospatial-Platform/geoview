import type { Extent } from 'ol/extent';

import { Projection } from '@/geo/utils/projection';
import type { TimeDimensionESRI } from '@/core/utils/date-mgt';
import { DateMgt } from '@/core/utils/date-mgt';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type {
  TypeFeatureInfoEntryPartial,
  TypeStyleGeometry,
  codedValueType,
  rangeDomainType,
  TypeOutfields,
  TypeOutfieldsType,
} from '@/api/types/map-schema-types';
import type { TypeLayerMetadataEsri } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { Fetch } from '@/core/utils/fetch-helper';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { EsriRelatedRecordsJsonResponseRelatedRecord } from '@/geo/layer/gv-layers/utils';
import {
  esriConvertEsriGeometryTypeToOLGeometryType,
  esriParseFeatureInfoEntries,
  esriQueryRecordsByUrl,
  esriQueryRelatedRecordsByUrl,
} from '@/geo/layer/gv-layers/utils';
import { getStyleFromEsriRenderer } from '@/geo/utils/renderer/esri-renderer';
import type { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import type { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import {
  LayerEntryConfigLayerIdEsriMustBeNumberError,
  LayerServiceMetadataEmptyError,
  LayerServiceMetadataUnableToFetchError,
} from '@/core/exceptions/layer-exceptions';
import {
  LayerEntryConfigEmptyLayerGroupError,
  LayerEntryConfigLayerIdNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { logger } from '@/core/utils/logger';
import { formatError } from '@/core/exceptions/core-exceptions';

/**
 * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
 * with a numeric layerId and creates a group entry when a layer is a group.
 *
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
 */
export function commonValidateListOfLayerEntryConfig(layer: EsriDynamic | EsriFeature, listOfLayerEntryConfig: ConfigBaseClass[]): void {
  listOfLayerEntryConfig.forEach((layerConfig, i) => {
    if (layerConfig.layerStatus === 'error') return;

    // If is a group layer
    if (layerConfig.getEntryTypeIsGroup()) {
      // Use the layer name from the metadata if it exists and there is no existing name.
      if (!layerConfig.getLayerName()) {
        layerConfig.setLayerName(
          layer.getMetadata()!.layers[Number(layerConfig.layerId)]?.name
            ? layer.getMetadata()!.layers[Number(layerConfig.layerId)].name
            : ''
        );
      }

      layer.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig);

      if (!layerConfig.listOfLayerEntryConfig.length) {
        // Add a layer load error
        layer.addLayerLoadError(new LayerEntryConfigEmptyLayerGroupError(layerConfig), layerConfig);
      }
      return;
    }

    // If a regular layer (not a group)
    if (layerConfig.getEntryTypeIsRegular()) {
      // Set the layer status to processing
      layerConfig.setLayerStatusProcessing();

      let esriIndex = Number(layerConfig.layerId);

      // Validate the layer id is a number (and a non-decimal one)
      if (!Number.isInteger(esriIndex)) {
        // Add a layer load error
        layer.addLayerLoadError(
          new LayerEntryConfigLayerIdEsriMustBeNumberError(
            layerConfig.getGeoviewLayerId(),
            layerConfig.layerId,
            layerConfig.getLayerName()
          ),
          layerConfig
        );
        return;
      }

      esriIndex = layer.getMetadata()?.layers ? layer.getMetadata()!.layers.findIndex((layerInfo) => layerInfo.id === esriIndex) : -1;

      if (esriIndex === -1) {
        // Add a layer load error
        layer.addLayerLoadError(new LayerEntryConfigLayerIdNotFoundError(layerConfig), layerConfig);
        return;
      }

      // Get the metadata
      const metadata = layer.getMetadata();

      if (metadata?.layers[esriIndex]?.subLayerIds?.length) {
        // Create the group layer entry config instance reusing the props
        const groupLayerConfigProps = layerConfig.toGroupLayerConfigProps(layerConfig.getLayerName() || metadata.layers[esriIndex].name);
        const groupLayerConfig = new GroupLayerEntryConfig(groupLayerConfigProps);

        // Replace the old version of the layer with the new layer group
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = groupLayerConfig;

        // TODO: Refactor: Do not do this on the fly here anymore with the new configs (quite unpredictable)...
        // Alert that we want to register new entry configs
        layer.emitLayerEntryRegisterInit({ config: groupLayerConfig });

        metadata.layers[esriIndex].subLayerIds.forEach((layerId) => {
          // Clone the layer props and tweak them
          const subLayerProps = {
            ...layerConfig.cloneLayerProps(),
            layerId: `${layerId}`,
            layerName: metadata.layers.filter((item) => item.id === layerId)[0].name,
            parentLayerConfig: groupLayerConfig,
          };

          let subLayerEntryConfig;
          if (layerConfig instanceof EsriDynamicLayerEntryConfig) {
            subLayerEntryConfig = new EsriDynamicLayerEntryConfig(subLayerProps);
          } else {
            subLayerEntryConfig = new EsriFeatureLayerEntryConfig(subLayerProps);
          }

          // Append the sub layer entry to the list
          groupLayerConfig.listOfLayerEntryConfig.push(subLayerEntryConfig);

          // TODO: Refactor: Do not do this on the fly here anymore with the new configs (quite unpredictable)... (standardizing this call with the other one above for now)
          // Alert that we want to register new entry configs
          layer.emitLayerEntryRegisterInit({ config: subLayerEntryConfig });
        });

        layer.validateListOfLayerEntryConfig(groupLayerConfig.listOfLayerEntryConfig);
        return;
      }

      if (layer.esriChildHasDetectedAnError(layerConfig, esriIndex)) {
        // Set the layer status to error
        layerConfig.setLayerStatusError();
        return;
      }

      // If no layer name
      if (!layerConfig.getLayerName()) layerConfig.setLayerName(metadata?.layers[esriIndex].name || 'No name / Sans nom');
    }
  });
}

/**
 * Extract the domain of the specified field from the metadata. If the type can not be found, return 'string'.
 * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - Layer configuration.
 * @param {string} fieldName - Field name for which we want to get the domain.
 * @returns {TypeOutfieldsType} The type of the field.
 */
export function commonGetFieldType(
  layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig,
  fieldName: string
): TypeOutfieldsType {
  const esriFieldDefinitions = layerConfig.getLayerMetadata()?.fields;
  const fieldDefinition = esriFieldDefinitions?.find((metadataEntry) => metadataEntry.name === fieldName);
  if (!fieldDefinition) return 'string';
  const esriFieldType = fieldDefinition.type;
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

/**
 * Return the type of the specified field.
 * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig layer configuration.
 * @param {string} fieldName field name for which we want to get the type.
 * @returns {null | codedValueType | rangeDomainType} The domain of the field.
 */
export function commonGetFieldDomain(
  layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig,
  fieldName: string
): null | codedValueType | rangeDomainType {
  const esriFieldDefinitions = layerConfig.getLayerMetadata()?.fields;
  const fieldDefinition = esriFieldDefinitions?.find((metadataEntry) => metadataEntry.name === fieldName);
  return fieldDefinition ? fieldDefinition.domain : null;
}

/**
 * This method will create a Geoview temporal dimension if it exist in the service metadata
 * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - The layer entry to configure
 * @param {TimeDimensionESRI} esriTimeDimension - The ESRI time dimension object
 * @param {boolean} singleHandle - True for ESRI Image
 */
// TODO: Issue #2139 - There is a bug with the temporal dimension returned by service URL:
// TO.DOCONT:  https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/Temporal_Test_Bed_fr/MapServer/0
export function commonProcessTimeDimension(
  layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig,
  esriTimeDimension: TimeDimensionESRI,
  singleHandle?: boolean
): void {
  if (esriTimeDimension !== undefined && esriTimeDimension.timeExtent) {
    layerConfig.setTimeDimension(DateMgt.createDimensionFromESRI(esriTimeDimension, singleHandle));
  }
}

/**
 * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
 * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - The layer entry to configure.
 */
export function commonProcessFeatureInfoConfig(
  layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig
): void {
  // Get the layer metadata
  const layerMetadata = layerConfig.getLayerMetadata();

  // If no metadata, throw metadata empty error (maybe change to just return if this is too strict? Trying the more strict approach first..)
  if (!layerMetadata) throw new LayerServiceMetadataEmptyError(layerConfig.getGeoviewLayerId(), layerConfig.getLayerNameCascade());

  const queryable = layerMetadata.capabilities.includes('Query');
  if (layerConfig.source.featureInfo) {
    // if queryable flag is undefined, set it accordingly to what is specified in the metadata
    if (layerConfig.source.featureInfo.queryable === undefined && layerMetadata.fields?.length) {
      // eslint-disable-next-line no-param-reassign
      layerConfig.source.featureInfo.queryable = queryable;
    }
    // Set queryable to false if there are no fields defined in the service
    else if (layerConfig.source.featureInfo.queryable && layerMetadata.type !== 'Group Layer' && !layerMetadata.fields.length) {
      // eslint-disable-next-line no-param-reassign
      layerConfig.source.featureInfo.queryable = false;
      logger.logWarning(`Layer ${layerConfig.layerPath} has no fields defined in the service metadata. Queryable set to false.`);
    }
    // The queryable flag comes from the user config
  } else {
    // eslint-disable-next-line no-param-reassign
    layerConfig.source.featureInfo =
      layerConfig.getIsMetadataLayerGroup() || !layerMetadata.fields?.length ? { queryable: false } : { queryable };
  }

  // dynamic group layer doesn't have fields definition
  if (layerMetadata.type !== 'Group Layer' && layerMetadata.fields) {
    // Process undefined outfields or aliasFields
    if (!layerConfig.source.featureInfo.outfields?.length) {
      // eslint-disable-next-line no-param-reassign
      if (!layerConfig.source.featureInfo.outfields) layerConfig.source.featureInfo.outfields = [];

      layerMetadata.fields.forEach((fieldEntry) => {
        if (layerMetadata.geometryField && fieldEntry?.name === layerMetadata.geometryField.name) return;
        const newOutfield: TypeOutfields = {
          name: fieldEntry.name,
          alias: fieldEntry.alias || fieldEntry.name,
          type: commonGetFieldType(layerConfig, fieldEntry.name),
          domain: commonGetFieldDomain(layerConfig, fieldEntry.name),
        };

        layerConfig.source.featureInfo!.outfields!.push(newOutfield);
      });
    }

    layerConfig.source.featureInfo.outfields.forEach((outfield) => {
      // eslint-disable-next-line no-param-reassign
      if (!outfield.alias) outfield.alias = outfield.name;
    });

    if (!layerConfig.source.featureInfo.nameField)
      if (layerMetadata.displayField) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.source.featureInfo.nameField = layerMetadata.displayField;
      } else {
        // eslint-disable-next-line no-param-reassign
        layerConfig.source.featureInfo.nameField = layerConfig.source.featureInfo.outfields[0]?.name;
      }
  }
}

/**
 * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
 * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - The layer entry to configure.
 */
export function commonProcessInitialSettings(
  layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig
): void {
  // Get the layer metadata
  const layerMetadata = layerConfig.getLayerMetadata();

  // If no visibility by default has been configured and there's a defaultVisibility found in the layer metadata, apply the latter
  if (layerConfig.getInitialSettings()?.states?.visible === undefined && layerMetadata?.defaultVisibility) {
    // Update the states initial settings
    layerConfig.updateInitialSettingsStateVisible(!!layerMetadata.defaultVisibility);
  }

  // Update Max / Min Scales with value if service doesn't allow the configured value for proper UI functionality
  if (layerMetadata?.minScale) {
    layerConfig.setMinScale(Math.min(layerConfig.getMinScale() ?? Infinity, layerMetadata.minScale));
  }

  if (layerMetadata?.maxScale) {
    layerConfig.setMaxScale(Math.max(layerConfig.getMaxScale() ?? -Infinity, layerMetadata.maxScale));
  }

  // Set the max record count for querying
  if ('maxRecordCount' in layerConfig) {
    // eslint-disable-next-line no-param-reassign
    layerConfig.maxRecordCount = layerMetadata?.maxRecordCount || 0;
  }

  // Validate and update the extent initial settings
  layerConfig.validateUpdateInitialSettingsExtent();

  // If no bounds defined in the initial settings and an extent is defined in the metadata
  if (!layerConfig.getInitialSettings()?.bounds && layerMetadata?.extent) {
    const layerExtent = [
      layerMetadata.extent.xmin,
      layerMetadata.extent.ymin,
      layerMetadata.extent.xmax,
      layerMetadata.extent.ymax,
    ] as Extent;

    // Transform to latlon extent
    if (layerExtent) {
      const lonlatExtent = Projection.transformExtentFromObj(
        layerExtent,
        layerMetadata.extent.spatialReference,
        Projection.getProjectionLonLat()
      );

      // Update the bounds initial settings
      layerConfig.updateInitialSettings({ bounds: lonlatExtent });
    }
  }

  // Validate and update the bounds initial settings
  layerConfig.validateUpdateInitialSettingsBounds();
}

/**
 * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
 * initial settings, fields and aliases).
 * @param {EsriDynamic | EsriFeature | EsriImage} layer The ESRI layer instance pointer.
 * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
 * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
 * @returns {Promise<TypeLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
 * @throws {LayerServiceMetadataUnableToFetchError} If the metadata fetch fails or contains an error.
 */
export async function commonProcessLayerMetadata<
  T extends EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig,
>(layer: EsriDynamic | EsriFeature | EsriImage, layerConfig: T, abortSignal?: AbortSignal): Promise<T> {
  // User-defined groups do not have metadata provided by the service endpoint.
  if (layerConfig.getEntryTypeIsGroup() && !layerConfig.getIsMetadataLayerGroup()) return layerConfig;

  // The url
  let queryUrl = layer.metadataAccessPath;

  if (layerConfig.getSchemaTag() !== CONST_LAYER_TYPES.ESRI_IMAGE)
    queryUrl = queryUrl.endsWith('/') ? `${queryUrl}${layerConfig.layerId}` : `${queryUrl}/${layerConfig.layerId}`;

  let responseJson;
  try {
    // Fetch the layer metadata
    responseJson = await Fetch.fetchJson<TypeLayerMetadataEsri>(`${queryUrl}?f=json`, { signal: abortSignal });
  } catch (error: unknown) {
    // Rethrow
    throw new LayerServiceMetadataUnableToFetchError(layerConfig.getGeoviewLayerId(), layerConfig.getLayerName(), formatError(error));
  }

  // Validate the metadata response
  AbstractGeoViewRaster.throwIfMetatadaHasError(layerConfig.getGeoviewLayerId(), layerConfig.getLayerName(), responseJson);

  // Set the layer metadata
  layerConfig.setLayerMetadata(responseJson);

  // The following line allow the type ascention of the type guard functions on the second line below
  if (layerConfig instanceof EsriDynamicLayerEntryConfig || layerConfig instanceof EsriFeatureLayerEntryConfig) {
    if (!layerConfig.getLayerStyle()) {
      const styleFromRenderer = getStyleFromEsriRenderer(responseJson.drawingInfo?.renderer);
      if (styleFromRenderer) layerConfig.setLayerStyle(styleFromRenderer);
    }
  }

  // Add projection definition if not already included
  if (responseJson.spatialReference) {
    try {
      Projection.getProjectionFromObj(responseJson.spatialReference);
    } catch (error: unknown) {
      logger.logWarning('Unsupported projection, attempting to add projection now.', error);
      await Projection.addProjection(responseJson.spatialReference);
    }
  }

  commonProcessFeatureInfoConfig(layerConfig);

  commonProcessInitialSettings(layerConfig);

  commonProcessTimeDimension(layerConfig, responseJson.timeInfo, layerConfig instanceof EsriImageLayerEntryConfig);

  return layerConfig;
}

/**
 * Transforms the query results of an Esri service response - when not querying on the Layers themselves (giving a 'reduced' FeatureInfoEntry).
 * The transformation reads the Esri formatted information and return a list of `TypeFeatureInfoEntryPartial` records.
 * In a similar fashion and response object as the "Query Feature Infos" functionalities done via the Layers.
 * @param {EsriRelatedRecordsJsonResponseRelatedRecord[]} records - The Json Object representing the data from Esri.
 * @returns TypeFeatureInfoEntryPartial[] an array of relared records of type TypeFeatureInfoEntryPartial
 */
export function parseFeatureInfoEntries(records: EsriRelatedRecordsJsonResponseRelatedRecord[]): TypeFeatureInfoEntryPartial[] {
  // Redirect
  return esriParseFeatureInfoEntries(records);
}

/**
 * Asynchronously queries an Esri feature layer given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {string} url - An Esri url indicating a feature layer to query
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export function queryRecordsByUrl(url: string): Promise<TypeFeatureInfoEntryPartial[]> {
  // Redirect
  return esriQueryRecordsByUrl(url);
}

/**
 * Asynchronously queries an Esri relationship table given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {string} url - An Esri url indicating a relationship table to query
 * @param {number} recordGroupIndex - The group index of the relationship layer on which to read the related records
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
