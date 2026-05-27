import { memo, useState, useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { Radio, RadioGroup, FormControlLabel, CheckIcon, Tooltip, Box, Button } from '@/ui';

import { getSxClasses } from './scale-style';
import type { SxStyles } from '@/ui/style/types';
import { useStoreMapInteraction, useStoreMapScale } from '@/core/stores/states/map-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

/** The properties for the scale component. */
interface ScaleProps {
  /** Whether the scale is in expanded mode. */
  expanded: boolean;
}

/** Represents a single scale display option. */
interface TypeScale {
  /** The unique identifier for the scale option. */
  scaleId: string;
  /** The display label text. */
  label: string;
  /** Whether to show a border bottom line. */
  borderBottom: boolean;
}

/** Scale mode index constants. */
const SCALE_MODES = {
  METRIC: 0,
  IMPERIAL: 1,
  NUMERIC: 2,
} as const;

/** Minimum width style for the scale container box. */
const BOX_STYLES = { minWidth: 120 } as const;

/**
 * Creates a scale component.
 *
 * Memoized to avoid re-rendering when parent updates but scale props remain unchanged.
 *
 * @param props - The scale properties
 * @returns The scale component
 */
export const Scale = memo(function Scale({ expanded }: ScaleProps): JSX.Element {
  logger.logTraceRender('components/scale/scale');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  /**
   * Computes the style classes for the scale component.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('SCALE - memoSxClasses');
    return getSxClasses(theme);
  }, [theme]);

  // State
  const [scaleMode, setScaleMode] = useState<number>(SCALE_MODES.METRIC);

  // Store
  const mapId = useStoreGeoViewMapId();
  const scale = useStoreMapScale();
  const interaction = useStoreMapInteraction();

  /**
   * Builds the list of scale display options.
   */
  const memoScaleValues: TypeScale[] = useMemo((): TypeScale[] => {
    logger.logTraceUseMemo('SCALE - memoScaleValues', scale.labelGraphicMetric, scale.labelGraphicImperial, scale.labelNumeric);
    return [
      {
        scaleId: '0',
        label: scale.labelGraphicMetric,
        borderBottom: true,
      },
      {
        scaleId: '1',
        label: scale.labelGraphicImperial,
        borderBottom: true,
      },
      {
        scaleId: '2',
        label: scale.labelNumeric,
        borderBottom: false,
      },
    ];
  }, [scale.labelGraphicMetric, scale.labelGraphicImperial, scale.labelNumeric]);

  /**
   * Returns the line width for the given scale mode.
   *
   * @param mode - The scale mode index
   * @returns The line width string or 'none'
   */
  const getScaleWidth = useCallback(
    (mode: number): string => {
      switch (mode) {
        case SCALE_MODES.METRIC:
          return scale.lineWidthMetric;
        case SCALE_MODES.IMPERIAL:
          return scale.lineWidthImperial;
        default:
          return 'none';
      }
    },
    [scale.lineWidthMetric, scale.lineWidthImperial]
  );

  // #region Handlers

  /**
   * Handles when the user clicks the scale button to cycle through modes (collapsed mode).
   */
  const handleCycleScale = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      setScaleMode((prev) => (prev + 1) % memoScaleValues.length);
    },
    [memoScaleValues.length]
  );

  /**
   * Handles when the user selects a radio button (expanded mode).
   */
  const handleRadioChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setScaleMode(Number(event.target.value));
  }, []);

  /**
   * Handles clicks on the radio group container to prevent event propagation.
   */
  const handleRadioGroupClick = useCallback((event: React.MouseEvent): void => {
    event.stopPropagation();
  }, []);

  /**
   * Handles keyboard input on the radio group to support both cycling and direct selection.
   *
   * Enter/Space cycle to the next option (backward compatible).
   * Arrow keys navigate directly (standard radio group behavior) without scrolling.
   */
  const handleRadioGroupKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      const optionCount = memoScaleValues.length;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        setScaleMode((prev) => (prev + 1) % optionCount);
      }
      // Arrow keys: Let MUI RadioGroup handle native keyboard navigation
    },
    [memoScaleValues.length]
  );

  // #endregion Handlers

  /**
   * Renders the scale label with optional graphic line.
   *
   * @param index - The scale mode index to render
   * @param isInteractive - Optional. Whether to apply interaction styling
   * @returns The scale label JSX element with optional graphic line
   */
  const renderScaleLabel = useCallback(
    (index: number, isInteractive = false): JSX.Element => {
      const value = memoScaleValues[index];
      return (
        <Box
          component="span"
          className={`${isInteractive ? `interaction-${interaction}` : ''} ${value.borderBottom ? 'hasScaleLine' : ''}`}
          sx={{
            ...memoSxClasses.scaleText,
            borderBottom: value.borderBottom ? '1px solid' : 'none',
            width: value.borderBottom ? getScaleWidth(index) : 'none',
          }}
        >
          {value.label}
        </Box>
      );
    },
    [memoScaleValues, interaction, memoSxClasses.scaleText, getScaleWidth]
  );

  /**
   * Builds the collapsed scale content (cycling button).
   */
  const memoCollapsedContent = useMemo((): JSX.Element => {
    logger.logTraceUseMemo('SCALE - memoCollapsedContent', scaleMode);
    return renderScaleLabel(scaleMode, true);
  }, [scaleMode, renderScaleLabel]);

  /**
   * Builds the expanded scale content (radio group with checkmark icons).
   */
  const memoExpandedContent = useMemo((): JSX.Element => {
    logger.logTraceUseMemo('SCALE - memoExpandedContent', scaleMode, memoScaleValues.length);
    return (
      <RadioGroup
        value={scaleMode}
        onChange={handleRadioChange}
        onKeyDown={handleRadioGroupKeyDown}
        onClick={handleRadioGroupClick}
        aria-label={t('mapnav.scale.selectFormat')}
        sx={{
          ...memoSxClasses.scaleExpandedContainer,
          // Show focus ring when any child Radio has focus
          '&:has(:focus-visible)': {
            outline: `2px solid ${theme.palette.common.black}`,
            outlineOffset: '2px',
            borderRadius: '4px',
          },
        }}
      >
        {memoScaleValues.map((value, index) => (
          <FormControlLabel
            key={value.scaleId}
            value={index}
            control={
              <Radio
                sx={{
                  // Hide the radio circle visually but keep it keyboard-accessible
                  opacity: 0,
                  width: 0,
                  height: 0,
                  padding: 0,
                  margin: 0,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  // Prevent any pointer interaction directly on the Radio
                  pointerEvents: 'none',
                }}
                inputProps={{
                  'aria-label': `${value.label}${value.borderBottom ? ` ${t('mapnav.scale.graphicScale')}` : ''}`,
                }}
              />
            }
            label={
              <Box sx={memoSxClasses.scaleExpandedCheckmarkText}>
                <CheckIcon
                  sx={{
                    ...memoSxClasses.scaleCheckmark,
                    fontSize: theme.palette.geoViewFontSize.lg,
                    opacity: scaleMode === index ? 1 : 0,
                    color: theme.palette.geoViewColor?.bgColor?.dark?.[650],
                  }}
                  aria-hidden="true"
                />
                {renderScaleLabel(index, false)}
              </Box>
            }
            sx={{
              margin: 0,
              alignItems: 'center',
              width: '100%',
              cursor: 'pointer',
              justifyContent: 'center',
            }}
          />
        ))}
      </RadioGroup>
    );
  }, [
    scaleMode,
    memoScaleValues,
    handleRadioChange,
    handleRadioGroupClick,
    handleRadioGroupKeyDown,
    renderScaleLabel,
    memoSxClasses.scaleExpandedContainer,
    memoSxClasses.scaleExpandedCheckmarkText,
    memoSxClasses.scaleCheckmark,
    t,
    theme,
  ]);

  return (
    <Tooltip title={t('mapnav.scale')} placement="top">
      <Box sx={BOX_STYLES}>
        <Box id={`${mapId}-scaleControlBarMetric`} sx={memoSxClasses.scaleControl} />
        <Box id={`${mapId}-scaleControlBarImperial`} sx={memoSxClasses.scaleControl} />

        {expanded ? (
          // Expanded: Semantic radio group with checkmark visual indicators
          <Box sx={memoSxClasses.scaleContainer}>{memoExpandedContent}</Box>
        ) : (
          // Collapsed: Cycling button
          <Button
            onClick={handleCycleScale}
            type="text"
            sx={{ ...memoSxClasses.scaleContainer, maxHeight: '40px' }}
            disableRipple
            className={`interaction-${interaction}`}
            aria-label={t('mapnav.scale.cycleHint')}
          >
            {memoCollapsedContent}
          </Button>
        )}
      </Box>
    </Tooltip>
  );
});
