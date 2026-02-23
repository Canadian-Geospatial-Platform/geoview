import type { Coordinate } from 'ol/coordinate';
import type { TemporalMode, TimeIANA } from '@/core/utils/date-mgt';
import type { TypeAliasLookup, TypeOutfields } from '@/api/types/map-schema-types';
export declare class GVLayerUtilities {
    /**
     * Normalizes ISO 8601 datetime literals in a filter string for use with
     * ESRI Dynamic (MapServer) layers.
     * This function:
     * - Detects SQL-style date literals containing ISO 8601 datetimes
     *   (e.g. `date '2020-01-01T05:00:00Z'`)
     * - Extracts and normalizes the ISO datetime value
     * - Removes timezone information (`Z` or offsets)
     * - Replaces the original literal with an ESRI- and database-friendly
     *   `TIMESTAMP 'YYYY-MM-DD HH:mm:ss'` expression
     * This is required because Dynamic services forward `layerDefs` directly
     * to the underlying datastore, and `TIMESTAMP` is the most portable and
     * reliable datetime literal across supported databases.
     * Example:
     * ```
     * time_field >= date '2020-01-01T05:00:00Z'
     * ```
     * becomes:
     * ```
     * time_field >= TIMESTAMP '2020-01-01 05:00:00'
     * ```
     * @param {string} filter - The original filter string containing ISO datetime values.
     * @param {TimeIANA} [timezone] - Optional IANA timezone used to normalize datetime values
     *                                before stripping timezone information.
     * @returns {string} A SQL filter string with normalized `TIMESTAMP` datetime literals
     * suitable for ESRI Dynamic (MapServer) services.
     */
    static parseDateTimeValuesEsriDynamic(filter: string, timezone?: TimeIANA, inputTemporalMode?: TemporalMode): string;
    /**
     * Normalizes ISO 8601 datetime literals in a filter string for use with
     * ESRI ImageServer and WMS layers.
     * This function:
     * - Detects SQL-style date literals containing ISO 8601 datetimes
     *   (e.g. `date '2020-01-01T05:00:00Z'`)
     * - Extracts and normalizes the ISO datetime value
     * - Removes the surrounding SQL `date '...'` literal
     * ImageServer and WMS services do not forward filters directly to a database
     * and do not support SQL keywords such as `TIMESTAMP`.
     * Example:
     * ```
     * acquisition_date >= date '2020-01-01T05:00:00Z'
     * ```
     * becomes:
     * ```
     * acquisition_date >= 2020-01-01T05:00:00Z
     * ```
     * @param {string} filter - The original filter string containing SQL-style date literals.
     * @param {TimeIANA} [timezone] - Optional IANA timezone used to normalize datetime values
     *                                before stripping timezone information.
     * @returns {string} A filter string with normalized, timezone-less datetime values suitable
     *   for ESRI ImageServer and WMS services.
     */
    static parseDateTimeValuesEsriImageOrWMS(filter: string, timezone?: TimeIANA, inputTemporalMode?: TemporalMode): string;
    /**
     * Create lookup dictionary of names to aliases
     * @param {TypeOutfields[]} [outfields] - The outfields array from layer metadata
     * @returns {TypeAliasLookup} The alias lookup dictionary
     */
    static createAliasLookup(outfields: TypeOutfields[] | undefined): TypeAliasLookup;
    /**
     * Rewrites SQL `LIKE` operations into case-insensitive equivalents for
     * Esri Dynamic (MapServer) services by wrapping the field in `UPPER()`
     * and uppercasing the comparison pattern.
     * Example:
     * ```
     * StationName like '%riv%'
     * ```
     * becomes:
     * ```
     * UPPER(StationName) LIKE '%RIV%'
     * ```
     * Only the provided field names are transformed; all other expressions remain untouched.
     * @param {string} filter - The original SQL-like filter string.
     * @param {string[]} fieldNames - List of field names allowed to be rewritten for case-insensitive LIKE matching.
     * @returns {string} The transformed filter string with case-insensitive LIKE operations applied.
     * @static
     */
    static parseLikeOperationsEsriDynamic(filter: string, fieldNames: string[]): string;
}
export type EsriRelatedRecordsJsonResponse = {
    features: EsriRelatedRecordsJsonResponseRelatedRecord[];
    relatedRecordGroups: EsriRelatedRecordsJsonResponseRelatedRecordGroup[];
};
export type EsriRelatedRecordsJsonResponseRelatedRecordGroup = {
    relatedRecords: EsriRelatedRecordsJsonResponseRelatedRecord[];
};
export type EsriRelatedRecordsJsonResponseRelatedRecord = {
    attributes: {
        [key: string]: unknown;
    };
    geometry: GeometryJson;
};
export type GeometryJson = {
    points: Coordinate[];
    paths: Coordinate[][];
    rings: Coordinate[][];
    x: Coordinate;
    y: Coordinate;
};
//# sourceMappingURL=utils.d.ts.map