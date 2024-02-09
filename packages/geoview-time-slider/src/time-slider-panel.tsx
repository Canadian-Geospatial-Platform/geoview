import { useTheme } from '@mui/material/styles';
import { TypeWindow, getLocalizedMessage } from 'geoview-core';
import { LayerListEntry, Layout } from 'geoview-core/src/core/components/common';
import { useVisibleTimeSliderLayers, useTimeSliderLayers } from 'geoview-core/src/core/stores';
import { Paper, Typography } from 'geoview-core/src/ui';
import { logger } from 'geoview-core/src/core/utils/logger';

import { TimeSlider } from './time-slider';
import { ConfigProps } from './time-slider-types';
import { getSxClasses } from './time-slider-style';

interface TypeTimeSliderProps {
  configObj: ConfigProps;
  mapId: string;
}

/**
 * Time slider tab
 *
 * @param {TypeTimeSliderProps} props The properties passed to slider
 * @returns {JSX.Element} the time slider tab
 */
export function TimeSliderPanel(props: TypeTimeSliderProps): JSX.Element {
  const { mapId, configObj } = props;
  const { cgpv } = window as TypeWindow;
  const { react } = cgpv;
  const { useState, useEffect, useCallback } = react;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [selectedLayerPath, setSelectedLayerPath] = useState<string>();

  // get values from store
  const visibleTimeSliderLayers = useVisibleTimeSliderLayers();
  const timeSliderLayers = useTimeSliderLayers();

  /**
   * handle Layer list when clicked on each layer.
   * @param {LayerListEntry} layer layer clicked by the user.
   */
  const handleLayerList = useCallback((layer: LayerListEntry) => {
    // Log
    logger.logTraceUseCallback('TIME-SLIDER-PANEL - handleLayerList');

    // Set the layer path
    setSelectedLayerPath(layer.layerPath);
  }, []);

  const renderLayerList = useCallback(() => {
    // Log
    logger.logTraceUseCallback('TIME-SLIDER-PANEL - renderLayerList');

    const array = visibleTimeSliderLayers.map((layerPath: string) => {
      // TODO: Check - Update the layerStatus and queryStatus below if necessary
      return {
        layerName: timeSliderLayers[layerPath].name,
        layerPath,
        tooltip: timeSliderLayers[layerPath].name,
        layerStatus: 'processed',
        queryStatus: 'processed',
      };
    });

    return array;
  }, [timeSliderLayers, visibleTimeSliderLayers]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER-PANEL - visibleTimeSliderLayers', visibleTimeSliderLayers);

    if (visibleTimeSliderLayers?.length) {
      setSelectedLayerPath(visibleTimeSliderLayers[0]);
    } else {
      setSelectedLayerPath(undefined);
    }
  }, [visibleTimeSliderLayers]);

  return (
    <Layout selectedLayerPath={selectedLayerPath} onLayerListClicked={handleLayerList} layerList={renderLayerList()}>
      {selectedLayerPath && <TimeSlider mapId={mapId} config={configObj} layerPath={selectedLayerPath} key={selectedLayerPath} />}
      {!selectedLayerPath && (
        <Paper sx={{ padding: '2rem' }}>
          <Typography variant="h3" gutterBottom sx={sxClasses.timeSliderInstructionsTitle}>
            {getLocalizedMessage(mapId, 'timeSlider.detailsInstructions')}
          </Typography>
          <Typography component="p" sx={sxClasses.timeSliderInstructionsBody}>
            {getLocalizedMessage(mapId, 'timeSlider.detailsInstructions')}
          </Typography>
        </Paper>
      )}
    </Layout>
  );
}
