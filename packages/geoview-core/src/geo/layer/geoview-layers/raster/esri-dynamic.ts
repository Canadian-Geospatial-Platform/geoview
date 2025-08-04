import { ImageArcGISRest } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageArcGISRest';
import { cloneDeep } from 'lodash';

import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import {
  EsriDynamicLayerEntryConfig,
  TypeMetadataEsriDynamic,
} from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
} from '@/api/config/types/map-schema-types';

import { commonProcessLayerMetadata, commonValidateListOfLayerEntryConfig } from '@/geo/layer/geoview-layers/esri-layer-common';
import { logger } from '@/core/utils/logger';
import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';
import { deepMergeObjects } from '@/core/utils/utilities';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { ConfigBaseClass, TypeLayerEntryShell } from '@/core/utils/config/validation-classes/config-base-class';

// GV: CONFIG EXTRACTION
// GV: This section of code was extracted and copied to the geoview config section
// GV: |||||
// GV: vvvvv

export interface TypeEsriDynamicLayerConfig extends TypeGeoviewLayerConfig {
  geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_DYNAMIC;
  listOfLayerEntryConfig: (GroupLayerEntryConfig | EsriDynamicLayerEntryConfig)[];
}

// GV: ^^^^^
// GV: |||||

/**
 * A class to add an EsriDynamic layer.
 *
 * @exports
 * @class EsriDynamic
 */
export class EsriDynamic extends AbstractGeoViewRaster {
  // The default hit tolerance the query should be using
  static override DEFAULT_HIT_TOLERANCE: number = 7;

  // Override the hit tolerance for a EsriDynamic layer
  override hitTolerance: number = EsriDynamic.DEFAULT_HIT_TOLERANCE;

  /**
   * Constructs an EsriDynamic Layer configuration processor.
   * @param {TypeEsriDynamicLayerConfig} layerConfig The layer configuration.
   */
  constructor(layerConfig: TypeEsriDynamicLayerConfig) {
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.serviceDateFormat) layerConfig.serviceDateFormat = 'DD/MM/YYYY HH:MM:SSZ';
    super(CONST_LAYER_TYPES.ESRI_DYNAMIC, layerConfig);
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataEsriDynamic | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataEsriDynamic | undefined {
    return super.getMetadata() as TypeMetadataEsriDynamic | undefined;
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override async onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Fetch the metadata
    const metadata = (await AbstractGeoViewRaster.fetchMetadata(
      this.metadataAccessPath,
      this.geoviewLayerId,
      this.geoviewLayerName
    )) as TypeMetadataEsriDynamic;

    // Now that we have metadata
    const { layers } = metadata;

    // Get all entries
    const entries = layers.map((layer) => {
      return {
        id: layer.id,
        index: layer.id,
        layerId: layer.id,
        layerName: layer.name,
        subLayerIds: layer.subLayerIds,
        subLayers: [],
      };
    });

    // Build a tree of entries
    const entriesTree = EsriDynamic.buildLayerEntriesTree(entries);

    // Redirect
    return EsriDynamic.createEsriDynamicLayerConfig(
      this.geoviewLayerId,
      this.geoviewLayerName,
      this.metadataAccessPath,
      false,
      entriesTree
    );
  }

  /**
   * Overrides the way the validation of the list of layer entry config happens.
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected override onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void {
    commonValidateListOfLayerEntryConfig(this, listOfLayerEntryConfig);
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<EsriDynamicLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: EsriDynamicLayerEntryConfig): Promise<EsriDynamicLayerEntryConfig> {
    return commonProcessLayerMetadata(this, layerConfig);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVEsriDynamic} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: EsriDynamicLayerEntryConfig): GVEsriDynamic {
    // Create the source
    const source = EsriDynamic.createEsriDynamicSource(layerConfig);

    // Create the GV Layer
    const gvLayer = new GVEsriDynamic(source, layerConfig);

    // Return it
    return gvLayer;
  }

  /**
   * Performs specific validation that can only be done by the child of the AbstractGeoViewEsriLayer class.
   * @param {TypeLayerEntryConfig} layerConfig - The layer config to check.
   * @returns {boolean} true if an error is detected.
   */
  esriChildHasDetectedAnError(layerConfig: TypeLayerEntryConfig): boolean {
    if (!this.getMetadata()?.supportsDynamicLayers) {
      // Log a warning, but continue
      logger.logWarning(`Layer ${layerConfig.layerPath} does not technically support dynamic layers per its metadata.`);
    }
    return false;
  }

