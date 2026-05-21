import { useTranslation } from 'react-i18next';
import type { MouseEvent } from 'react';
import { useMemo, memo, useCallback, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { ClickAwayListener } from '@mui/material';
import Slider from '@mui/material/Slider';
import { Box, CloseIcon, HeightIcon, IconButton, Paper, Popper, Typography } from '@/ui';

import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { getSxClasses } from './resize-footer-panel-style';
import { useStoreUIFooterPanelResizeValue, useStoreUIActiveTrapGeoView } from '@/core/stores/states/ui-state';
import { logger } from '@/core/utils/logger';
import { handleEscapeKey } from '@/core/utils/utilities';

/** Slider input styles for vertical orientation. */
const SLIDER_STYLES = {
  '& input[type="range"]': {
    WebkitAppearance: 'slider-vertical',
  },
} as const;

/** Available resize percentage values. */
const RESIZE_VALUES = [35, 50, 100];

/** Snap threshold: values within this distance of a mark snap to it. */
const SNAP_THRESHOLD = 5;

/**
 * Creates the popper to resize the map container and footer panel.
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
  const theme = useTheme();
  const memoSxClasses = useMemo(() => {
    return getSxClasses(theme);
  }, [theme]);

  // Store
  const footerPanelResizeValue = useStoreUIFooterPanelResizeValue();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();
  const uiController = useUIController();

  // States
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [pendingValue, setPendingValue] = useState<number | undefined>(undefined);
  const [open, setOpen] = useState(false);

  // Get container
  const mapId = useStoreGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  // Element IDs for accessibility and focus management
  const closeButtonId = `${mapId}-resize-close-button`;

  // Marks calculation
  const marks = RESIZE_VALUES.map((value) => ({ value, label: `${value}%` }));

  // #region Handlers

  /**
   * Handles opening the resize popper.
   */
  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
    setOpen(true);
  }, []);

  /**
   * Handles closing the resize popper, applying any pending keyboard value.
   */
  const handleClose = useCallback((): void => {
    // Apply pending keyboard value on close
    if (pendingValue !== undefined) {
      uiController.setFooterPanelResizeValue(pendingValue);
      setPendingValue(undefined);
    }
    setOpen(false);
    setAnchorEl(null);
  }, [pendingValue, uiController]);

  /**
   * Handles keyboard events on the slider container.
   *
   * Arrow keys snap between mark values (35/50/100) instead of stepping by 1.
   * Enter closes the popper and applies the pending value.
   * All keyboard events are stopped from propagating to the map's OpenLayers handlers.
   */
  const handleSliderKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      // Let Tab pass through for normal focus navigation
      if (event.key === 'Tab') return;

      // Stop native event propagation to prevent map handlers
      event.nativeEvent.stopImmediatePropagation();
      event.stopPropagation();
      event.preventDefault();

      // Enter closes the popper and applies the pending value
      if (event.key === 'Enter') {
        handleClose();
        return;
      }

      // Snap to next/previous mark on arrow keys
      if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
        const current = pendingValue ?? footerPanelResizeValue;
        const next = RESIZE_VALUES.find((v) => v > current);
        if (next !== undefined) setPendingValue(next);
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
        const current = pendingValue ?? footerPanelResizeValue;
        const prev = [...RESIZE_VALUES].reverse().find((v) => v < current);
        if (prev !== undefined) setPendingValue(prev);
      }
    },
    [pendingValue, footerPanelResizeValue, handleClose]
  );

  /**
   * Handles slider value change, snapping to marks within threshold.
   */
  const handleOnSliderChange = useCallback((_event: Event, value: number | number[]): void => {
    const v = value as number;
    const snap = RESIZE_VALUES.find((mark) => Math.abs(v - mark) <= SNAP_THRESHOLD);
    setPendingValue(snap ?? v);
  }, []);

  /**
   * Handles committing the slider value on mouse release.
   *
   * For mouse interactions (pointerup/mouseup), applies the resize and closes the popper because
   * resizing the footer panel moves the anchor button and causes the popper to jump.
   * For keyboard interactions (keydown), the value stays as pendingValue and is applied when the popper closes.
   */
  const handleOnSliderChangeCommitted = useCallback(
    (event: React.SyntheticEvent | Event, value: number | number[]): void => {
      // Only apply on mouse release — keyboard changes stay as pendingValue until popper closes
      const eventType = (event as Event).type;
      if (eventType === 'mouseup' || eventType === 'pointerup') {
        uiController.setFooterPanelResizeValue(value as number);
        setPendingValue(undefined);
        setOpen(false);
        setAnchorEl(null);
      }
    },
    [uiController]
  );

  // #endregion Handlers

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClose}>
      <Box>
        <IconButton onClick={handleClick} aria-label={t('footerBar.resizeTooltip')}>
          <HeightIcon />
        </IconButton>
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="top-start"
          container={mapElem}
          focusSelector={`#${closeButtonId}`}
          focusTrap={activeTrapGeoView}
          handleKeyDown={(key, callBackFn): void => handleEscapeKey(key, '', false, callBackFn)}
          onClose={handleClose}
          sx={{
            position: 'fixed',
            pointerEvents: 'auto',
            zIndex: theme.zIndex.modal + 100,
          }}
        >
          <Paper component="section" sx={memoSxClasses.panel}>
            <Box component="header" sx={memoSxClasses.header}>
              <Typography component="h2" sx={memoSxClasses.title}>
                {t('footerBar.resizeTooltip')}
              </Typography>
              <IconButton
                id={closeButtonId}
                tooltip={t('general.close')}
                size="small"
                onClick={handleClose}
                aria-label={t('general.close')}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={memoSxClasses.slider} onKeyDown={handleSliderKeyDown}>
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
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
});
