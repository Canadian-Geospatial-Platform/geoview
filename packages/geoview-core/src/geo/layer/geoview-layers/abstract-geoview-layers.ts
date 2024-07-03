/* eslint-disable no-param-reassign */
// We have many reassing for layerPath-layerConfig. We keep it global..
// TODO: refactor eslint - we have few files with many reassing should wee if we can build better...
import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import LayerGroup, { Options as LayerGroupOptions } from 'ol/layer/Group';
import Feature from 'ol/Feature';
import Source from 'ol/source/Source';
import { shared as iconImageCache } from 'ol/style/IconImageCache';

import { TypeLocalizedString } from '@config/types/map-schema-types';

import { generateId, getXMLHttpRequest, createLocalizedString, getLocalizedValue, whenThisThen } from '@/core/utils/utilities';
import { TypeJsonObject, toJsonObject } from '@/core/types/global-types';
import { TimeDimension, TypeDateFragments, DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { AsyncSemaphore } from '@/core/utils/async-semaphore';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import {
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  layerEntryIsGroupLayer,
  TypeStyleConfig,
  TypeLayerInitialSettings,
  TypeLayerStatus,
  TypeStyleGeometry,
  CONST_LAYER_ENTRY_TYPES,
  TypeLoadEndListenerType,
  TypeFeatureInfoEntry,
  codedValueType,
  rangeDomainType,
  TypeLocation,
  QueryType,
  TypeUniqueValueStyleConfig,
  TypeClassBreakStyleConfig,
} from '@/geo/map/map-schema-types';
import { GeoViewLayerCreatedTwiceError } from '@/geo/layer/exceptions/layer-exceptions';
import { Projection } from '@/geo/utils/projection';
import { getLegendStyles, getFeatureCanvas } from '@/geo/utils/renderer/geoview-renderer';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { LayerApi } from '../layer';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { MapViewer } from '@/geo/map/map-viewer';

// Constant used to define the default layer names
const DEFAULT_LAYER_NAMES: Record<TypeGeoviewLayerType, string> = {
  CSV: 'CSV Layer',
  esriDynamic: 'Esri Dynamic Layer',
  esriFeature: 'Esri Feature Layer',
  esriImage: 'Esri Image Layer',
  imageStatic: 'Static Image Layer',
  GeoJSON: 'GeoJson Layer',
  GeoPackage: 'GeoPackage Layer',
  xyzTiles: 'XYZ Tiles',
  vectorTiles: 'Vector Tiles',
  ogcFeature: 'OGC Feature Layer',
  ogcWfs: 'WFS Layer',
  ogcWms: 'WMS Layer',
};

/**
 * The AbstractGeoViewLayer class is the abstraction class of all GeoView Layers classes.
 * It registers the configuration options and defines the methods shared by all its descendant. The class constructor has
 * three parameters: mapId, type and mapLayerConfig. Its role is to save in attributes the mapId, type and elements of the
 * mapLayerConfig that are common to all GeoView layers. The main characteristic of a GeoView layer is the presence of an
 * metadataAccessPath attribute whose value is passed as an attribute of the mapLayerConfig object.
 */
export abstract class AbstractGeoViewLayer {
  // The default hit tolerance the query should be using
  static DEFAULT_HIT_TOLERANCE: number = 4;

  // The default hit tolerance
  hitTolerance: number = AbstractGeoViewLayer.DEFAULT_HIT_TOLERANCE;

  /** The map id on which the GeoView layer will be drawn. */
  mapId: string;

  /** The type of GeoView layer that is instantiated. */
  type: TypeGeoviewLayerType;

  /** The unique identifier for the GeoView layer. The value of this attribute is extracted from the mapLayerConfig parameter.
   * If its value is undefined, a unique value is generated.
   */
  geoviewLayerId: string;

  /** The GeoView layer name. The value of this attribute is extracted from the mapLayerConfig parameter. If its value is
   * undefined, a default value is generated.
   */
  geoviewLayerName: TypeLocalizedString = createLocalizedString('');

  /** The GeoView layer metadataAccessPath. The name attribute is optional */
  metadataAccessPath: TypeLocalizedString = createLocalizedString('');

  /**
   * An array of layer settings. In the schema, this attribute is optional. However, we define it as mandatory and if the
   * configuration does not provide a value, we use an empty array instead of an undefined attribute.
   */
  listOfLayerEntryConfig: TypeLayerEntryConfig[] = [];

  /**
   * Initial settings to apply to the GeoView layer at creation time. This attribute is allowed only if listOfLayerEntryConfig.length > 1.
   */
  initialSettings?: TypeLayerInitialSettings;

  /** layers of listOfLayerEntryConfig that did not load. */
  layerLoadError: { layer: string; loggerMessage: string }[] = [];

  /**
   * The OpenLayer root layer representing this GeoView Layer.
   */
  olRootLayer?: BaseLayer;

  // The service metadata.
  metadata: TypeJsonObject | null = null;

  /** Layer name */
  #layerName: Record<string, TypeLocalizedString | undefined> = {};

  /** Layer metadata */
  #layerMetadata: Record<string, TypeJsonObject> = {};

  /** Layer temporal dimension indexed by layerPath. */
  #layerTemporalDimension: Record<string, TimeDimension> = {};

  /** Style to apply to the layer. */
  #style: Record<string, TypeStyleConfig> = {};

  /** Attribution used in the OpenLayer source. */
  #attributions: string[] = [];

  /** Date format object used to translate server to ISO format and ISO to server format */
  serverDateFragmentsOrder?: TypeDateFragments;

  /** Date format object used to translate internal UTC ISO format to the external format, the one used by the user */
  externalFragmentsOrder: TypeDateFragments;

  /** Boolean indicating if the layer should be included in time awareness functions such as the Time Slider. True by default. */
  #isTimeAware: boolean = true;

  // Keep all callback delegates references
  #onLayerNameChangedHandlers: LayerNameChangedDelegate[] = [];

  // Keep all callback delegates references
  #onLayerStyleChangedHandlers: LayerStyleChangedDelegate[] = [];

  // Keep all callback delegate references
  #onLegendQueryingHandlers: LegendQueryingDelegate[] = [];

  // Keep all callback delegate references
  #onLegendQueriedHandlers: LegendQueriedDelegate[] = [];

  // Keep all callback delegate references
  #onVisibleChangedHandlers: VisibleChangedDelegate[] = [];

  // Keep all callback delegate references
  #onLayerEntryProcessedHandlers: LayerEntryProcessedDelegate[] = [];

  // Keep all callback delegate references
  #onLayerRequestingHandlers: LayerRequestingDelegate[] = [];

  // Keep all callback delegate references
  #onLayerCreationHandlers: LayerCreationDelegate[] = [];

  // Keep all callback delegate references
  #onLayerFilterAppliedHandlers: LayerFilterAppliedDelegate[] = [];

  // Keep all callback delegate references
  #onLayerOpacityChangedHandlers: LayerOpacityChangedDelegate[] = [];

  // Keep all callback delegates references
  #onIndividualLayerLoadedHandlers: IndividualLayerLoadedDelegate[] = [];

  /** ***************************************************************************************************************************
   * The class constructor saves parameters and common configuration parameters in attributes.
   *
   * @param {TypeGeoviewLayerType} type - The type of GeoView layer that is instantiated.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration options.
   * @param {string} mapId - The unique identifier of the map on which the GeoView layer will be drawn.
   */
  constructor(type: TypeGeoviewLayerType, geoviewLayerConfig: TypeGeoviewLayerConfig, mapId: string) {
    this.mapId = mapId;
    this.type = type;
    this.geoviewLayerId = geoviewLayerConfig.geoviewLayerId || generateId('');
    this.geoviewLayerName.en = geoviewLayerConfig?.geoviewLayerName?.en
      ? geoviewLayerConfig.geoviewLayerName.en
      : DEFAULT_LAYER_NAMES[type];
    this.geoviewLayerName.fr = geoviewLayerConfig?.geoviewLayerName?.fr
      ? geoviewLayerConfig.geoviewLayerName.fr
      : DEFAULT_LAYER_NAMES[type];
    if (geoviewLayerConfig.metadataAccessPath?.en) this.metadataAccessPath.en = geoviewLayerConfig.metadataAccessPath.en.trim();
    if (geoviewLayerConfig.metadataAccessPath?.fr) this.metadataAccessPath.fr = geoviewLayerConfig.metadataAccessPath.fr.trim();
    this.initialSettings = geoviewLayerConfig.initialSettings;
    this.serverDateFragmentsOrder = geoviewLayerConfig.serviceDateFormat
      ? DateMgt.getDateFragmentsOrder(geoviewLayerConfig.serviceDateFormat)
      : undefined;
    this.externalFragmentsOrder = DateMgt.getDateFragmentsOrder(geoviewLayerConfig.externalDateFormat);
    this.#isTimeAware = geoviewLayerConfig.isTimeAware === undefined ? true : geoviewLayerConfig.isTimeAware;
    this.#setListOfLayerEntryConfig(geoviewLayerConfig, geoviewLayerConfig.listOfLayerEntryConfig);
  }

  /** ***************************************************************************************************************************
   * Set the list of layer entry configuration and initialize the registered layer object and register all layers to layer sets.
   *
   * @param {TypeGeoviewLayer} mapLayerConfig The GeoView layer configuration options.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer's configuration
   * @private
   */
  #setListOfLayerEntryConfig(mapLayerConfig: TypeGeoviewLayerConfig, listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    if (listOfLayerEntryConfig.length === 0) return;
    if (listOfLayerEntryConfig.length === 1) this.listOfLayerEntryConfig = listOfLayerEntryConfig;
    else {
      const layerGroup = new GroupLayerEntryConfig({
        geoviewLayerConfig: listOfLayerEntryConfig[0].geoviewLayerConfig,
        layerId: this.geoviewLayerId,
        layerName: this.geoviewLayerName,
        isMetadataLayerGroup: false,
        initialSettings: mapLayerConfig.initialSettings,
        listOfLayerEntryConfig,
      } as GroupLayerEntryConfig);
      this.listOfLayerEntryConfig = [layerGroup];
      layerGroup.listOfLayerEntryConfig.forEach((layerConfig) => {
        (layerConfig as AbstractBaseLayerEntryConfig).parentLayerConfig = layerGroup;
      });
    }
    this.listOfLayerEntryConfig[0].geoviewLayerConfig.listOfLayerEntryConfig = listOfLayerEntryConfig;
  }

  /**
   * Gets the MapViewer where the layer resides
   * @returns {MapViewer} The MapViewer
   */
  getMapViewer(): MapViewer {
    // GV The GVLayers need a reference to the MapViewer to be able to perform operations.
    // GV This is a trick to obtain it. Otherwise, it'd need to be provided via constructor.
    return MapEventProcessor.getMapViewer(this.mapId);
  }

  /** ***************************************************************************************************************************
   * Gets the layer configuration of the specified layer path.
   *
   * @param {string} layerPath The layer path.
   *
   * @returns {ConfigBaseClass | undefined} The layer configuration or undefined if not found.
   */
  getLayerConfig(layerPath: string): ConfigBaseClass | undefined {
    // Trick to get a layer config from a layer class
    return this.getMapViewer().layer.getLayerEntryConfig(layerPath);
  }

  /** ***************************************************************************************************************************
   * Gets the OpenLayer of the specified layer path.
   *
   * @param {string} layerPath The layer path.
   *
   * @returns {BaseLayer | undefined} The layer configuration or undefined if not found.
   */
  getOLLayer(layerPath: string): BaseLayer | undefined {
    // Trick to get an open layer layer from a layer class
    return this.getMapViewer().layer.getOLLayer(layerPath);
  }

  /** ***************************************************************************************************************************
   * Gets the Geoview layer id.
   * @returns {string} The geoview layer id
   */
  getGeoviewLayerId(): string {
    return this.geoviewLayerId;
  }

  /** ***************************************************************************************************************************
   * Gets the Geoview layer name.
   * @returns {TypeLocalizedString | undefined} The geoview layer name
   */
  getGeoviewLayerName(): TypeLocalizedString | undefined {
    return this.geoviewLayerName;
  }

  /**
   * Gets the layer status
   * @returns The layer status
   */
  getLayerStatus(layerPath: string): TypeLayerStatus {
    // Take the layer status from the config, temporary patch until layers refactoring is done
    return this.getLayerConfig(layerPath)!.layerStatus;
  }

  /** ***************************************************************************************************************************
   * Gets the layer name.
   * @returns {TypeLocalizedString | undefined} The geoview layer name
   */
  getLayerName(layerPath: string): TypeLocalizedString | undefined {
    // If a new layer name is set
    if (this.#layerName[layerPath]) return this.#layerName[layerPath];
    // TODO: Refactor - Temporary patch until configs refactoring is done, the style should have been set already
    // Take name from config
    return this.getLayerConfig(layerPath)?.layerName;
  }

  /** ***************************************************************************************************************************
   * Sets the layer name.
   * @param {string} layerPath The layer path.
   * @param {TypeLocalizedString} name The layer name.
   */
  setLayerName(layerPath: string, name: TypeLocalizedString | undefined): void {
    this.#layerName[layerPath] = name;
    this.#emitLayerNameChanged({ layerPath, layerName: name });
  }

  /**
   * Gets the layer style
   * @returns The layer style
   */
  getStyle(layerPath: string): TypeStyleConfig | undefined {
    return this.#style[layerPath];
  }

  /**
   * Sets the layer style
   * @param {TypeStyleConfig | undefined} style - The layer style
   */
  setStyle(layerPath: string, style: TypeStyleConfig): void {
    this.#style[layerPath] = style;
    this.#emitLayerStyleChanged({ style, layerPath });
  }

  /**
   * Gets the layer attributions
   * @returns {string[]} The layer attributions
   */
  getAttributions(): string[] {
    return this.#attributions;
  }

  /**
   * Sets the layer attributions
   * @param {string[]} attributions - The layer attributions
   */
  setAttributions(attributions: string[]): void {
    this.#attributions = attributions;
  }

  /** ***************************************************************************************************************************
   * Get the layer metadata that is associated to the layer.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {TypeJsonObject} The layer metadata.
   */
  getLayerMetadata(layerPath: string): TypeJsonObject {
    return this.#layerMetadata[layerPath];
  }

  /** ***************************************************************************************************************************
   * Set the layer metadata for the layer identified by specified layerPath.
   *
   * @param {string} layerPath The layer path to the layer's configuration affected by the change.
   * @param {TypeJsonObject} layerMetadata The value to assign to the layer metadata property.
   */
  setLayerMetadata(layerPath: string, layerMetadata: TypeJsonObject): void {
    this.#layerMetadata[layerPath] = layerMetadata;
  }

  /** ***************************************************************************************************************************
   * Get the temporal dimension that is associated to the layer. Returns undefined when the layer config can't be found using the layer
   * path.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {TimeDimension} The temporal dimension associated to the layer or undefined.
   */
  getTemporalDimension(layerPath: string): TimeDimension {
    return this.#layerTemporalDimension[layerPath];
  }

  /** ***************************************************************************************************************************
   * Set the layerTemporalDimension for the layer identified by specified layerPath.
   *
   * @param {string} layerPath The layer path to the layer's configuration affected by the change.
   * @param {TimeDimension} temporalDimension The value to assign to the layer temporal dimension property.
   */
  setTemporalDimension(layerPath: string, temporalDimension: TimeDimension): void {
    this.#layerTemporalDimension[layerPath] = temporalDimension;
  }

  /**
   * Gets the flag if layer use its time dimension, this can be use to exclude layers from time function like time slider
   * @returns {boolean} The flag indicating if the layer should be included in time awareness functions such as the Time Slider. True by default..
   */
  getIsTimeAware(): boolean {
    return this.#isTimeAware;
  }

  /** ***************************************************************************************************************************
   * Recursively process the list of layer entries to count all layers in error.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer's configuration
   *                                                        (default: this.listOfLayerEntryConfig).
   *
   * @returns {number} The number of layers in error.
   */
  countErrorStatus(listOfLayerEntryConfig: TypeLayerEntryConfig[] = this.listOfLayerEntryConfig): number {
    return listOfLayerEntryConfig.reduce((counter: number, layerConfig: TypeLayerEntryConfig) => {
      if (layerEntryIsGroupLayer(layerConfig)) return counter + this.countErrorStatus(layerConfig.listOfLayerEntryConfig);
      if ((layerConfig as AbstractBaseLayerEntryConfig).layerStatus === 'error') return counter + 1;
      return counter;
    }, 0);
  }

  /** ***************************************************************************************************************************
   * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
   * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
   * Its code is the same for all child classes. It must first validate that the olLayers attribute is null indicating
   * that the method has never been called before for this layer. If this is not the case, an error message must be sent.
   * Then, it calls the abstract method getAdditionalServiceDefinition. For example, when the child is a WFS service, this
   * method executes the GetCapabilities request and saves the result in the metadata attribute of the class. It also process
   * the layer's metadata for each layer in the listOfLayerEntryConfig tree in order to define the missing pieces of the layer's
   * configuration. Layer's configuration can come from the configuration of the GeoView layer or from the information saved by
   * the method processListOfLayerEntryMetadata, priority being given to the first of the two. When the GeoView layer does not
   * have a service definition, the getAdditionalServiceDefinition method does nothing.
   *
   * Finally, the processListOfLayerEntryConfig is called to instantiate each layer identified by the listOfLayerEntryConfig
   * attribute. This method will also register the layers to all layer sets that offer this possibility. For example, if a layer
   * is queryable, it will subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer
   * to return the descriptive information of all the features in a tolerance radius. This information will be used to populate
   * the details-panel.
   */
  async createGeoViewLayers(): Promise<void> {
    if (!this.olRootLayer) {
      // Log
      logger.logTraceCore('ABSTRACT-GEOVIEW-LAYERS - createGeoViewLayers', this.listOfLayerEntryConfig);

      // Try to get a key for logging timings
      let logTimingsKey;
      if (this.listOfLayerEntryConfig.length > 0) logTimingsKey = `${this.mapId} | ${this.listOfLayerEntryConfig[0].layerPath}`;

      // Log
      if (logTimingsKey) logger.logMarkerStart(logTimingsKey);

      // Get additional service and await
      await this.getAdditionalServiceDefinition();

      // Log the time it took thus far
      if (logTimingsKey) logger.logMarkerCheck(logTimingsKey, 'to get additional service definition');

      // Process list of layers and await
      this.olRootLayer = await this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig);

      // Log the time it took thus far
      if (logTimingsKey) logger.logMarkerCheck(logTimingsKey, 'to process list of layer entry config');
    } else {
      // Raise error
      throw new GeoViewLayerCreatedTwiceError(this, this.mapId);
    }
  }

  /** ***************************************************************************************************************************
   * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
   */
  protected async getAdditionalServiceDefinition(): Promise<void> {
    try {
      await this.fetchServiceMetadata();
      if (this.listOfLayerEntryConfig.length) await this.validateAndExtractLayerMetadata();
    } catch (error) {
      // Log
      logger.logError(error);
    }
  }

  /** ***************************************************************************************************************************
   * This method Validate the list of layer configs and extract them in the geoview instance.
   */
  async validateAndExtractLayerMetadata(): Promise<void> {
    try {
      // Recursively process the configuration tree of layer entries by removing layers in error and processing valid layers.
      this.validateListOfLayerEntryConfig(this.listOfLayerEntryConfig);
      await this.processListOfLayerEntryMetadata(this.listOfLayerEntryConfig);
    } catch (error) {
      // Log
      logger.logError(error);
    }
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected async fetchServiceMetadata(): Promise<void> {
    const metadataUrl = getLocalizedValue(this.metadataAccessPath, AppEventProcessor.getDisplayLanguage(this.mapId));
    if (metadataUrl) {
      try {
        const metadataString = await getXMLHttpRequest(`${metadataUrl}?f=json`);
        if (metadataString === '{}') this.metadata = null;
        else {
          this.metadata = toJsonObject(JSON.parse(metadataString));
          const copyrightText = this.metadata.copyrightText as string;
          const attributions = this.getAttributions();
          if (copyrightText && !attributions.includes(copyrightText)) {
            // Add it
            attributions.push(copyrightText);
            this.setAttributions(attributions);
          }
        }
      } catch (error) {
        // Log
        logger.logError(error);
        this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
      }
    }
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
   * necessary, additional code can be executed in the child method to complete the layer configuration.
   *
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void;

  /** ***************************************************************************************************************************
   * This method processes recursively the metadata of each layer in the "layer list" configuration.
   *
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layers to process.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected async processListOfLayerEntryMetadata(listOfLayerEntryConfig: ConfigBaseClass[]): Promise<void> {
    try {
      const promisedAllLayerDone: Promise<ConfigBaseClass>[] = [];
      for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
        const layerConfig = listOfLayerEntryConfig[i];
        if (layerEntryIsGroupLayer(layerConfig))
          if (layerConfig.isMetadataLayerGroup) promisedAllLayerDone.push(this.#processMetadataGroupLayer(layerConfig));
          // eslint-disable-next-line no-await-in-loop
          else await this.processListOfLayerEntryMetadata(layerConfig.listOfLayerEntryConfig);
        else promisedAllLayerDone.push(this.processLayerMetadata(layerConfig as AbstractBaseLayerEntryConfig));
      }
      const arrayOfLayerConfigs = await Promise.all(promisedAllLayerDone);
      arrayOfLayerConfigs.forEach((layerConfig) => {
        if (layerConfig.layerStatus === 'error') {
          const message = `Error while loading layer path ${layerConfig.layerPath} on map ${this.mapId}`;
          this.layerLoadError.push({ layer: layerConfig.layerPath, loggerMessage: message });
          throw new Error(message);
        } else {
          // When we get here, we know that the metadata (if the service provide some) are processed.

          //
          // TODO: Refactor - Layers refactoring. Make it a super clear function when moving config information in the layer for real.
          // TO.DOCONT: After this point(?) the layerConfig should be full static and the system should rely on the Layer class to do stuff.
          //
          // Save the style in the layer as we're done processing style found in metadata
          if (layerConfig instanceof AbstractBaseLayerEntryConfig) this.setStyle(layerConfig.layerPath, layerConfig.style!);

          // We need to signal to the layer sets that the 'processed' phase is done.
          // GV TODO: For the moment, be aware that the layerStatus setter is doing a lot of things behind the scene.
          // GV       The layerStatus setter contains a lot of code and we will change it in favor of a method.
          layerConfig.layerStatus = 'processed';
          this.#emitLayerEntryProcessed({ config: layerConfig });
        }
      });
    } catch (error) {
      // Log
      logger.logError(error);
    }
  }

  /** ***************************************************************************************************************************
   * This method is used to process metadata group layer entries. These layers behave as a GeoView group layer and also as a data
   * layer (i.e. they have extent, visibility and query flag definition). Metadata group layers can be identified by
   * the presence of an isMetadataLayerGroup attribute set to true.
   *
   * @param {GroupLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<GroupLayerEntryConfig>} A promise that the vector layer configuration has its metadata and group layers processed.
   * @private
   */
  async #processMetadataGroupLayer(layerConfig: GroupLayerEntryConfig): Promise<GroupLayerEntryConfig> {
    try {
      // TODO: Check - Does this call makes sense for a metadata group layer? I'm not sure the "TypeScript" works here?
      // TO.DOCONT: Seems to be wrong type? I'm commenting line to see.. 2024-06-05
      // await this.processLayerMetadata(layerConfig);
      await this.processListOfLayerEntryMetadata(layerConfig.listOfLayerEntryConfig!);
      layerConfig.layerStatus = 'processed';
      this.#emitLayerEntryProcessed({ config: layerConfig });
      return layerConfig;
    } catch (error) {
      // Log
      logger.logError(error);
    }
    return layerConfig;
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty outfields and aliasFields properties of the
   * layer's configuration when applicable.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    if (!layerConfig.source) layerConfig.source = {};
    if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: false };

    return Promise.resolve(layerConfig);
  }

  /** ***************************************************************************************************************************
   * Process recursively the list of layer Entries to create the layers and the layer groups.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries to process.
   * @param {LayerGroup} layerGroup Optional layer group to use when we have many layers. The very first call to
   *  processListOfLayerEntryConfig must not provide a value for this parameter. It is defined for internal use.
   *
   * @returns {Promise<BaseLayer | null>} The promise that the layers were processed.
   */
  async processListOfLayerEntryConfig(
    listOfLayerEntryConfig: TypeLayerEntryConfig[],
    layerGroup?: LayerGroup
  ): Promise<BaseLayer | undefined> {
    // Log
    logger.logTraceCore('ABSTRACT-GEOVIEW-LAYERS - processListOfLayerEntryConfig', listOfLayerEntryConfig);

    try {
      if (listOfLayerEntryConfig.length === 0) return undefined;
      if (listOfLayerEntryConfig.length === 1) {
        if (layerEntryIsGroupLayer(listOfLayerEntryConfig[0])) {
          const newLayerGroup = this.createLayerGroup(listOfLayerEntryConfig[0], listOfLayerEntryConfig[0].initialSettings!);
          const groupReturned = await this.processListOfLayerEntryConfig(listOfLayerEntryConfig[0].listOfLayerEntryConfig!, newLayerGroup);
          if (groupReturned) {
            if (layerGroup) layerGroup.getLayers().push(groupReturned);
            return groupReturned;
          }
          this.layerLoadError.push({
            layer: listOfLayerEntryConfig[0].layerPath,
            loggerMessage: `Unable to create group layer ${listOfLayerEntryConfig[0].layerPath} on map ${this.mapId}`,
          });
          return undefined;
        }

        if ((listOfLayerEntryConfig[0] as AbstractBaseLayerEntryConfig).layerStatus === 'error') return undefined;
        const { layerPath } = listOfLayerEntryConfig[0];
        const baseLayer = await this.processOneLayerEntry(listOfLayerEntryConfig[0] as AbstractBaseLayerEntryConfig);
        if (baseLayer) {
          // FIXME: Temporary patch to keep the behavior until those layer classes don't exist. Looks like we won't need this anymore afterall!
          // GV Why did we need this? For the layer-sets?
          // MapEventProcessor.getMapViewerLayerAPI(this.mapId).registerLayerConfigUpdate(
          //   listOfLayerEntryConfig[0] as AbstractBaseLayerEntryConfig
          // );

          if (layerGroup) layerGroup!.getLayers().push(baseLayer!);
          return layerGroup || baseLayer;
        }
        this.layerLoadError.push({
          layer: listOfLayerEntryConfig[0].layerPath,
          loggerMessage: `Unable to create layer ${listOfLayerEntryConfig[0].layerPath} on map ${this.mapId}`,
        });
        this.getLayerConfig(layerPath)!.layerStatus = 'error';
        return undefined;
      }

      if (!layerGroup) {
        // All children of this level in the tree have the same parent, so we use the first element of the array to retrieve the parent node.
        layerGroup = this.createLayerGroup(
          (listOfLayerEntryConfig[0] as AbstractBaseLayerEntryConfig).parentLayerConfig as TypeLayerEntryConfig,
          listOfLayerEntryConfig[0].initialSettings!
        );
      }
      const promiseOfLayerCreated: Promise<BaseLayer | undefined>[] = [];
      listOfLayerEntryConfig.forEach((layerConfig, i) => {
        if (layerEntryIsGroupLayer(layerConfig)) {
          const newLayerGroup = this.createLayerGroup(listOfLayerEntryConfig[i], listOfLayerEntryConfig[i].initialSettings!);
          promiseOfLayerCreated.push(this.processListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!, newLayerGroup));
        } else if ((listOfLayerEntryConfig[i] as AbstractBaseLayerEntryConfig).layerStatus === 'error')
          promiseOfLayerCreated.push(Promise.resolve(undefined));
        else {
          promiseOfLayerCreated.push(this.processOneLayerEntry(layerConfig as AbstractBaseLayerEntryConfig));
        }
      });
      const listOfLayerCreated = await Promise.all(promiseOfLayerCreated);
      listOfLayerCreated.forEach((baseLayer, i) => {
        const { layerPath } = listOfLayerEntryConfig[i];
        if (baseLayer) {
          // FIXME: Temporary patch to keep the behavior until those layer classes don't exist. Looks like we won't need this anymore afterall!
          // GV Why did we need this? For the layer-sets?
          // const layerConfig = baseLayer?.get('layerConfig') as AbstractBaseLayerEntryConfig;
          // if (layerConfig) {
          //   if (!layerEntryIsGroupLayer(listOfLayerEntryConfig[i])) {
          //     MapEventProcessor.getMapViewerLayerAPI(this.mapId).registerLayerConfigUpdate(layerConfig);
          //   }
          layerGroup!.getLayers().push(baseLayer);
          // }
        } else {
          this.layerLoadError.push({
            layer: listOfLayerEntryConfig[i].layerPath,
            loggerMessage: `Unable to create ${
              layerEntryIsGroupLayer(listOfLayerEntryConfig[i]) ? CONST_LAYER_ENTRY_TYPES.GROUP : ''
            } layer ${listOfLayerEntryConfig[i].layerPath} on map ${this.mapId}`,
          });
          this.getLayerConfig(layerPath)!.layerStatus = 'error';
        }
      });

      return layerGroup!;
    } catch (error) {
      // Log
      logger.logError(error);
      return undefined;
    }
  }

  /** ***************************************************************************************************************************
   * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | undefined>} The GeoView layer that has been created.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer | undefined> {
    // GV IMPORTANT: The processOneLayerEntry method of all the children must call this method to ensure that the flow of
    // GV            layerStatus values is correctly sequenced.
    layerConfig.layerStatus = 'loading';
    return Promise.resolve(undefined);
  }

  /** ***************************************************************************************************************************
   * Return feature information for the layer specified.
   *
   * @param {QueryType} queryType  The type of query to perform.
   * @param {string} layerPath The layer path to the layer's configuration.
   * @param {TypeLocation} location An optionsl pixel, coordinate or polygon that will be used by the query.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  // GV Things important to know about the get feature info family of methods
  /*
   * There's no doubt that the layerConfig is correctly defined when we call these methods. The layerConfig object is created in
   * the GeoView layer constructor and has all the necessary flags to inform programmers and users whether the layer referenced by
   * a layerConfig or its layerPath is viable or not. If the layer is not visible on the map, it has probably not yet been loaded
   * or an error has occurred. If clicked on, these layers will return an empty array, as they have no features on the map. So
   * users can't expect anything to be returned after a click. They have to wait until they see something on the map to know where
   * the features are so they can click on them.
   */
  async getFeatureInfo(
    queryType: QueryType,
    layerPath: string,
    location: TypeLocation = null
  ): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // TODO: Refactor - Remove the layerPath parameter once hybrid work is done
      // Get the layer config
      const layerConfig = this.getLayerConfig(layerPath) as AbstractBaseLayerEntryConfig;

      if (!layerConfig?.source?.featureInfo?.queryable) {
        logger.logError(`Layer at path ${layerConfig.layerPath} is not queryable`);
        return null;
      }

      // Log
      logger.logTraceCore('ABSTRACT-GEOVIEW-LAYERS - getFeatureInfo', queryType, layerPath);
      const logMarkerKey = `${queryType} | ${layerPath}`;
      logger.logMarkerStart(logMarkerKey);

      let promiseGetFeature: Promise<TypeFeatureInfoEntry[] | undefined | null>;
      switch (queryType) {
        case 'all':
          promiseGetFeature = this.getAllFeatureInfo(layerPath);
          break;
        case 'at_pixel':
          promiseGetFeature = this.getFeatureInfoAtPixel(location as Pixel, layerPath);
          break;
        case 'at_coordinate':
          promiseGetFeature = this.getFeatureInfoAtCoordinate(location as Coordinate, layerPath);
          break;
        case 'at_long_lat':
          promiseGetFeature = this.getFeatureInfoAtLongLat(location as Coordinate, layerPath);
          break;
        case 'using_a_bounding_box':
          promiseGetFeature = this.getFeatureInfoUsingBBox(location as Coordinate[], layerPath);
          break;
        case 'using_a_polygon':
          promiseGetFeature = this.getFeatureInfoUsingPolygon(location as Coordinate[], layerPath);
          break;
        default:
          // Default is empty array
          promiseGetFeature = Promise.resolve([]);

          // Log
          logger.logError(`Queries using ${queryType} are invalid.`);
      }

      // Wait for results
      const arrayOfFeatureInfoEntries = await promiseGetFeature;

      // Log
      logger.logMarkerCheck(logMarkerKey, 'to getFeatureInfo', arrayOfFeatureInfoEntries);

      // Return the result
      return arrayOfFeatureInfoEntries;
    } catch (error) {
      // Log
      logger.logError(error);
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features on a layer. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected getAllFeatureInfo(layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Log
    logger.logError(`getAllFeatureInfo is not implemented! for ${layerPath}`);
    return Promise.resolve(null);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Log
    logger.logError(`getFeatureInfoAtPixel is not implemented! for ${layerPath} - ${location}`);
    return Promise.resolve(null);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected getFeatureInfoAtCoordinate(location: Coordinate, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Log
    logger.logError(`getFeatureInfoAtCoordinate is not implemented! for ${layerPath} - ${location}`);
    return Promise.resolve(null);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided longitude latitude. Returns an empty array [] when the
   * layer is not queryable.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected getFeatureInfoAtLongLat(location: Coordinate, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Log
    logger.logError(`getFeatureInfoAtLongLat is not implemented for ${layerPath} - ${location}!`);
    return Promise.resolve(null);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided bounding box. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected getFeatureInfoUsingBBox(location: Coordinate[], layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Log
    logger.logError(`getFeatureInfoUsingBBox is not implemented! for ${layerPath} - ${location}`);
    return Promise.resolve(null);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided polygon. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected getFeatureInfoUsingPolygon(location: Coordinate[], layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Log
    logger.logError(`getFeatureInfoUsingPolygon is not implemented! for ${layerPath} - ${location}`);
    return Promise.resolve(null);
  }

  /**
   * Queries the legend.
   * This function raises legend querying and queried events.
   * @returns {Promise<TypeLegend | null>} The promise when the legend (or null) will be received
   */
  queryLegend(layerPath: string): Promise<TypeLegend | null> {
    // Emit that the legend has been queried
    this.#emitLegendQuerying({ layerPath });

    // Get the legend
    const promiseLegend = this.getLegend(layerPath);

    // Whenever the promise resolves
    promiseLegend
      .then((legend) => {
        // If legend was received
        if (legend) {
          // Check for possible number of icons and set icon cache size
          this.updateIconImageCache(legend);
          // Emit legend information once retrieved
          this.#emitLegendQueried({ layerPath, legend });
        }
      })
      .catch((error) => {
        // Log
        logger.logPromiseFailed('promiseLegend in queryLegend in AbstractGeoviewLayer', error);
      });

    // Return the promise
    return promiseLegend;
  }

  /**
   * Update the size of the icon image list based on styles.
   * @param {TypeLegend} legend - The legend to check.
   */
  updateIconImageCache(legend: TypeLegend): void {
    // GV This will need to be revised if functionality to add additional icons to a layer is added
    let styleCount = this.getMapViewer().iconImageCacheSize;
    if (legend.styleConfig)
      Object.keys(legend.styleConfig).forEach((geometry) => {
        if (
          legend.styleConfig &&
          (legend.styleConfig[geometry as TypeStyleGeometry]?.styleType === 'uniqueValue' ||
            legend.styleConfig[geometry as TypeStyleGeometry]?.styleType === 'classBreaks')
        ) {
          if ((legend.styleConfig[geometry as TypeStyleGeometry] as TypeUniqueValueStyleConfig)!.uniqueValueStyleInfo?.length)
            styleCount += (legend.styleConfig[geometry as TypeStyleGeometry] as TypeUniqueValueStyleConfig)!.uniqueValueStyleInfo.length;
          if ((legend.styleConfig[geometry as TypeStyleGeometry] as TypeClassBreakStyleConfig)!.classBreakStyleInfo?.length)
            styleCount += (legend.styleConfig[geometry as TypeStyleGeometry] as TypeClassBreakStyleConfig)!.classBreakStyleInfo.length;
        }
      });
    // Set the openlayers icon image cache
    iconImageCache.setSize(styleCount);
    // Update the cache size for the map viewer
    this.getMapViewer().iconImageCacheSize = styleCount;
  }

  /** ***************************************************************************************************************************
   * Creates a layer group.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   * @param {TypeLayerInitialSettings } initialSettings Initial settings to apply to the layer.
   * @returns {LayerGroup} A new layer group.
   */
  protected createLayerGroup(layerConfig: TypeLayerEntryConfig, initialSettings: TypeLayerInitialSettings): LayerGroup {
    const layerGroupOptions: LayerGroupOptions = {
      layers: new Collection(),
      properties: { layerConfig },
    };
    if (initialSettings?.extent !== undefined) layerGroupOptions.extent = initialSettings.extent;
    if (initialSettings?.maxZoom !== undefined) layerGroupOptions.maxZoom = initialSettings.maxZoom;
    if (initialSettings?.minZoom !== undefined) layerGroupOptions.minZoom = initialSettings.minZoom;
    if (initialSettings?.states?.opacity !== undefined) layerGroupOptions.opacity = initialSettings.states.opacity;

    // Create the OpenLayer layer
    const layerGroup = new LayerGroup(layerGroupOptions);

    // Emit about it
    this.emitLayerCreation({ config: layerConfig, layer: layerGroup });

    // Return it
    return layerGroup;
  }

  /** ***************************************************************************************************************************
   * Returns the layer bounds or undefined if not defined in the layer configuration or the metadata. If projectionCode is
   * defined, returns the bounds in the specified projection otherwise use the map projection. The bounds are different from the
   * extent. They are mainly used for display purposes to show the bounding box in which the data resides and to zoom in on the
   * entire layer data. It is not used by openlayer to limit the display of data on the map.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   * @param {string | number | undefined} projectionCode Optional projection code to use for the returned bounds.
   *
   * @returns {Extent} The layer bounding box.
   */
  getMetadataBounds(layerPath: string, projectionCode: string | number | undefined = undefined): Extent | undefined {
    let bounds: Extent | undefined;
    const processGroupLayerBounds = (listOfLayerEntryConfig: ConfigBaseClass[]): void => {
      listOfLayerEntryConfig.forEach((layerConfig) => {
        if (layerEntryIsGroupLayer(layerConfig)) processGroupLayerBounds(layerConfig.listOfLayerEntryConfig);
        else if (layerConfig.initialSettings?.bounds) {
          if (!bounds)
            bounds = [
              layerConfig.initialSettings.bounds[0],
              layerConfig.initialSettings.bounds[1],
              layerConfig.initialSettings.bounds[2],
              layerConfig.initialSettings.bounds[3],
            ];
          else
            bounds = [
              Math.min(layerConfig.initialSettings.bounds[0], bounds[0]),
              Math.min(layerConfig.initialSettings.bounds[1], bounds[1]),
              Math.max(layerConfig.initialSettings.bounds[2], bounds[2]),
              Math.max(layerConfig.initialSettings.bounds[3], bounds[3]),
            ];
        }
      });
    };
    // GV The following code will need to be modified when the topmost layer of a GeoView
    // GV layer creates dynamicaly a group out of a list of layers.
    const layerConfig: ConfigBaseClass | ConfigBaseClass[] | undefined = layerPath.includes('/')
      ? this.getLayerConfig(layerPath)
      : this.listOfLayerEntryConfig;
    if (layerConfig) {
      if (Array.isArray(layerConfig)) processGroupLayerBounds(layerConfig);
      else processGroupLayerBounds([layerConfig]);

      // TODO: Check - Are the bounds initially always 4326?
      if (projectionCode && bounds) return Projection.transformExtent(bounds, `EPSG:4326`, `EPSG:${projectionCode}`);
    }
    return bounds;
  }

  /** ***************************************************************************************************************************
   * Returns the domain of the specified field or null if the field has no domain.
   *
   * @param {string} fieldName field name for which we want to get the domain.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected getFieldDomain(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): null | codedValueType | rangeDomainType {
    // Log
    logger.logWarning(`getFieldDomain is not implemented for ${fieldName} - ${layerConfig}`);
    return null;
  }

  /** ***************************************************************************************************************************
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected getFieldType(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): 'string' | 'date' | 'number' {
    // Log
    logger.logWarning(`getFieldType is not implemented for ${fieldName} - ${layerConfig}`);
    return 'string';
  }

  /** ***************************************************************************************************************************
   * Return the extent of the layer or undefined if it will be visible regardless of extent. The layer extent is an array of
   * numbers representing an extent: [minx, miny, maxx, maxy]. This routine return undefined when the layer path can't be found.
   * The extent is used to clip the data displayed on the map.
   *
   * @param {string} layerPath Layer path to the layer's configuration.
   *
   * @returns {Extent | undefined} The layer extent.
   */
  getExtent(layerPath: string): Extent | undefined {
    const olLayer = this.getOLLayer(layerPath);
    return olLayer?.getExtent();
  }

  /** ***************************************************************************************************************************
   * set the extent of the layer. Use undefined if it will be visible regardless of extent. The layer extent is an array of
   * numbers representing an extent: [minx, miny, maxx, maxy]. This routine does nothing when the layerPath specified is not
   * found.
   *
   * @param {Extent} layerExtent The extent to assign to the layer.
   * @param {string} layerPath The layer path to the layer's configuration.
   */
  setExtent(layerExtent: Extent, layerPath: string): void {
    const olLayer = this.getOLLayer(layerPath);
    if (olLayer) olLayer.setExtent(layerExtent);
  }

  /** ***************************************************************************************************************************
   * Return the opacity of the layer (between 0 and 1). This routine return undefined when the layerPath specified is not found.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {number | undefined} The opacity of the layer.
   */
  getOpacity(layerPath: string): number | undefined {
    const olLayer = this.getOLLayer(layerPath);
    return olLayer?.getOpacity();
  }

  /** ***************************************************************************************************************************
   * Set the opacity of the layer (between 0 and 1). This routine does nothing when the layerPath specified is not found.
   *
   * @param {number} layerOpacity The opacity of the layer.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   */
  setOpacity(layerOpacity: number, layerPath: string): void {
    const olLayer = this.getOLLayer(layerPath);
    if (olLayer) {
      olLayer.setOpacity(layerOpacity);
      this.#emitLayerOpacityChanged({ layerPath, opacity: layerOpacity });
    }
  }

  /** ***************************************************************************************************************************
   * Return the visibility of the layer (true or false). This routine return undefined when the layerPath specified is not found.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {boolean | undefined} The visibility of the layer.
   */
  getVisible(layerPath: string): boolean | undefined {
    const olLayer = this.getOLLayer(layerPath);
    return olLayer?.getVisible();
  }

  /** ***************************************************************************************************************************
   * Set the visibility of the layer (true or false). This routine does nothing when the layerPath specified is not found.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string} layerPath The layer path to the layer's configuration.
   */
  setVisible(layerVisibility: boolean, layerPath: string): void {
    const olLayer = this.getOLLayer(layerPath);
    if (olLayer) {
      const curVisible = this.getVisible(layerPath);
      olLayer.setVisible(layerVisibility);
      // olLayer.changed();
      if (layerVisibility !== curVisible) this.#emitVisibleChanged({ visible: layerVisibility });
    }
  }

  /** ***************************************************************************************************************************
   * Return the min zoom of the layer. This routine return undefined when the layerPath specified is not found.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {number | undefined} The min zoom of the layer.
   */
  getMinZoom(layerPath: string): number | undefined {
    const olLayer = this.getOLLayer(layerPath);
    return olLayer?.getMinZoom();
  }

  /** ***************************************************************************************************************************
   * Set the min zoom of the layer. This routine does nothing when the layerPath specified is not found.
   *
   * @param {boolean} layerVisibility The min zoom of the layer.
   * @param {string} layerPath The layer path to the layer's configuration.
   */
  setMinZoom(minZoom: number, layerPath: string): void {
    const olLayer = this.getOLLayer(layerPath);
    if (olLayer) olLayer.setMinZoom(minZoom);
  }

  /** ***************************************************************************************************************************
   * Return the max zoom of the layer. This routine return undefined when the layerPath specified is not found.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {number | undefined} The max zoom of the layer.
   */
  getMaxZoom(layerPath: string): number | undefined {
    const olLayer = this.getOLLayer(layerPath);
    return olLayer?.getMaxZoom();
  }

  /** ***************************************************************************************************************************
   * Set the max zoom of the layer. This routine does nothing when the layerPath specified is not found.
   *
   * @param {boolean} layerVisibility The max zoom of the layer.
   * @param {string} layerPath The layer path to the layer's configuration.
   */
  setMaxZoom(maxZoom: number, layerPath: string): void {
    const olLayer = this.getOLLayer(layerPath);
    if (olLayer) olLayer.setMaxZoom(maxZoom);
  }

  /** ***************************************************************************************************************************
   * Overridable function returning the legend of the layer. Returns null when the layerPath specified is not found. If the style property
   * of the layerConfig object is undefined, the legend property of the object returned will be null.
   * @param {string} layerPath The layer path to the layer's configuration.
   * @returns {Promise<TypeLegend | null>} The legend of the layer.
   */
  async getLegend(layerPath: string): Promise<TypeLegend | null> {
    try {
      // Get the legend using the layer information and layer styling
      const legend: TypeLegend = {
        type: this.type,
        styleConfig: this.getStyle(layerPath),
        legend: await getLegendStyles(this.getStyle(layerPath)),
      };
      return legend;
    } catch (error) {
      // Log
      logger.logError(error);
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * Get and format the value of the field with the name passed in parameter. Vector GeoView layers convert dates to milliseconds
   * since the base date. Vector feature dates must be in ISO format.
   *
   * @param {Feature} features The features that hold the field values.
   * @param {string} fieldName The field name.
   * @param {'number' | 'string' | 'date'} fieldType The field type.
   *
   * @returns {string | number | Date} The formatted value of the field.
   */
  protected getFieldValue(feature: Feature, fieldName: string, fieldType: 'number' | 'string' | 'date'): string | number | Date {
    const fieldValue = feature.get(fieldName);
    let returnValue: string | number | Date;
    if (fieldType === 'date') {
      if (typeof fieldValue === 'string') {
        if (!this.serverDateFragmentsOrder)
          this.serverDateFragmentsOrder = DateMgt.getDateFragmentsOrder(DateMgt.deduceDateFormat(fieldValue));
        returnValue = DateMgt.applyInputDateFormat(fieldValue, this.serverDateFragmentsOrder);
      } else {
        // All vector dates are kept internally in UTC.
        returnValue = DateMgt.convertToUTC(`${DateMgt.convertMilisecondsToDate(fieldValue)}Z`);
      }
      const reverseTimeZone = true;
      if (this.externalFragmentsOrder)
        returnValue = DateMgt.applyOutputDateFormat(returnValue, this.externalFragmentsOrder, reverseTimeZone);
      return returnValue;
    }
    return fieldValue;
  }

  /** ***************************************************************************************************************************
   * Convert the feature information to an array of TypeFeatureInfoEntry[] | undefined | null.
   *
   * @param {Feature[]} features The array of features to convert.
   * @param {ImageLayerEntryConfig | VectorLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The Array of feature information.
   */
  protected async formatFeatureInfoResult(
    features: Feature[],
    layerConfig: OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig
  ): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      if (!features.length) return [];

      // Will hold the generic icon to use in formatting
      let genericLegendInfo: string | null | undefined;
      // We only want 1 task to fetch the generic legend (when we have to)
      const semaphore = new AsyncSemaphore(1);

      // Will be executed when we have to use a default canvas for a particular feature
      const callbackToFetchDataUrl = (): Promise<string | null> => {
        // Make sure one task at a time in this
        return semaphore.withLock(async () => {
          // Only execute this once in the callback. After this, once the semaphore is unlocked, it's either a string or null for as long as we're formatting
          if (genericLegendInfo === undefined) {
            genericLegendInfo = null; // Turn it to null, we are actively trying to find something (not undefined anymore)
            const legend = await this.queryLegend(layerConfig.layerPath);
            const legendIcons = LegendEventProcessor.getLayerIconImage(legend);
            if (legendIcons) genericLegendInfo = legendIcons![0].iconImage || null;
          }
          return genericLegendInfo;
        });
      };

      const featureInfo = layerConfig?.source?.featureInfo;
      const fieldTypes = featureInfo?.fieldTypes?.split(',') as ('string' | 'number' | 'date')[];
      const outfields = getLocalizedValue(
        featureInfo?.outfields as TypeLocalizedString,
        AppEventProcessor.getDisplayLanguage(this.mapId)
      )?.split(',');
      const aliasFields = getLocalizedValue(
        featureInfo?.aliasFields as TypeLocalizedString,
        AppEventProcessor.getDisplayLanguage(this.mapId)
      )?.split(',');

      // Loop on the features to build the array holding the promises for their canvas
      const promisedAllCanvasFound: Promise<{ feature: Feature; canvas: HTMLCanvasElement }>[] = [];
      features.forEach((featureNeedingItsCanvas) => {
        promisedAllCanvasFound.push(
          new Promise((resolveCanvas) => {
            getFeatureCanvas(
              featureNeedingItsCanvas,
              this.getStyle(layerConfig.layerPath)!,
              layerConfig.filterEquation,
              layerConfig.legendFilterIsOff,
              callbackToFetchDataUrl
            )
              .then((canvas) => {
                resolveCanvas({ feature: featureNeedingItsCanvas, canvas });
              })
              .catch((error) => {
                // Log
                logger.logPromiseFailed(
                  'getFeatureCanvas in featureNeedingItsCanvas loop in formatFeatureInfoResult in AbstractGeoViewLayer',
                  error
                );
              });
          })
        );
      });

      // Hold a dictionary built on the fly for the field domains
      const dictFieldDomains: { [fieldName: string]: codedValueType | rangeDomainType | null } = {};
      // Hold a dictionary build on the fly for the field types
      const dictFieldTypes: { [fieldName: string]: 'string' | 'number' | 'date' } = {};

      // Loop on the promised feature infos
      let featureKeyCounter = 0;
      let fieldKeyCounter = 0;
      const queryResult: TypeFeatureInfoEntry[] = [];
      const arrayOfFeatureInfo = await Promise.all(promisedAllCanvasFound);
      arrayOfFeatureInfo.forEach(({ feature, canvas }) => {
        let extent;
        if (feature.getGeometry()) extent = feature.getGeometry()!.getExtent();

        const featureInfoEntry: TypeFeatureInfoEntry = {
          // feature key for building the data-grid
          featureKey: featureKeyCounter++,
          geoviewLayerType: this.type,
          extent,
          geometry: feature,
          featureIcon: canvas,
          fieldInfo: {},
          nameField:
            getLocalizedValue(
              layerConfig?.source?.featureInfo?.nameField as TypeLocalizedString,
              AppEventProcessor.getDisplayLanguage(this.mapId)
            ) || null,
        };

        const featureFields = feature.getKeys();
        featureFields.forEach((fieldName) => {
          if (fieldName !== 'geometry') {
            // Calculate the field domain if not already calculated
            if (!(fieldName in dictFieldDomains)) {
              // Calculate it
              dictFieldDomains[fieldName] = this.getFieldDomain(fieldName, layerConfig);
            }
            const fieldDomain = dictFieldDomains[fieldName];

            // Calculate the field type if not already calculated
            if (!(fieldName in dictFieldTypes)) {
              dictFieldTypes[fieldName] = this.getFieldType(fieldName, layerConfig);
            }
            const fieldType = dictFieldTypes[fieldName];

            if (outfields?.includes(fieldName)) {
              const fieldIndex = outfields.indexOf(fieldName);
              featureInfoEntry.fieldInfo[fieldName] = {
                fieldKey: fieldKeyCounter++,
                value: this.getFieldValue(feature, fieldName, fieldTypes![fieldIndex]),
                dataType: fieldTypes![fieldIndex] as 'string' | 'date' | 'number',
                alias: aliasFields![fieldIndex],
                domain: fieldDomain,
              };
            } else if (!outfields) {
              featureInfoEntry.fieldInfo[fieldName] = {
                fieldKey: fieldKeyCounter++,
                value: this.getFieldValue(feature, fieldName, fieldType),
                dataType: fieldType,
                alias: fieldName,
                domain: fieldDomain,
              };
            }
          }
        });
        queryResult.push(featureInfoEntry);
      });
      return queryResult;
    } catch (error) {
      // Log
      logger.logError(error);
      return [];
    }
  }

  /** ***************************************************************************************************************************
   * Get the layerFilter that is associated to the layer. Returns undefined when the layer config can't be found using the layer
   * path.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {string | undefined} The filter associated to the layer or undefined.
   */
  getLayerFilter(layerPath: string): string | undefined {
    const layerConfig = this.getLayerConfig(layerPath);
    // TODO: Refactor to put the 'layerFilter' at the right place. Meanwhile, using `any` here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (layerConfig as any)?.layerFilter;
  }

  /**
   * Overridable function called when the layer gets in loaded status.
   * @param layerConfig - The layer configuration
   */
  onLoaded(layerConfig: AbstractBaseLayerEntryConfig): void {
    // Set loaded
    layerConfig.layerStatus = 'loaded';

    // Emit event
    this.#emitIndividualLayerLoaded({ layerPath: layerConfig.layerPath });

    // Set visibility
    this.setVisible(layerConfig.initialSettings?.states?.visible !== false, layerConfig.layerPath);
  }

  /**
   * Overridable function called when the layer gets in error status.
   * @param layerConfig - The layer configuration
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  onError(layerConfig: AbstractBaseLayerEntryConfig): void {
    // Set error
    layerConfig.layerStatus = 'error';
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   *
   * @returns {Extent} The new layer bounding box.
   */
  abstract getBounds(layerPath: string): Extent | undefined;

  /**
   * Overridable function that gets the extent of an array of features.
   * @param {string} layerPath - The layer path
   * @param {string[]} objectIds - The IDs of features to get extents from.
   * @returns {Promise<Extent | undefined>} The extent of the features, if available
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  getExtentFromFeatures(layerPath: string, objectIds: string[]): Promise<Extent | undefined> {
    logger.logError(`Feature geometry for ${objectIds} is unavailable from ${layerPath}`);
    return Promise.resolve(undefined);
  }

  /** ***************************************************************************************************************************
   * Set the layerStatus code of all layers in the listOfLayerEntryConfig.
   *
   * @param {TypeLayerStatus} newStatus The new status to assign to the layers.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer's configuration.
   * @param {string} errorMessage The error message.
   */
  setAllLayerStatusTo(newStatus: TypeLayerStatus, listOfLayerEntryConfig: TypeLayerEntryConfig[], errorMessage?: string): void {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      if (layerEntryIsGroupLayer(layerConfig)) this.setAllLayerStatusTo(newStatus, layerConfig.listOfLayerEntryConfig, errorMessage);
      else {
        if (layerConfig.layerStatus === 'error') return;
        layerConfig.layerStatus = newStatus;
        if (newStatus === 'error') {
          const { layerPath } = layerConfig;
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `${errorMessage} for layer ${layerPath} of map ${this.mapId}`,
          });
        }
      }
    });
  }

  /** ***************************************************************************************************************************
   * Recursively processes the list of layer entries to see if all of them are greater than or equal to the provided layer status.
   * @param {TypeLayerStatus} layerStatus The layer status to compare with the internal value of the config.
   * @returns {boolean} true when all layers are greater than or equal to the layerStatus parameter.
   */
  allLayerStatusAreGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean {
    // Redirect
    return ConfigBaseClass.allLayerStatusAreGreaterThanOrEqualTo(layerStatus, this.listOfLayerEntryConfig);
  }

  /**
   * Returns a Promise that will be resolved once the given layer is in a processed phase.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * @param {AbstractGeoViewLayer} geoviewLayerConfig - The layer object
   * @param {number} timeout - Optionally indicate the timeout after which time to abandon the promise
   * @param {number} checkFrequency - Optionally indicate the frequency at which to check for the condition on the layerabstract
   * @returns {Promise<void>} A promise when done waiting
   * @throws An exception when the layer failed to become in processed phase before the timeout expired
   */
  async waitForAllLayerStatusAreGreaterThanOrEqualTo(timeout?: number, checkFrequency?: number): Promise<void> {
    // Wait for the processed phase
    await whenThisThen(
      () => {
        return this.allLayerStatusAreGreaterThanOrEqualTo('processed');
      },
      timeout,
      checkFrequency
    );

    // Resolve successfully, otherwise an exception has been thrown already
    return Promise.resolve();
  }

  /**
   * The olLayerAndLoadEndListeners setter method for the ConfigBaseClass class and its descendant classes.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration we are creating a layer for.
   * @param {BaseLayer} olLayer - The OpenLayer we are creating
   * @param {TypeLoadEndListenerType} listenerType - The layer listener type.
   */
  setLayerAndLoadEndListeners(layerConfig: AbstractBaseLayerEntryConfig, olLayer: BaseLayer, listenerType: TypeLoadEndListenerType): void {
    // Precond:
    if (!olLayer) throw new Error(`An OpenLayer must be provided to register listeners. Layer path ${layerConfig.layerPath}`);
    if (!listenerType) throw new Error(`A listenerType must be provided to register listeners. Layer path ${layerConfig.layerPath}`);

    // If in old LAYERS_HYBRID_MODE (in the new LAYERS_HYBRID_MODE we want the new classes to handle that)
    if (!LayerApi.LAYERS_HYBRID_MODE) {
      // Group layers have no listener
      if (layerConfig.entryType !== CONST_LAYER_ENTRY_TYPES.GROUP) {
        let loadErrorListener: () => void;

        // Definition of the load end listener functions
        const loadEndListener = (): void => {
          // Call the overridable loaded function
          this.onLoaded(layerConfig);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (olLayer! as any).get('source').un(`${listenerType}loaderror`, loadErrorListener);
        };

        loadErrorListener = (): void => {
          // Call the overridable error function
          this.onError(layerConfig);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (olLayer! as any).get('source').un(`${listenerType}loadend`, loadEndListener);
        };

        // Activation of the load end listeners
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (olLayer! as any).get('source').once(`${listenerType}loaderror`, loadErrorListener);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (olLayer! as any).get('source').once(`${listenerType}loadend`, loadEndListener);
      }
    }
  }

  /**
   * Recursively gets all layer entry configs in the GeoView Layer.
   * @returns {ConfigBaseClass[]} The list of layer entry configs
   */
  getAllLayerEntryConfigs(): ConfigBaseClass[] {
    // Prepare the container
    const allLayerEntryConfigs: ConfigBaseClass[] = [];

    // Call recursive method on each root
    this.listOfLayerEntryConfig.forEach((layerEntryConfig) => {
      // Call
      this.#getAllLayerEntryConfigsRec(allLayerEntryConfigs, layerEntryConfig);
    });

    // Return the list
    return allLayerEntryConfigs;
  }

  /**
   * Recursively gathers the layer entry configs
   * @param {ConfigBaseClass[]} totalList - The total gathered thus far
   * @param {TypeLayerEntryConfig} currentNode - The current layer entry config being worked on
   */
  #getAllLayerEntryConfigsRec(totalList: ConfigBaseClass[], currentNode: TypeLayerEntryConfig): void {
    // Add it
    totalList.push(currentNode);

    // For each children
    currentNode.listOfLayerEntryConfig?.forEach((layerEntryConfig) => {
      // Go recursive
      this.#getAllLayerEntryConfigsRec(totalList, layerEntryConfig);
    });
  }

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {LayerNameChangedEvent} event - The event to emit
   * @private
   */
  #emitLayerNameChanged(event: LayerNameChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerNameChangedHandlers, event);
  }

  /**
   * Registers a layer name changed event handler.
   * @param {LayerNameChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerNameChanged(callback: LayerNameChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerNameChangedHandlers, callback);
  }

  /**
   * Unregisters a layer name changed event handler.
   * @param {LayerNameChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerNameChanged(callback: LayerNameChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerNameChangedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LegendQueryingEvent} event The event to emit
   * @private
   */
  #emitLegendQuerying(event: LegendQueryingEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLegendQueryingHandlers, event);
  }

  /**
   * Registers a legend querying event handler.
   * @param {LegendQueryingDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLegendQuerying(callback: LegendQueryingDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLegendQueryingHandlers, callback);
  }

  /**
   * Unregisters a legend querying event handler.
   * @param {LegendQueryingDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLegendQuerying(callback: LegendQueryingDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLegendQueryingHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LegendQueriedEvent} event The event to emit
   * @private
   */
  #emitLegendQueried(event: LegendQueriedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLegendQueriedHandlers, event);
  }

  /**
   * Registers a legend queried event handler.
   * @param {LegendQueriedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLegendQueried(callback: LegendQueriedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLegendQueriedHandlers, callback);
  }

  /**
   * Unregisters a legend queried event handler.
   * @param {LegendQueriedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLegendQueried(callback: LegendQueriedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLegendQueriedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {VisibleChangedEvent} event The event to emit
   * @private
   */
  #emitVisibleChanged(event: VisibleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onVisibleChangedHandlers, event);
  }

  /**
   * Registers a visible changed event handler.
   * @param {VisibleChangedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onVisibleChanged(callback: VisibleChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onVisibleChangedHandlers, callback);
  }

  /**
   * Unregisters a visible changed event handler.
   * @param {VisibleChangedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offVisibleChanged(callback: VisibleChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onVisibleChangedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerEntryProcessedEvent} event The event to emit
   * @private
   */
  #emitLayerEntryProcessed(event: LayerEntryProcessedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerEntryProcessedHandlers, event);
  }

  /**
   * Registers a layer entry config processed event handler.
   * @param {LayerEntryProcessedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerEntryProcessed(callback: LayerEntryProcessedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerEntryProcessedHandlers, callback);
  }

  /**
   * Unregisters a layer entry config processed event handler.
   * @param {LayerEntryProcessedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerEntryProcessed(callback: LayerEntryProcessedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerEntryProcessedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerRequestingEvent} event The event to emit
   * @private
   */
  protected emitLayerRequesting(event: LayerRequestingEvent): (BaseLayer | undefined)[] {
    // Emit the event for all handlers
    return EventHelper.emitEvent(this, this.#onLayerRequestingHandlers, event);
  }

  /**
   * Registers a layer creation event handler.
   * @param {LayerRequestingDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerRequesting(callback: LayerRequestingDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerRequestingHandlers, callback);
  }

  /**
   * Unregisters a layer creation event handler.
   * @param {LayerRequestingDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerRequesting(callback: LayerRequestingDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerRequestingHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerCreationEvent} event The event to emit
   * @private
   */
  protected emitLayerCreation(event: LayerCreationEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerCreationHandlers, event);
  }

  /**
   * Registers a layer creation event handler.
   * @param {LayerCreationDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerCreation(callback: LayerCreationDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerCreationHandlers, callback);
  }

  /**
   * Unregisters a layer creation event handler.
   * @param {LayerCreationDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerCreation(callback: LayerCreationDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerCreationHandlers, callback);
  }

  /**
   * Emits filter applied event.
   * @param {FilterAppliedEvent} event - The event to emit
   * @private
   */
  protected emitLayerFilterApplied(event: LayerFilterAppliedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerFilterAppliedHandlers, event);
  }

  /**
   * Registers a filter applied event handler.
   * @param {FilterAppliedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerFilterApplied(callback: LayerFilterAppliedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerFilterAppliedHandlers, callback);
  }

  /**
   * Unregisters a filter applied event handler.
   * @param {FilterAppliedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerFilterApplied(callback: LayerFilterAppliedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerFilterAppliedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerStyleChangedEvent} event - The event to emit
   */
  #emitLayerStyleChanged(event: LayerStyleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerStyleChangedHandlers, event);
  }

  /**
   * Registers a layer style changed event handler.
   * @param {LayerStyleChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerStyleChanged(callback: LayerStyleChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerStyleChangedHandlers, callback);
  }

  /**
   * Unregisters a layer style changed event handler.
   * @param {LayerStyleChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerStyleChanged(callback: LayerStyleChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerStyleChangedHandlers, callback);
  }

  /**
   * Emits opacity changed event.
   * @param {LayerOpacityChangedEvent} event - The event to emit
   * @private
   */
  #emitLayerOpacityChanged(event: LayerOpacityChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerOpacityChangedHandlers, event);
  }

  /**
   * Registers an opacity changed event handler.
   * @param {LayerOpacityChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerOpacityChanged(callback: LayerOpacityChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerOpacityChangedHandlers, callback);
  }

  /**
   * Unregisters an opacity changed event handler.
   * @param {LayerOpacityChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerOpacityChanged(callback: LayerOpacityChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerOpacityChangedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when the layer's features have been loaded on the map.
   * @param {IndividualLayerLoadedEvent} event - The event to emit
   * @private
   */
  #emitIndividualLayerLoaded(event: IndividualLayerLoadedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onIndividualLayerLoadedHandlers, event);
  }

  /**
   * Registers an individual layer loaded event handler.
   * @param {IndividualLayerLoadedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onIndividualLayerLoaded(callback: IndividualLayerLoadedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onIndividualLayerLoadedHandlers, callback);
  }

  /**
   * Unregisters an individual layer loaded event handler.
   * @param {IndividualLayerLoadedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offIndividualLayerLoaded(callback: IndividualLayerLoadedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onIndividualLayerLoadedHandlers, callback);
  }

  // #endregion
}

/**
 * Define an event for the delegate
 */
