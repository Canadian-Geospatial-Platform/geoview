import { TypeWindow } from 'geoview-core';
import { ChartType, SchemaValidator } from 'geochart';
import { LayerListEntry, Layout } from 'geoview-core/src/core/components/common';
import { GeoChart } from './geochart';
import { PluginGeoChartConfig } from './geochart-types';

interface GeoChartPanelProps {
  mapId: string;
  configObj: PluginGeoChartConfig<ChartType>;
  layerList: LayerListEntry[];
}

const { cgpv } = window as TypeWindow;

/**
 * Time slider tab
 *
 * @param {TypeTimeSliderProps} props The properties passed to slider
 * @returns {JSX.Element} the time slider tab
 */
export function GeoChartPanel(props: GeoChartPanelProps): JSX.Element {
  const { mapId, configObj, layerList } = props;
  const { react } = cgpv;
  const { useState } = react;

  const [selectedLayerPath, setSelectedLayerPath] = useState<string>('');

  /**
   * Handles clicks to layers in left panel. Sets selected layer.
   *
   * @param {LayerListEntry} layer The data of the selected layer
   */
  const handleLayerChange = (layer: LayerListEntry): void => {
    setSelectedLayerPath(layer.layerPath);
  };

  return (
    <Layout handleLayerList={handleLayerChange} selectedLayerPath={selectedLayerPath} layerList={layerList}>
      <GeoChart mapId={mapId} config={configObj} schemaValidator={new SchemaValidator()} />
    </Layout>
  );
}
