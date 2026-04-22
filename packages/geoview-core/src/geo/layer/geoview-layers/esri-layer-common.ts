import type { Extent } from 'ol/extent';

import { Projection } from '@/geo/utils/projection';
import type { TimeDimensionESRI } from '@/core/utils/date-mgt';
import { DateMgt } from '@/core/utils/date-mgt';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type {
  TypeFeatureInfoEntryPartial,
  TypeStyleGeometry,
  codedValueType,
  rangeDomainType,
  TypeOutfields,
  TypeOutfieldsType,
  TypeFieldEntry,
  DisplayDateMode,
} from '@/api/types/map-schema-types';
import type {
  TypeMetadataEsriDynamic,
  TypeMetadataEsriDynamicLayer,
  TypeMetadataEsriFeature,
  TypeMetadataEsriFeatureLayer,
  TypeMetadataEsriLayerSummary,
  TypeMetadataEsriImage,
  TypeMosaicRule,
  TypeLayerMetadataFields,
} from '@/api/types/layer-schema-types';
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
   * This method validates recursively the configuration of the layer entries to ensure that
   * it is a feature layer identified with a numeric layerId and creates a group entry
   * when a layer is a group.
   *
   * @param layer - The ESRI layer instance pointer.
   * @param listOfLayerEntryConfig - The list of layer entries configuration to validate.
   * @param callbackWhenRegisteringConfig - Called when a config needs to be registered.
   * @remarks
   * - This method performs **indirect recursion** by eventually delegating child validation to
   *   {@link validateListOfLayerEntryConfig} in a sub function called here.
   */
  static commonValidateListOfLayerEntryConfig(
    layer: EsriDynamic | EsriFeature,
    listOfLayerEntryConfig: ConfigBaseClass[],
    callbackWhenRegisteringConfig: RegisterLayerEntryConfigDelegate
  ): void {
    // Get the metadata
    const metadata = layer.getMetadata();

    // Return if no metadata. There should always be some here, because the check happened already in validateListOfLayerEntryConfig.
    if (!metadata) return;

    // Loop on the layer entry configs
    listOfLayerEntryConfig.forEach((layerConfig, index) => {
      // Skip configs already marked as error
      if (layerConfig.layerStatus === 'error') return;

      // Handle group layer validation
      if (layerConfig instanceof GroupLayerEntryConfig) {
        this.#validateGroupLayer(layer, layerConfig, metadata);
        return;
      }

      // Handle regular layer validation
      if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
        this.#validateRegularLayer(layer, layerConfig, index, listOfLayerEntryConfig, metadata, callbackWhenRegisteringConfig);
      }
    });
  }

  /**
   * Validates a group layer entry configuration and recursively validates its children.
   *
   * This method performs three main tasks:
   * 1. Initializes the group layer name using metadata when the name is missing.
   * 2. Recursively validates all child layer entry configurations.
   * 3. Ensures the group contains at least one valid child layer; otherwise an error is registered.
   *
   * @param layer - The parent GeoView layer instance responsible for validating layer
   * entry configurations and registering potential load errors.
   * @param layerConfig - The group layer entry configuration being validated.
   * @param metadata - The ESRI service metadata associated with the layer. This metadata
   * may be used to resolve missing layer names. If undefined, no metadata-based initialization
   * will occur.
   * @remarks
   * - This method performs **indirect recursion** by delegating child validation to
   *   {@link validateListOfLayerEntryConfig}.
   * - If the group ends up with no valid child layers after validation, a
   *   {@link LayerEntryConfigEmptyLayerGroupError} is attached on the layer.
   */
  static #validateGroupLayer(
    layer: EsriDynamic | EsriFeature,
    layerConfig: GroupLayerEntryConfig,
    metadata: TypeMetadataEsriDynamic | TypeMetadataEsriFeature
  ): void {
    // Initialize the layer name by filling the blanks with the name from the metadata
    layerConfig.initLayerNameFromMetadata(metadata.layers?.[Number(layerConfig.layerId)]?.name);

    // Recursively validate children
    layer.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig);

    // Error if group ended up empty
    if (!layerConfig.listOfLayerEntryConfig.length) {
      layer.addLayerLoadError(new LayerEntryConfigEmptyLayerGroupError(layerConfig), layerConfig);
    }
  }

  /**
   * Validates a regular (non-group) layer entry configuration against the service metadata.
   *
   * This method performs the validation workflow for a single layer entry:
   * 1. Marks the layer entry configuration as processing.
   * 2. Initializes extent and bounds settings defined in the configuration.
   * 3. Validates that the configured `layerId` is a valid integer.
   * 4. Resolves the corresponding layer in the ESRI service metadata.
   * 5. Expands the configuration into a group layer if the metadata indicates the
   *    presence of sublayers.
   * 6. Finalizes validation using metadata (warnings, default name assignment, etc.).
   * If validation fails (e.g., invalid `layerId` or layer not found in metadata),
   * a corresponding layer load error is registered on the parent layer.
   *
   * @param layer - The GeoView layer instance responsible for validating
   * configurations and registering potential layer load errors.
   * @param layerConfig - The layer entry configuration to
   * validate. This represents a regular layer (not a group layer).
   * @param index - The index of the layer entry configuration within
   * `listOfLayerEntryConfig`. This is used when the configuration must be
   * replaced (e.g., when expanding a regular layer into a group layer due to
   * sublayers in the metadata).
   * @param listOfLayerEntryConfig - The list containing the layer entry configuration
   * being validated. This list may be modified if the current configuration is expanded
   * into a group layer.
   * @param metadata - The ESRI service metadata used to validate the layer identifier
   * and inspect properties such as sublayers.
   * @param callbackWhenRegisteringConfig - Callback invoked whenever new layer entry
   * configurations are dynamically created and need to be registered.
   * @remarks
   * - If the metadata indicates that the layer contains `subLayerIds`, the layer
   *   configuration is expanded into a group layer via {@link #expandSubLayers}.
   * - When no sublayers exist, the validation is finalized through
   *   {@link #finalizeRegularLayer}.
   * - Errors encountered during validation are reported using `layer.addLayerLoadError`.
   */
  static #validateRegularLayer(
    layer: EsriDynamic | EsriFeature,
    layerConfig: AbstractBaseLayerEntryConfig,
    index: number,
    listOfLayerEntryConfig: ConfigBaseClass[],
    metadata: TypeMetadataEsriDynamic | TypeMetadataEsriFeature,
    callbackWhenRegisteringConfig: RegisterLayerEntryConfigDelegate
  ): void {
    // Mark layer as processing
    layerConfig.setLayerStatusProcessing();

    // Initialize extent settings
    layerConfig.initInitialSettingsExtentAndBoundsFromConfig();

    let esriIndex = Number(layerConfig.layerId);

    // Validate id is integer
    if (!Number.isInteger(esriIndex)) {
      layer.addLayerLoadError(
        new LayerEntryConfigLayerIdEsriMustBeNumberError(layerConfig.getGeoviewLayerId(), layerConfig.layerId, layerConfig.getLayerName()),
        layerConfig
      );
      return;
    }

    // Find layer in metadata
    esriIndex = metadata.layers ? metadata.layers.findIndex((l) => l.id === esriIndex) : -1;

    if (esriIndex === -1) {
      layer.addLayerLoadError(new LayerEntryConfigLayerIdNotFoundError(layerConfig), layerConfig);
      return;
    }

    // Get the metadata of the layer
    const metadataLayer = metadata.layers[esriIndex];

    // Expand sublayers if necessary
    if (metadataLayer?.subLayerIds?.length) {
      this.#expandSubLayers(layer, layerConfig, index, listOfLayerEntryConfig, metadata, metadataLayer, callbackWhenRegisteringConfig);
      return;
    }

    // Check metadata warnings
    this.#checkForWarningOnTheLayerMetadata(layer, layerConfig, metadata, metadataLayer);

    // Initialize the layer name by filling the blanks with the name from the metadata
    layerConfig.initLayerNameFromMetadata(metadataLayer?.name);
  }

  /**
   * Expands a regular layer entry configuration into a group layer configuration
   * when the corresponding metadata layer contains sublayers.
   *
   * This method transforms the provided `layerConfig` into a {@link GroupLayerEntryConfig}
   * and dynamically generates child layer entry configurations for each sublayer defined
   * in the ESRI service metadata. The original layer entry configuration in the
   * `listOfLayerEntryConfig` array is replaced with the newly created group configuration.
   * The expansion process performs the following steps:
   * 1. Creates a new {@link GroupLayerEntryConfig} using properties derived from the
   *    original layer configuration.
   * 2. Replaces the original configuration in the list with the new group configuration.
   * 3. Registers the new group configuration through the provided callback.
   * 4. Iterates through each `subLayerId` from the metadata and creates a corresponding
   *    layer entry configuration (either {@link EsriDynamicLayerEntryConfig} or
   *    {@link EsriFeatureLayerEntryConfig} depending on the original type).
   * 5. Adds each generated configuration to the group's `listOfLayerEntryConfig` and
   *    registers it through the callback.
   * 6. Recursively validates the newly generated sublayer configurations.
   *
   * @param layer - The parent GeoView layer instance responsible
   * for validating the newly created sublayer configurations and registering potential errors.
   * @param layerConfig - The original layer entry configuration that will
   * be expanded into a group layer due to the presence of sublayers in the metadata.
   * @param index - The index of the original configuration within `listOfLayerEntryConfig`.
   * This index is used to replace the original configuration with the newly created group configuration.
   * @param listOfLayerEntryConfig - The list containing the layer entry configuration being expanded.
   * This array is modified in-place to replace the original configuration with the generated group layer.
   * @param metadata - The full ESRI service metadata used to resolve sublayer names and other properties.
   * @param metadataLayer - The metadata layer corresponding to the configuration being
   * expanded. This metadata provides the list of `subLayerIds` used to generate child configurations.
   * @param callbackWhenRegisteringConfig - Callback invoked
   * whenever a new layer entry configuration is created and needs to be registered by the calling system.
   * @remarks
   * - The type of generated sublayer configuration is determined by the type of the
   *   original `layerConfig`.
   * - This method performs **indirect recursion** by invoking
   *   {@link validateListOfLayerEntryConfig} on the generated sublayer configurations.
   * - The original layer entry configuration is **replaced** by a group configuration
   *   within the parent list.
   */
  static #expandSubLayers(
    layer: EsriDynamic | EsriFeature,
    layerConfig: ConfigBaseClass,
    index: number,
    listOfLayerEntryConfig: ConfigBaseClass[],
    metadata: TypeMetadataEsriDynamic | TypeMetadataEsriFeature,
    metadataLayer: TypeMetadataEsriLayerSummary,
    callbackWhenRegisteringConfig: RegisterLayerEntryConfigDelegate
  ): void {
    // Create group config
    const groupProps = layerConfig.toGroupLayerConfigProps(layerConfig.getLayerName() || metadataLayer.name);

    const groupLayerConfig = new GroupLayerEntryConfig(groupProps);

    // Replace the original config with the group
    // eslint-disable-next-line no-param-reassign
    listOfLayerEntryConfig[index] = groupLayerConfig;

    callbackWhenRegisteringConfig(groupLayerConfig);

    // Create configs for each sublayer
    metadataLayer.subLayerIds?.forEach((layerId: number) => {
      const subMeta = metadata.layers.find((item) => item.id === layerId);

      const subLayerProps = {
        ...layerConfig.cloneLayerProps(),
        layerId: `${layerId}`,
        layerName: subMeta?.name,
        parentLayerConfig: groupLayerConfig,
      };

      const subLayerEntryConfig =
        layerConfig instanceof EsriDynamicLayerEntryConfig
          ? new EsriDynamicLayerEntryConfig(subLayerProps)
          : new EsriFeatureLayerEntryConfig(subLayerProps);

      groupLayerConfig.listOfLayerEntryConfig.push(subLayerEntryConfig);

      callbackWhenRegisteringConfig(subLayerEntryConfig);
    });

    // Recursively validate generated layers
    layer.validateListOfLayerEntryConfig(groupLayerConfig.listOfLayerEntryConfig);
  }

  /**
   * Checks the ESRI layer metadata and logs warnings when unsupported or unexpected conditions are detected.
   *
   * This method does **not** throw errors; it only emits warnings to help developers diagnose configuration or
   * server-side metadata inconsistencies. It checks two cases:
   * 1. **EsriDynamic layers** — Logs a warning if the metadata explicitly indicates that dynamic layers
   *    are *not* supported (`supportsDynamicLayers === false`).
   * 2. **EsriFeature layers** — Logs a warning if the metadata for the child layer does not identify itself
   *    as a `"Feature Layer"`, which may suggest a misconfiguration or unexpected server response.
   *
   * @param layer - The ESRI layer instance being evaluated.
   * @param layerConfig - The configuration object associated with the layer entry. Used to
   * report contextual information (layer path, user-friendly name, etc.) in warnings.
   * @param metadata - The full ESRI service metadata used to resolve sublayer names and other properties.
   * @param metadataLayer - The metadata layer corresponding to the configuration being
   * expanded. This metadata provides the list of `subLayerIds` used to generate child configurations.
   */
  static #checkForWarningOnTheLayerMetadata(
    layer: EsriDynamic | EsriFeature,
    layerConfig: AbstractBaseLayerEntryConfig,
    metadata: TypeMetadataEsriDynamic | TypeMetadataEsriFeature,
    metadataLayer: TypeMetadataEsriLayerSummary
  ): void {
    // If the layer is an EsriDynamic
    if (layer instanceof EsriDynamic) {
      if ((metadata as TypeMetadataEsriDynamic)?.supportsDynamicLayers === false) {
        // Log a warning, but continue
        GeoViewError.logWarning(new LayerNotSupportingDynamicLayersError(layerConfig.layerPath, layerConfig.getLayerNameCascade()));
      }
    }

    // If the layer is an EsriFeature
    if (layer instanceof EsriFeature) {
      // Older ArcGIS servers may not provide a 'type' property
      if (metadataLayer && metadataLayer.type !== 'Feature Layer') {
        GeoViewError.logWarning(new LayerNotFeatureLayerError(layerConfig.layerPath, layerConfig.getLayerNameCascade()));
      }
    }
  }

  /**
   * This method is used to process the layer's metadata.
   *
   * It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param layer - The ESRI layer instance pointer
   * @param layerConfig - The layer entry configuration to process
   * @param displayDateMode - Optional display date mode
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves once the layer configuration has its metadata processed
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error
   */
  static async commonProcessLayerMetadata<
    T extends EsriDynamic | EsriFeature | EsriImage,
    U extends EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig,
  >(layer: T, layerConfig: U, displayDateMode?: DisplayDateMode, abortSignal?: AbortSignal): Promise<U> {
    // User-defined groups do not have metadata provided by the service endpoint.
    if (layerConfig.getEntryTypeIsGroup() && !layerConfig.getIsMetadataLayerGroup()) return layerConfig;

    // If the layer is EsriDynamic or EsriFeature (basically not EsriImage)
    let layerMetadata: TypeMetadataEsriDynamicLayer | TypeMetadataEsriFeatureLayer | TypeMetadataEsriImage;
    if (layerConfig instanceof EsriDynamicLayerEntryConfig || layerConfig instanceof EsriFeatureLayerEntryConfig) {
      // The url
      const baseUrl = layer.getMetadataAccessPath().replace(/\/$/, '');
      const queryUrl = `${baseUrl}/${layerConfig.layerId}`;

      try {
        // Fetch the layer metadata
        layerMetadata = await Fetch.fetchJson<TypeMetadataEsriDynamicLayer | TypeMetadataEsriFeatureLayer | TypeMetadataEsriImage>(
          `${queryUrl}?f=json`,
          {
            signal: abortSignal,
          }
        );
      } catch (error: unknown) {
        // Rethrow
        throw new LayerServiceMetadataUnableToFetchError(layerConfig.getGeoviewLayerId(), layerConfig.getLayerName(), formatError(error));
      }
    } else {
      // In the case of an EsriImage, the layer metadata was already queried (same as the service metadata), use that
      layerMetadata = layerConfig.getServiceMetadata()!;
    }

    // Validate the metadata response
    AbstractGeoViewRaster.throwIfMetatadaHasError(layerConfig.getGeoviewLayerId(), layerConfig.getLayerName(), layerMetadata);

    // Set the layer metadata
    layerConfig.setLayerMetadata(layerMetadata);

    // For ESRI Image layers, extract and store mosaic rule from metadata
    if (layerConfig instanceof EsriImageLayerEntryConfig) {
      this.#processImageLayerMosaicRule(layerConfig, layerMetadata as TypeMetadataEsriImage);
      this.#processImageLayerDefaultRasterFunction(layerConfig, layerMetadata as TypeMetadataEsriImage);
    }

    // The following line allow the type ascention of the type guard functions on the second line below
    if (layerConfig instanceof EsriDynamicLayerEntryConfig || layerConfig instanceof EsriFeatureLayerEntryConfig) {
      // Cast the metadata according to the config type (basically excluding the EsriImage)
      const layerMetadataCasted = layerMetadata as TypeMetadataEsriDynamicLayer | TypeMetadataEsriFeatureLayer;

      // Create the style from the Esri Renderer
      const styleFromRenderer = EsriRenderer.createStylesFromEsriRenderer(layerMetadataCasted.drawingInfo?.renderer);

      // Initialize the layer style by filling the blanks with the information from the metadata
      layerConfig.initLayerStyleFromMetadata(styleFromRenderer);
    }

    // Check if we support that projection and if not add it on-the-fly
    await Projection.addProjectionIfMissing(layerMetadata.spatialReference || layerMetadata.sourceSpatialReference);

    // Also register the extent's spatial reference if it exists
    if (layerMetadata.extent?.spatialReference) {
      await Projection.addProjectionIfMissing(layerMetadata.extent.spatialReference);
    }

    this.#commonProcessFeatureInfoConfig(layerConfig, layerMetadata);

    this.#commonProcessInitialSettings(layerConfig, layerMetadata);

    this.#commonProcessTimeDimension(layerConfig, layerMetadata.timeInfo, displayDateMode);

    return layerConfig;
  }

  /**
   * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
   *
   * @param layerConfig - The layer entry to configure
   * @param layerMetadata - The layer metadata
   */
  static #commonProcessFeatureInfoConfig(
    layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig,
    layerMetadata: TypeMetadataEsriDynamicLayer | TypeMetadataEsriFeatureLayer | TypeMetadataEsriImage
  ): void {
    // Cast to the TypeMetadataEsriDynamicLayer to perform some specific payload operations here
    const layerMetadataEsriDynamicLayer = layerMetadata as TypeMetadataEsriDynamicLayer;

    // If no metadata, throw metadata empty error (maybe change to just return if this is too strict? Trying the more strict approach first..)
    if (!layerMetadata) throw new LayerServiceMetadataEmptyError(layerConfig.getGeoviewLayerId(), layerConfig.getLayerNameCascade());

    // Read variables
    const queryable = layerMetadata.capabilities.includes('Query') || layerMetadata.capabilities.includes('Catalog');
    const { fields } = layerMetadata;
    const hasFields = !!fields?.length;
    const isGroupLayer = layerMetadataEsriDynamicLayer.type === 'Group Layer';
    const isMetadataGroup = layerConfig.getIsMetadataLayerGroup();

    // Initialize the queryable source
    layerConfig.initQueryableSource(queryable && hasFields && !isGroupLayer && !isMetadataGroup);

    // Initialize the outfields
    // dynamic group layer doesn't have fields definition
    if (hasFields && !isGroupLayer) {
      // Get the outfields
      let outfields = layerConfig.getOutfields();

      // Process undefined outfields or aliasFields
      if (!outfields?.length) {
        // Create it
        outfields = [];

        // Loop
        fields.forEach((fieldEntry) => {
          // If the field is the geometry field
          if (layerMetadataEsriDynamicLayer.geometryField && fieldEntry?.name === layerMetadataEsriDynamicLayer.geometryField?.name) {
            // Keep the geometry field for future use
            layerConfig.setGeometryField({
              name: fieldEntry.name,
              alias: fieldEntry.alias || fieldEntry.name,
              // TODO: CHECK - Mismatch of TypeOutfieldsType and geometryType as string. This seems wrong, should the TypeOutfieldsType be enhanced to include geometry types?
              type: layerMetadataEsriDynamicLayer.geometryType as TypeOutfieldsType,
            });

            // Skip that geometry field
            return;
          }

          // Compile it
          const newOutfield: TypeOutfields = {
            name: fieldEntry.name,
            alias: fieldEntry.alias || fieldEntry.name,
            type: this.esriGetFieldType(layerConfig, fields, fieldEntry.name),
            domain: this.esriGetFieldDomain(fields, fieldEntry.name),
          };

          outfields!.push(newOutfield);
        });

        // Set it
        layerConfig.setOutfields(outfields);
      }

      // Initialize the outfields aliases
      layerConfig.initOutfieldsAliases();

      // Initialize the name field
      layerConfig.initNameField(layerMetadataEsriDynamicLayer.displayField ?? outfields?.[0]?.name);
    }
  }

  /**
   * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
   *
   * @param layerConfig - The layer entry to configure
   * @param layerMetadata - The layer metadata
   */
  static #commonProcessInitialSettings(
    layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig,
    layerMetadata: TypeMetadataEsriDynamicLayer | TypeMetadataEsriFeatureLayer | TypeMetadataEsriImage
  ): void {
    // Cast to the TypeMetadataEsriDynamicLayer to perform some specific payload operations here
    const layerMetadataEsriDynamicLayer = layerMetadata as TypeMetadataEsriDynamicLayer;

    // Validate and update the visible initial settings
    layerConfig.initInitialSettingsStatesVisibleFromMetadata(layerMetadataEsriDynamicLayer?.defaultVisibility);

    // Update Min / Max Scales with value if service doesn't allow the configured value for proper UI functionality
    layerConfig.initMinScaleFromMetadata(layerMetadataEsriDynamicLayer?.minScale);
    layerConfig.initMaxScaleFromMetadata(layerMetadataEsriDynamicLayer?.maxScale);

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
   * This method will create a Geoview temporal dimension if it exist in the service metadata.
   *
   * @param layerConfig - The layer entry to configure
   * @param esriTimeDimension - The ESRI time dimension object
   * @param displayDateMode - Optional display date mode
   * @param singleHandle - Optional true for ESRI Image
   * @throws {InvalidTimeDimensionError} When range couldn't be computed, or when duration is invalid, or non-positive or when an infinite loop is detected
   * @throws {InvalidDateError} When input has invalid dates
   */
  static #commonProcessTimeDimension(
    layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig,
    esriTimeDimension: TimeDimensionESRI | undefined,
    displayDateMode: DisplayDateMode | undefined,
    singleHandle?: boolean
  ): void {
    if (!esriTimeDimension?.timeExtent) return;

    // TODO: Review the purpose of the singleHandle variable. It now always defaults to false and is used to set the defaultValues of the timeslider,
    // TO.DOCONT: but the default values could be / should be overwritten by the config. Also, the defaultValues seem like the actual way to make the timeslider a single handle?
    // Create the time dimension
    layerConfig.setTimeDimension(DateMgt.createDimensionFromESRI(esriTimeDimension, displayDateMode, singleHandle));
  }

  /**
   * Processes ESRI Image Server metadata to set the default raster function if one wasn't configured.
   *
   * The first non-"None" raster function is used as the default.
   *
   * @param layerConfig - The ESRI Image layer configuration
   * @param metadata - The service metadata response
   */
  static #processImageLayerDefaultRasterFunction(layerConfig: EsriImageLayerEntryConfig, metadata: TypeMetadataEsriImage): void {
    // Skip if user already configured a raster function
    if (layerConfig.getInitialRasterFunction()) return;

    // Check if metadata has raster function infos
    if (!metadata.rasterFunctionInfos || metadata.rasterFunctionInfos.length === 0) return;

    // Find the first non-"None" raster function (first in list is the default)
    const defaultRasterFunction = metadata.rasterFunctionInfos.find((rf) => rf.name && rf.name.toLowerCase() !== 'none');

    if (defaultRasterFunction) {
      // Set the default raster function using the setter
      layerConfig.setInitialRasterFunction(defaultRasterFunction.name);
    }
  }

  /**
   * Processes ESRI Image Server metadata to extract default mosaic rule parameters.
   *
   * Stores the mosaic rule in the layer config for use during source creation and querying.
   *
   * @param layerConfig - The ESRI Image layer configuration
   * @param metadata - The service metadata response
   */
  static #processImageLayerMosaicRule(layerConfig: EsriImageLayerEntryConfig, metadata: TypeMetadataEsriImage): void {
    // Check if metadata has default mosaic settings
    if (!metadata.defaultMosaicMethod) return;

    // Build mosaic rule from metadata defaults
    const mosaicRule: TypeMosaicRule = {
      mosaicMethod: EsriUtilities.convertMosaicMethod(metadata.defaultMosaicMethod),
    };

    // Add optional parameters if present
    if (metadata.sortField) {
      mosaicRule.sortField = metadata.sortField;
      mosaicRule.ascending = metadata.sortAscending ?? true;
    }

    if (metadata.sortValue !== undefined) {
      mosaicRule.sortValue = String(metadata.sortValue);
    }

    if (metadata.mosaicOperator) {
      mosaicRule.mosaicOperation = EsriUtilities.convertMosaicOperator(metadata.mosaicOperator);
    }

    // Store in layer config via type extension
    layerConfig.setInitialMosaicRule(mosaicRule);
  }

  /**
   * Converts metadata mosaic method to ESRI REST API format.
   *
   * @param method - The metadata mosaic method
   * @returns The ESRI API mosaic method string
   */
  static convertMosaicMethod(method: string): TypeMosaicRule['mosaicMethod'] {
    const methodMap: Record<string, TypeMosaicRule['mosaicMethod']> = {
      ByAttribute: 'esriMosaicAttribute',
      Center: 'esriMosaicCenter',
      Nadir: 'esriMosaicNadir',
      Viewpoint: 'esriMosaicViewpoint',
      Seamline: 'esriMosaicSeamline',
      None: 'esriMosaicNone',
      LockRaster: 'esriMosaicLockRaster',
      Northwest: 'esriMosaicNorthwest',
    };
    return methodMap[method] || 'esriMosaicNone';
  }

  /**
   * Converts metadata mosaic operator to ESRI REST API format.
   *
   * @param operator - The metadata mosaic operator
   * @returns The ESRI API mosaic operation string
   */
  static convertMosaicOperator(operator: string): TypeMosaicRule['mosaicOperation'] {
    const operatorMap: Record<string, TypeMosaicRule['mosaicOperation']> = {
      First: 'MT_FIRST',
      Last: 'MT_LAST',
      Min: 'MT_MIN',
      Max: 'MT_MAX',
      Mean: 'MT_MEAN',
      Blend: 'MT_BLEND',
      Sum: 'MT_SUM',
    };
    return operatorMap[operator];
  }

  // #endregion LAYER PROCESSING METHODS

  // #region QUERY METHODS

  /**
   * Asynchronously queries an Esri feature layer given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
   *
   * @param url - An Esri url indicating a feature layer to query
   * @param geometryType - Optional geometry type for the geometries in the layer being queried (used when geometries are returned)
   * @param parseFeatureInfoEntries - Optional boolean to indicate if we use the raw esri output or if we parse it, defaults to true
   * @returns A promise that resolves with an array of related records of type TypeFeatureInfoEntryPartial, or an empty array
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseEmptyError} When the JSON response is empty
   * @throws {ResponseTypeError} When the response from the service is not an object
   * @throws {ResponseContentError} When the response actually contains an error within it
   * @throws {NetworkError} When a network issue happened
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
   *
   * @param url - An Esri url indicating a relationship table to query
   * @param recordGroupIndex - The group index of the relationship layer on which to read the related records
   * @returns A promise that resolves with an array of related records of type TypeFeatureInfoEntryPartial, or an empty array
   * @deprecated Doesn't seem to be called anywhere
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
   *
   * @param layerUrl - An Esri url indicating a feature layer to query
   * @param geometryType - Optional geometry type for the geometries in the layer being queried (used when returnGeometry is true)
   * @param objectIds - The list of objectids to filter the query on
   * @param fields - The list of field names to include in the output
   * @param geometry - True to return the geometries in the output
   * @param outSR - Optional spatial reference of the output geometries from the query
   * @param maxOffset - Optional max allowable offset value to simplify geometry
   * @param parseFeatureInfoEntries - Optional boolean to indicate if we use the raw esri output or if we parse it
   * @returns A promise that resolves with an array of related records of type TypeFeatureInfoEntryPartial, or an empty array
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
   *
   * The transformation reads the Esri formatted information and return a list of `TypeFeatureInfoEntryPartial` records.
   * In a similar fashion and response object as the "Query Feature Infos" functionalities done via the Layers.
   *
   * @param records - The records representing the data from Esri
   * @param geometryType - Optional geometry type
   * @returns An array of related records of type TypeFeatureInfoEntryPartial
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
   *
   * For ESRI Image layers, well-known pixel fields (`PixelValue`, `ProcessedValue`, `Name`)
   * are short-circuited to `'string'` because they have no metadata entry.
   *
   * @param layerConfig - The ESRI layer config, used to detect EsriImage-specific fields.
   * @param fields - The metadata field definitions to search.
   * @param fieldName - Field name for which we want to get the type.
   * @returns The mapped outfield type (`'date'`, `'oid'`, `'number'`, or `'string'`).
   */
  static esriGetFieldType(
    layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig,
    fields: TypeLayerMetadataFields[],
    fieldName: string
  ): TypeOutfieldsType {
    // For EsriImage layers, handle well-known pixel fields that have no metadata entry
    if (layerConfig instanceof EsriImageLayerEntryConfig) {
      const lowerFieldName = fieldName.toLowerCase();
      if (lowerFieldName === 'pixelvalue' || lowerFieldName === 'processedvalue' || lowerFieldName === 'name') {
        return 'string';
      }
    }

    // Find the field definition in the provided fields array
    const fieldDefinition = fields?.find((metadataEntry) => metadataEntry.name === fieldName);
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
   *
   * @param fields - The metadata field definitions to search.
   * @param fieldName - Field name for which we want to get the domain.
   * @returns The domain of the field, or `null` if not found.
   */
  // TODO: ESRI domains are translated to GeoView domains in the configuration. Any GeoView layer that support geoview domains can
  // TO.DOCONT: call a method getFieldDomain that use config.source.featureInfo.outfields to find a field domain.
  static esriGetFieldDomain(fields: TypeLayerMetadataFields[], fieldName: string): codedValueType | rangeDomainType | undefined {
    // Find the field definition in the provided fields array
    return fields?.find((metadataEntry) => metadataEntry.name === fieldName)?.domain;
  }

  // #endregion PARSING METHODS
}

export type RegisterLayerEntryConfigDelegate = (
  config: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | GroupLayerEntryConfig
) => void;