  /**
   * Initializes a GeoView layer configuration for an Esri Dynamic layer.
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   * @param {string} geoviewLayerId - A unique identifier for the layer.
   * @param {string} geoviewLayerName - The display name of the layer.
   * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new EsriDynamic({ geoviewLayerId, geoviewLayerName, metadataAccessPath } as TypeEsriDynamicLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a Esri Dynamic layer.
   * This function constructs a `TypeEsriDynamicLayerConfig` object that describes an Esri Dynamic layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @param {unknown} customGeocoreLayerConfig - An optional layer config from Geocore.
   * @returns {TypeEsriDynamicLayerConfig} The constructed configuration object for the Esri Dynamic layer.
   */
  static createEsriDynamicLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeLayerEntryShell[],
    customGeocoreLayerConfig: unknown = {}
  ): TypeEsriDynamicLayerConfig {
    const geoviewLayerConfig: TypeEsriDynamicLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.ESRI_DYNAMIC,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };

    // Convert the tree of entries to GeoviewLayerConfigs
    geoviewLayerConfig.listOfLayerEntryConfig = EsriDynamic.#convertTreeToLayerConfigs(
      geoviewLayerConfig,
      layerEntries,
      customGeocoreLayerConfig
    );

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes an Esry Dynamic layer config returning a Promise of an array of ConfigBaseClass layer entry configurations.
   * @returns A Promise with the layer configurations.
   */
  static processEsriDynamicConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: number[]
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = EsriDynamic.createEsriDynamicLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      false,
      layerIds.map((layerId) => {
        return { id: layerId, index: layerId };
      }),
      {}
    );

    // Create the class from geoview-layers package
    const myLayer = new EsriDynamic(layerConfig);

    // Process it
    return AbstractGeoViewLayer.processConfig(myLayer);
  }

  /**
   * Recursively converts a tree of ESRI dynamic layer entries into a flat array of `GroupLayerEntryConfig` and
   * `EsriDynamicLayerEntryConfig` instances suitable for use in a GeoView layer.
   * @remarks
   * - Group layers with sublayers are processed recursively into `GroupLayerEntryConfig` instances.
   * - Leaf layers are converted into `EsriDynamicLayerEntryConfig` instances.
   * - A custom configuration object from GeoCore can override or extend default values via deep merging.
   * @param {TypeEsriDynamicLayerConfig} geoviewLayerConfig - The top-level ESRI dynamic layer configuration object.
   * @param {TypeLayerEntryShell[]} layerEntries - An array representing the tree structure of the layer entries (may include groups or leaves).
   * @param {unknown} [customGeocoreLayerConfig={}] - Optional GeoCore-specific configuration overrides to apply to each entry.
   * @returns {(GroupLayerEntryConfig | EsriDynamicLayerEntryConfig)[]} An array of fully-formed layer entry configuration instances.
   */
  static #convertTreeToLayerConfigs(
    geoviewLayerConfig: TypeEsriDynamicLayerConfig,
    layerEntries: TypeLayerEntryShell[],
    customGeocoreLayerConfig: unknown = {}
  ): (GroupLayerEntryConfig | EsriDynamicLayerEntryConfig)[] {
    // For each layer entry
    return layerEntries.map((layerEntry) => {
      // If is a group layer
      if (layerEntry.subLayers && layerEntry.subLayers.length > 0) {
        // Recursively convert sublayers
        const subConfigs = EsriDynamic.#convertTreeToLayerConfigs(geoviewLayerConfig, layerEntry.subLayers, customGeocoreLayerConfig);

        return new GroupLayerEntryConfig({
          geoviewLayerConfig,
          layerId: `${layerEntry.layerId}`,
          layerName: `${layerEntry.layerName}`,
          listOfLayerEntryConfig: subConfigs,
        } as GroupLayerEntryConfig);
      }

      // Create entry config
      const layerEntryConfig = {
        geoviewLayerConfig,
        schemaTag: CONST_LAYER_TYPES.ESRI_DYNAMIC,
        entryType: CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE,
        layerId: `${layerEntry.index}`,
        layerName: `${layerEntry.layerName || layerEntry.layerId}`,
        source: {
          dataAccessPath: geoviewLayerConfig.metadataAccessPath,
        },
      };

      // Overwrite default from geocore custom config
      const mergedConfig = deepMergeObjects(layerEntryConfig, customGeocoreLayerConfig) as EsriDynamicLayerEntryConfig;

      // Reconstruct
      return new EsriDynamicLayerEntryConfig(mergedConfig);
    });
  }

  /**
   * Creates an ImageArcGISRest source from a layer config.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The configuration for the EsriDynamic layer.
   * @returns {ImageArcGISRest} A fully configured ImageArcGISRest source.
   * @throws If required config fields like dataAccessPath are missing.
   */
  static createEsriDynamicSource(layerConfig: EsriDynamicLayerEntryConfig): ImageArcGISRest {
    const { source } = layerConfig;

    if (!source?.dataAccessPath) {
      throw new LayerDataAccessPathMandatoryError(layerConfig.layerPath, layerConfig.getLayerName());
    }

    const sourceOptions: SourceOptions = {
      url: source.dataAccessPath,
      attributions: layerConfig.getAttributions(),
      params: {
        LAYERS: `show:${layerConfig.layerId}`,
        ...(source.transparent !== undefined && { transparent: source.transparent }),
        ...(source.format && { format: source.format }),
      },
      crossOrigin: source.crossOrigin ?? 'Anonymous',
    };

    // If forcing service projection so that OpenLayers takes care of reprojecting locally on the map
    if (source.forceServiceProjection) {
      // Find the SRID from the layer metadata
      const srid =
        layerConfig.getLayerMetadata()?.sourceSpatialReference?.latestWkid || layerConfig.getLayerMetadata()?.sourceSpatialReference?.wkid;

      // Tweak the source params and projection to force it to use the native projection of the service, not the projection of the map
      // GV Set the image spatial reference to the service source - performance is better when open layers does the conversion
      // GV.CONT Older versions of ArcGIS Server are not properly converted, so this is only used for version 10.8+
      // GV This line (especially bboxSR) fixes an issue with EsriDynamic not taking in consideration the map projection in sourceOptions.projection (maybe an old Esri service?)
      sourceOptions.projection = `EPSG:${srid}`;
      sourceOptions.params!.imageSR = srid;
      sourceOptions.params!.bboxSR = srid;
    }

    // Create the source
    const olSource = new ImageArcGISRest(sourceOptions);

    // Raster layers do not accept layerDefs — must be cleared
    if (layerConfig.getServiceMetadata()?.layers?.[0]?.type === 'Raster Layer') {
      const params = olSource.getParams();
      olSource.updateParams({ ...params, layerDefs: '' });
    }

    // Apply the filter on the source right away, before the first load
    GVEsriDynamic.applyViewFilterOnSource(
      layerConfig,
      olSource,
      layerConfig.layerStyle,
      layerConfig.getExternalFragmentsOrder(),
      undefined,
      layerConfig.layerFilter
    );

    // Return the source
    return olSource;
  }

  /**
   * Builds a hierarchical tree structure from a flat array of ESRI layer entries by linking parent layers
   * with their corresponding sublayers based on `subLayerIds`.
   * @remarks
   * - Each entry is deep-cloned to avoid mutating the original input.
   * - Entries that are referenced as sublayers are nested under their parent in the `subLayers` array.
   * - Only root-level entries (those not referenced as sublayers) are returned at the top level of the tree.
   * @param {{ layerId: number; subLayerIds: number[] }[]} entries - A flat array of layer entry objects, each potentially referencing sublayers by ID.
   * @returns {TypeLayerEntryShell[]} A nested array representing the hierarchical layer structure with `subLayers` assigned to parents.
   */
  static buildLayerEntriesTree(entries: { layerId: number; subLayerIds: number[] }[]): TypeLayerEntryShell[] {
    // Create a lookup map of all entries by layerId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entryMap: Record<number, any> = {};
    entries.forEach((entry) => {
      entryMap[entry.layerId] = cloneDeep(entry);
    });

    // Track root entries (those not referenced as sublayers)
    const referenced = new Set<number>();

    // Assign subLayers
    entries.forEach((entry) => {
      if (entry.subLayerIds && entry.subLayerIds.length > 0) {
        entry.subLayerIds.forEach((subId) => {
          const child = entryMap[subId];
          if (child) {
            entryMap[entry.layerId].subLayers!.push(child);
            referenced.add(subId); // mark as child
          }
        });
      }
    });

    // Return only root nodes (not referenced as subLayers)
    return entries.filter((entry) => !referenced.has(entry.layerId)).map((entry) => entryMap[entry.layerId]);
  }
}

/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriDynamicLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsEsriDynamic = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriDynamicLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

/**
 * type guard function that redefines a TypeLayerEntryConfig as a EsriDynamicLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is ESRI_DYNAMIC. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsEsriDynamic = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is EsriDynamicLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};
