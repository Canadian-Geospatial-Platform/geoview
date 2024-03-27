import { useTheme } from '@mui/material/styles';
import { TypeWindow } from 'geoview-core/src/core/types/global-types';
import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { LayerListEntry, Layout } from 'geoview-core/src/core/components/common';
import { useMapVisibleLayers, useTimeSliderLayers } from 'geoview-core/src/core/stores';
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
  const { useState, useCallback, useMemo, useEffect } = react;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [selectedLayerPath, setSelectedLayerPath] = useState<string>();

  // get values from store
  const visibleLayers = useMapVisibleLayers() as string[];
  const timeSliderLayers = useTimeSliderLayers();

  /**
   * handle Layer list when clicked on each layer.
   * @param {LayerListEntry} layer layer clicked by the user.
   */
  const handleClickLayerList = useCallback((layer: LayerListEntry) => {
    // Log
    logger.logTraceUseCallback('TIME-SLIDER-PANEL - handleLayerList');

    // Set the layer path
    setSelectedLayerPath(layer.layerPath);
  }, []);

  // Reacts when the array of layer data updates
  const memoLayersList = useMemo(() => {
    // Log
    logger.logTraceUseMemo('TIME-SLIDER-PANEL - memoLayersList', timeSliderLayers);

    // Return the layers
    return visibleLayers
      .map((layerPath) => {
        return { layerPath, timeSliderLayerInfo: timeSliderLayers[layerPath!] };
      })
      .filter((layer) => layer && layer.timeSliderLayerInfo)
      .map((layer) => {
        return {
          layerName: layer.timeSliderLayerInfo.name,
          layerPath: layer.layerPath,
          tooltip: layer.timeSliderLayerInfo.name,
          layerStatus: 'loaded',
          queryStatus: 'processed',
        } as LayerListEntry;
      });
  }, [visibleLayers, timeSliderLayers]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER-PANEL - memoLayersList', memoLayersList, selectedLayerPath);

    // If the selected layer path isn't in the list of layers possible, clear it
    if (selectedLayerPath && !memoLayersList.map((layer) => layer.layerPath).includes(selectedLayerPath)) {
      // Clear the selected layer path
      setSelectedLayerPath('');
    }
  }, [memoLayersList, selectedLayerPath]);

  return (
    <Layout selectedLayerPath={selectedLayerPath} onLayerListClicked={handleClickLayerList} layerList={memoLayersList}>
      {selectedLayerPath && <TimeSlider mapId={mapId} config={configObj} layerPath={selectedLayerPath} key={selectedLayerPath} />}
      {!selectedLayerPath && (
        <Paper sx={{ padding: '2rem' }}>
          <Typography variant="h3" gutterBottom sx={sxClasses.timeSliderInstructionsTitle}>
            {getLocalizedMessage(mapId, 'timeSlider.instructions')}
          </Typography>
          <Typography component="p" sx={sxClasses.timeSliderInstructionsBody}>
            {getLocalizedMessage(mapId, 'timeSlider.instructions')}
          </Typography>
        </Paper>
      )}
    </Layout>
  );
}
