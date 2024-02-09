import { TypeWindow } from 'geoview-core';
import { LayerListEntry, Layout } from 'geoview-core/src/core/components/common';
import { useVisibleTimeSliderLayers, useTimeSliderLayers } from 'geoview-core/src/core/stores';
import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { Typography } from 'geoview-core/src/ui';
import { TimeSlider } from './time-slider';
import { ConfigProps } from './time-slider-types';

interface TypeTimeSliderProps {
  configObj: ConfigProps;
  mapId: string;
}

const { cgpv } = window as TypeWindow;

/**
 * Time slider tab
 *
 * @param {TypeTimeSliderProps} props The properties passed to slider
 * @returns {JSX.Element} the time slider tab
 */
export function TimeSliderPanel(props: TypeTimeSliderProps): JSX.Element {
  const { mapId, configObj } = props;
  const { react } = cgpv;
  const { useState, useEffect, useCallback } = react;

  // internal state
  const [selectedLayerPath, setSelectedLayerPath] = useState<string>();

  // get values from store
  const visibleTimeSliderLayers = useVisibleTimeSliderLayers();
  const timeSliderLayers = useTimeSliderLayers();

  /**
   * handle Layer list when clicked on each layer.
   * @param {LayerListEntry} layer layer clicked by the user.
   */
  const handleLayerList = (layer: LayerListEntry) => {
    setSelectedLayerPath(layer.layerPath);
  };

  useEffect(() => {
    if (!selectedLayerPath) setSelectedLayerPath(visibleTimeSliderLayers[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTimeSliderLayers]);

  const renderLayerList = useCallback(() => {
    const array = visibleTimeSliderLayers.map((layerPath: string) => {
      // TODO: Update the layerStatus and queryStatus below if necessary
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

  return selectedLayerPath ? (
    <Layout selectedLayerPath={selectedLayerPath} handleLayerList={handleLayerList} layerList={renderLayerList()}>
      <TimeSlider mapId={mapId} config={configObj} layerPath={selectedLayerPath} key={selectedLayerPath} />
    </Layout>
  ) : (
    <Typography>{getLocalizedMessage(mapId, 'timeSlider.panel.noLayers')}</Typography>
  );
}
