import i18n from 'i18next';

import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from './types/config-constants';
import { TypeGeoviewLayerType } from './types/config-types';
import { TypeDisplayLanguage, TypeLayerEntryType } from './types/map-schema-types';

type NewType = TypeGeoviewLayerType;

/**
 * Definition of the GeoView layer entry types for each type of Geoview layer
 */
export const convertLayerTypeToEntry = (layerType: NewType): TypeLayerEntryType => {
  switch (layerType) {
    case CONST_LAYER_TYPES.CSV:
    case CONST_LAYER_TYPES.GEOJSON:
    case CONST_LAYER_TYPES.GEOPACKAGE:
    case CONST_LAYER_TYPES.OGC_FEATURE:
    case CONST_LAYER_TYPES.WFS:
    case CONST_LAYER_TYPES.ESRI_FEATURE:
      return CONST_LAYER_ENTRY_TYPES.VECTOR;

    case CONST_LAYER_TYPES.IMAGE_STATIC:
    case CONST_LAYER_TYPES.ESRI_DYNAMIC:
    case CONST_LAYER_TYPES.ESRI_IMAGE:
    case CONST_LAYER_TYPES.WMS:
      return CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;
    case CONST_LAYER_TYPES.XYZ_TILES:
    case CONST_LAYER_TYPES.VECTOR_TILES:
      return CONST_LAYER_ENTRY_TYPES.RASTER_TILE;
    default:
      // Throw unsupported error
      throw new Error(`Unsupported layer type ${layerType} to convert to layer entry`);
  }
};

/**
 * Return proper language Geoview localized values from map i18n instance
 *
 * @param {string} mapId the map to get the i18n
 * @param {string} localizedKey localize key to get
 * @returns {string} message with values replaced
 */
export function getLocalizedMessage(localizedKey: string, language: TypeDisplayLanguage): string {
  const trans = i18n.getFixedT(language);
  return trans(localizedKey);
}
