import { memo, useState, useMemo, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import type { Coordinate } from 'ol/coordinate';

import { Radio, RadioGroup, FormControlLabel, Box, Button, CheckIcon, Tooltip } from '@/ui';

import { useStoreMapPointerPosition } from '@/core/stores/states/map-state';
import { GeoUtilities } from '@/geo/utils/utilities';
import { getSxClasses } from './mouse-position-style';
import type { SxStyles } from '@/ui/style/types';
import { logger } from '@/core/utils/logger';

/** Mouse position component props. */
interface MousePositionProps {
  /** Whether the mouse position display is expanded. */
  expanded: boolean;
}

/** Formatted coordinate strings for display. */
interface FormattedCoordinates {
  /** Formatted longitude string. */
  lng: string;
  /** Formatted latitude string. */
  lat: string;
}

/** Available position display modes. */
const POSITION_MODES = {
  DMS: 0,
  DD: 1,
  PROJECTED: 2,
} as const;

/**
 * Formats the coordinates output in latitude and longitude.
 *
 * @param lonlat - The coordinate array [longitude, latitude]
 * @param DMS - Whether to format as degrees-minutes-seconds
 * @param t - The translation function
 * @returns The formatted coordinate strings
 */
const formatCoordinates = (lonlat: Coordinate, DMS: boolean, t: (key: string) => string): FormattedCoordinates => {
  const labelX = lonlat[0] < 0 ? t('mapctrl.mouseposition.west') : t('mapctrl.mouseposition.east');
  const labelY = lonlat[1] < 0 ? t('mapctrl.mouseposition.south') : t('mapctrl.mouseposition.north');

  const lng = `${DMS ? GeoUtilities.coordFormatDMS(lonlat[0]) : Math.abs(lonlat[0]).toFixed(4)} ${labelX}`;
  const lat = `${DMS ? GeoUtilities.coordFormatDMS(lonlat[1]) : Math.abs(lonlat[1]).toFixed(4)} ${labelY}`;

  return { lng, lat };
};

/**
 * Creates the mouse position component.
 *
 * Memoized to prevent re-renders when parent updates but expanded prop hasn't changed.
 *
 * @param props - Properties defined in MousePositionProps interface
 * @returns The mouse position component
 */
export const MousePosition = memo(function MousePosition(props: MousePositionProps): JSX.Element {
  const { expanded } = props;
  // Log too annoying
  // logger.logTraceRender('components/mouse-position/mouse-position');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const memoSxClasses = useMemo((): SxStyles => getSxClasses(theme), [theme]);

  // State
  const [positionMode, setPositionMode] = useState<number>(POSITION_MODES.DMS);

  // Store
  const pointerPosition = useStoreMapPointerPosition();

  /**
   * Formats position strings for all display modes.
   */
  const memoPositions = useMemo((): string[] => {
    if (!pointerPosition) {
      // Use translated "not available" message instead of em dash
      return [t('mapctrl.mouseposition.notAvailable'), t('mapctrl.mouseposition.notAvailable'), t('mapctrl.mouseposition.notAvailable')];
    }

    // Log too annoying
    // logger.logTraceUseMemo('MOUSE-POSITION - pointerPosition', pointerPosition);

    const { lonlat, projected } = pointerPosition;
    const DMS = formatCoordinates(lonlat, true, t);
    const DD = formatCoordinates(lonlat, false, t);

    return [`${DMS.lng} | ${DMS.lat}`, `${DD.lng} | ${DD.lat}`, `${projected[0].toFixed(4)}m E | ${projected[1].toFixed(4)}m N`];
  }, [pointerPosition, t]);

  // #region Handlers

  /**
   * Handles cycling through position display modes (collapsed mode).
   */
  const handleCyclePosition = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      setPositionMode((p) => (p + 1) % memoPositions.length);
    },
    [memoPositions.length]
  );

  /**
   * Handles when the user selects a radio button (expanded mode).
   */
  const handleRadioChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setPositionMode(Number(event.target.value));
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
      const optionCount = memoPositions.length;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        setPositionMode((prev) => (prev + 1) % optionCount);
      }
      // Arrow keys: Let MUI RadioGroup handle native keyboard navigation
    },
    [memoPositions.length]
  );

  // #endregion Handlers

  /**
   * Builds the collapsed coordinate display content (cycling button).
   */
  const memoCollapsedContent = useMemo((): JSX.Element => {
    logger.logTraceUseMemo('MOUSE-POSITION - memoCollapsedContent', positionMode, memoPositions.length);
    return <Box sx={memoSxClasses.mousePositionText}>{memoPositions[positionMode]}</Box>;
  }, [memoPositions, positionMode, memoSxClasses.mousePositionText]);

  /**
   * Builds the expanded coordinate display content (radio group with checkmark icons).
   *
   * Coordinates update in real-time as the mouse moves over the map.
   */
  const memoExpandedContent = useMemo((): JSX.Element => {
    logger.logTraceUseMemo('MOUSE-POSITION - memoExpandedContent', positionMode, memoPositions.length, !!pointerPosition);
    // Define labels locally - only used here
    const POSITION_LABELS = [t('mapctrl.mouseposition.dms'), t('mapctrl.mouseposition.dd'), t('mapctrl.mouseposition.projected')];

    return (
      <RadioGroup
        value={positionMode}
        onChange={handleRadioChange}
        onKeyDown={handleRadioGroupKeyDown}
        onClick={handleRadioGroupClick}
        aria-label={t('mapctrl.mouseposition.selectFormat')}
        sx={{
          padding: theme.spacing(0, 6),
          // Show focus ring when any child Radio has focus
          '&:has(:focus-visible)': {
            outline: `2px solid ${theme.palette.common.black}`,
            outlineOffset: '2px',
            borderRadius: '4px',
          },
        }}
      >
        {memoPositions.map((position, index) => {
          // Calculate checkmark opacity: hide if no position data, or if not selected
          const checkmarkOpacity = !pointerPosition || positionMode !== index ? 0 : 1;

          return (
            <FormControlLabel
              // eslint-disable-next-line react/no-array-index-key
              key={`pos-${index}`}
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
                    'aria-label': POSITION_LABELS[index],
                  }}
                />
              }
              label={
                <Box sx={memoSxClasses.mousePositionTextCheckmarkContainer}>
                  <CheckIcon
                    sx={{
                      ...memoSxClasses.mousePositionCheckmark,
                      fontSize: theme.palette.geoViewFontSize.lg,
                      opacity: checkmarkOpacity,
                      color: theme.palette.geoViewColor?.bgColor?.dark?.[650],
                    }}
                    aria-hidden="true"
                  />
                  <Box component="span">{position}</Box>
                </Box>
              }
              sx={{
                margin: 0,
                alignItems: 'center',
                width: '100%',
                cursor: 'pointer',
                justifyContent: 'flex-start',
              }}
            />
          );
        })}
      </RadioGroup>
    );
  }, [
    positionMode,
    memoPositions,
    pointerPosition,
    handleRadioChange,
    handleRadioGroupClick,
    handleRadioGroupKeyDown,
    memoSxClasses.mousePositionTextCheckmarkContainer,
    memoSxClasses.mousePositionCheckmark,
    t,
    theme,
  ]);

  return (
    <Tooltip title={t('mapctrl.mouseposition.coordinates')} placement="top">
      <Box sx={{ minWidth: 'fit-content' }}>
        {expanded ? (
          // Expanded: Semantic radio group with checkmark visual indicators
          <Box sx={memoSxClasses.mousePositionTextContainer}>{memoExpandedContent}</Box>
        ) : (
          // Collapsed: Cycling button
          <Button
            onClick={handleCyclePosition}
            type="text"
            sx={memoSxClasses.mousePosition}
            disableRipple
            aria-label={t('mapctrl.mouseposition.cycleHint')}
          >
            <Box sx={memoSxClasses.mousePositionTextContainer}>{memoCollapsedContent}</Box>
          </Button>
        )}
      </Box>
    </Tooltip>
  );
});
