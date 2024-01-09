import { useTranslation } from 'react-i18next';

import { Geometry, Point, Polygon, LineString, MultiPoint } from 'ol/geom';

import { MenuItem } from '@/ui';
import { DataTableDataEntrys } from './data-table';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

interface JSONExportButtonProps {
  features: DataTableDataEntrys[];
  layerId: string;
}

/**
 * Custom  GeoJson export button which will help to download data table data in geojson format.
 * @param {DataTableDataEntrys[]} features list of rows to be displayed in data table
 * @param {string} layerId id of the layer
 * @returns {JSX.Element} returns Menu Item
 *
 */
function JSONExportButton({ features, layerId }: JSONExportButtonProps): JSX.Element {
  const { t } = useTranslation<string>();

  // get store value - projection config to transfer lat long.
  const { transformPoints } = useMapStoreActions();

  /**
   * Create a geometry json
   *
   * @param {Geometry} geometry the geometry
   * @return {TypeJsonObject} the geometry json
   *
   */
  const buildGeometry = (geometry: Geometry) => {
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
  };

  /**
   * build the JSON file
   * @return {JSON.stringify} Json file content
   *
   */
  const getJson = (): string => {
    const geoData = features.map((feature) => {
      const { geometry, rows } = feature;
      return {
        type: 'Feature',
        geometry: buildGeometry(geometry?.getGeometry() as Geometry),
        properties: rows,
      };
    });

    // Stringify with some indentation
    return JSON.stringify({ type: 'FeatureCollection', features: geoData }, null, 2);
  };

  /**
   * export the blob to a file
   * @param {Blob} blob the blob to save to file
   * @param {string} filename file name
   */
  const exportBlob = (blob: Blob, filename: string) => {
    // Save the blob in a json file
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  /**
   * Export data table in csv format.
   */
  const handleExportData = () => {
    const jsonString = getJson();
    const blob = new Blob([jsonString], {
      type: 'text/json',
    });

    exportBlob(blob, `table-${layerId}.json`);
  };

  return <MenuItem onClick={handleExportData}>{t('dataTable.jsonExportBtn')}</MenuItem>;
}

export default JSONExportButton;
