import type { Extent } from 'ol/extent';

import { Projection } from '@/geo/utils/projection';
import type { TimeDimensionESRI } from '@/core/utils/date-mgt';
import { DateMgt } from '@/core/utils/date-mgt';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type {
  TypeFeatureInfoEntryPartial,
  TypeStyleGeometry,
  codedValueType,
  rangeDomainType,
  TypeOutfields,
  TypeOutfieldsType,
  TypeFieldEntry,
} from '@/api/types/map-schema-types';
import type { TypeLayerMetadataEsri } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { Fetch } from '@/core/utils/fetch-helper';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { EsriRelatedRecordsJsonResponse, EsriRelatedRecordsJsonResponseRelatedRecord } from '@/geo/layer/gv-layers/utils';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { EsriRenderer } from '@/geo/utils/renderer/esri-renderer';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import type { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import {
  LayerEntryConfigLayerIdEsriMustBeNumberError,
  LayerNotFeatureLayerError,
  LayerNotSupportingDynamicLayersError,
  LayerServiceMetadataEmptyError,
  LayerServiceMetadataUnableToFetchError,
} from '@/core/exceptions/layer-exceptions';
import {
  LayerEntryConfigEmptyLayerGroupError,
  LayerEntryConfigLayerIdNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { formatError } from '@/core/exceptions/core-exceptions';
import { GeometryApi } from '@/geo/layer/geometry/geometry';

export class EsriUtilities {
  // #region LAYER PROCESSING METHODS

  /**
   * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
   * with a numeric layerId and creates a group entry when a layer is a group.
   * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   * @param {RegisterLayerEntryConfigDelegate} callbackWhenRegisteringConfig - Called when a config needs to be registered.
   * @static
   */
  static commonValidateListOfLayerEntryConfig(
    layer: EsriDynamic | EsriFeature,
    listOfLayerEntryConfig: ConfigBaseClass[],
    callbackWhenRegisteringConfig: RegisterLayerEntryConfigDelegate
  ): void {
    // TODO: REFACTOR - Send this function to ChatGPT for a complete rewrite..

    // For each layer entry config
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

        // Indirect recursion
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

        // Validate and update the extent initial settings
        layerConfig.initInitialSettingsExtentAndBoundsFromConfig();

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
          callbackWhenRegisteringConfig(groupLayerConfig);

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

            // TODO: Refactor: Do not do this on the fly here anymore with the new configs (quite unpredictable)...
            // Alert that we want to register new entry configs
            callbackWhenRegisteringConfig(subLayerEntryConfig);
          });

          // Indirect recursion
          layer.validateListOfLayerEntryConfig(groupLayerConfig.listOfLayerEntryConfig);
          return;
        }

        // Check for warnings if any needs to be logged
        this.#checkForWarningOnTheLayerMetadata(layer, layerConfig, esriIndex);

        // If no layer name
        if (!layerConfig.getLayerName()) layerConfig.setLayerName(metadata?.layers[esriIndex].name || 'No name / Sans nom');
      }
    });
  }

  /**
   * Checks the ESRI layer metadata and logs warnings when unsupported or unexpected conditions are detected.
   * This method does **not** throw errors; it only emits warnings to help developers diagnose configuration or
   * server-side metadata inconsistencies. It checks two cases:
   * 1. **EsriDynamic layers** — Logs a warning if the metadata explicitly indicates that dynamic layers
   *    are *not* supported (`supportsDynamicLayers === false`).
   * 2. **EsriFeature layers** — Logs a warning if the metadata for the child layer does not identify itself
   *    as a `"Feature Layer"`, which may suggest a misconfiguration or unexpected server response.
   * @param {EsriDynamic | EsriFeature} layer
   *   The ESRI layer instance being evaluated.
   * @param {AbstractBaseLayerEntryConfig} layerConfig
   *   The configuration object associated with the layer entry. Used to report contextual information
   *   (layer path, user-friendly name, etc.) in warnings.
   * @param {number} esriIndexForFeature
   *   For feature layers, the index pointing to the corresponding entry inside the server metadata's
   *   `layers[]` array. Ignored for dynamic layers.
   * @static
   */
  static #checkForWarningOnTheLayerMetadata(
    layer: EsriDynamic | EsriFeature,
    layerConfig: AbstractBaseLayerEntryConfig,
    esriIndexForFeature: number
  ): void {
    // If the layer is an EsriDynamic
    if (layer instanceof EsriDynamic) {
      if (layer.getMetadata()?.supportsDynamicLayers === false) {
        // Log a warning, but continue
        GeoViewError.logWarning(new LayerNotSupportingDynamicLayersError(layerConfig.layerPath, layerConfig.getLayerNameCascade()));
      }
    } else if (layer instanceof EsriFeature) {
      // If the metadata for the particular layer doesn't indicate 'Feature Layer' as the type
      // GV: Older ArcGIS servers do not have a 'type' attribute for layers in the layers list and it can only be retrieved from the layer's metadata endpoint
      // GV: This will incorrectly throw a warning in those cases, but at least it still loads with this setup
      if (layer.getMetadata()!.layers[esriIndexForFeature].type !== 'Feature Layer') {
        // Log warning
        GeoViewError.logWarning(new LayerNotFeatureLayerError(layerConfig.layerPath, layerConfig.getLayerNameCascade()));
      }
    }
  }

  /**
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   * @param {EsriDynamic | EsriFeature | EsriImage} layer The ESRI layer instance pointer.
   * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
   * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
   * @returns {Promise<TypeLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   * @static
   */
  static async commonProcessLayerMetadata<
    T extends EsriDynamic | EsriFeature | EsriImage,
    U extends EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig,
  >(layer: T, layerConfig: U, abortSignal?: AbortSignal): Promise<U> {
    // User-defined groups do not have metadata provided by the service endpoint.
    if (layerConfig.getEntryTypeIsGroup() && !layerConfig.getIsMetadataLayerGroup()) return layerConfig;

    // The url
    let queryUrl = layer.getMetadataAccessPath();

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
      // Create the style from the Esri Renderer
      const styleFromRenderer = EsriRenderer.createStylesFromEsriRenderer(responseJson.drawingInfo?.renderer);

      // Initialize the layer style by filling the blanks with the information from the metadata
      layerConfig.initLayerStyleFromMetadata(styleFromRenderer);
    }

    // Check if we support that projection and if not add it on-the-fly
    await Projection.addProjectionIfMissing(responseJson.spatialReference);

    this.#commonProcessFeatureInfoConfig(layerConfig);

    this.#commonProcessInitialSettings(layerConfig);

    this.#commonProcessTimeDimension(layerConfig, responseJson.timeInfo, layerConfig instanceof EsriImageLayerEntryConfig);

    return layerConfig;
  }

  /**
   * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
   * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - The layer entry to configure.
   * @private
   * @static
   */
  static #commonProcessFeatureInfoConfig(
    layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig
  ): void {
    // Get the layer metadata
    const layerMetadata = layerConfig.getLayerMetadata();

    // If no metadata, throw metadata empty error (maybe change to just return if this is too strict? Trying the more strict approach first..)
    if (!layerMetadata) throw new LayerServiceMetadataEmptyError(layerConfig.getGeoviewLayerId(), layerConfig.getLayerNameCascade());

    // Read variables
    const queryable = layerMetadata.capabilities.includes('Query');
    const hasFields = !!layerMetadata.fields?.length;
    const isGroupLayer = layerMetadata.type === 'Group Layer';
    const isMetadataGroup = layerConfig.getIsMetadataLayerGroup();

    // Initialize the queryable source
    layerConfig.initQueryableSource(queryable && hasFields && !isGroupLayer && !isMetadataGroup);

    // Initialize the outfields
    // dynamic group layer doesn't have fields definition
    if (layerMetadata.type !== 'Group Layer' && layerMetadata.fields) {
      // Get the outfields
      let outfields = layerConfig.getOutfields();

      // Process undefined outfields or aliasFields
      if (!outfields?.length) {
        // Create it
        outfields = [];

        // Loop
        layerMetadata.fields.forEach((fieldEntry) => {
          // If the field is the geometry field
          if (layerMetadata.geometryField && fieldEntry?.name === layerMetadata.geometryField?.name) {
            // Keep the geometry field for future use
            layerConfig.setGeometryField({
              name: fieldEntry.name,
              alias: fieldEntry.alias || fieldEntry.name,
              type: layerMetadata.geometryType as TypeOutfieldsType, // Force the typing, because the type doesn't include all geometry type values
            });

            // Skip that geometry field
            return;
          }

          // Compile it
          const newOutfield: TypeOutfields = {
            name: fieldEntry.name,
            alias: fieldEntry.alias || fieldEntry.name,
            type: this.esriGetFieldType(layerConfig, fieldEntry.name),
            domain: this.esriGetFieldDomain(layerConfig, fieldEntry.name),
          };

          outfields!.push(newOutfield);
        });

        // Set it
        layerConfig.setOutfields(outfields);
      }

      // Initialize the outfields aliases
      layerConfig.initOutfieldsAliases();

      // Initialize the name field
      layerConfig.initNameField(layerMetadata.displayField ?? outfields?.[0]?.name);
    }
  }

  /**
   * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
   * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - The layer entry to configure.
   * @static
   * @private
   */
  static #commonProcessInitialSettings(
    layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig
  ): void {
    // Get the layer metadata
    const layerMetadata = layerConfig.getLayerMetadata();

    // Validate and update the visible initial settings
    layerConfig.initInitialSettingsStatesVisibleFromMetadata(layerMetadata?.defaultVisibility);

    // Update Min / Max Scales with value if service doesn't allow the configured value for proper UI functionality
    layerConfig.initMinScaleFromMetadata(layerMetadata?.minScale);
    layerConfig.initMaxScaleFromMetadata(layerMetadata?.maxScale);

    // Set the max record count for querying
    if ('maxRecordCount' in layerConfig) {
      // eslint-disable-next-line no-param-reassign
      layerConfig.maxRecordCount = layerMetadata?.maxRecordCount || 0;
    }

    // If no bounds defined in the initial settings and an extent is defined in the metadata
    let bounds = layerConfig.getInitialSettingsBounds();
    if (!bounds && layerMetadata?.extent) {
      const layerExtent = [
        layerMetadata.extent.xmin,
        layerMetadata.extent.ymin,
        layerMetadata.extent.xmax,
        layerMetadata.extent.ymax,
      ] as Extent;

      // Transform to latlon extent
      bounds = Projection.transformExtentFromObj(layerExtent, layerMetadata.extent.spatialReference, Projection.getProjectionLonLat());

      // Validate and update the bounds initial settings
      layerConfig.initInitialSettingsBoundsFromMetadata(bounds);
    }
  }

  /**
   * This method will create a Geoview temporal dimension if it exist in the service metadata
   * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - The layer entry to configure
   * @param {TimeDimensionESRI} esriTimeDimension - The ESRI time dimension object
   * @param {boolean} singleHandle - True for ESRI Image
   * @static
   */
  // TODO: Issue #2139 - There is a bug with the temporal dimension returned by service URL:
  // TO.DOCONT:  https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/Temporal_Test_Bed_fr/MapServer/0
  static #commonProcessTimeDimension(
    layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig,
    esriTimeDimension: TimeDimensionESRI,
    singleHandle?: boolean
  ): void {
    if (esriTimeDimension !== undefined && esriTimeDimension.timeExtent) {
      layerConfig.setTimeDimension(DateMgt.createDimensionFromESRI(esriTimeDimension, singleHandle));
    }
  }

  // #endregion LAYER PROCESSING METHODS

  // #region QUERY METHODS

  /**
   * Asynchronously queries an Esri feature layer given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
   * @param {string} url - An Esri url indicating a feature layer to query
   * @param {TypeStyleGeometry?} geometryType - The geometry type for the geometries in the layer being queried (used when geometries are returned)
   * @param {boolean} parseFeatureInfoEntries - A boolean to indicate if we use the raw esri output or if we parse it, defaults to true.
   * @returns {Promise<TypeFeatureInfoEntryPartial[]>} A promise of an array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {ResponseTypeError} When the response from the service is not an object.
   * @throws {ResponseContentError} When the response actually contains an error within it.
   * @throws {NetworkError} When a network issue happened.
   * @static
   */
  static async queryRecordsByUrl(
    url: string,
    geometryType: TypeStyleGeometry | undefined,
    parseFeatureInfoEntries: boolean = true
  ): Promise<TypeFeatureInfoEntryPartial[]> {
    // Query the data
    const respJson = await Fetch.fetchEsriJson<EsriRelatedRecordsJsonResponse>(url);

    // Return the array of TypeFeatureInfoEntryPartial or the raw response features array
    return parseFeatureInfoEntries
      ? this.esriParseFeatureInfoEntries(respJson.features, geometryType)
      : ((respJson.features ?? []) as unknown as TypeFeatureInfoEntryPartial[]);
  }

  /**
   * Asynchronously queries an Esri relationship table given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
   * @param {string} url - An Esri url indicating a relationship table to query
   * @param {number} recordGroupIndex - The group index of the relationship layer on which to read the related records
   * @returns {Promise<TypeFeatureInfoEntryPartial[]>} A promise of an array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
   * @static
   * @deprecated Doesn't seem to be called anywhere.
   */
  static async queryRelatedRecordsByUrl(url: string, recordGroupIndex: number): Promise<TypeFeatureInfoEntryPartial[]> {
    // Query the data
    const respJson = await Fetch.fetchJson<EsriRelatedRecordsJsonResponse>(url);

    // If any related record groups found
    if (respJson.relatedRecordGroups.length > 0)
      // Return the array of TypeFeatureInfoEntryPartial
      return this.esriParseFeatureInfoEntries(respJson.relatedRecordGroups[recordGroupIndex].relatedRecords);
    return [];
  }

  /**
   * Asynchronously queries an Esri feature layer given the url and object ids and returns an array of `TypeFeatureInfoEntryPartial` records.
   * @param {string} layerUrl - An Esri url indicating a feature layer to query
   * @param {TypeStyleGeometry} geometryType - The geometry type for the geometries in the layer being queried (used when returnGeometry is true)
   * @param {number[]} objectIds - The list of objectids to filter the query on
   * @param {string} fields - The list of field names to include in the output
   * @param {boolean} geometry - True to return the geometries in the output
   * @param {number} outSR - The spatial reference of the output geometries from the query
   * @param {number} maxOffset - The max allowable offset value to simplify geometry
   * @param {boolean} parseFeatureInfoEntries - A boolean to indicate if we use the raw esri output or if we parse it
   * @returns {Promise<TypeFeatureInfoEntryPartial[]>} A promise of an array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
   * @static
   */
  static queryRecordsByUrlObjectIds(
    layerUrl: string,
    geometryType: TypeStyleGeometry | undefined,
    objectIds: number[],
    fields: string,
    geometry: boolean,
    outSR?: number,
    maxOffset?: number,
    parseFeatureInfoEntries: boolean = true
  ): Promise<TypeFeatureInfoEntryPartial[]> {
    // Offset
    const offset = maxOffset !== undefined ? `&maxAllowableOffset=${maxOffset}` : '';

    // Query
    const oids = objectIds.join(',');
    const url = `${layerUrl}/query?&objectIds=${oids}&outFields=${fields}&returnGeometry=${geometry}&outSR=${outSR}&geometryPrecision=1${offset}&f=json`;

    // Redirect
    return this.queryRecordsByUrl(url, geometryType, parseFeatureInfoEntries);
  }

  // #endregion QUERY METHODS

  // #region PARSING METHODS

  /**
   * Transforms the query results of an Esri service response - when not querying on the Layers themselves (giving a 'reduced' FeatureInfoEntry).
   * The transformation reads the Esri formatted information and return a list of `TypeFeatureInfoEntryPartial` records.
   * In a similar fashion and response object as the "Query Feature Infos" functionalities done via the Layers.
   * @param {EsriRelatedRecordsJsonResponseRelatedRecord[]} records The records representing the data from Esri.
   * @param {TypeStyleGeometry?} geometryType - Optional, the geometry type.
   * @returns TypeFeatureInfoEntryPartial[] An array of relared records of type TypeFeatureInfoEntryPartial
   * @static
   */
  static esriParseFeatureInfoEntries(
    records: EsriRelatedRecordsJsonResponseRelatedRecord[],
    geometryType?: TypeStyleGeometry
  ): TypeFeatureInfoEntryPartial[] {
    // Loop on the Esri results
    return records.map((rec) => {
      // The coordinates
      const coordinates = rec.geometry?.points || rec.geometry?.paths || rec.geometry?.rings || [rec.geometry?.x, rec.geometry?.y]; // MultiPoint or Line or Polygon or Point schema

      // Prep the TypeFeatureInfoEntryPartial
      const featInfo: TypeFeatureInfoEntryPartial = {
        fieldInfo: {},
        geometry: geometryType ? GeometryApi.createGeometryFromType(geometryType, coordinates) : undefined,
      };

      // Loop on the Esri attributes
      Object.entries(rec.attributes).forEach((tupleAttrValue) => {
        featInfo.fieldInfo[tupleAttrValue[0]] = { value: tupleAttrValue[1] } as TypeFieldEntry;
      });

      // Return the TypeFeatureInfoEntryPartial
      return featInfo;
    });
  }

  /**
   * Returns the type of the specified field.
   * @param {EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig The ESRI layer config
   * @param {string} fieldName field name for which we want to get the type.
   * @returns {TypeOutfieldsType} The type of the field.
   * @static
   */
  static esriGetFieldType(
    layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig,
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
   * Returns the domain of the specified field.
   * @param {EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig The ESRI layer config
   * @param {string} fieldName field name for which we want to get the domain.
   * @returns {codedValueType | rangeDomainType | null} The domain of the field.
   * @static
   */
  // TODO: ESRI domains are translated to GeoView domains in the configuration. Any GeoView layer that support geoview domains can
  // TO.DOCONT: call a method getFieldDomain that use config.source.featureInfo.outfields to find a field domain.
  static esriGetFieldDomain(
    layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig,
    fieldName: string
  ): codedValueType | rangeDomainType | null {
    const esriFieldDefinitions = layerConfig.getLayerMetadata()?.fields;
    const fieldDefinition = esriFieldDefinitions?.find((metadataEntry) => metadataEntry.name === fieldName);
    return fieldDefinition ? fieldDefinition.domain : null;
  }

  // #endregion PARSING METHODS
}

export type RegisterLayerEntryConfigDelegate = (
  config: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | GroupLayerEntryConfig
) => void;
