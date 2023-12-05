import { TypeWindow } from 'geoview-core';
import { CloseButton, EnlargeButton, LayerList, LayerListEntry, LayerTitle, ResponsiveGrid } from 'geoview-core/src/core/components/common';
import { useVisibleTimeSliderLayers, useTimeSliderLayers, useGeoviewDisplayLanguage } from 'geoview-core/src/core/stores';
import { getSxClasses } from './time-slider-style';
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
  const { react, ui, useTranslation } = cgpv;
  const { useCallback, useState, useEffect } = react;
  const { Box } = ui.elements;
  const { useTheme } = ui;
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const [selectedLayerPath, setSelectedLayerPath] = useState<string>();
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [isEnlargeDataTable, setIsEnlargeDataTable] = useState(false);

  const displayLanguage = useGeoviewDisplayLanguage();
  const visibleTimeSliderLayers = useVisibleTimeSliderLayers();
  const timeSliderLayers = useTimeSliderLayers();

  useEffect(() => {
    if (!selectedLayerPath) setSelectedLayerPath(visibleTimeSliderLayers[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTimeSliderLayers]);

  /**
   * Handles clicks to layers in left panel. Sets selected layer.
   *
   * @param {LayerListEntry} layer The data of the selected layer
   */
  const handleLayerChange = (layer: LayerListEntry): void => {
    setSelectedLayerPath(layer.layerPath);
    setIsLayersPanelVisible(true);
  };

  /**
   * Render group layers as list.
   *
   * @returns JSX.Element
   */
  const renderLayerList = useCallback(() => {
    if (visibleTimeSliderLayers.length)
      return (
        <LayerList
          isEnlargeDataTable={isEnlargeDataTable}
          selectedLayerIndex={selectedLayerPath ? visibleTimeSliderLayers.indexOf(selectedLayerPath) : 0}
          handleListItemClick={(layer) => {
            handleLayerChange(layer);
          }}
          layerList={visibleTimeSliderLayers.map((layer) => ({
            layerName: timeSliderLayers[layer].name,
            layerPath: layer,
            tooltip: layer as string,
          }))}
        />
      );
    return <span>{translations[displayLanguage].noLayers}</span>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTimeSliderLayers, selectedLayerPath, isEnlargeDataTable]);

  return (
    <Box sx={sxClasses.detailsContainer}>
      <ResponsiveGrid.Root>
        <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
          <LayerTitle>{t('general.layers')}</LayerTitle>
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              [theme.breakpoints.up('md')]: { justifyContent: 'right' },
              [theme.breakpoints.down('md')]: { justifyContent: 'space-between' },
            }}
          >
            <LayerTitle hideTitle>{selectedLayerPath}</LayerTitle>
            <Box>
              <EnlargeButton isEnlargeDataTable={isEnlargeDataTable} setIsEnlargeDataTable={setIsEnlargeDataTable} />
              <CloseButton isLayersPanelVisible={isLayersPanelVisible} setIsLayersPanelVisible={setIsLayersPanelVisible} />
            </Box>
          </Box>
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
      <ResponsiveGrid.Root>
        <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
          {renderLayerList()}
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
          {selectedLayerPath && <TimeSlider mapId={mapId} layerPath={selectedLayerPath} key={selectedLayerPath} />}
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
    </Box>
  );
}
