import type { Coordinate } from 'ol/coordinate';

import type { TypeDateFragments } from '@/core/utils/date-mgt';
import { DateMgt } from '@/core/utils/date-mgt';
import type { TypeAliasLookup, TypeOutfields } from '@/api/types/map-schema-types';

export class GVLayerUtilities {
  /**
   * Parses a datetime filter for use in a Vector Geoviewlayer.
   *
   * @param {string} filter - The filter containing datetimes to parse
   * @returns {TypeDateFragments | undefined} externalFragmentsOrder - The external fragments order of the layer
   */
  static parseDateTimeValuesVector(filter: string, externalFragmentsOrder: TypeDateFragments | undefined): string {
    // The retured filter
    let filterValueToUse = filter;

    // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
    // OLD REGEX, not working anymore, test before standardization
    //   ...`${filterValueToUse?.replaceAll(/\s{2,}/g, ' ').trim()} `.matchAll(
    //     /(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi
    //   ),
    const searchDateEntry = [
      ...filterValueToUse.matchAll(
        /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/gi
      ),
    ];

    searchDateEntry.reverse();
    searchDateEntry.forEach((dateFound) => {
      // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
      const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
      const reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], externalFragmentsOrder, reverseTimeZone);
      filterValueToUse = `${filterValueToUse.slice(0, dateFound.index)}${reformattedDate}${filterValueToUse.slice(
        dateFound.index + dateFound[0].length
      )}`;
    });

    // Return the filter values to use
    return filterValueToUse;
  }

  /**
   * Parses a datetime filter for use in an Esri Dynamic layer.
   *
   * @param {string} filter - The filter containing datetimes to parse
   * @returns {TypeDateFragments | undefined} externalFragmentsOrder - The external fragments order of the layer
   */
  static parseDateTimeValuesEsriDynamic(filter: string, externalFragmentsOrder: TypeDateFragments | undefined): string {
    // The retured filter
    let filterValueToUse = filter;

    // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
    // OLD REGEX, not working anymore, test before standardization
    //   ...`${filterValueToUse?.replaceAll(/\s{2,}/g, ' ').trim()} `.matchAll(
    //     /(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi
    //   ),
    const searchDateEntry = [
      ...filterValueToUse.matchAll(
        /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/gi
      ),
    ];

    searchDateEntry.reverse();
    searchDateEntry.forEach((dateFound) => {
      // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
      const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
      let reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], externalFragmentsOrder, reverseTimeZone);
      // GV ESRI Dynamic layers doesn't accept the ISO date format. The time zone must be removed. The 'T' separator
      // GV normally placed between the date and the time must be replaced by a space.
      reformattedDate = reformattedDate.slice(0, reformattedDate.length === 20 ? -1 : -6); // drop time zone.
      reformattedDate = reformattedDate.replace('T', ' ');
      filterValueToUse = `${filterValueToUse.slice(0, dateFound.index)}${reformattedDate}${filterValueToUse.slice(
        dateFound.index + dateFound[0].length
      )}`;
    });

    // Return the filter values to use
    return filterValueToUse;
  }

  /**
   * Parses a datetime filter for use in an Esri Image or WMS layer.
   *
   * @param {string} filter - The filter containing datetimes to parse
   * @returns {TypeDateFragments | undefined} externalFragmentsOrder - The external fragments order of the layer
   */
  static parseDateTimeValuesEsriImageOrWMS(filter: string, externalFragmentsOrder: TypeDateFragments | undefined): string {
    // The retured filter
    let filterValueToUse = filter;

    // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
    const searchDateEntry = [
      ...`${filterValueToUse} `.matchAll(/(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi),
    ];
    searchDateEntry.reverse();
    searchDateEntry.forEach((dateFound) => {
      // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
      const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
      const reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], externalFragmentsOrder, reverseTimeZone);
      filterValueToUse = `${filterValueToUse.slice(0, dateFound.index - 6)}${reformattedDate}${filterValueToUse.slice(
        dateFound.index + dateFound[0].length + 2
      )}`;
    });

    // Return the filter values to use
    return filterValueToUse;
  }

  // Create lookup dictionary of names to aliases
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
