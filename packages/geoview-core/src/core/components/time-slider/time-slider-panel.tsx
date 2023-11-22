/* eslint-disable react/require-default-props */
import React, { useCallback, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { t } from 'i18next';
import { Box } from '@/ui';
import { getSxClasses } from './time-slider-style';
import { TimeSlider } from './time-slider';
import { SliderFilterProps } from './time-slider-api';
import { CloseButton, EnlargeButton, LayerList, LayerListEntry, LayerTitle, ResponsiveGrid } from '../common';

interface TypeTimeSliderProps {
  mapId: string;
  layersList: string[];
  timeSliderData: { [index: string]: SliderFilterProps };
}

/**
 * Time slider tab
 *
 * @param {TypeTimeSliderProps} props The properties passed to slider
 * @returns {JSX.Element} the time slider tab
 */
export function TimeSliderPanel(props: TypeTimeSliderProps): JSX.Element {
  const { mapId, layersList, timeSliderData } = props;
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // First layer is initially selected
  const [selectedLayerPath, setSelectedLayerPath] = useState<string>(layersList[0]);
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [isEnlargeDataTable, setIsEnlargeDataTable] = useState(false);

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
    return (
      <LayerList
        isEnlargeDataTable={isEnlargeDataTable}
        selectedLayerIndex={layersList.indexOf(selectedLayerPath)}
        handleListItemClick={(layer) => handleLayerChange(layer)}
        layerList={layersList.map((layer) => ({ layerName: layer, layerPath: layer, tooltip: layer as string }))}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layersList, selectedLayerPath, isEnlargeDataTable]);

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
      <ResponsiveGrid.Root sx={{ mt: 8 }}>
        <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
          {renderLayerList()}
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
          <TimeSlider
            mapId={mapId}
            layerPath={selectedLayerPath}
            sliderFilterProps={timeSliderData[selectedLayerPath]}
            key={selectedLayerPath}
          />
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
    </Box>
  );
}
