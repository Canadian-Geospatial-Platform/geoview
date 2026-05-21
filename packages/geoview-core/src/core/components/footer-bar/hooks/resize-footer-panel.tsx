import { useTranslation } from 'react-i18next';
import type { MouseEvent } from 'react';
import { useState, useMemo, memo, useCallback } from 'react';
import Slider from '@mui/material/Slider';
import { Box, HeightIcon, IconButton, Popover } from '@/ui';

import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { getSxClasses } from './resize-footer-panel-style';
import { useStoreUIFooterPanelResizeValue } from '@/core/stores/states/ui-state';
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

/** Snap threshold in percentage points — slider snaps to a mark when within this distance. */
const SNAP_THRESHOLD = 3;

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
  const [pendingValue, setPendingValue] = useState<number | undefined>(undefined);

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
   * Handles slider drag, updating the preview value with snap logic without resizing.
   */
  const handleOnSliderChange = useCallback((_event: Event, value: number | number[]): void => {
    let snapped = value as number;
    for (const mark of RESIZE_VALUES) {
      if (Math.abs(snapped - mark) <= SNAP_THRESHOLD) {
        snapped = mark;
        break;
      }
    }
    setPendingValue(snapped);
  }, []);

  /**
   * Handles committing the slider value on release, applying the resize and closing the popover.
   */
  const handleOnSliderChangeCommitted = useCallback(
    (_event: React.SyntheticEvent | Event, value: number | number[]): void => {
      let snapped = value as number;
      for (const mark of RESIZE_VALUES) {
        if (Math.abs(snapped - mark) <= SNAP_THRESHOLD) {
          snapped = mark;
          break;
        }
      }
      uiController.setFooterPanelResizeValue(snapped);
      setPendingValue(undefined);
      handleClose();
    },
    [uiController, handleClose]
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
            value={pendingValue ?? footerPanelResizeValue}
            step={1}
            valueLabelDisplay="auto"
            marks={marks}
            onChange={handleOnSliderChange}
            onChangeCommitted={handleOnSliderChangeCommitted}
            min={RESIZE_VALUES[0]}
            max={RESIZE_VALUES[RESIZE_VALUES.length - 1]}
          />
        </Box>
      </Popover>
    </>
  );
});
