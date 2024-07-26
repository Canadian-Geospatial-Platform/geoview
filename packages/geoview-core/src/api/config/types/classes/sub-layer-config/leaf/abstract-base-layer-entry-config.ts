import { TypeBaseSourceInitialConfig, TypeTemporalDimension, TypeStyleGeometry, TypeLayerEntryType } from '@config/types/map-schema-types';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';

// #region CLASS HEADER
/**
 * Base type used to define a GeoView sublayer to display on the map.
 */
export abstract class AbstractBaseLayerEntryConfig extends EntryConfigBaseClass {
  // #region PUBLIC PROPERTIES
  /** The geometry type of the leaf node. */
  geometryType?: TypeStyleGeometry;

  /** Source settings to apply to the GeoView vector layer source at creation time. */
  source?: TypeBaseSourceInitialConfig;

  /** Optional temporal dimension. */
  temporalDimension?: TypeTemporalDimension;

  // #region GETTER/SETTER
  // #region PROTECTED GET/SET
  /**
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected @abstract
   */
  protected abstract override getSchemaPath(): string;

  /**
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   * @protected @abstract
   */
  protected abstract override getEntryType(): TypeLayerEntryType;
}
