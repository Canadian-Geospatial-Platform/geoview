import type { Coordinate } from 'ol/coordinate';

import type { TemporalMode, TimeIANA } from '@/core/utils/date-mgt';
import { DateMgt } from '@/core/utils/date-mgt';
import type { TypeAliasLookup, TypeOutfields } from '@/api/types/map-schema-types';

export class GVLayerUtilities {
  /**
   * Normalizes ISO 8601 datetime literals in a filter string for use with
   * ESRI Dynamic (MapServer) layers.
   *
   * This function:
   * - Detects SQL-style date literals containing ISO 8601 datetimes
   *   (e.g. `date '2020-01-01T05:00:00Z'`)
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
   * time_field >= date '2020-01-01T05:00:00Z'
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
    const matches = [...filterValueToUse.matchAll(DateMgt.REGEX_ISO_DATE_WITH_PREFIX)];

    // Replace from end to start to preserve indexes
    matches.reverse().forEach((match) => {
      const fullMatch = match[0]; // date '...'
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
   * - Detects SQL-style date literals containing ISO 8601 datetimes
   *   (e.g. `date '2020-01-01T05:00:00Z'`)
   * - Extracts and normalizes the ISO datetime value
   * - Removes the surrounding SQL `date '...'` literal
   *
   * ImageServer and WMS services do not forward filters directly to a database
   * and do not support SQL keywords such as `TIMESTAMP`.
   *
   * @example
   * ```
   * acquisition_date >= date '2020-01-01T05:00:00Z'
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
    const matches = [...filterValueToUse.matchAll(DateMgt.REGEX_ISO_DATE_WITH_PREFIX)];

    // Replace from end to start to preserve indexes
    matches.reverse().forEach((match) => {
      const fullMatch = match[0]; // date '...'
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
    filterValueToUse = filterValueToUse.replace(likeRegex, (_match, field: string, quotedValue: string, rawValue: string) => {
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
