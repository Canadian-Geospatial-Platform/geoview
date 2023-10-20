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
import { getSxClasses } from './range-slider-style';
import { RangeSliderPanel } from './range-slider-panel';
import { TypeArrayOfFeatureInfoEntries, api, getLocalizedValue } from '@/app';
import { SliderFilterProps } from './range-slider-api';

interface TypeRangeSliderProps {
  mapId: string;
  rangeSliderData: {
    [index: string]: {
      fieldIndices: number[];
      usedFieldTypes: string[];
      usedAliasFields: string[];
      usedOutFields: string[];
      minsAndMaxes: number[][];
      featureInfo: TypeArrayOfFeatureInfoEntries;
      activeSliders: SliderFilterProps[];
    };
  };
}

/**
 * layers list
 *
 * @param {TypeRangeSliderProps} props The properties passed to RangeSlider
 * @returns {JSX.Element} the layers list
 */
export function RangeSlider(props: TypeRangeSliderProps): JSX.Element {
  const { mapId, rangeSliderData } = props;
  const layersList = Object.keys(rangeSliderData);
  const theme = useTheme();

  const sxClasses = getSxClasses(theme);

  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number>(0);

  const handleListItemClick = useCallback((index: number) => {
    setSelectedLayerIndex(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Render group layers as list.
   *
   * @returns JSX.Element
   */
  const renderLayerList = useCallback(() => {
    return (
      <List sx={sxClasses.list}>
        {layersList.map((layerPath, i) => {
          const isSelectedBorder = i === selectedLayerIndex;
          const layerName = getLocalizedValue(api.maps[mapId].layer.registeredLayers[layerPath].layerName, mapId);
          if (api.maps[mapId].layer.registeredLayers[layerPath].olLayer?.getVisible()) {
            return (
              <Paper
                sx={{ ...sxClasses.layerListPaper, border: isSelectedBorder ? `2px solid ${theme.palette.primary.main}` : 'none' }}
                key={layerPath}
              >
                <ListItem
                  disablePadding
                  secondaryAction={
                    <IconButton edge="end" aria-label="expand" sx={sxClasses.listItemIcon}>
                      <ChevronRightIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    onClick={() => {
                      handleListItemClick(i);
                    }}
                    sx={{ height: '67px' }}
                  >
                    <ListItemIcon>
                      <SendIcon />
                    </ListItemIcon>
                    <Tooltip title={layerName} placement="top" enterDelay={1000}>
                      <ListItemText sx={sxClasses.layerNamePrimary} primary={layerName || layerPath} />
                    </Tooltip>
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
  }, [layersList, selectedLayerIndex]);

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
          <RangeSliderPanel
            mapId={mapId}
            layerPath={layersList[selectedLayerIndex]}
            sliderData={rangeSliderData[layersList[selectedLayerIndex]]}
            key={selectedLayerIndex}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
