import type { Coordinate } from 'ol/coordinate';
import type { TypeDateFragments } from '@/core/utils/date-mgt';
import type { TypeOutfieldsType, TypeAliasLookup, TypeOutfields } from '@/api/types/map-schema-types';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
export declare class GVLayerUtilities {
    /**
     * Returns the type of the specified field.
     * @param {AbstractBaseLayerEntryConfig} layerConfig The layer config
     * @param {string} fieldName field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     * @deprecated This function seems deprecated, it's called, but where it's called doesn't seem to be called anywhere, remove it and remove where it's called?
     */
    static featureInfoGetFieldType(layerConfig: AbstractBaseLayerEntryConfig, fieldName: string): TypeOutfieldsType;
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