export type LegendQueryingEvent = {
  layerPath: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type LegendQueryingDelegate = EventDelegateBase<AbstractGeoViewLayer, LegendQueryingEvent, void>;

/**
 * Define an event for the delegate
 */
export type LegendQueriedEvent = {
  layerPath: string;
  legend: TypeLegend;
};

/**
 * Define a delegate for the event handler function signature
 */
type LegendQueriedDelegate = EventDelegateBase<AbstractGeoViewLayer, LegendQueriedEvent, void>;

/**
 * Define an event for the delegate
 */
export type VisibleChangedEvent = {
  visible: boolean;
};

/**
 * Define a delegate for the event handler function signature
 */
type VisibleChangedDelegate = EventDelegateBase<AbstractGeoViewLayer, VisibleChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerEntryProcessedEvent = {
  config: ConfigBaseClass;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerEntryProcessedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerEntryProcessedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerRequestingEvent = {
  // The configuration associated with the layer to be created
  config: ConfigBaseClass;
  // The OpenLayers source associated with the layer to be created
  source: Source;
  // Extra configuration can be anything (for simplicity)
  extraConfig?: unknown;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerRequestingDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerRequestingEvent, BaseLayer | undefined>;

/**
 * Define an event for the delegate
 */
export type LayerCreationEvent = {
  // The configuration associated with the created layer
  config: ConfigBaseClass;
  // The created layer
  layer: BaseLayer;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerCreationDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerCreationEvent, void>;

export interface TypeWmsLegendStyle {
  name: string;
  legend: HTMLCanvasElement | null;
}

/**
 * Define a delegate for the event handler function signature
 */
type LayerFilterAppliedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerFilterAppliedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerFilterAppliedEvent = {
  // The layer path of the affected layer
  layerPath: string;
  // The filter
  filter: string;
};

/**
 * Define a delegate for the event handler function signature.
 */
type LayerNameChangedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerNameChangedEvent, void>;

/**
 * Define an event for the delegate.
 */
export type LayerNameChangedEvent = {
  // The new layer name.
  layerName?: TypeLocalizedString;
  // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
  // The layer path.
  layerPath: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerOpacityChangedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerOpacityChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerOpacityChangedEvent = {
  // The layer path of the affected layer
  layerPath: string;
  // The filter
  opacity: number;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerStyleChangedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerStyleChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerStyleChangedEvent = {
  // The style
  style: TypeStyleConfig;

  // TODO: Refactor - After layers refactoring, remove the layerPath parameter here
  layerPath: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type IndividualLayerLoadedDelegate = EventDelegateBase<AbstractGeoViewLayer, IndividualLayerLoadedEvent, void>;

/**
 * Define an event for the delegate
 */
export type IndividualLayerLoadedEvent = {
  // The loaded layer
  layerPath: string;
};

export interface TypeWmsLegend extends Omit<TypeLegend, 'styleConfig'> {
  legend: HTMLCanvasElement | null;
  styles?: TypeWmsLegendStyle[];
}

export interface TypeImageStaticLegend extends Omit<TypeLegend, 'styleConfig'> {
  legend: HTMLCanvasElement | null;
}

export interface TypeVectorLegend extends TypeLegend {
  legend: TypeVectorLayerStyles;
}

export type TypeStyleRepresentation = {
  /** The defaultCanvas property is used by Simple styles and default styles when defined in unique value and class
   * break styles.
   */
  defaultCanvas?: HTMLCanvasElement | null;
  /** The arrayOfCanvas property is used by unique value and class break styles. */
  arrayOfCanvas?: (HTMLCanvasElement | null)[];
};
export type TypeVectorLayerStyles = Partial<Record<TypeStyleGeometry, TypeStyleRepresentation>>;

/** ******************************************************************************************************************************
 * GeoViewAbstractLayers types
 */

// GV: CONFIG EXTRACTION
// GV: This section of code was extracted and copied to the geoview config section
// GV: |||||
// GV: vvvvv

// Definition of the keys used to create the constants of the GeoView layer
// TODO: Refactor - Move this and related types/const below lower in the architecture? Say, to MapSchemaTypes? Otherwise, things circle..
type LayerTypesKey =
  | 'CSV'
  | 'ESRI_DYNAMIC'
  | 'ESRI_FEATURE'
  | 'ESRI_IMAGE'
  | 'IMAGE_STATIC'
  | 'GEOJSON'
  | 'GEOPACKAGE'
  | 'XYZ_TILES'
  | 'VECTOR_TILES'
  | 'OGC_FEATURE'
  | 'WFS'
  | 'WMS';

/**
 * Type of GeoView layers
 */
export type TypeGeoviewLayerType =
  | 'CSV'
  | 'esriDynamic'
  | 'esriFeature'
  | 'esriImage'
  | 'imageStatic'
  | 'GeoJSON'
  | 'GeoPackage'
  | 'xyzTiles'
  | 'vectorTiles'
  | 'ogcFeature'
  | 'ogcWfs'
  | 'ogcWms';

/**
 * This type is created to only be used when validating the configuration schema types.
 * Indeed, GeoCore is not an official Abstract Geoview Layer, but it can be used in schema types.
 */
export type TypeGeoviewLayerTypeWithGeoCore = TypeGeoviewLayerType | typeof CONST_LAYER_ENTRY_TYPES.GEOCORE;

/**
 * Definition of the GeoView layer constants
 */
export const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType> = {
  CSV: 'CSV',
  ESRI_DYNAMIC: 'esriDynamic',
  ESRI_FEATURE: 'esriFeature',
  ESRI_IMAGE: 'esriImage',
  IMAGE_STATIC: 'imageStatic',
  GEOJSON: 'GeoJSON',
  GEOPACKAGE: 'GeoPackage',
  XYZ_TILES: 'xyzTiles',
  VECTOR_TILES: 'vectorTiles',
  OGC_FEATURE: 'ogcFeature',
  WFS: 'ogcWfs',
  WMS: 'ogcWms',
};

/**
 * Definition of the sub schema to use for each type of Geoview layer
 */
export const CONST_GEOVIEW_SCHEMA_BY_TYPE: Record<TypeGeoviewLayerType, string> = {
  CSV: 'TypeVectorLayerEntryConfig',
  imageStatic: 'TypeImageStaticLayerEntryConfig',
  esriDynamic: 'TypeEsriDynamicLayerEntryConfig',
  esriFeature: 'TypeVectorLayerEntryConfig',
  esriImage: 'TypeEsriImageLayerEntryConfig',
  GeoJSON: 'TypeVectorLayerEntryConfig',
  GeoPackage: 'TypeVectorLayerEntryConfig',
  xyzTiles: 'TypeTileLayerEntryConfig',
  vectorTiles: 'TypeTileLayerEntryConfig',
  ogcFeature: 'TypeVectorLayerEntryConfig',
  ogcWfs: 'TypeVectorLayerEntryConfig',
  ogcWms: 'TypeOgcWmsLayerEntryConfig',
};

// GV: ^^^^^
// GV: |||||
const validVectorLayerLegendTypes: TypeGeoviewLayerType[] = [
  CONST_LAYER_TYPES.CSV,
  CONST_LAYER_TYPES.GEOJSON,
  CONST_LAYER_TYPES.ESRI_DYNAMIC,
  CONST_LAYER_TYPES.ESRI_FEATURE,
  CONST_LAYER_TYPES.ESRI_IMAGE,
  CONST_LAYER_TYPES.OGC_FEATURE,
  CONST_LAYER_TYPES.WFS,
  CONST_LAYER_TYPES.GEOPACKAGE,
];

/**
 * type guard function that redefines a TypeLegend as a TypeVectorLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const isVectorLegend = (verifyIfLegend: TypeLegend): verifyIfLegend is TypeVectorLegend => {
  return validVectorLayerLegendTypes.includes(verifyIfLegend?.type);
};

/**
 * type guard function that redefines a TypeLegend as a TypeWmsLegend
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const isWmsLegend = (verifyIfLegend: TypeLegend): verifyIfLegend is TypeWmsLegend => {
  return verifyIfLegend?.type === CONST_LAYER_TYPES.WMS;
};

/**
 * type guard function that redefines a TypeLegend as a TypeImageStaticLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const isImageStaticLegend = (verifyIfLegend: TypeLegend): verifyIfLegend is TypeImageStaticLegend => {
  return verifyIfLegend?.type === CONST_LAYER_TYPES.IMAGE_STATIC;
};
