import type { Coordinate } from 'ol/coordinate';
import type { TypeDateFragments } from '@/core/utils/date-mgt';
import type { TypeAliasLookup, TypeOutfields } from '@/api/types/map-schema-types';
export declare class GVLayerUtilities {
    /**
     * Parses a datetime filter for use in a Vector Geoviewlayer.
     *
     * @param {string} filter - The filter containing datetimes to parse
     * @returns {TypeDateFragments | undefined} externalFragmentsOrder - The external fragments order of the layer
     */
    static parseDateTimeValuesVector(filter: string, externalFragmentsOrder: TypeDateFragments | undefined): string;
    /**
     * Parses a datetime filter for use in an Esri Dynamic layer.
     *
     * @param {string} filter - The filter containing datetimes to parse
     * @returns {TypeDateFragments | undefined} externalFragmentsOrder - The external fragments order of the layer
     */
    static parseDateTimeValuesEsriDynamic(filter: string, externalFragmentsOrder: TypeDateFragments | undefined): string;
    /**
     * Parses a datetime filter for use in an Esri Image or WMS layer.
     *
     * @param {string} filter - The filter containing datetimes to parse
     * @returns {TypeDateFragments | undefined} externalFragmentsOrder - The external fragments order of the layer
     */
    static parseDateTimeValuesEsriImageOrWMS(filter: string, externalFragmentsOrder: TypeDateFragments | undefined): string;
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