import { useState, MouseEvent, useMemo } from 'react';
import Slider from '@mui/material/Slider';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { Box, HeightIcon, IconButton, Popover } from '@/ui';
import { getSxClasses } from './resize-footer-panel-style';
import {
  useUIFooterPanelResizeValue,
  useUIStoreActions,
  useUIFooterPanelResizeValues,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';

/**
 * Popover to resize the map container and footer panel.
 * @returns
 */
export function ResizeFooterPanel() {
  const sxClasses = getSxClasses();

  const mapId = useGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  // store state
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const footerPanelResizeValues = useUIFooterPanelResizeValues();

  const { setFooterPanelResizeValue } = useUIStoreActions();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const marks = useMemo(() => {
    // Log
    logger.logTraceUseMemo('RESIZE-FOOTER-PANEL - marks', footerPanelResizeValues);

    return footerPanelResizeValues.map((value) => ({ value, label: `${value}%` }));
  }, [footerPanelResizeValues]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOnSliderChange = (event: Event, value: number | number[]) => {
    setFooterPanelResizeValue(value as number);
    handleClose();
  };

  const open = Boolean(anchorEl);
  return (
    <>
      <IconButton onClick={(e) => handleClick(e)} tooltip="footerBar.resizeTooltip">
        <HeightIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        container={mapElem} // popover will be displayed when screen is in fullscreen mode.
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={sxClasses.slider}>
          <Slider
            sx={{
              '& input[type="range"]': {
                WebkitAppearance: 'slider-vertical',
              },
            }}
            orientation="vertical"
            value={footerPanelResizeValue}
            step={null} // so that slider jump to values based on marks array.
            valueLabelDisplay="off"
            marks={marks}
            onChange={handleOnSliderChange}
            min={footerPanelResizeValues[0]}
            max={footerPanelResizeValues[footerPanelResizeValues.length - 1]}
          />
        </Box>
      </Popover>
    </>
  );
}
