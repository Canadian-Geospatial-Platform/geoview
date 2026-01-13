import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { Extent, TypeLayerStyleConfig } from '@/api/types/map-schema-types';
import type {
  ConfigClassOrType,
  TypeBaseSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeGeoviewLayerType,
  TypeLayerEntryType,
  TypeLayerInitialSettings,
  TypeLayerStatus,
  TypeTileGrid,
  TypeValidSourceProjectionCodes,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';
import { LAYER_STATUS } from '@/core/utils/constant';
import type { GroupLayerEntryConfig, GroupLayerEntryConfigProps } from './group-layer-entry-config';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';
import type { TimeDimension, TypeDateFragments } from '@/core/utils/date-mgt';
import { DateMgt } from '@/core/utils/date-mgt';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { GeoUtilities } from '@/geo/utils/utilities';
import { deepMerge } from '@/core/utils/utilities';

export interface ConfigBaseClassProps {
  layerId: string;
  geoviewLayerConfig: TypeGeoviewLayerConfig;
  schemaTag?: TypeGeoviewLayerType; // This property isn't necessary in the config as the class handles them, but we have it explicit here for the ConfigClassOrType thing.
  entryType?: TypeLayerEntryType; // This property isn't necessary in the config as the class handles them, but we have it explicit here for the ConfigClassOrType thing.
  layerPath?: string; // This property isn't necessary in the config, but we have it explicit here for the ConfigClassOrType thing.
  layerName?: string;
  initialSettings?: TypeLayerInitialSettings;
  source?: TypeBaseSourceInitialConfig;
  minScale?: number;
  maxScale?: number;
  isMetadataLayerGroup?: boolean;
  parentLayerConfig?: GroupLayerEntryConfig;
  attributions?: string[];
  bounds?: number[];
  timeDimension?: TimeDimension;
  layerStyle?: TypeLayerStyleConfig;
  wmsLayerId?: string;
  wfsLayerId?: string;
}

/**
 * Base type used to define a GeoView layer to display on the map. Unless specified,its properties are not part of the schema.
 */
export abstract class ConfigBaseClass {
  /** The identifier of the layer to display on the map. This element is part of the schema. */
  // TODO: This should be #layerId. We should use getLayerId() and setLayerId() instead and fix the issues that come up when doing so. Same with other attributes.
  // GV Cannot put it #layerId as it breaks things
  layerId: string;

  /** The layer entry properties used to create the layer entry config */
  protected layerEntryProps: ConfigBaseClassProps;

  /** The schema tag for the layer entry config */
  #schemaTag: TypeGeoviewLayerType;

  /** The entry type for the layer entry config */
  #entryType: TypeLayerEntryType;

  /** The display name of the layer. */
  #layerName?: string;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  #initialSettings?: TypeLayerInitialSettings;

  /** It is used to identified unprocessed layers and shows the final layer state */
  #layerStatus: TypeLayerStatus = 'newInstance';

  /** The min scale that can be reached by the layer. */
  #minScale?: number;

  /** The max scale that can be reached by the layer. */
  #maxScale?: number;

  /** It is used internally to distinguish layer groups derived from the metadata. */
  #isMetadataLayerGroup: boolean;

  /** Keep all callback delegates references */
  #onLayerStatusChangedHandlers: LayerStatusChangedDelegate[] = [];

  // The layer status weigths
  static #layerStatusWeight = {
    newInstance: 10,
    registered: 20,
    processing: 30,
    processed: 40,
    loading: 50,
    loaded: 60,
    error: 70,
  };

  /**
   * The class constructor.
   * @param {ConfigClassOrType} layerConfig - The layer configuration we want to instanciate.
   */
  // TODO: Refactor - There is an oddity inside LayerApi.addGeoviewLayer to the effect that it's calling validateListOfGeoviewLayerConfig even if it was already called in config-validation.
  // TO.DOCONT: Until this is fixed, this constructor supports sending a ConfigBaseClass in its typing, for now (ConfigClassOrType = ConfigBaseClassProps | ConfigBaseClass)... though it should only be a ConfigBaseClassProps eventually.
  protected constructor(layerConfig: ConfigClassOrType, schemaTag: TypeGeoviewLayerType, entryType: TypeLayerEntryType) {
    // Transfer the properties from the object to the class (without using Object.assign anymore)
    this.layerEntryProps = ConfigBaseClass.getClassOrTypeLayerEntryProps(layerConfig);
    this.layerId = layerConfig.layerId;
    this.#schemaTag = schemaTag;
    this.#entryType = entryType;
    this.#layerName = ConfigBaseClass.getClassOrTypeLayerName(layerConfig);
    this.#initialSettings = ConfigBaseClass.getClassOrTypeInitialSettings(layerConfig);
    this.#minScale = ConfigBaseClass.getClassOrTypeMinScale(layerConfig);
    this.#maxScale = ConfigBaseClass.getClassOrTypeMaxScale(layerConfig);
    this.#isMetadataLayerGroup = ConfigBaseClass.getClassOrTypeIsMetadataLayerGroup(layerConfig);
  }

  /**
   * Overridable method to apply the service metadata to this layer entry and its children.
   * Subclasses should override this method to implement the logic needed
   * to update the service metadata on the current layer entry, including
   * any recursive behavior for child entries or associated sources.
   * @param {unknown} metadata - The service metadata to set.
   * @protected
   * @abstract
   */
  protected abstract onSetServiceMetadata(metadata: unknown): void;

  /**
   * Overridable method to apply the data access path to this layer entry and its children.
   * Subclasses should override this method to implement the logic needed
   * to update the data access path on the current layer entry, including
   * any recursive behavior for child entries or associated sources.
   * @param {string} dataAccessPath - The data access path to set.
   * @protected
   * @abstract
   */
  protected abstract onSetDataAccessPath(dataAccessPath: string): void;

  /**
   * The layerPath getter method for the ConfigBaseClass class and its descendant classes.
   * @returns {string} The layer path
   */
  get layerPath(): string {
    return ConfigBaseClass.#evaluateLayerPath(this);
  }

  /**
   * The layerId getter method for the ConfigBaseClass class and its descendant classes.
   * @retuns {TypeLayerStatus} The layer status
   */
  get layerStatus(): TypeLayerStatus {
    return this.#layerStatus;
  }

  /**
   * Gets the layer name of the entry layer or
   * fallbacks on the geoviewLayerName from the GeoViewLayerConfig or
   * fallbacks on the geoviewLayerId from the GeoViewLayerConfig or
   * fallsback on the layerPath.
   */
  getLayerNameCascade(): string {
    return this.#layerName || this.getGeoviewLayerName() || this.getGeoviewLayerId() || this.layerPath;
  }

  /**
   * Gets the layer name of the entry layer if any.
   */
  getLayerName(): string | undefined {
    return this.#layerName;
  }

  /**
   * Sets the layer name of the entry layer.
   * @param {string} layerName - The layer name.
   */
  setLayerName(layerName: string): void {
    // Validate the input is indeed a string (it happened that this was garbage)
    if (typeof layerName === 'string') {
      this.#layerName = layerName;
    } // else skip
  }

  /**
   * Gets the schema tag for the layer entry config.
   * @returns {TypeGeoviewLayerType} The layer entry type (or undefined, e.g. groups).
   */
  getSchemaTag(): TypeGeoviewLayerType {
    return this.#schemaTag;
  }

  /**
   * Sets the schema tag for the layer entry config.
   * @param {TypeGeoviewLayerType} schemaTag - The schema tag.
   */
  setSchemaTag(schemaTag: TypeGeoviewLayerType): void {
    this.#schemaTag = schemaTag;
  }

  /**
   * Gets the layer entry type for the layer entry config.
   * @returns {TypeLayerEntryType} The layer entry type.
   */
  getEntryType(): TypeLayerEntryType {
    return this.#entryType;
  }

  /**
   * Sets the layer entry type for the layer entry config.
   * @param {TypeLayerEntryType} entryType - The layer entry type.
   */
  setEntryType(entryType: TypeLayerEntryType): void {
    this.#entryType = entryType;
  }

  /**
   * Type guard that checks if this entry is a group layer entry.
   * @returns {boolean} True if this is a GroupLayerEntryConfig.
   */
  getEntryTypeIsGroup(): this is GroupLayerEntryConfig {
    return ConfigBaseClass.getClassOrTypeEntryTypeIsGroup(this);
  }

  /**
   * Returns the GeoView layer configuration associated with this layer entry.
   * @returns {TypeGeoviewLayerConfig} The GeoView layer configuration object.
   */
  getGeoviewLayerConfig(): TypeGeoviewLayerConfig {
    return this.layerEntryProps.geoviewLayerConfig;
  }

  /**
   * Retrieves the parent layer configuration if this layer is part of a group.
   * @returns {GroupLayerEntryConfig | undefined} The parent group layer config, or undefined if not in a group.
   */
  getParentLayerConfig(): GroupLayerEntryConfig | undefined {
    return this.layerEntryProps.parentLayerConfig;
  }

  /**
   * Sets the parent layer configuration for this layer.
   * @param {GroupLayerEntryConfig} parentLayerConfig - The parent group layer configuration to assign.
   */
  setParentLayerConfig(parentLayerConfig: GroupLayerEntryConfig): void {
    this.layerEntryProps.parentLayerConfig = parentLayerConfig;
  }

  /**
   * Returns the unique GeoView layer ID associated with this layer entry.
   * @returns {string} The GeoView layer ID.
   */
  getGeoviewLayerId(): string {
    return this.getGeoviewLayerConfig().geoviewLayerId;
  }

  /**
   * Returns the display name of the GeoView layer, if defined.
   * @returns {string | undefined} The GeoView layer name, or undefined if not set.
   */
  getGeoviewLayerName(): string | undefined {
    return this.getGeoviewLayerConfig().geoviewLayerName;
  }

  /**
   * Retrieves the metadata access path used by this GeoView layer.
   * @returns {string | undefined} The metadata access path, or undefined if not set.
   */
  getMetadataAccessPath(): string | undefined {
    return this.getGeoviewLayerConfig().metadataAccessPath;
  }

  /**
   * Updates the metadata access path for this GeoView layer.
   * @param {string} metadataAccessPath - The new metadata access path to assign.
   */
  setMetadataAccessPath(metadataAccessPath: string): void {
    this.getGeoviewLayerConfig().metadataAccessPath = metadataAccessPath;
  }

  /**
   * Gets the layer indication for the metadata layer group.
   */
  getIsMetadataLayerGroup(): boolean {
    return this.#isMetadataLayerGroup;
  }

  /**
   * Sets the layer is metadata layer group indication.
   * @param {boolean} isMetadataLayerGroup - The indication if it's a metadata layer group.
   */
  setIsMetadataLayerGroup(isMetadataLayerGroup: boolean): void {
    this.#isMetadataLayerGroup = isMetadataLayerGroup;
  }

  /**
   * Type guard that checks if this entry is a regular layer entry (not a group layer entry).
   * @returns {boolean} True if this is a AbstractBaseLayerEntryConfig.
   */
  getEntryTypeIsRegular(): this is AbstractBaseLayerEntryConfig {
    return !this.getEntryTypeIsGroup();
  }

  /**
   * Gets the service date format as specified by the config.
   * @returns {string | undefined} The Date Format
   */
  getServiceDateFormat(): string | undefined {
    return this.getGeoviewLayerConfig().serviceDateFormat;
  }

  /**
   * Gets the service date fragments order as specified by the config.
   * @returns {TypeDateFragments} The Date Fragments
   */
  getServiceDateFragmentsOrder(): TypeDateFragments | undefined {
    if (this.getServiceDateFormat()) {
      return DateMgt.getDateFragmentsOrder(this.getServiceDateFormat());
    }
    return undefined;
  }

  /**
   * Gets the external date format as specified by the config.
   * @returns {string | undefined} The Date Format
   */
  getExternalDateFormat(): string | undefined {
    return this.getGeoviewLayerConfig().externalDateFormat;
  }

  /**
   * Gets the external fragments order if specified by the config, defaults to ISO_UTC.
   * Date format object used to translate internal UTC ISO format to the external format.
   * @returns {TypeDateFragments} The Date Fragments
   */
  getExternalFragmentsOrder(): TypeDateFragments | undefined {
    if (this.getExternalDateFormat()) {
      return DateMgt.getDateFragmentsOrder(this.getExternalDateFormat());
    }
    return undefined;
  }

  /**
   * Gets the external fragments order if specified by the config, defaults to ISO_UTC.
   * Date format object used to translate internal UTC ISO format to the external format.
   * @returns {TypeDateFragments} The Date Fragments
   */
  getExternalFragmentsOrderOrDefault(): TypeDateFragments {
    return DateMgt.getDateFragmentsOrder(this.getExternalDateFormat());
  }

  /**
   * Gets the layer min scale if any.
   * @returns {number | undefined} The layer min scale if any.
   */
  getMinScale(): number | undefined {
    return this.#minScale;
  }

  /**
   * Sets the layer min scale.
   * @param {number?} minScale - The layer min scale or undefined.
   */
  setMinScale(minScale?: number): void {
    this.#minScale = minScale;
  }

  /**
   * Initializes the minimum scale from metadata when available.
   * If a minimum scale is already defined on the layer, the most restrictive
   * (smallest) value between the existing scale and the metadata value is kept.
   * This ensures metadata does not loosen an already constrained scale range.
   * @param {number | undefined} minScaleMetadata - The minimum scale value derived from metadata.
   */
  initMinScaleFromMetadata(minScaleMetadata?: number): void {
    if (minScaleMetadata) {
      this.setMinScale(Math.min(this.getMinScale() ?? Infinity, minScaleMetadata));
    }
  }

  /**
   * Gets the layer max scale if any.
   * @returns {number | undefined} The layer max scale if any.
   */
  getMaxScale(): number | undefined {
    return this.#maxScale;
  }

  /**
   * Sets the layer max scale.
   * @param {number?} maxScale - The layer max scale or undefined.
   */
  setMaxScale(maxScale?: number): void {
    this.#maxScale = maxScale;
  }

  /**
   * Initializes the maximum scale from metadata when available.
   * If a maximum scale is already defined on the layer, the most restrictive
   * (largest) value between the existing scale and the metadata value is kept.
   * This ensures metadata does not tighten an already constrained scale range.
   * @param {number | undefined} maxScaleMetadata - The maximum scale value derived from metadata.
   */
  initMaxScaleFromMetadata(maxScaleMetadata?: number): void {
    if (maxScaleMetadata) {
      this.setMaxScale(Math.max(this.getMaxScale() ?? -Infinity, maxScaleMetadata));
    }
  }

  /**
   * Gets the initial settings.
   * @returns {TypeLayerInitialSettings | undefined} The initial settings.
   */
  getInitialSettings(): TypeLayerInitialSettings | undefined {
    return this.#initialSettings;
  }

  /**
   * Returns a shallow-copy of the initialSettings object.
   * @returns {TypeLayerInitialSettings} The shallow-copy of the initialSettings object.
   */
  cloneInitialSettings(): TypeLayerInitialSettings {
    return { ...this.getInitialSettings(), states: this.getInitialSettings()?.states };
  }

  /**
   * Gets the the initial settings extend, if any
   * @returns {Extent  | undefined} The initial settings extend, if any.
   */
  getInitialSettingsExtent(): Extent | undefined {
    return this.#initialSettings?.extent;
  }

  /**
   * Gets the the initial settings bounds, if any
   * @returns {Extent  | undefined} The initial settings bounds, if any.
   */
  getInitialSettingsBounds(): Extent | undefined {
    return this.#initialSettings?.bounds;
  }

  /**
   * Gets the the initial settings className, if any
   * @returns {string  | undefined} The initial settings className, if any.
   */
  getInitialSettingsClassName(): string | undefined {
    return this.#initialSettings?.className;
  }

  /**
   * Initializes the initial settings configuration by filling the blanks in our config with the information from the metadata, if necessary.
   * @param {TypeLayerInitialSettings | undefined} initialSettingsMetadata - The initialSettings metadata to use to help fill the blanks in our initialSettings config, if any.
   */
  initInitialSettingsFromMetadata(initialSettingsMetadata: TypeLayerInitialSettings | undefined): void {
    this.#initialSettings = deepMerge(initialSettingsMetadata, this.#initialSettings);
  }

  /**
   * Validates and initializes the `visible` value in the `initialSettings` object, if necessary.
   * @param {number | undefined} visible - The candidate `visible` value to validate against the current setting, if any.
   */
  initInitialSettingsStatesVisibleFromMetadata(visible: boolean | undefined): void {
    // Validate and update the extent initial settings
    this.#initialSettings ??= {};
    this.#initialSettings.states ??= {};
    this.#initialSettings.states.visible ??= visible;
  }

  /**
   * Initializes the minimum zoom level in the initial settings using metadata.
   * @param {number | undefined} minZoomMetadata - The minimum zoom value from metadata, if any.
   */
  initInitialSettingsMinZoomFromMetadata(minZoomMetadata: number | undefined): void {
    // Redirect
    this.#initInitialSettingsMinZoom(minZoomMetadata);
  }

  /**
   * Initializes the maximum zoom level in the initial settings using metadata.
   * @param {number | undefined} maxZoomMetadata - The maximum zoom value from metadata, if any.
   */
  initInitialSettingsMaxZoomFromMetadata(maxZoomMetadata: number | undefined): void {
    // Redirect
    this.#initInitialSettingsMaxZoom(maxZoomMetadata);
  }

  /**
   * Initializes the extent in the initial settings using the layer configuration, if any.
   */
  initInitialSettingsExtentAndBoundsFromConfig(): void {
    // Redirect
    this.#initInitialSettingsExtent(this.#initialSettings?.extent);
    this.#initInitialSettingsBounds(this.#initialSettings?.bounds);
  }

  /**
   * Initializes the extent in the initial settings using metadata.
   * @param {Extent | undefined} extentToValidate - The extent from metadata to validate and apply, if any.
   */
  // TODO: CHECK - This function isn't called, but I feel like it should be... What's the relationship between extent and bounds?
  initInitialSettingsExtentFromMetadata(extentToValidate: Extent | undefined): void {
    // Redirect
    this.#initInitialSettingsExtent(extentToValidate);
  }

  /**
   * Initializes the bounds in the initial settings using metadata.
   * @param {Extent | undefined} extentToValidate - The bounds from metadata to validate and apply, if any.
   */
  initInitialSettingsBoundsFromMetadata(extentToValidate: Extent | undefined): void {
    // Redirect
    this.#initInitialSettingsBounds(extentToValidate);
  }

  /**
   * Returns the sibling layer configurations of the current layer.
   * If the current layer has a parent, this method retrieves all layer entry
   * configs under the same parent. It can optionally exclude layers of type 'group'.
   * @param {boolean} includeGroups - Whether to include entries of type 'group' in the result. False by default.
   * @returns {ConfigBaseClass[]} An array of sibling layer configurations. Returns an empty array if there is no parent.
   */
  getSiblings(includeGroups: boolean = false): ConfigBaseClass[] {
    // Get the parent layer config, if any
    const parentLayerConfig = this.getParentLayerConfig();

    // If there's a parent
    if (parentLayerConfig) {
      return parentLayerConfig.listOfLayerEntryConfig.filter((config) => includeGroups || !config.getEntryTypeIsGroup());
    }

    // No siblings
    return [];
  }

  /**
   * Sets the service metadata for this layer entry.
   * This is the public entry point for updating the service metadata.
   * Internally, it delegates the behavior to the `onSetServiceMetadata` method,
   * which can be overridden by subclasses to implement custom logic.
   * @param {unknown} metadata - The new service metadata to be used.
   */
  setServiceMetadata(metadata: unknown): void {
    // Redirect
    this.onSetServiceMetadata(metadata);
  }

  /**
   * Sets the data access path for this layer entry.
   * This is the public entry point for updating the data access path.
   * Internally, it delegates the behavior to the `onSetDataAccessPath` method,
   * which can be overridden by subclasses to implement custom logic.
   * @param {string} dataAccessPath - The new path to be used for accessing data.
   */
  setDataAccessPath(dataAccessPath: string): void {
    // Redirect
    this.onSetDataAccessPath(dataAccessPath);
  }

  /**
   * Sets the layer status to registered.
   */
  setLayerStatusRegistered(): void {
    // Redirect
    this.setLayerStatus(LAYER_STATUS.REGISTERED);
  }

  /**
   * Sets the layer status to processing.
   */
  setLayerStatusProcessing(): void {
    // Redirect
    this.setLayerStatus(LAYER_STATUS.PROCESSING);
  }

  /**
   * Sets the layer status to processed.
   */
  setLayerStatusProcessed(): void {
    // Redirect
    this.setLayerStatus(LAYER_STATUS.PROCESSED);
  }

  /**
   * Sets the layer status to loading.
   */
  setLayerStatusLoading(): void {
    // Redirect
    this.setLayerStatus(LAYER_STATUS.LOADING);
  }

  /**
   * Sets the layer status to loaded.
   */
  setLayerStatusLoaded(): void {
    // Redirect
    this.setLayerStatus(LAYER_STATUS.LOADED);
  }

  /**
   * Sets the layer status to error.
   */
  setLayerStatusError(): void {
    // Redirect
    this.setLayerStatus(LAYER_STATUS.ERROR);
  }

  /**
   * Sets the layer status and emits an event when changed.
   * @param {string} newLayerStatus - The new layerId value.
   */
  setLayerStatus(newLayerStatus: TypeLayerStatus): void {
    // Log
    logger.logTraceCore('LAYERS STATUS -', this.layerPath, newLayerStatus);

    // GV For quick debug, uncomment the line
    // if (newLayerStatus === 'error') debugger;

    // Check if we're not accidentally trying to set a status less than the current one (or setting loading, it's allowed to jump between loading and loaded)
    if (!this.isGreaterThanOrEqualTo(newLayerStatus) || newLayerStatus === 'loading') {
      this.#layerStatus = newLayerStatus;

      // Emit about it
      this.#emitLayerStatusChanged({ layerStatus: newLayerStatus });
    } else if (this.layerStatus !== newLayerStatus) {
      // Log the warning as this shouldn't be happening
      logger.logWarning(
        `The layer status for ${this.layerPath} was already '${this.layerStatus}' and the system wanted to set ${newLayerStatus}`
      );
    }
  }

  /**
   * Updates the status of all parents layers based on the status of their sibling layers.
   * This method checks the statuses of sibling layers (layers sharing the same parent).
   * - If at least one sibling is in a 'loading' state, it sets the parent layer status to 'loading'.
   * - If all siblings are in a 'loaded' state, it sets the parent layer status to 'loaded'.
   * - If all siblings are in an 'error' state, it sets the parent layer status to 'error'.
   * - If neither condition is met, the parent status remains unchanged.
   */
  updateLayerStatusParent(): void {
    // Redirect
    ConfigBaseClass.#updateLayerStatusParentRec(this);
  }

  /**
   * This method compares the internal layer status of the config with the layer status passed as a parameter and it
   * returns true if the internal value is greater or equal to the value of the parameter.
   * @param {TypeLayerStatus} layerStatus - The layer status to compare with the internal value of the config.
   * @returns {boolean} Returns true if the internal value is greater or equal than the value of the parameter.
   */
  isGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean {
    return ConfigBaseClass.#layerStatusWeight[this.layerStatus] >= ConfigBaseClass.#layerStatusWeight[layerStatus];
  }

  /**
   * Creates and returns a deep clone of the layer entry configuration properties.
   * This method returns a cloned copy of the original properties (`layerEntryProps`)
   * that were used to create this layer entry configuration. Modifying the returned
   * object will not affect the internal state of the layer.
   * @returns {ConfigBaseClassProps} A deep-cloned copy of the layer entry properties.
   */
  cloneLayerProps(): ConfigBaseClassProps {
    // Redirect
    return this.onCloneLayerProps();
  }

  /**
   * Writes the instance as Json.
   * @returns {T} The Json representation of the instance.
   */
  toJson<T>(): T {
    // Redirect
    return this.onToJson();
  }

  /**
   * Converts the current layer config instance into a `GroupLayerEntryConfigProps` object.
   * This method serializes the current layer into a configuration object used
   * to represent a group layer within a GeoView configuration. It populates
   * essential properties such as the layer ID, name, configuration references,
   * and initializes it as a metadata layer group.
   * @param {string?} name - The layer name. Will use this.getLayerName() when undefined.
   * @returns {GroupLayerEntryConfigProps} The configuration object representing the group layer.
   */
  toGroupLayerConfigProps(name?: string): GroupLayerEntryConfigProps {
    // To json object
    const groupLayerProps = this.toJson<GroupLayerEntryConfigProps>();
    groupLayerProps.layerName = name || this.getLayerName();
    groupLayerProps.geoviewLayerConfig = this.getGeoviewLayerConfig();
    groupLayerProps.parentLayerConfig = this.getParentLayerConfig();
    groupLayerProps.isMetadataLayerGroup = true;
    groupLayerProps.listOfLayerEntryConfig = [];
    return groupLayerProps;
  }

  // #region PROTECTED/PRIVATE METHODS

  /**
   * Validates and initializes the `minZoom` value in the `initialSettings` object, if necessary.
   * Ensures that the `minZoom` is not decreased unintentionally by keeping the more restrictive (higher) value
   * between the existing `minZoom` and the provided `minZoomToValidate`.
   * @param {number | undefined} minZoomToValidate - The candidate `minZoom` value to validate against the current setting, if any.
   */
  #initInitialSettingsMinZoom(minZoomToValidate: number | undefined): void {
    // If we have something to update it with
    if (minZoomToValidate) {
      this.#initialSettings ??= {};
      this.#initialSettings.minZoom = Math.max(this.#initialSettings.minZoom ?? -Infinity, minZoomToValidate);
    }
  }

  /**
   * Validates and initializes the `maxZoom` value in the `initialSettings` object, if necessary.
   * Ensures that the `maxZoom` is not increased unintentionally by keeping the more restrictive (lower) value
   * between the existing `maxZoom` and the provided `maxZoomToValidate`.
   * @param {number | undefined} maxZoomToValidate - The candidate `maxZoom` value to validate against the current setting, if any.
   */
  #initInitialSettingsMaxZoom(maxZoomToValidate: number | undefined): void {
    // If we have something to update it with
    if (maxZoomToValidate) {
      this.#initialSettings ??= {};
      this.#initialSettings.maxZoom = Math.min(this.#initialSettings.maxZoom ?? Infinity, maxZoomToValidate);
    }
  }

  /**
   * Validates and initializes the `extent` in the `initialSettings` object, if necessary.
   * If no extent is explicitly provided, the current `initialSettings.extent` is used by default.
   * The provided extent (or existing one) is passed to `validateExtentWhenDefined()` to apply any required corrections.
   * @param {Extent | undefined} extentToValidate - The extent to validate and apply, if any.
   */
  #initInitialSettingsExtent(extentToValidate: Extent | undefined): void {
    // If we have something to update it with
    if (extentToValidate) {
      // Validate and update the extent initial settings
      this.#initialSettings ??= {};
      this.#initialSettings.extent = GeoUtilities.validateExtentWhenDefined(extentToValidate);
    }
  }

  /**
   * Validates and initializes the `bounds` in the `initialSettings` object, if necessary.
   * If no bounds is explicitly provided, the current `initialSettings.bounds` is used by default.
   * The provided bounds (or existing one) is passed to `validateExtentWhenDefined()` to apply any required corrections.
   * @param {Extent | undefined} boundsToValidate - The bounds to validate and apply, if any.
   */
  #initInitialSettingsBounds(boundsToValidate: Extent | undefined): void {
    // If we have something to update it with
    if (boundsToValidate) {
      // Validate and update the bounds initial settings
      this.#initialSettings ??= {};
      this.#initialSettings.bounds = GeoUtilities.validateExtentWhenDefined(boundsToValidate);
    }
  }

  /**
   * Overridable function to create and return a deep clone of the layer entry configuration properties.
   * This method returns a cloned copy of the original properties (`layerEntryProps`)
   * that were used to create this layer entry configuration. Modifying the returned
   * object will not affect the internal state of the layer.
   * @returns {ConfigBaseClassProps} A deep-cloned copy of the layer entry properties.
   */
  protected onCloneLayerProps(): ConfigBaseClassProps {
    // Return a cloned copy of the layer entry props that were used to create this layer entry config
    return { ...this.layerEntryProps };
  }

  /**
   * Overridable function to write the instance as Json.
   * @returns {unknown} The Json representation of the instance.
   * @protected
   */
  protected onToJson<T>(): T {
    return {
      schemaTag: this.getSchemaTag(),
      entryType: this.getEntryType(),
      layerId: this.layerId,
      layerName: this.getLayerName(),
      isMetadataLayerGroup: this.getIsMetadataLayerGroup(),
    } as T;
  }

  // #endregion PROTECTED/PRIVATE METHODS

  // #region STATIC

  /**
   * Recursively updates the status of the parent layer based on the status of its sibling layers.
   * This method checks the statuses of sibling layers (layers sharing the same parent).
   * - If at least one sibling is in a 'loading' state, it sets the parent layer status to 'loading'.
   * - If all siblings are in a 'loaded' state, it sets the parent layer status to 'loaded'.
   * - If all siblings are in an 'error' state, it sets the parent layer status to 'error'.
   * - If neither condition is met, the parent status remains unchanged.
   */
  static #updateLayerStatusParentRec(currentConfig: ConfigBaseClass): void {
    // Get the parent config, if any
    const parentLayerConfig = currentConfig.getParentLayerConfig();

    // If there's no parent
    if (!parentLayerConfig) return;

    // Get all siblings of the layer
    const siblings = currentConfig.getSiblings(true);

    // Get all siblings which are in loading state
    const siblingsInLoading = siblings.filter((lyrConfig) => lyrConfig.layerStatus === 'loading');

    // If at least one layer is loading
    if (siblingsInLoading.length > 0) {
      // Set the parent layer status as loading
      parentLayerConfig.setLayerStatusLoading();
      // Continue with the parent
      ConfigBaseClass.#updateLayerStatusParentRec(parentLayerConfig);
      return;
    }

    // Get all siblings which are loaded
    const siblingsInLoaded = siblings.filter((lyrConfig) => lyrConfig.layerStatus === 'loaded');

    // If all siblings are loaded
    if (siblings.length === siblingsInLoaded.length) {
      // Set the parent layer status as loaded
      parentLayerConfig.setLayerStatusLoaded();
      // Continue with the parent
      ConfigBaseClass.#updateLayerStatusParentRec(parentLayerConfig);
      return;
    }

    // Get all siblings which are in error or loaded
    const siblingsInError = siblings.filter((lyrConfig) => lyrConfig.layerStatus === 'error' || lyrConfig.layerStatus === 'loaded');

    // If all siblings are in fact in error or loaded
    if (siblings.length === siblingsInError.length) {
      // Set the parent layer status as error
      parentLayerConfig.setLayerStatusError();
      // Continue with the parent
      ConfigBaseClass.#updateLayerStatusParentRec(parentLayerConfig);
    }
  }

  /**
   * Getter for the layer Path of the layer configuration parameter.
   * @param {ConfigBaseClass} layerConfig - The layer configuration for which we want to get the layer path.
   * @param {string} layerPath - Internal parameter used to build the layer path (should not be used by the user).
   *
   * @returns {string} Returns the layer path.
   */
  static #evaluateLayerPath(layerConfig: ConfigBaseClass, layerPath?: string): string {
    let pathEnding = layerPath;
    if (pathEnding === undefined) pathEnding = layerConfig.layerId;

    // Get the parent config, if any
    const parentLayerConfig = layerConfig.getParentLayerConfig();

    // If no parent
    if (!parentLayerConfig) return `${layerConfig.getGeoviewLayerId()}/${pathEnding}`;

    // Go recursive
    return this.#evaluateLayerPath(parentLayerConfig, `${parentLayerConfig.layerId}/${pathEnding}`);
  }

  /**
   * Recursively checks the list of layer entries to see if all of them are greater than or equal to the provided layer status.
   *
   * @param {TypeLayerStatus} layerStatus - The layer status to compare with the internal value of the config.
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig - The list of layer's configuration (default: this.listOfLayerEntryConfig).
   *
   * @returns {boolean} true when all layers are greater than or equal to the layerStatus parameter.
   */
  static allLayerStatusAreGreaterThanOrEqualTo(layerStatus: TypeLayerStatus, listOfLayerEntryConfig: ConfigBaseClass[]): boolean {
    // Try to find a layer that is not greater than or equal to the layerStatus parameter. If you can, return false
    return !listOfLayerEntryConfig.find((layerConfig) => {
      if (ConfigBaseClass.getClassOrTypeEntryTypeIsGroup(layerConfig))
        return !this.allLayerStatusAreGreaterThanOrEqualTo(layerStatus, layerConfig.listOfLayerEntryConfig);
      return !layerConfig.isGreaterThanOrEqualTo(layerStatus);
    });
  }

  /**
   * Returns the corresponding layer entry type for a given GeoView layer type.
   * This method maps a `TypeGeoviewLayerType` (e.g., CSV, WMS, XYZ_TILES)
   * to its associated `TypeLayerEntryType` (e.g., VECTOR, RASTER_IMAGE, RASTER_TILE).
   * Useful for determining how a layer should be handled/rendered internally.
   * @param {TypeGeoviewLayerType} layerType - The GeoView layer type to convert.
   * @returns The corresponding layer entry type.
   * @throws {NotSupportedError} If the provided `layerType` is not supported for conversion.
   */
  static getLayerEntryTypeFromLayerType(layerType: TypeGeoviewLayerType): TypeLayerEntryType {
    switch (layerType) {
      case CONST_LAYER_TYPES.CSV:
      case CONST_LAYER_TYPES.GEOJSON:
      case CONST_LAYER_TYPES.KML:
      case CONST_LAYER_TYPES.OGC_FEATURE:
      case CONST_LAYER_TYPES.WFS:
      case CONST_LAYER_TYPES.WKB:
      case CONST_LAYER_TYPES.ESRI_FEATURE:
        return CONST_LAYER_ENTRY_TYPES.VECTOR;

      case CONST_LAYER_TYPES.IMAGE_STATIC:
      case CONST_LAYER_TYPES.ESRI_DYNAMIC:
      case CONST_LAYER_TYPES.ESRI_IMAGE:
      case CONST_LAYER_TYPES.WMS:
        return CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;
      case CONST_LAYER_TYPES.XYZ_TILES:
      case CONST_LAYER_TYPES.GEOTIFF:
      case CONST_LAYER_TYPES.VECTOR_TILES:
        return CONST_LAYER_ENTRY_TYPES.RASTER_TILE;
      default:
        // Throw unsupported error
        throw new NotSupportedError(`Unsupported layer type ${layerType} to convert to layer entry`);
    }
  }

  // #region HELPER METHODS TO WORK WITH A CONFIG INSTANCE OR A CONFIG JSON OBJECT

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {TypeGeoviewLayerType | undefined} The schema tag or undefined.
   */
  static getClassOrTypeSchemaTag(layerConfig: ConfigClassOrType | undefined): TypeGeoviewLayerType | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getSchemaTag();
    }
    return layerConfig?.schemaTag;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
   * @param {TypeGeoviewLayerType} schemaTag - The schema tag.
   */
  static setClassOrTypeSchemaTag(layerConfig: ConfigClassOrType, schemaTag: TypeGeoviewLayerType): void {
    if (layerConfig instanceof ConfigBaseClass) {
      layerConfig.setSchemaTag(schemaTag);
    } else {
      // eslint-disable-next-line no-param-reassign
      layerConfig.schemaTag = schemaTag;
    }
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {TypeLayerEntryType | undefined} The layer entry type or undefined.
   */
  static getClassOrTypeEntryType(layerConfig: ConfigClassOrType | undefined): TypeLayerEntryType | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getEntryType();
    }
    return layerConfig?.entryType;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
   * @param {TypeLayerEntryType} entryType - The entry type.
   */
  static setClassOrTypeEntryType(layerConfig: ConfigClassOrType, entryType: TypeLayerEntryType): void {
    if (layerConfig instanceof ConfigBaseClass) {
      layerConfig.setEntryType(entryType);
    } else {
      // eslint-disable-next-line no-param-reassign
      layerConfig.entryType = entryType;
    }
  }

  /**
   * Helper typeguard function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {GroupLayerEntryConfig} The group layer entry config when the layerConfig is a group entry type.
   */
  static getClassOrTypeEntryTypeIsGroup(layerConfig: ConfigClassOrType | undefined): layerConfig is GroupLayerEntryConfig {
    return ConfigBaseClass.getClassOrTypeEntryType(layerConfig) === CONST_LAYER_ENTRY_TYPES.GROUP;
  }

  /**
   * Extracts the `layerEntryProps` from either a class instance (`ConfigBaseClass`) or a plain configuration object.
   * This function acts as a type guard and converter to ensure consistent access to `layerEntryProps`,
   * whether the input is a class or a raw configuration type.
   * @template T - A subtype of `ConfigBaseClassProps`.
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The configuration, which may be a class or a plain object.
   * @returns {T} The extracted `layerEntryProps` cast to the expected type.
   */
  static getClassOrTypeLayerEntryProps<T extends ConfigBaseClassProps>(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): T {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.layerEntryProps as T;
    }
    // As-is
    return layerConfig as T;
  }

  /**
   * Retrieves the `geoviewLayerConfig` from a layer configuration object or class.
   * Internally uses `getClassOrTypeLayerEntryProps()` to normalize access to the configuration structure.
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The configuration, which may be a class instance or a plain object.
   * @returns {TypeGeoviewLayerConfig} The `geoviewLayerConfig` associated with the provided configuration.
   */
  static getClassOrTypeGeoviewLayerConfig(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): TypeGeoviewLayerConfig {
    return ConfigBaseClass.getClassOrTypeLayerEntryProps(layerConfig).geoviewLayerConfig;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The geoviewLayerConfig to apply.
   */
  static setClassOrTypeGeoviewLayerConfig(layerConfig: ConfigClassOrType, geoviewLayerConfig: TypeGeoviewLayerConfig): void {
    if (layerConfig instanceof ConfigBaseClass) {
      // eslint-disable-next-line no-param-reassign
      layerConfig.layerEntryProps.geoviewLayerConfig = geoviewLayerConfig;
    } else {
      // eslint-disable-next-line no-param-reassign
      layerConfig.geoviewLayerConfig = geoviewLayerConfig;
    }
  }

  /**
   * Retrieves the `parentLayerConfig` from the provided layer configuration, whether it's a class instance or a plain object.
   * This allows consistent access to the parent group layer config regardless of whether the input is an instance of
   * `ConfigBaseClass` or a raw config type.
   * @param {ConfigClassOrType} layerConfig - The layer configuration to extract the parent from.
   * @returns {GroupLayerEntryConfig | undefined} The parent group layer config, or `undefined` if this layer has no parent.
   */
  static getClassOrTypeParentLayerConfig(layerConfig: ConfigClassOrType): GroupLayerEntryConfig | undefined {
    return ConfigBaseClass.getClassOrTypeLayerEntryProps(layerConfig).parentLayerConfig;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
   * @param {GroupLayerEntryConfig} geoviewLayerConfig - The geoviewLayerConfig to apply.
   */
  static setClassOrTypeParentLayerConfig(layerConfig: ConfigClassOrType, parentLayerConfig: GroupLayerEntryConfig | undefined): void {
    if (layerConfig instanceof ConfigBaseClass) {
      // eslint-disable-next-line no-param-reassign
      layerConfig.layerEntryProps.parentLayerConfig = parentLayerConfig;
    } else {
      // eslint-disable-next-line no-param-reassign
      layerConfig.parentLayerConfig = parentLayerConfig;
    }
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {string | undefined} The layer name or undefined.
   */
  static getClassOrTypeLayerName(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig | undefined): string | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getLayerName();
    }

    return (layerConfig as ConfigBaseClassProps)?.layerName || (layerConfig as TypeGeoviewLayerConfig).geoviewLayerName;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @param {string} layerName - The layer name to apply.
   */
  static setClassOrTypeLayerName(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig | undefined, layerName: string): void {
    if (layerConfig instanceof ConfigBaseClass) {
      layerConfig.setLayerName(layerName);
    }

    // eslint-disable-next-line no-param-reassign
    if (layerConfig) (layerConfig as ConfigBaseClassProps).layerName = layerName;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {number | undefined} The minimum scale or undefined.
   */
  static getClassOrTypeMinScale(layerConfig: ConfigClassOrType | undefined): number | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getMinScale();
    }
    return layerConfig?.minScale;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
   * @param {number} minScale - The minimum scale to apply.
   */
  static setClassOrTypeMinScale(layerConfig: ConfigClassOrType, minScale: number): void {
    if (layerConfig instanceof ConfigBaseClass) {
      layerConfig.setMinScale(minScale);
    } else {
      // eslint-disable-next-line no-param-reassign
      layerConfig.minScale = minScale;
    }
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {number | undefined} The maximum scale or undefined.
   */
  static getClassOrTypeMaxScale(layerConfig: ConfigClassOrType | undefined): number | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getMaxScale();
    }
    return layerConfig?.maxScale;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
   * @param {number} maxScale - The maximum scale to apply.
   */
  static setClassOrTypeMaxScale(layerConfig: ConfigClassOrType, maxScale: number): void {
    if (layerConfig instanceof ConfigBaseClass) {
      layerConfig.setMaxScale(maxScale);
    } else {
      // eslint-disable-next-line no-param-reassign
      layerConfig.maxScale = maxScale;
    }
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {TypeLayerInitialSettings | undefined} The initial settings in the layer config or undefined.
   */
  static getClassOrTypeInitialSettings(
    layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig | undefined
  ): TypeLayerInitialSettings | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getInitialSettings();
    }
    return layerConfig?.initialSettings;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
   * @param {TypeLayerInitialSettings} initialSettings - The initial settings scale to apply.
   */
  static setClassOrTypeInitialSettings(layerConfig: ConfigClassOrType, initialSettings: TypeLayerInitialSettings): void {
    if (layerConfig instanceof ConfigBaseClass) {
      // eslint-disable-next-line no-param-reassign
      layerConfig.#initialSettings = initialSettings;
    } else {
      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings = initialSettings;
    }
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {boolean} The indication if the layer config is metadata layer group.
   */
  static getClassOrTypeIsMetadataLayerGroup(layerConfig: ConfigClassOrType | undefined): boolean {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getIsMetadataLayerGroup();
    }
    return layerConfig?.isMetadataLayerGroup || false;
  }

  // #endregion

  /**
   * Utility type guard that checks whether the given configuration (class instance or plain object)
   * represents a particular layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a particular layer; otherwise `false`.
   * @static
   * @protected
   */
  protected static isClassOrTypeSchemaTag<T extends ConfigClassOrType | TypeGeoviewLayerConfig>(
    layerConfig: T,
    layerType: TypeGeoviewLayerType
  ): layerConfig is T {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getSchemaTag() === layerType;
    }

    // Try to cast it as ConfigBaseClassProps and check schemaTag
    const configBaseProps = layerConfig as ConfigBaseClassProps;
    if (configBaseProps.schemaTag) {
      return configBaseProps.schemaTag === layerType;
    }

    // Try from within the geoviewLayerConfig property
    if (configBaseProps.geoviewLayerConfig) {
      return configBaseProps.geoviewLayerConfig.geoviewLayerType === layerType;
    }

    // Try to use it as a TypeGeoviewLayerConfig
    const configType = layerConfig as TypeGeoviewLayerConfig;
    return configType.geoviewLayerType === layerType;
  }

  // #endregion

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {LayerStatusChangedEvent} event - The event to emit
   * @private
   */
  #emitLayerStatusChanged(event: LayerStatusChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerStatusChangedHandlers, event);
  }

  /**
   * Registers a layer status changed event handler.
   * @param {LayerStatusChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerStatusChanged(callback: LayerStatusChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Unregisters a layer status changed event handler.
   * @param {LayerStatusChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerStatusChanged(callback: LayerStatusChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  // #endregion
}

// #region TYPES

export type TypeLayerEntryShell = {
  id: number | string;
  index?: number; // This property is used for the config responses coming from Geocore which have 'index' in 'layerEntries' array
  layerId?: number | string;
  layerName?: string;
  tileGrid?: TypeTileGrid;
  subLayers?: TypeLayerEntryShell[];
  source?: TypeLayerEntryShellSource;
  geoviewLayerConfig?: TypeGeoviewLayerConfig;
  wmsLayerId?: string;
  wfsLayerId?: string;
  listOfLayerEntryConfig?: TypeLayerEntryShell[]; // For the groups
};

export type TypeLayerEntryShellSource = {
  dataAccessPath?: string;
  extent?: Extent;
  projection?: TypeValidSourceProjectionCodes;
};

// #endregion

// #region EVENT TYPES

/**
 * Define an event for the delegate.
 */
export type LayerStatusChangedEvent = {
  // The new layer status.
  layerStatus: TypeLayerStatus;
};

/**
 * Define a delegate for the event handler function signature.
 */
export type LayerStatusChangedDelegate = EventDelegateBase<ConfigBaseClass, LayerStatusChangedEvent, void>;

// #endregion
