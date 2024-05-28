import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Geometry, Point, Polygon, LineString, MultiPoint } from 'ol/geom';

import { MenuItem } from '@/ui';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { TypeJsonObject } from '@/core/types/global-types';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';

interface JSONExportButtonProps {
  features: TypeFeatureInfoEntry[];
  layerPath: string;
}

/**
 * Custom  GeoJson export button which will help to download data table data in geojson format.
 * @param {TypeFeatureInfoEntry[]} features list of rows to be displayed in data table
 * @param {string} layerPath id of the layer
 * @returns {JSX.Element} returns Menu Item
 *
 */
function JSONExportButton({ features, layerPath }: JSONExportButtonProps): JSX.Element {
  const { t } = useTranslation<string>();

  // get store value - projection config to transfer lat long.
  const { transformPoints } = useMapStoreActions();

  /**
   * Creates a geometry json
   * @param {Geometry} geometry - The geometry
   * @returns {TypeJsonObject} The geometry json
   */
  const buildGeometry = useCallback(
    (geometry: Geometry): TypeJsonObject => {
      let builtGeometry = {};

      if (geometry instanceof Polygon) {
        builtGeometry = {
          type: 'Polygon',
          coordinates: geometry.getCoordinates().map((coords) => {
            return coords.map((coord) => transformPoints([coord], 4326)[0]);
          }),
        };
      } else if (geometry instanceof LineString) {
        builtGeometry = { type: 'LineString', coordinates: geometry.getCoordinates().map((coord) => transformPoints([coord], 4326)[0]) };
      } else if (geometry instanceof Point) {
        builtGeometry = { type: 'Point', coordinates: transformPoints([geometry.getCoordinates()], 4326)[0] };
      } else if (geometry instanceof MultiPoint) {
        builtGeometry = { type: 'MultiPoint', coordinates: geometry.getCoordinates().map((coord) => transformPoints([coord], 4326)[0]) };
      }

      return builtGeometry;
    },
    [transformPoints]
  );

  /**
   * Builds the JSON file
   * @returns {string} Json file content as string
   */
  const getJson = useCallback((): string => {
    const geoData = features.map((feature) => {
      const { geometry, fieldInfo } = feature;
      return {
        type: 'Feature',
        geometry: buildGeometry(geometry?.getGeometry() as Geometry),
        properties: fieldInfo,
      };
    });

    // Stringify with some indentation
    return JSON.stringify({ type: 'FeatureCollection', features: geoData }, null, 2);
  }, [buildGeometry, features]);

  /**
   * Exports the blob to a file
   * @param {Blob} blob - The blob to save to file
   * @param {string} filename - File name
   */
  const exportBlob = useCallback((blob: Blob, filename: string): void => {
    // Save the blob in a json file
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }, []);

  /**
   * Exports data table in csv format.
   */
  const handleExportData = useCallback((): void => {
    const jsonString = getJson();
    const blob = new Blob([jsonString], {
      type: 'text/json',
    });

    exportBlob(blob, `table-${layerPath}.json`);
  }, [exportBlob, getJson, layerPath]);

  return <MenuItem onClick={handleExportData}>{t('dataTable.jsonExportBtn')}</MenuItem>;
}

export default JSONExportButton;
