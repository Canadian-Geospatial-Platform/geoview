import type { Options as SourceOptions } from 'ol/source/ImageArcGISRest';
import type { Projection as OLProjection } from 'ol/proj';
import { ImageArcGISRest } from 'ol/source';

import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { EsriDynamicLayerEntryConfigProps } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import type { TypeGeoviewLayerConfig, TypeMetadataEsriDynamic } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

import { EsriUtilities } from '@/geo/layer/geoview-layers/esri-layer-common';
import { deepMergeObjects } from '@/core/utils/utilities';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';

export interface TypeEsriDynamicLayerConfig extends TypeGeoviewLayerConfig {
  // TODO: Refactor - Layers - Get rid of the `geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_DYNAMIC` property in this interface and all others in other layers.
  // TO.DOCONT: In fact, probably get rid of all these interfaces altogether and implement the class structures better with regards to their possible `listOfLayerEntryConfig`.
  geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_DYNAMIC;
  listOfLayerEntryConfig: (GroupLayerEntryConfig | EsriDynamicLayerEntryConfig)[];
}

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
    super(layerConfig);

    // Initialize the serverDateFragmentsOrder if not already set
    this.initServerDateFragmentsOrderFromServiceDateFormat();
  }

  // #region OVERRIDES

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
    const metadata = await this.onFetchServiceMetadata<TypeMetadataEsriDynamic>();

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
    return EsriDynamic.createGeoviewLayerConfig(
      this.getGeoviewLayerId(),
      this.getGeoviewLayerName(),
      this.getMetadataAccessPath(),
      this.getGeoviewLayerConfig().isTimeAware,
      entriesTree
    );
  }

  /**
   * Overrides the way the validation of the list of layer entry config happens.
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected override onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void {
    // Redirect and hook when a layer entry must be registered
    EsriUtilities.commonValidateListOfLayerEntryConfig(this, listOfLayerEntryConfig, (config) => {
      // Register the layer entry config
      this.emitLayerEntryRegisterInit({ config });
    });
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @param {OLProjection?} [mapProjection] - The map projection.
   * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
   * @returns {Promise<EsriDynamicLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(
    layerConfig: EsriDynamicLayerEntryConfig,
    mapProjection?: OLProjection,
    abortSignal?: AbortSignal
  ): Promise<EsriDynamicLayerEntryConfig> {
    return EsriUtilities.commonProcessLayerMetadata(this, layerConfig, abortSignal);
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

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Initializes a GeoView layer configuration for an Esri Dynamic layer.
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   * @param {string} geoviewLayerId - A unique identifier for the layer.
   * @param {string} geoviewLayerName - The display name of the layer.
   * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
   * @param {boolean?} [isTimeAware] - Indicates whether the layer supports time-based filtering.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
   * @static
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware?: boolean
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new EsriDynamic({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeEsriDynamicLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a Esri Dynamic layer.
   * This function constructs a `TypeEsriDynamicLayerConfig` object that describes an Esri Dynamic layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @param {unknown} customGeocoreLayerConfig - An optional layer config from Geocore.
   * @returns {TypeEsriDynamicLayerConfig} The constructed configuration object for the Esri Dynamic layer.
   * @static
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined,
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
   * Processes an Esri Dynamic GeoviewLayerConfig and returns a promise
   * that resolves to an array of `ConfigBaseClass` layer entry configurations.
   *
   * This method:
   * 1. Creates a Geoview layer configuration using the provided parameters.
   * 2. Instantiates a layer with that configuration.
   * 3. Processes the layer configuration and returns the result.
   * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name for the GeoView layer.
   * @param {string} url - The URL of the service endpoint.
   * @param {string[]} layerIds - An array of layer IDs to include in the configuration.
   * @param {boolean} isTimeAware - Indicates if the layer is time aware.
   * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
   * @static
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: number[],
    isTimeAware: boolean
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = EsriDynamic.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
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
   * @static
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
          layerId: `${layerEntry.layerId || layerEntry.id || layerEntry.index}`,
          layerName: layerEntry.layerName,
          listOfLayerEntryConfig: subConfigs,
        });
      }

      // Create entry config
      const layerEntryConfig: EsriDynamicLayerEntryConfigProps = {
        geoviewLayerConfig,
        layerId: `${layerEntry.layerId || layerEntry.id || layerEntry.index}`,
        layerName: layerEntry.layerName,
      };

      // Overwrite default from geocore custom config
      const mergedConfig = deepMergeObjects<EsriDynamicLayerEntryConfigProps>(layerEntryConfig, customGeocoreLayerConfig);

      // Reconstruct
      return new EsriDynamicLayerEntryConfig(mergedConfig);
    });
  }

  /**
   * Creates an ImageArcGISRest source from a layer config.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The configuration for the EsriDynamic layer.
   * @returns {ImageArcGISRest} A fully configured ImageArcGISRest source.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   * @static
   */
  static createEsriDynamicSource(layerConfig: EsriDynamicLayerEntryConfig): ImageArcGISRest {
    // Get the source config
    const source = layerConfig.getSource();

    const sourceOptions: SourceOptions = {
      url: layerConfig.getDataAccessPath(),
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
      layerConfig.getLayerStyle(),
      layerConfig.getExternalFragmentsOrder(),
      undefined,
      layerConfig.getLayerFilter()
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
   * @static
   */
  static buildLayerEntriesTree(entries: { layerId: number; subLayerIds: number[] }[]): TypeLayerEntryShell[] {
    // Create a lookup map of all entries by layerId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entryMap: Record<number, any> = {};
    entries.forEach((entry) => {
      entryMap[entry.layerId] = structuredClone(entry);
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

  // #endregion STATIC METHODS
}
