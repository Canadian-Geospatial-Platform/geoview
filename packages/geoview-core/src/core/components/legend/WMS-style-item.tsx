import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useTheme, Theme } from '@mui/material/styles';
import {
  Box,
  Collapse,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
  IconButton,
  BrowserNotSupportedIcon,
  RadioButtonCheckedIcon,
  RadioButtonUncheckedIcon,
  Grid,
} from '@/ui';
import { TypeWmsLegendStyle } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { api, WMS } from '@/app';

const sxClasses = {
  legendIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    background: '#fff',
  },
  expandableIconContainer: {
    paddingLeft: 10,
  },
  maxIconImg: {
    maxWidth: 24,
    maxHeight: 24,
  },
  iconPreview: {
    marginLeft: 8,
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'palette.grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    '&:focus': {
      border: 'revert',
    },
  },
};

export interface TypeWMSStyleProps {
  layerId: string;
  mapId: string;
  subLayerId: string | undefined;
  style: TypeWmsLegendStyle;
  currentWMSStyle: string | undefined;
  setCurrentWMSStyle: Dispatch<SetStateAction<string>>;
}

/**
 * Legend Item for a WMS style
 *
 * @returns {JSX.Element} the legend list item
 */
export function WMSStyleItem(props: TypeWMSStyleProps): JSX.Element {
  const { layerId, mapId, subLayerId, style, currentWMSStyle, setCurrentWMSStyle } = props;
  const { name, legend } = style;

  const theme: Theme & {
    iconImage: React.CSSProperties;
  } = useTheme();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (name === currentWMSStyle) setCurrentWMSStyle(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWMSStyle]);

  const handleWMSStyleToggle = () => {
    (api.maps[mapId].layer.geoviewLayers[layerId] as WMS).setWmsStyle(name, subLayerId!);
    setCurrentWMSStyle(name);
  };

  return (
    <Grid item sm={12} md={subLayerId ? 12 : 6} lg={subLayerId ? 12 : 4}>
      <ListItem>
        <ListItemButton>
          <IconButton sx={sxClasses.iconPreview} color="primary" size="small" onClick={() => setIsOpen(!isOpen)}>
            {legend !== null && legend.toDataURL() !== 'no data' ? (
              <Box sx={sxClasses.legendIcon}>
                <img alt="icon" src={legend!.toDataURL()} style={sxClasses.maxIconImg} />
              </Box>
            ) : (
              <BrowserNotSupportedIcon />
            )}
          </IconButton>
          <Tooltip title={name} placement="top" enterDelay={1000}>
            <ListItemText sx={sxClasses.expandableIconContainer}>{name}</ListItemText>
          </Tooltip>
          <IconButton color="primary" onClick={() => handleWMSStyleToggle()}>
            {currentWMSStyle === name ? <RadioButtonCheckedIcon /> : <RadioButtonUncheckedIcon />}
          </IconButton>
        </ListItemButton>
      </ListItem>
      <Collapse in={isOpen} timeout="auto">
        <Box>
          <Box sx={sxClasses.expandableIconContainer}>
            {legend && legend!.toDataURL() && <img alt="" style={theme.iconImage} src={legend!.toDataURL()} />}
          </Box>
        </Box>
      </Collapse>
    </Grid>
  );
}
