import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { Cast, TypeJsonArray, TypeJsonObject } from '@config/types/config-types';
import {
  TypeStyleConfig,
  TypeLayerEntryType,
  TypeSourceWfsInitialConfig,
  Extent,
  TypeFeatureInfoLayerConfig,
  TypeOutfields,
} from '@config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/abstract-base-layer-entry-config';
import { WfsLayerConfig } from '@config/types/classes/geoview-config/vector-config/wfs-config';
import { isvalidComparedToInternalSchema } from '@config/utils';
import { GeoviewLayerConfigError } from '@config/types/classes/config-exceptions';

import { logger } from '@/core/utils/logger';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { findPropertyNameByRegex, xmlToJson } from '@/core/utils/utilities';

// ====================
// #region CLASS HEADER
/**
 * The OGC WFS geoview sublayer class.
 */

export class WfsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  // ==================
  // #region PROPERTIES
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceWfsInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;
  // #endregion PROPERTIES

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected, public and static.
   */
  // ================
  // #region OVERRIDE

  /**
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected @override
   */
  protected override getSchemaPath(): string {
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.WFS;
  }

  /**
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   * @protected @override
   */
  protected override getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.VECTOR;
  }

  /**
   * Shadow method used to do a cast operation on the parent method to return WfsLayerConfig instead of
   * AbstractGeoviewLayerConfig.
   *
   * @returns {WfsLayerConfig} The Geoview layer configuration that owns this WFS layer entry config.
   * @override @async
   */
  override getGeoviewLayerConfig(): WfsLayerConfig {
    return super.getGeoviewLayerConfig() as WfsLayerConfig;
  }

  /**
   * This method is used to fetch, parse and extract the relevant information from the metadata of the leaf node.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   * @override @async
   */
  override async fetchLayerMetadata(): Promise<void> {
    // If an error has already been detected, then the layer is unusable.
    if (this.getErrorDetectedFlag()) return;

    // WFS service metadata contains one part of the layer's metadata.
    const fromGetCapabilities = this.getGeoviewLayerConfig().findLayerMetadataEntry(this.layerId);
    if (fromGetCapabilities) {
      // The second part of the layer metadata is fetch from the DescribeFeatureType service call.
      const fromDescribeFeatureType = (await this.#fetchDescribeFeatureType()) as TypeJsonObject;
      this.setLayerMetadata({
        fromGetCapabilities,
        fromDescribeFeatureType,
      });

      // Parse the raw layer metadata and build the geoview configuration.
      this.parseLayerMetadata();

      this.source.featureInfo = this.#createFeatureInfoUsingMetadata();

      if (!isvalidComparedToInternalSchema(this.getSchemaPath(), this, true)) {
        throw new GeoviewLayerConfigError(
          `GeoView internal configuration ${this.getLayerPath()} is invalid compared to the internal schema specification.`
        );
      }

      return;
    }

    logger.logError(`Can't find layer's metadata for layerPath ${this.getLayerPath()}.`);
    this.setErrorDetectedFlag();
  }

  /**
   * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
   * The resulting config will then be overwritten by the values provided in the user config.
   * @override
   */
  override applyDefaultValues(): void {
    super.applyDefaultValues();
    this.source = {
      strategy: 'all',
      maxRecordCount: 0,
      crossOrigin: 'Anonymous',
      projection: 3978,
      featureInfo: {
        queryable: false,
        nameField: '',
        outfields: [],
      },
    };
  }

  /**
   * This method is used to parse the layer metadata and extract the source information and other properties.
   * @override @protected
   */
  protected override parseLayerMetadata(): void {
    const layerMetadata = this.getLayerMetadata().fromGetCapabilities;

    if (findPropertyNameByRegex(layerMetadata, /(?:WGS84BoundingBox)/)) {
      const lowerCorner = (
        findPropertyNameByRegex(layerMetadata, [/(?:WGS84BoundingBox)/, /(?:LowerCorner)/, /(?:#text)/]) as string
      ).split(' ');
      const upperCorner = (
        findPropertyNameByRegex(layerMetadata, [/(?:WGS84BoundingBox)/, /(?:UpperCorner)/, /(?:#text)/]) as string
      ).split(' ');
      const bounds = [Number(lowerCorner[0]), Number(lowerCorner[1]), Number(upperCorner[0]), Number(upperCorner[1])] as Extent;

      this.initialSettings!.extent = validateExtentWhenDefined(bounds);
      if (this.initialSettings?.extent?.find?.((value, i) => value !== bounds[i]))
        logger.logWarning(
          `The extent specified in the metadata for the layer path “${this.getLayerPath()}” is considered invalid and has been corrected.`
        );

      this.bounds = this.initialSettings!.extent;
    }

    this.source.featureInfo!.queryable = this.#layerIsQueryable();

    // this.#processTemporalDimension(layerMetadata.Dimension);
  }

  // #endregion OVERRIDE

  // ===============
  // #region PRIVATE
  /**
   * This method analyzes the metadata to determine whether the layer is queryable.
   *
   * @returns {boolean} True if the layer is queryable.
   * @private
   */
  #layerIsQueryable(): boolean {
    const serviceMetadata = this.getGeoviewLayerConfig().getServiceMetadata();
    const operation = findPropertyNameByRegex(serviceMetadata, [/(?:OperationsMetadata)/, /(?:Operation)/]) as TypeJsonArray;
    return !!operation?.find?.((operationDescription) => operationDescription['@attributes'].name === 'GetFeature');
  }

  /**
   * Fetch the feature information from the service endpoint.
   *
   * @private @async
   */
  async #fetchDescribeFeatureType(): Promise<TypeJsonObject[]> {
    // Determine the supported return format.
    const serviceMetadata = this.getGeoviewLayerConfig().getServiceMetadata();
    const operation = findPropertyNameByRegex(serviceMetadata, [/(?:OperationsMetadata)/, /(?:Operation)/]) as TypeJsonArray;
    const describeFeatureTypeOperation = operation?.find?.(
      (operationDescription) => operationDescription['@attributes'].name === 'DescribeFeatureType'
    ) as TypeJsonObject;

    // If the output format cannot be deduce from the metadata, try 'application/json' as output format.
    let supportedOutputFormat = 'application/json';
    if (describeFeatureTypeOperation) {
      const availableFormats = findPropertyNameByRegex(describeFeatureTypeOperation, [/(?:Parameter)/, /(?:AllowedValue)/, /(?:Value)/]);
      if (availableFormats) {
        if (Array.isArray(availableFormats)) supportedOutputFormat = availableFormats[0]['#text'] as string;
        else supportedOutputFormat = availableFormats['#text'] as string;
      }
    }

    // format URL for the DescribeFeatureType request.
    const describeFeatureUrl = `${this.getGeoviewLayerConfig().processUrlParameters(
      'DescribeFeatureType'
    )}&outputFormat=${encodeURIComponent(supportedOutputFormat as string)}&typeName=${this.layerId}`;

    // Execute the request using a JSON output format.
    if (supportedOutputFormat === 'application/json') {
      const layerMetadata = (await (await fetch(describeFeatureUrl)).json()) as TypeJsonObject;
      if (Array.isArray(layerMetadata.featureTypes) && Array.isArray(layerMetadata.featureTypes[0].properties))
        return layerMetadata.featureTypes[0].properties;
      return [];
    }

    // Execute the request using a XML output format.
    if (supportedOutputFormat.toUpperCase().includes('XML')) {
      const layerMetadata = (await (await fetch(describeFeatureUrl)).text()) as string;
      // need to pass a xmldom to xmlToJson to convert xsd schema to json
      const xmlDOMDescribe = new DOMParser().parseFromString(layerMetadata, 'text/xml');
      const xmlJsonDescribe = xmlToJson(xmlDOMDescribe);
      const prefix = Object.keys(xmlJsonDescribe)[0].includes('xsd:') ? 'xsd:' : '';
      const xmlJsonSchema = xmlJsonDescribe[`${prefix}schema`];
      const xmlJsonDescribeElement =
        xmlJsonSchema[`${prefix}complexType`] !== undefined
          ? xmlJsonSchema[`${prefix}complexType`][`${prefix}complexContent`][`${prefix}extension`][`${prefix}sequence`][`${prefix}element`]
          : [];

      if (Array.isArray(xmlJsonDescribeElement)) {
        // recreate the array of properties as if it was json
        const featureTypeProperties: TypeJsonArray = [];
        xmlJsonDescribeElement.forEach((element) => {
          featureTypeProperties.push(element['@attributes']);
        });
        return featureTypeProperties;
      }
    }

    logger.logError(`Unsupported WFS output format (${supportedOutputFormat}) for layerPath ${this.getLayerPath()}`);
    this.setErrorDetectedFlag();
    return [];
  }

  /**
   * This method creates the feature information from the layer metadata.
   *
   * @returns {TypeFeatureInfoLayerConfig} The feature information in the viewer format.
   * @private
   */
  #createFeatureInfoUsingMetadata(): TypeFeatureInfoLayerConfig {
    const layerMetadata = this.getLayerMetadata().fromDescribeFeatureType as TypeJsonArray;

    const outfields: TypeOutfields[] = [];
    layerMetadata.forEach((fieldEntry) => {
      const fieldType = (fieldEntry.type as string).toLowerCase();
      if (fieldType.includes('point') || fieldType.includes('line') || fieldType.includes('polygon')) return;
      outfields.push(
        Cast<TypeOutfields>({
          name: fieldEntry.name,
          alias: fieldEntry.name,
          type: WfsLayerEntryConfig.#convertFieldType(fieldType),
          domain: null,
        })
      );
    });

    const nameField = outfields[0].name;

    return { queryable: this.#layerIsQueryable(), nameField, outfields };
  }

  // #endregion PRIVATE

  // ==============
  // #region STATIC
  /** ***************************************************************************************************************************
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {AbstractBaseLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   * @private @static
   */
  static #convertFieldType(fieldType: string): 'string' | 'date' | 'number' {
    const lowerFieldType = fieldType.toLowerCase();
    if (lowerFieldType.includes('string')) return 'string';
    if (lowerFieldType.includes('date')) return 'date';
    if (lowerFieldType.includes('int') || lowerFieldType.includes('number')) return 'number';
    return 'string';
  }

  // #endregion STATIC
  // #endregion METHODS
  // #endregion CLASS HEADER
}
