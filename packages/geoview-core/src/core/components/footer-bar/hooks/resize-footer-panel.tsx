import { useTranslation } from 'react-i18next';
import type { MouseEvent } from 'react';
import { useState, useMemo, memo, useCallback } from 'react';
import Slider from '@mui/material/Slider';
import { Box, HeightIcon, IconButton, Popover } from '@/ui';

import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { getSxClasses } from './resize-footer-panel-style';
import { useStoreUIFooterPanelResizeValue } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';

/** Slider input styles for vertical orientation. */
const SLIDER_STYLES = {
  '& input[type="range"]': {
    WebkitAppearance: 'slider-vertical',
  },
} as const;

/** Popover anchor origin configuration. */
const ANCHOR_ORIGIN = {
  vertical: 'top',
  horizontal: 'left',
} as const;

/** Popover transform origin configuration. */
const TRANSFORM_ORIGIN = {
  vertical: 'bottom',
  horizontal: 'left',
} as const;

/** Available resize percentage values. */
const RESIZE_VALUES = [35, 50, 100];

/**
 * Creates the popover to resize the map container and footer panel.
 *
 * Memoized to prevent re-renders since this component has no props.
 *
 * @returns The resize footer panel
 */
export const ResizeFooterPanel = memo(function ResizeFooterPanel(): JSX.Element {
  // Log
  logger.logTraceRender('components/footer-bar/hooks/resize-footer-panel');

  // Hooks
  const { t } = useTranslation<string>();
  const sxClasses = useMemo(() => getSxClasses(), []);

  // Store
  const footerPanelResizeValue = useStoreUIFooterPanelResizeValue();
  const uiController = useUIController();

  // States
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Get container
  const mapId = useStoreGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  // Marks calculation
  const marks = RESIZE_VALUES.map((value) => ({ value, label: `${value}%` }));

  // #region Handlers

  /**
   * Handles opening the resize popover.
   */
  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  }, []);

  /**
   * Handles closing the resize popover.
   */
  const handleClose = useCallback((): void => {
    setAnchorEl(null);
  }, []);

  /**
   * Handles slider value change and closes the popover.
   */
  const handleOnSliderChange = useCallback(
    (event: Event, value: number | number[]): void => {
      uiController.setFooterPanelResizeValue(value as number);
      handleClose();
    },
    [handleClose, uiController]
  );

  // #endregion Handlers

  const open = Boolean(anchorEl);
  return (
    <>
      <IconButton onClick={(e) => handleClick(e)} aria-label={t('footerBar.resizeTooltip')}>
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
            min={RESIZE_VALUES[0]}
            max={RESIZE_VALUES[RESIZE_VALUES.length - 1]}
          />
        </Box>
      </Popover>
    </>
  );
});
