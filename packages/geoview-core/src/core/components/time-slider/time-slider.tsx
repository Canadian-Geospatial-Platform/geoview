/* eslint-disable react/require-default-props */
import React, { useCallback, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { t } from 'i18next';
import {
  Grid,
  Box,
  ChevronRightIcon,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  SendIcon,
  Tooltip,
  Typography,
} from '@/ui';
import { getSxClasses } from './time-slider-style';
import { TimeSliderPanel } from './time-slider-panel';
import { api, getLocalizedValue } from '@/app';

export interface SliderFilterProps {
  range: string[];
  defaultValue: string;
  minAndMax: number[];
  field: string;
  values: number[];
  filtering: boolean;
}

interface TypeTimeSliderProps {
  mapId: string;
}

/**
 * Time slider tab
 *
 * @param {TypeTimeSliderProps} props The properties passed to slider
 * @returns {JSX.Element} the time slider tab
 */
export function TimeSlider(props: TypeTimeSliderProps): JSX.Element {
  const { mapId } = props;
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Create list of layers that have a temporal dimension
  const layersList: string[] = Object.keys(api.maps[mapId].layer.registeredLayers).filter(
    (layerPath) =>
      api.maps[mapId].layer.registeredLayers[layerPath].entryType !== 'group' &&
      api.maps[mapId].layer.geoviewLayers[layerPath.split('/')[0]].layerTemporalDimension[layerPath]
  );

  let timeSliderData: { [index: string]: SliderFilterProps } = {};
  layersList.forEach((layerPath) => {
    const temporalDimensionInfo = api.maps[mapId].layer.geoviewLayers[layerPath.split('/')[0]].layerTemporalDimension[layerPath];
    const { range } = temporalDimensionInfo.range;
    const defaultValue = temporalDimensionInfo.default;
    const minAndMax: number[] = [new Date(range[0]).getTime(), new Date(range[range.length - 1]).getTime()];
    const { field } = temporalDimensionInfo;
    const values = temporalDimensionInfo.singleHandle ? [new Date(temporalDimensionInfo.default).getTime()] : [...minAndMax];
    const filtering = true;
    const sliderData = { [layerPath]: { range, defaultValue, minAndMax, field, filtering, values } };
    timeSliderData = { ...timeSliderData, ...sliderData };
  });

  // First layer is initially selected
  const [selectedLayer, setSelectedLayer] = useState<string>(layersList[0]);

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
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setSelectedLayer(layerPath);
                    }}
                    sx={{ height: '67px' }}
                  >
                    <ListItemIcon>
                      <SendIcon />
                    </ListItemIcon>
                    <Tooltip title={layerName} placement="top" enterDelay={1000}>
                      <ListItemText sx={sxClasses.layerNamePrimary} primary={layerName || layerPath} />
                    </Tooltip>
                    <IconButton edge="end" sx={sxClasses.listItemIcon}>
                      <ChevronRightIcon />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              </Paper>
            );
          }
          return null;
        })}
      </List>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layersList, selectedLayer]);

  return (
    <Box sx={sxClasses.detailsContainer}>
      <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4, md: 8 }}>
        <Grid container style={{ padding: '20px 0px 28px 0px' }}>
          <Grid item md={4}>
            <Typography component="div" sx={{ ...sxClasses.panelHeaders, paddingLeft: '20px' }}>
              {t('details.availableLayers')}
            </Typography>
            {renderLayerList()}
          </Grid>
          <TimeSliderPanel mapId={mapId} layerPath={selectedLayer} sliderFilterProps={timeSliderData[selectedLayer]} key={selectedLayer} />
        </Grid>
      </Grid>
    </Box>
  );
}
