import type { MouseEvent } from 'react';
import { useMemo, memo, useCallback, useState, useRef, useEffect, useId } from 'react';

import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { ClickAwayListener } from '@mui/material';
import type { SxStyles } from '@/ui/style/types';
import { Box, CloseIcon, HeightIcon, IconButton, Paper, Popper, Slider, Typography } from '@/ui';

import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { getSxClasses } from './resize-footer-panel-style';
import { useStoreUIFooterPanelResizeValue, useStoreUIActiveTrapGeoView } from '@/core/stores/states/ui-state';
import { logger } from '@/core/utils/logger';
import { useStoreAppShellContainer } from '@/core/stores/states/app-state';
import { handleEscapeKey } from '@/core/utils/utilities';
import { TIMEOUT } from '@/core/utils/constant';

/** Available resize percentage values. */
const RESIZE_VALUES = [35, 50, 100];

/** Snap threshold: values within this distance of a mark snap to it. */
const SNAP_THRESHOLD = 5;

/**
 * Creates the popper to resize the map container and footer panel.
 *
 * Memoized to prevent re-renders triggered by parent updates since this
 * component has no props and manages its own internal state.
 *
 * @returns The resize footer panel
 */
export const ResizeFooterPanel = memo((): JSX.Element => {
  // Log
  logger.logTraceRender('components/footer-bar/hooks/resize-footer-panel');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  /**
   * Builds custom sx classes for the resize footer panel.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    // Log
    logger.logTraceUseMemo('RESIZE-FOOTER-PANEL - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // Store
  const footerPanelResizeValue = useStoreUIFooterPanelResizeValue();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();
  const uiController = useUIController();

  // States
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [pendingValue, setPendingValue] = useState<number | undefined>(undefined);
  const [open, setOpen] = useState<boolean>(false);

  // Refs
  const resizeButtonRef = useRef<HTMLButtonElement>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prevOpenRef = useRef<boolean>(false);
  const keyboardCloseRef = useRef<boolean>(false);
  const isPointerInteractionRef = useRef<boolean>(false);

  // Get container
  const mapId = useStoreGeoViewMapId();
  const mapElem = useStoreAppShellContainer();

  // Element IDs for accessibility and focus management
  const closeButtonId = `${mapId}-resize-close-button`;
  const popperId = useId();

  // Marks calculation
  const marks = RESIZE_VALUES.map((value) => ({ value, label: `${value}%` }));

  // #region Handlers

  /**
   * Handles closing the resize popper, applying any pending keyboard value.
   */
  const handleClose = useCallback((): void => {
    // Apply pending keyboard value on close
    if (pendingValue !== undefined) {
      uiController.setFooterPanelResizeValue(pendingValue);
      setPendingValue(undefined);
    }
    // Reset in case the popper closes (click-away/Escape) mid-drag, before onChangeCommitted fires
    isPointerInteractionRef.current = false;
    setOpen(false);
    setAnchorEl(null);
  }, [pendingValue, uiController]);

  /**
   * Handles toggling the resize popper open or closed.
   */
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      if (open) {
        handleClose();
        return;
      }
      setAnchorEl(event.currentTarget);
      setOpen(true);
    },
    [open, handleClose]
  );

  /**
   * Marks the beginning of a pointer-driven slider interaction (mouse or touch drag).
   */
  const handleSliderPointerDown = useCallback((): void => {
    isPointerInteractionRef.current = true;
  }, []);

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
        keyboardCloseRef.current = true;
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
   * Formats the resize value as a translated percentage string.
   *
   * @param value - The slider value to format
   * @returns The translated value text
   */
  const getResizeValueText = useCallback((value: number): string => t('footerBar.resizeValueText', { value }), [t]);

  /**
   * Handles slider value change, snapping to marks within threshold.
   */
  const handleOnSliderChange = useCallback((value: number | number[]): void => {
    const v = value as number;
    const snap = RESIZE_VALUES.find((mark) => Math.abs(v - mark) <= SNAP_THRESHOLD);
    setPendingValue(snap ?? v);
  }, []);

  /**
   * Handles committing the slider value on pointer release, applying the resize and closing the popper.
   *
   * The underlying slider auto-commits on every arrow-key keystroke too, so this only reacts when
   * `isPointerInteractionRef` confirms the commit came from a mouse/touch drag release — resizing the
   * footer panel moves the anchor button and causes the popper to jump, which must not happen mid keyboard
   * navigation. Keyboard changes stay as pendingValue and are applied when the popper closes.
   */
  const handleOnSliderChangeCommitted = useCallback(
    (value: number | number[]): void => {
      if (!isPointerInteractionRef.current) return;
      isPointerInteractionRef.current = false;

      uiController.setFooterPanelResizeValue(value as number);
      setPendingValue(undefined);
      setOpen(false);
      setAnchorEl(null);
    },
    [uiController]
  );

  // #endregion Handlers

  /**
   * Restores focus to the Resize button when the popper closes via keyboard (Enter key).
   *
   * Only restores focus on Enter-key close to avoid stealing focus from click-away or mouse drag closes.
   * Uses 100ms timeout to allow DOM reflow to complete after footer panel resize.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('RESIZE-FOOTER-PANEL - restore focus', open);

    // When popper closes, reset the flag and attempt focus restoration
    if (prevOpenRef.current && !open) {
      // Reset flag at start of close transition — before any async callbacks
      const wasKeyboardClose = keyboardCloseRef.current;
      keyboardCloseRef.current = false;

      // Only restore focus if this was a keyboard-initiated close and button is available
      if (resizeButtonRef.current && wasKeyboardClose) {
        focusTimeoutRef.current = setTimeout(() => {
          resizeButtonRef.current?.focus({ focusVisible: true });
          focusTimeoutRef.current = undefined;
        }, TIMEOUT.resizeButtonFocusRestore);
      }
    }

    // Track previous open state for next render
    prevOpenRef.current = open;

    return () => {
      if (focusTimeoutRef.current !== undefined) {
        clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = undefined;
      }
    };
  }, [open]);

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClose}>
      <Box sx={memoSxClasses.root}>
        <IconButton
          iconRef={resizeButtonRef}
          onClick={handleClick}
          aria-label={t('footerBar.resizeTooltip')}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popperId : undefined}
        >
          <HeightIcon />
        </IconButton>
        <Popper
          id={popperId}
          role="dialog"
          aria-modal="false"
          aria-label={t('footerBar.resizeAriaLabel')}
          open={open}
          anchorEl={anchorEl}
          placement="top-start"
          strategy="fixed"
          container={mapElem}
          focusSelector={`#${closeButtonId}`}
          focusTrap={activeTrapGeoView}
          handleKeyDown={handleEscapeKey}
          onClose={handleClose}
          sx={memoSxClasses.popper}
        >
          <Paper component="section" sx={memoSxClasses.panel}>
            <Box component="header" sx={memoSxClasses.header}>
              <Typography component="h2" sx={memoSxClasses.title}>
                {t('footerBar.resizeTooltip')}
              </Typography>
              <IconButton
                id={closeButtonId}
                className="buttonPopperClose"
                tooltip={t('general.close')}
                size="small"
                onClick={handleClose}
                aria-label={t('general.close')}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- wrapper handles drag start and key snapping/close for the inner Slider, which is the interactive control */}
            <Box sx={memoSxClasses.sliderWrapper} onKeyDown={handleSliderKeyDown} onPointerDown={handleSliderPointerDown}>
              <Slider
                orientation="vertical"
                value={pendingValue ?? footerPanelResizeValue}
                step={1}
                min={RESIZE_VALUES[0]}
                max={RESIZE_VALUES[RESIZE_VALUES.length - 1]}
                marks={marks}
                onChange={handleOnSliderChange}
                onChangeCommitted={handleOnSliderChangeCommitted}
                valueLabelDisplay="auto"
                aria-label={t('footerBar.footerPanelHeight')}
                onValueDisplayAriaLabel={getResizeValueText}
                onValueLabelFormat={getResizeValueText}
              />
            </Box>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
});
ResizeFooterPanel.displayName = 'ResizeFooterPanel';
