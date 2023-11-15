/* eslint-disable react/require-default-props */
import React, { useCallback, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { t } from 'i18next';
import { Box, ChevronRightIcon, IconButton, List, ListItem, ListItemButton, ListItemIcon, Paper, Tooltip, Typography } from '@/ui';
import { getSxClasses } from './time-slider-style';
import { TimeSlider } from './time-slider';
import { api, getLocalizedValue, IconStack } from '@/app';
import { SliderFilterProps } from './time-slider-api';
import { CloseButton, EnlargeButton, ResponsiveGrid } from '../common';

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
  const [selectedLayer, setSelectedLayer] = useState<string>(layersList[0]);
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [isEnlargeDataTable, setIsEnlargeDataTable] = useState(false);

  /**
   * Render group layers as list.
   *
   * @returns JSX.Element
   */
  const renderLayerList = useCallback(() => {
    return (
      <List sx={sxClasses.list}>
        {layersList.map((layerPath) => {
          const isSelectedBorder = layerPath === selectedLayer;
          const layerName = getLocalizedValue(api.maps[mapId].layer.registeredLayers[layerPath].layerName, mapId);
          // TODO use visible layers from store instead of this
          if (api.maps[mapId].layer.registeredLayers[layerPath].olLayer?.getVisible()) {
            return (
              <Paper
                sx={{ ...sxClasses.layerListPaper, border: isSelectedBorder ? `2px solid ${theme.palette.primary.main}` : 'none' }}
                key={layerPath}
              >
                <Tooltip title={layerName} placement="top" enterDelay={1000}>
                  <Box>
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => {
                          setSelectedLayer(layerPath);
                          setIsLayersPanelVisible(false);
                        }}
                        sx={{ height: '67px' }}
                      >
                        <ListItemIcon>
                          <IconStack layerPath={layerPath} />
                        </ListItemIcon>

                        <Box sx={sxClasses.listPrimaryText}>
                          <Typography component="p">{layerName}</Typography>
                        </Box>

                        <Box
                          sx={{
                            padding: isEnlargeDataTable ? '0.25rem' : '1rem',
                            paddingRight: isEnlargeDataTable ? '0.25rem' : '1rem',
                            [theme.breakpoints.down('xl')]: {
                              display: isEnlargeDataTable ? 'none !important' : 'block',
                            },
                            [theme.breakpoints.down('sm')]: {
                              display: 'none',
                            },
                          }}
                        >
                          <IconButton
                            disabled
                            edge="end"
                            size="small"
                            sx={{ color: `${theme.palette.primary.main} !important`, background: `${theme.palette.grey.A100} !important` }}
                          >
                            <ChevronRightIcon />
                          </IconButton>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  </Box>
                </Tooltip>
              </Paper>
            );
          }
          return null;
        })}
      </List>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layersList, selectedLayer, isEnlargeDataTable]);

  return (
    <Box sx={sxClasses.detailsContainer}>
      <ResponsiveGrid.Root>
        <ResponsiveGrid.Left xs={isLayersPanelVisible ? 12 : 0} md={3} isLayersPanelVisible={isLayersPanelVisible}>
          <Typography component="p" sx={sxClasses.panelHeaders}>
            {t('details.availableLayers')}
          </Typography>
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right
          isLayersPanelVisible={false}
          xs={!isLayersPanelVisible ? 12 : 0}
          md={9}
          sx={{ display: 'flex', justifyContent: 'right' }}
        >
          <EnlargeButton isEnlargeDataTable={isEnlargeDataTable} setIsEnlargeDataTable={setIsEnlargeDataTable} />
          <CloseButton isLayersPanelVisible={isLayersPanelVisible} setIsLayersPanelVisible={setIsLayersPanelVisible} />
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
      <ResponsiveGrid.Root sx={{ marginTop: '1rem' }}>
        <ResponsiveGrid.Left
          isLayersPanelVisible={isLayersPanelVisible}
          xs={isLayersPanelVisible ? 12 : 0}
          md={!isEnlargeDataTable ? 4 : 1.25}
        >
          {renderLayerList()}
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right
          xs={!isLayersPanelVisible ? 12 : 0}
          md={!isEnlargeDataTable ? 8 : 10.75}
          isLayersPanelVisible={isLayersPanelVisible}
        >
          <TimeSlider mapId={mapId} layerPath={selectedLayer} sliderFilterProps={timeSliderData[selectedLayer]} key={selectedLayer} />
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
    </Box>
  );
}
