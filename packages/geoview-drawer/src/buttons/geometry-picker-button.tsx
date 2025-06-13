import { TypeWindow } from 'geoview-core';
import { ClickAwayListener, useTheme } from '@mui/material';

import { Popper, IconButton, DialogTitle, DialogContent, Paper, Box, List, ListItem } from 'geoview-core/src/ui';
import { useAppGeoviewHTMLElement, useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewMapId } from 'geoview-core/src/core/stores/geoview-store';
import { handleEscapeKey, getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';

import { useDrawerGeomType, useDrawerActions } from 'geoview-core/src/core/stores/store-interface-and-intial-values/drawer-state';
import { getSxClasses } from 'geoview-core/src/core/components/nav-bar/nav-bar-style';

interface GeometryPickerButtonProps {
  geomTypes: string[];
}

export default function GeometryPickerButton({ geomTypes }: GeometryPickerButtonProps): JSX.Element {
  const { cgpv } = window as TypeWindow;
  const { useState, useCallback, useMemo } = cgpv.react;
  const { RadioButtonUncheckedIcon, LinearScaleIcon, PolygonIcon, CircleIcon } = cgpv.ui.elements;

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Get store values
  const mapId = useGeoViewMapId();
  const geoviewElement = useAppGeoviewHTMLElement();
  const displayLanguage = useAppDisplayLanguage();
  const geomType = useDrawerGeomType();

  // Store actions
  const { setGeomType } = useDrawerActions();

  // States
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const shellContainer = geoviewElement.querySelector(`[id^="shell-${mapId}"]`) as HTMLElement;

  // Get current icon based on selected geometry type
  const currentIcon = useMemo(() => {
    switch (geomType) {
      case 'Point':
        return <RadioButtonUncheckedIcon />;
      case 'LineString':
        return <LinearScaleIcon />;
      case 'Polygon':
        return <PolygonIcon />;
      case 'Circle':
        return <CircleIcon />;
      default:
        return <RadioButtonUncheckedIcon />;
    }
  }, [geomType, RadioButtonUncheckedIcon, LinearScaleIcon, PolygonIcon, CircleIcon]);

  // Handlers
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      if (open) {
        setOpen(false);
        setAnchorEl(null);
      } else {
        setAnchorEl(event.currentTarget);
        setOpen(true);
      }
    },
    [open]
  );

  const handleClickAway = useCallback((): void => {
    if (open) {
      setOpen(false);
      setAnchorEl(null);
    }
  }, [open]);

  /**
   * Handles a click on the draw button
   */
  const handleGeometrySelect = useCallback(
    (type: string): void => {
      setGeomType(type);
      setOpen(false);
      setAnchorEl(null);
    },
    [setGeomType]
  );

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box>
        <IconButton
          id="drawer-geometry-picker"
          tooltip={getLocalizedMessage(displayLanguage, 'drawer.geometryPicker') as string}
          tooltipPlacement="left"
          sx={sxClasses.navButton}
          onClick={handleClick}
          className={open ? 'highlighted active' : ''}
        >
          {currentIcon}
        </IconButton>

        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="left-end"
          onClose={handleClickAway}
          container={shellContainer}
          sx={{ marginRight: '5px !important' }}
          handleKeyDown={(key, callBackFn) => handleEscapeKey(key, '', false, callBackFn)}
        >
          <Paper sx={{ width: '300px', maxHeight: '500px' }}>
            <DialogTitle sx={sxClasses.popoverTitle}>{getLocalizedMessage(displayLanguage, 'drawer.geometryPickerPanel')}</DialogTitle>
            <DialogContent>
              <List>
                <ListItem>
                  <IconButton
                    id="button-point"
                    tooltip={getLocalizedMessage(displayLanguage, 'drawer.point')}
                    tooltipPlacement="left"
                    size="small"
                    onClick={() => handleGeometrySelect('Point')}
                    disabled={geomType === 'Point'}
                  >
                    <RadioButtonUncheckedIcon />
                    {getLocalizedMessage(displayLanguage, 'drawer.point')}
                  </IconButton>
                </ListItem>
                <ListItem>
                  <IconButton
                    id="button-linestring"
                    tooltip={getLocalizedMessage(displayLanguage, 'drawer.linestring')}
                    tooltipPlacement="left"
                    size="small"
                    onClick={() => handleGeometrySelect('LineString')}
                    disabled={geomType === 'LineString'}
                  >
                    <LinearScaleIcon />
                    {getLocalizedMessage(displayLanguage, 'drawer.linestring')}
                  </IconButton>
                </ListItem>
                <ListItem>
                  <IconButton
                    id="button-polygon"
                    tooltip={getLocalizedMessage(displayLanguage, 'drawer.polygon')}
                    tooltipPlacement="left"
                    size="small"
                    onClick={() => handleGeometrySelect('Polygon')}
                    disabled={geomType === 'Polygon'}
                  >
                    <PolygonIcon />
                    {getLocalizedMessage(displayLanguage, 'drawer.polygon')}
                  </IconButton>
                </ListItem>
                <ListItem>
                  <IconButton
                    id="button-circle"
                    tooltip={getLocalizedMessage(displayLanguage, 'drawer.circle')}
                    tooltipPlacement="left"
                    size="small"
                    onClick={() => handleGeometrySelect('Circle')}
                    disabled={geomType === 'Circle'}
                  >
                    <CircleIcon />
                    {getLocalizedMessage(displayLanguage, 'drawer.circle')}
                  </IconButton>
                </ListItem>
              </List>
            </DialogContent>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
