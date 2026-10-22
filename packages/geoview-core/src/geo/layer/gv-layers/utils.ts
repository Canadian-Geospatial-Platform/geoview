import type { Coordinate } from 'ol/coordinate';
import type { ImageArcGISRest, ImageWMS } from 'ol/source';

import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { TypeAliasLookup, TypeOutfields } from '@/api/types/map-schema-types';
import type { TemporalMode, TimeIANA } from '@/core/utils/date-mgt';
import { DateMgt } from '@/core/utils/date-mgt';
import { LayerInvalidLayerFilterError } from '@/core/exceptions/layer-exceptions';
import { formatError } from '@/core/exceptions/core-exceptions';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import { NodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { WfsRenderer } from '@/geo/utils/renderer/wfs-renderer';

export class GVLayerUtilities {
  /**
   * Normalizes ISO 8601 datetime literals in a filter string for use with
   * ESRI Dynamic (MapServer) layers.
   *
   * This function:
   * - Detects canonical quoted ISO 8601 datetimes and legacy SQL-style date literals
   *   (e.g. `'2020-01-01T05:00:00Z'` or `date '2020-01-01T05:00:00Z'`)
   * - Extracts and normalizes the ISO datetime value
   * - Removes timezone information (`Z` or offsets)
   * - Replaces the original literal with an ESRI- and database-friendly
   *   `TIMESTAMP 'YYYY-MM-DD HH:mm:ss'` expression
   *
   * This is required because Dynamic services forward `layerDefs` directly
   * to the underlying datastore, and `TIMESTAMP` is the most portable and
   * reliable datetime literal across supported databases.
   *
   * @example
   * ```
   * time_field >= '2020-01-01T05:00:00Z'
   * ```
   * becomes:
   * ```
   * time_field >= TIMESTAMP '2020-01-01 05:00:00'
   * ```
   *
   * @param filter - The original filter string containing ISO datetime values
   * @param timezone - Optional IANA timezone used to normalize datetime values
   *                                before stripping timezone information
   * @param inputTemporalMode - Optional temporal mode for date handling
   * @returns A SQL filter string with normalized `TIMESTAMP` datetime literals
   * suitable for ESRI Dynamic (MapServer) services
   */
  static parseDateTimeValuesEsriDynamic(filter: string, timezone?: TimeIANA, inputTemporalMode?: TemporalMode): string {
    // Match ISO 8601 datetimes with optional milliseconds + timezone
    let filterValueToUse = filter;
    const matches = [...filterValueToUse.matchAll(DateMgt.REGEX_ISO_DATE_LITERAL)];

    // Replace from end to start to preserve indexes
    matches.reverse().forEach((match) => {
      const fullMatch = match[0]; // '...' or date '...'
      const isoValue = match[1]; // ISO datetime only

      // Normalize date (clears T and Z)
      const normalized = DateMgt.formatDate(
        isoValue,
        'YYYY-MM-DD HH:mm:ss',
        'en',
        timezone,
        inputTemporalMode,
        undefined,
        undefined,
        false
      );

      // Wrap in ESRI-friendly TIMESTAMP literal
      const timestampLiteral = `TIMESTAMP '${normalized}'`;

      // Build new filter string
      filterValueToUse = filterValueToUse.slice(0, match.index) + timestampLiteral + filterValueToUse.slice(match.index + fullMatch.length);
    });

    // Return the filter values to use
    return filterValueToUse;
  }

  /**
   * Normalizes ISO 8601 datetime literals in a filter string for use with
   * ESRI ImageServer and WMS layers.
   *
   * This function:
   * - Detects canonical quoted ISO 8601 datetimes and legacy SQL-style date literals
   *   (e.g. `'2020-01-01T05:00:00Z'` or `date '2020-01-01T05:00:00Z'`)
   * - Extracts and normalizes the ISO datetime value
   * - Removes the surrounding SQL `date '...'` literal
   *
   * ImageServer and WMS services do not forward filters directly to a database
   * and do not support SQL keywords such as `TIMESTAMP`.
   *
   * @example
   * ```
   * acquisition_date >= '2020-01-01T05:00:00Z'
   * ```
   * becomes:
   * ```
   * acquisition_date >= 2020-01-01T05:00:00Z
   * ```
   *
   * @param filter - The original filter string containing SQL-style date literals
   * @param timezone - Optional IANA timezone used to normalize datetime values
   *                                before stripping timezone information
   * @param inputTemporalMode - Optional temporal mode for date handling
   * @returns A filter string with normalized, timezone-less datetime values suitable
   *   for ESRI ImageServer and WMS services
   */
  static parseDateTimeValuesEsriImageOrWMS(filter: string, timezone?: TimeIANA, inputTemporalMode?: TemporalMode): string {
    // Match ISO 8601 datetimes with optional milliseconds + timezone
    let filterValueToUse = filter;
    const matches = [...filterValueToUse.matchAll(DateMgt.REGEX_ISO_DATE_LITERAL)];

    // Replace from end to start to preserve indexes
    matches.reverse().forEach((match) => {
      const fullMatch = match[0]; // '...' or date '...'
      const isoValue = match[1]; // ISO datetime only

      // Normalize date adds T and adds Z
      const normalized = DateMgt.formatDate(isoValue, 'YYYY-MM-DDTHH:mm:ss', 'en', timezone, inputTemporalMode, undefined, undefined, true);

      // Build new filter string
      filterValueToUse = filterValueToUse.slice(0, match.index) + normalized + filterValueToUse.slice(match.index + fullMatch.length);
    });

    // Return the filter values to use
    return filterValueToUse;
  }

  /**
   * Applies data and time filters to a WMS or Esri Image source.
   *
   * @param layerConfig - The WMS or Esri Image layer entry configuration
   * @param source - The OpenLayers WMS or Esri Image source to update
   * @param filter - Optional filters to apply to the source
   * @throws {LayerInvalidLayerFilterError} When a filter cannot be parsed or applied
   */
  static applyViewFilterOnSource(
    layerConfig: OgcWmsLayerEntryConfig | EsriImageLayerEntryConfig,
    source: ImageWMS | ImageArcGISRest,
    filter: LayerFilters | undefined
  ): void {
    const sourceParams: { TIME?: string; FILTER?: string } = {};

    let currentDataFilter: string | undefined;
    let currentDatetimeFilter: string | undefined;
    let newDataFilter: string | undefined;
    let newDatetimeFilter: string | undefined;
    try {
      currentDataFilter = source.getParams()['FILTER'];
      currentDatetimeFilter = source.getParams()['TIME'];

      if ('getVersionOrDefault' in layerConfig) {
        sourceParams.FILTER = undefined;
        newDataFilter = filter?.getDataRelatedFilters();

        if (newDataFilter) {
          const ogcXmlFilter = WfsRenderer.sqlToOlFilterXml(
            newDataFilter,
            layerConfig.getVersionOrDefault(),
            layerConfig.getOutfields()?.[0]?.name!
          );

          sourceParams.FILTER = WfsRenderer.wrapOGCFilter(ogcXmlFilter, 'wms', false);
        }
      }

      sourceParams.TIME = undefined;
      newDatetimeFilter = filter?.getTimeFilter();
      if (newDatetimeFilter) {
        if ('getVersionOrDefault' in layerConfig) {
          sourceParams.TIME = this.#parseTimeFilterForWms(newDatetimeFilter, layerConfig.getServiceDateTimezone());
        } else {
          sourceParams.TIME = this.#parseTimeFilterForEsriImage(newDatetimeFilter);
        }
      }

      const shouldUpdateFilter = sourceParams.FILTER !== currentDataFilter || sourceParams.TIME !== currentDatetimeFilter;
      if (shouldUpdateFilter) source.updateParams(sourceParams);
    } catch (error: unknown) {
      throw new LayerInvalidLayerFilterError(
        layerConfig.layerPath,
        layerConfig.getLayerNameCascade(),
        `data: ${newDataFilter}, datetime: ${newDatetimeFilter}`,
        `data: ${currentDataFilter}, datetime: ${currentDatetimeFilter}`,
        formatError(error)
      );
    }
  }

  /**
   * Converts a reusable time filter predicate into a WMS TIME parameter value.
   *
   * @param timeFilter - Time filter predicate to convert
   * @param timezone - Optional service timezone used to normalize date values
   * @returns The WMS TIME parameter value
   */
  static #parseTimeFilterForWms(timeFilter: string, timezone?: string): string {
    const legacyQueryElements = timeFilter.split(/(?<=\b)\s*=/);
    if (legacyQueryElements.length > 1 && /\bdate\s*'/i.test(legacyQueryElements[1])) {
      return this.parseDateTimeValuesEsriImageOrWMS(legacyQueryElements[1].trim(), timezone).replace(/\s*/g, '');
    }

    const normalizeDate = (date: string): string => {
      return this.parseDateTimeValuesEsriImageOrWMS(`date '${date}'`, timezone);
    };
    const timeValues = this.#parseCanonicalTimeFilterValues(timeFilter);

    return timeValues.map(normalizeDate).join('/');
  }

  /**
   * Converts a reusable time filter predicate into an Esri Image TIME parameter value.
   *
   * @param timeFilter - Time filter predicate to convert
   * @returns The Esri Image TIME parameter value
   */
  static #parseTimeFilterForEsriImage(timeFilter: string): string {
    const legacyTimeMatch = /^\s*time\s*=\s*(\d+)(?:\s*,\s*(\d+))?\s*$/i.exec(timeFilter);
    if (legacyTimeMatch)
      return legacyTimeMatch
        .slice(1)
        .filter((value) => value !== undefined)
        .join(',');

    return this.#parseCanonicalTimeFilterValues(timeFilter)
      .map((date) => DateMgt.convertToMilliseconds(date))
      .join(',');
  }

  /**
   * Extracts date values from a reusable equality or bounded-range time predicate.
   *
   * @param timeFilter - Time filter predicate to parse
   * @returns The selected date values in predicate order
   * @throws {Error} When the time filter does not use a supported predicate
   */
  static #parseCanonicalTimeFilterValues(timeFilter: string): string[] {
    const filterEquation = GeoviewRenderer.createFilterNodeFromFilter(timeFilter);

    const isSingleDate =
      filterEquation.length === 3 &&
      filterEquation[0].nodeType === NodeType.variable &&
      filterEquation[1].nodeType === NodeType.binary &&
      filterEquation[1].nodeValue === '=' &&
      filterEquation[2].nodeType === NodeType.string &&
      typeof filterEquation[2].nodeValue === 'string';
    if (isSingleDate) return [filterEquation[2].nodeValue as string];

    const isDateRange =
      filterEquation.length === 7 &&
      filterEquation[0].nodeType === NodeType.variable &&
      filterEquation[1].nodeType === NodeType.binary &&
      ['>', '>='].includes(filterEquation[1].nodeValue as string) &&
      filterEquation[2].nodeType === NodeType.string &&
      typeof filterEquation[2].nodeValue === 'string' &&
      filterEquation[3].nodeType === NodeType.binary &&
      filterEquation[3].nodeValue === 'and' &&
      filterEquation[4].nodeType === NodeType.variable &&
      filterEquation[4].nodeValue === filterEquation[0].nodeValue &&
      filterEquation[5].nodeType === NodeType.binary &&
      ['<', '<='].includes(filterEquation[5].nodeValue as string) &&
      filterEquation[6].nodeType === NodeType.string &&
      typeof filterEquation[6].nodeValue === 'string';
    if (isDateRange) return [filterEquation[2].nodeValue as string, filterEquation[6].nodeValue as string];

    throw new Error('Unsupported time filter syntax');
  }

  /**
   * Create lookup dictionary of names to aliases.
   *
   * @param outfields - Optional outfields array from layer metadata
   * @returns The alias lookup dictionary
   */
  static createAliasLookup(outfields: TypeOutfields[] | undefined): TypeAliasLookup {
    if (!outfields) return {};

    const aliasLookup =
      outfields?.reduce((acc, field) => {
        // eslint-disable-next-line no-param-reassign
        acc[field.name] = field.alias;
        return acc;
      }, {} as TypeAliasLookup) ?? {};

    return aliasLookup;
  }

  /**
   * Rewrites SQL `LIKE` operations into case-insensitive equivalents for
   * Esri Dynamic (MapServer) services by wrapping the field in `UPPER()`
   * and uppercasing the comparison pattern.
   *
   * @example
   * ```
   * StationName like '%riv%'
   * ```
   * becomes:
   * ```
   * UPPER(StationName) LIKE '%RIV%'
   * ```
   *
   * Only the provided field names are transformed; all other expressions remain untouched.
   *
   * @param filter - The original SQL-like filter string
   * @param fieldNames - List of field names allowed to be rewritten for case-insensitive LIKE matching
   * @returns The transformed filter string with case-insensitive LIKE operations applied
   */
  static parseLikeOperationsEsriDynamic(filter: string, fieldNames: string[]): string {
    let filterValueToUse = filter;

    if (!filter || fieldNames.length === 0) return filterValueToUse;

    // Escape field names for regex usage
    const escapedFields = fieldNames.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    /**
     * Regex explanation:
     * 1. (field)        => capture the field name
     * 2. \s+like\s+     => LIKE operator (case-insensitive)
     * 3. ('...')        => SQL string literal (single quotes)
     */
    const likeRegex = new RegExp(`\\b(${escapedFields.join('|')})\\b\\s+like\\s+('([^']*)')`, 'gi');

    // Proceed
    filterValueToUse = filterValueToUse.replace(likeRegex, (_match: string, field: string, _quotedValue: string, rawValue: string) => {
      // Uppercase the literal content, not the quotes
      const upperValue = rawValue.toUpperCase();
      return `UPPER(${field}) LIKE '${upperValue}'`;
    });

    // Return the result
    return filterValueToUse;
  }
}

export type EsriRelatedRecordsJsonResponse = {
  features: EsriRelatedRecordsJsonResponseRelatedRecord[];
  relatedRecordGroups: EsriRelatedRecordsJsonResponseRelatedRecordGroup[];
};

export type EsriRelatedRecordsJsonResponseRelatedRecordGroup = {
  relatedRecords: EsriRelatedRecordsJsonResponseRelatedRecord[];
};

export type EsriRelatedRecordsJsonResponseRelatedRecord = {
  attributes: { [key: string]: unknown };
  geometry: GeometryJson;
};

export type GeometryJson = {
  points: Coordinate[];
  paths: Coordinate[][];
  rings: Coordinate[][];
  x: Coordinate;
  y: Coordinate;
};
