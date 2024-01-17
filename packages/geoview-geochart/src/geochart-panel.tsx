import { TypeWindow } from 'geoview-core';
import { ChartType, SchemaValidator } from 'geochart';
import { LayerListEntry, Layout } from 'geoview-core/src/core/components/common';
import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { useGeochartConfigs } from 'geoview-core/src/core/stores/store-interface-and-intial-values/geochart-state';
import { useMapVisibleLayers } from 'geoview-core/src/core/stores/store-interface-and-intial-values/map-state';
import { Typography } from 'geoview-core/src/ui/typography/typography';
import { Paper } from 'geoview-core/src/ui';
import { useTheme } from '@mui/material/styles';
import { GeoChart } from './geochart';
import { PluginGeoChartConfig } from './geochart-types';

import { getSxClasses } from './geochart-style';

interface GeoChartPanelProps {
  mapId: string;
  configObj: PluginGeoChartConfig<ChartType>;
}

const { cgpv } = window as TypeWindow;

type GeoChartLayerChartConfig = {
  [layerPath: string]: PluginGeoChartConfig<ChartType>;
};

/**
 * Geo Chart tab
 *
 * @param {TypeTimeSliderProps} props The properties passed to geo chart
 * @returns {JSX.Element} Geo Chart tab
 */
export function GeoChartPanel(props: GeoChartPanelProps): JSX.Element {
  const { mapId, configObj } = props;
  const { react } = cgpv;
  const { useState, useCallback, useEffect } = react;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const [selectedLayerPath, setSelectedLayerPath] = useState<string>('');

  //! Cast the config
  // const chartConfig: PluginGeoChartConfig<ChartType> | undefined = this.configObj;

  // get store geochart info
  const layerList = useGeochartConfigs();
  const visibleLayers = useMapVisibleLayers();

  // For a GeoChart to be used in a footer panel with a layer selection happening independently from the GeoChart itself,
  // we want 1 chart per layer, so this splits the main config in multiple chunks for each chart layer
  const layerChartConfigsState: GeoChartLayerChartConfig = {};
  configObj.charts.forEach((chart) => {
    // Retrieve a chart config for each layer
    const specificChartConfig = { charts: [chart] };
    const lyrPaths = chart.layers?.map((lyr) => {
      return lyr.layerId;
    });
    lyrPaths?.forEach((lyrPath) => {
      if (!(lyrPath in layerChartConfigsState)) {
        layerChartConfigsState[lyrPath] = specificChartConfig;
      }
    });
  });
  // const [layerChartConfigs] = useState<GeoChartLayerChartConfig>(layerChartConfigsState);

  // Create the validator shared for all the charts in the footer
  const [schemaValidator] = useState<SchemaValidator>(new SchemaValidator());

  /**
   * Handles clicks to layers in left panel. Sets selected layer.
   *
   * @param {LayerListEntry} layer The data of the selected layer
   */
  const handleLayerChange = (layer: LayerListEntry): void => {
    setSelectedLayerPath(layer.layerPath);
    cgpv.api.maps[mapId].plugins.geochart.redrawChart();
  };

  /**
   * Renders a single GeoChart component
   * @param chartConfig PluginGeoChartConfig<ChartType> the Chart Config to assign the the GeoChart
   * @param sx CSSProperties Styling to apply (basically if the GeoChart should be visible or not depending on the selected layer)
   * @returns JSX.Element
   */
  // const renderChart = (chartConfig: PluginGeoChartConfig<ChartType>, sx: React.CSSProperties, key: string) => {
  //   return <GeoChart sx={sx} key={key} mapId={mapId} config={chartConfig} schemaValidator={schemaValidator} />;
  // };

  useEffect(() => {
    // if (!selectedLayerPath) setSelectedLayerPath(layerList[visibleLayers[0]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleLayers]);

  const renderLayerList = useCallback(() => {
    const arrayValid = visibleLayers.filter((layerPath: string) => {
      return layerList[layerPath] !== undefined;
    });
    const array = arrayValid.map((layerPath: string) => {
      return layerList[layerPath].layerData;
    });

    return array;
  }, [layerList, visibleLayers]);

  return selectedLayerPath ? (
    <Layout selectedLayerPath={selectedLayerPath} handleLayerList={handleLayerChange} layerList={renderLayerList()}>
      {selectedLayerPath && <GeoChart mapId={mapId} schemaValidator={schemaValidator} />}
      {!selectedLayerPath && (
        <Paper sx={{ padding: '2rem' }}>
          <Typography variant="h3" gutterBottom sx={sxClasses.detailsInstructionsTitle}>
            {getLocalizedMessage(mapId, 'geochart.chartPanel.noLayers')}
          </Typography>
          <Typography component="p" sx={sxClasses.detailsInstructionsBody}>
            {getLocalizedMessage(mapId, 'geochart.chartPanel.noLayers')}
          </Typography>
        </Paper>
      )}
    </Layout>
  ) : (
    <Typography>{getLocalizedMessage(mapId, 'chartPanel.panel.noLayers')}</Typography>
  );

  // Loop on the layers to find out which is selected and grab the chart associated with the selected layer by moving its position to 0px
  // TODO: Remove the TEMP REDRAW button, obviously. Maybe think of a better way to handle the chart rendering? Leaving it like this for now.
  // return (
  //   <Layout handleLayerList={handleLayerChange} selectedLayerPath={selectedLayerPath} layerList={layerList}>
  //     <Box sx={{ position: 'absolute', right: '250px', zIndex: 9999 }}>
  //       <input
  //         style={{ border: 'solid red 1px' }}
  //         type="button"
  //         value="TEMP REDRAW"
  //         onClick={() => {
  //           cgpv.api.maps[mapId].plugins.geochart.redrawChart();
  //         }}
  //       />
  //     </Box>
  //     {Object.entries(layerChartConfigs).map(([layerPath, layerChartConfig], index) => {
  //       const sx: React.CSSProperties = { position: 'absolute', top: '-5000px' };
  //       if (layerPath === selectedLayerPath) {
  //         sx.top = '0px';
  //       }
  //       return renderChart(layerChartConfig, sx, index.toString());
  //     })}
  //   </Layout>
  // );
}
