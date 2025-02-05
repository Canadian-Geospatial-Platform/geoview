import { useState, MouseEvent, useMemo, memo, useCallback } from 'react';
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

// Define static styles outside component
const SLIDER_STYLES = {
  '& input[type="range"]': {
    WebkitAppearance: 'slider-vertical',
  },
} as const;

const ANCHOR_ORIGIN = {
  vertical: 'top',
  horizontal: 'left',
} as const;

const TRANSFORM_ORIGIN = {
  vertical: 'bottom',
  horizontal: 'left',
} as const;

/**
 * Popover to resize the map container and footer panel.
 * @returns
 */
export const ResizeFooterPanel = memo(function ResizeFooterPanel(): JSX.Element {
  // Log
  logger.logTraceRender('components/footer-bar/hooks/resize-footer-panel');

  // Hooks
  const sxClasses = useMemo(() => getSxClasses(), []);

  // Store
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const footerPanelResizeValues = useUIFooterPanelResizeValues();
  const { setFooterPanelResizeValue } = useUIStoreActions();

  // States
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Get container
  const mapId = useGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  // Memoize marks calculation
  const marks = useMemo(() => {
    // Log
    logger.logTraceUseMemo('RESIZE-FOOTER-PANEL - marks', footerPanelResizeValues);

    return footerPanelResizeValues.map((value) => ({ value, label: `${value}%` }));
  }, [footerPanelResizeValues]);

  // Handlers
  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback((): void => {
    setAnchorEl(null);
  }, []);

  const handleOnSliderChange = useCallback(
    (event: Event, value: number | number[]): void => {
      setFooterPanelResizeValue(value as number);
      handleClose();
    },
    [handleClose, setFooterPanelResizeValue]
  );

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
        anchorOrigin={ANCHOR_ORIGIN}
        transformOrigin={TRANSFORM_ORIGIN}
      >
        <Box sx={sxClasses.slider}>
          <Slider
            sx={SLIDER_STYLES}
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
});
