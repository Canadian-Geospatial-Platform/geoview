import { TypeWindow } from 'geoview-core';
import { LayerListEntry, Layout } from 'geoview-core/src/core/components/common';
import { useVisibleTimeSliderLayers, useAppDisplayLanguage, useTimeSliderLayers } from 'geoview-core/src/core/stores';
import { TimeSlider } from './time-slider';

interface TypeTimeSliderProps {
  mapId: string;
}

/**
 * translations object to inject to the viewer translations
 */
const translations: { [index: string]: { [index: string]: string } } = {
  en: {
    noLayers: 'No layers with temporal data',
  },
  fr: {
    noLayers: 'Pas de couches avec des données temporelles',
  },
};

const { cgpv } = window as TypeWindow;

/**
 * Time slider tab
 *
 * @param {TypeTimeSliderProps} props The properties passed to slider
 * @returns {JSX.Element} the time slider tab
 */
export function TimeSliderPanel(props: TypeTimeSliderProps): JSX.Element {
  const { mapId } = props;
  const { react, ui } = cgpv;
  const { useState, useEffect } = react;
  const { Box } = ui.elements;
  const displayLanguage = useAppDisplayLanguage();

  const [selectedLayerPath, setSelectedLayerPath] = useState<string>();

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

  if (!visibleTimeSliderLayers.length) return <span>{translations[displayLanguage].noLayers}</span>;
  return selectedLayerPath ? (
    <Layout
      selectedLayerPath={selectedLayerPath}
      handleLayerList={handleLayerList}
      layerList={visibleTimeSliderLayers.map((layer) => {
        return { layerName: timeSliderLayers[layer].name, layerPath: layer, tooltip: timeSliderLayers[layer].name };
      })}
    >
      <TimeSlider mapId={mapId} layerPath={selectedLayerPath} key={selectedLayerPath} />
    </Layout>
  ) : (
    <Box />
  );
}
