import { memo, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Coordinate } from 'ol/coordinate';
import { useTheme } from '@mui/material/styles';
import { Box, Button, CheckIcon } from '@/ui';

import { useStoreMapPointerPosition } from '@/core/stores/store-interface-and-intial-values/map-state';
import { GeoUtilities } from '@/geo/utils/utilities';
import { getSxClasses } from './mouse-position-style';

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
 * Renders a single coordinate display line with an active indicator.
 *
 * Memoized to avoid re-rendering unchanged coordinate lines when only the active mode changes.
 */
const CoordinateDisplay = memo(function CoordinateDisplay({
  position,
  isActive,
  sxClasses,
  fontSize,
}: {
  position: string;
  isActive: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sxClasses: any;
  fontSize: string;
}) {
  return (
    <Box sx={sxClasses.mousePositionTextCheckmarkContainer}>
      <CheckIcon
        sx={{
          fontSize,
          opacity: isActive ? 1 : 0,
          ...sxClasses.mousePositionCheckmark,
        }}
      />
      <Box component="span">{position}</Box>
    </Box>
  );
});

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
 * @returns The mouse position component
 */
export const MousePosition = memo(function MousePosition({ expanded }: MousePositionProps): JSX.Element {
  // Log too annoying
  // logger.logTraceRender('components/mouse-position/mouse-position');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [positionMode, setPositionMode] = useState<number>(POSITION_MODES.DMS);

  // Store
  const pointerPosition = useStoreMapPointerPosition();

  /**
   * Formats position strings for all display modes.
   */
  const memoPositions = useMemo(() => {
    if (!pointerPosition) return ['', '', ''];

    // Log too annoying
    // logger.logTraceUseMemo('MOUSE-POSITION - pointerPosition', pointerPosition);

    const { lonlat, projected } = pointerPosition;
    const DMS = formatCoordinates(lonlat, true, t);
    const DD = formatCoordinates(lonlat, false, t);

    return [`${DMS.lng} | ${DMS.lat}`, `${DD.lng} | ${DD.lat}`, `${projected[0].toFixed(4)}m E | ${projected[1].toFixed(4)}m N`];
  }, [pointerPosition, t]);

  /**
   * Handles cycling through position display modes.
   */
  const switchPositionMode = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    setPositionMode((p) => (p + 1) % 3);
  }, []);

  /**
   * Builds the expanded coordinate display content.
   */
  const memoExpandedContent = useMemo(
    () => (
      <Box
        id="mousePositionWrapper"
        sx={{
          display: !expanded ? 'none' : 'block',
          transition: 'display 1ms ease-in 300ms',
        }}
      >
        {memoPositions.map((position, index) => (
          <CoordinateDisplay
            // eslint-disable-next-line react/no-array-index-key
            key={`pos-${index}`}
            position={position}
            isActive={index === positionMode}
            sxClasses={sxClasses}
            fontSize={theme.palette.geoViewFontSize.lg}
          />
        ))}
      </Box>
    ),
    [memoPositions, positionMode, expanded, sxClasses, theme.palette.geoViewFontSize.lg]
  );

  // TODO: WCAG Issue #2390 - Ensure that mouse position button updates are announced by screen readers
  // TODO: WCAG Issue #2390 - Rethink this to use mutliple buttons or select element for better accessibility?

  /**
   * Builds the collapsed coordinate display content.
   */
  const memoCollapsedContent = useMemo(
    () => (
      <Box
        component="span"
        sx={{
          display: expanded ? 'none' : 'block',
          ...sxClasses.mousePositionText,
        }}
      >
        {memoPositions[positionMode]}
      </Box>
    ),
    [expanded, memoPositions, positionMode, sxClasses.mousePositionText]
  );

  return (
    <Button
      type="text"
      onClick={switchPositionMode}
      sx={sxClasses.mousePosition}
      tooltip={t('mapnav.coordinates')!}
      tooltipPlacement="top"
      disableRipple
    >
      <Box sx={sxClasses.mousePositionTextContainer}>
        {memoExpandedContent}
        {memoCollapsedContent}
      </Box>
    </Button>
  );
});
