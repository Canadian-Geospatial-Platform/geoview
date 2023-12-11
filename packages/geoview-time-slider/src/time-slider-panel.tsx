import { TypeWindow } from 'geoview-core';
import { LayerListEntry, Layout } from 'geoview-core/src/core/components/common';
import { useVisibleTimeSliderLayers, useTimeSliderLayers } from 'geoview-core/src/core/stores';
import { TimeSlider } from './time-slider';

interface TypeTimeSliderProps {
  configObj: unknown;
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
  const { react, ui } = cgpv;
  const { useTranslation } = cgpv;
  const { useState, useEffect } = react;
  const { Box } = ui.elements;

  const { t } = useTranslation();

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

  if (!visibleTimeSliderLayers.length) return <span>{t('timeSlider.panel.noLayers')}</span>;
  return selectedLayerPath ? (
    <Layout
      selectedLayerPath={selectedLayerPath}
      handleLayerList={handleLayerList}
      layerList={visibleTimeSliderLayers.map((layerPath: string) => {
        return { layerName: timeSliderLayers[layerPath].name, layerPath, tooltip: timeSliderLayers[layerPath].name };
      })}
    >
      <TimeSlider mapId={mapId} config={configObj} layerPath={selectedLayerPath} key={selectedLayerPath} />
    </Layout>
  ) : (
    <Box />
  );
}
