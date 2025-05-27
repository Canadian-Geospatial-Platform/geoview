import { memo, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Coordinate } from 'ol/coordinate';
import { useTheme } from '@mui/material/styles';
import { Box, Button, CheckIcon } from '@/ui';

import { useMapPointerPosition } from '@/core/stores/store-interface-and-intial-values/map-state';
import { coordFormatDMS } from '@/geo/utils/utilities';
import { getSxClasses } from './mouse-position-style';

interface MousePositionProps {
  expanded: boolean;
}

interface FormattedCoordinates {
  lng: string;
  lat: string;
}

// Constants outside component to prevent recreating every render
const POSITION_MODES = {
  DMS: 0,
  DD: 1,
  PROJECTED: 2,
} as const;

/**
 * Format coordinates utility component
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
 * Format the coordinates output in lat long
 */
const formatCoordinates = (lonlat: Coordinate, DMS: boolean, t: (key: string) => string): FormattedCoordinates => {
  const labelX = lonlat[0] < 0 ? t('mapctrl.mouseposition.west') : t('mapctrl.mouseposition.east');
  const labelY = lonlat[1] < 0 ? t('mapctrl.mouseposition.south') : t('mapctrl.mouseposition.north');

  const lng = `${DMS ? coordFormatDMS(lonlat[0]) : Math.abs(lonlat[0]).toFixed(4)} ${labelX}`;
  const lat = `${DMS ? coordFormatDMS(lonlat[1]) : Math.abs(lonlat[1]).toFixed(4)} ${labelY}`;

  return { lng, lat };
};

/**
 * Create mouse position component
 * @returns {JSX.Element} the mouse position component
 */
// Memoizes entire component, preventing re-renders if props haven't changed
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
  const pointerPosition = useMapPointerPosition();

  // Format positions only when pointerPosition changes
  const positions = useMemo(() => {
    if (!pointerPosition) return ['', '', ''];

    // Log too annoying
    // logger.logTraceUseMemo('MOUSE-POSITION - pointerPosition', pointerPosition);

    const { lonlat, projected } = pointerPosition;
    const DMS = formatCoordinates(lonlat, true, t);
    const DD = formatCoordinates(lonlat, false, t);

    return [`${DMS.lng} | ${DMS.lat}`, `${DD.lng} | ${DD.lat}`, `${projected[0].toFixed(4)}m E | ${projected[1].toFixed(4)}m N`];
  }, [pointerPosition, t]);

  // Callbacks
  const switchPositionMode = useCallback((): void => {
    setPositionMode((p) => (p + 1) % 3);
  }, []);

  // Memoized content
  const expandedContent = useMemo(
    () => (
      <Box
        id="mousePositionWrapper"
        sx={{
          display: !expanded ? 'none' : 'block',
          transition: 'display 1ms ease-in 300ms',
        }}
      >
        {positions.map((position, index) => (
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
    [positions, positionMode, expanded, sxClasses, theme.palette.geoViewFontSize.lg]
  );

  const collapsedContent = useMemo(
    () => (
      <Box
        component="span"
        sx={{
          display: expanded ? 'none' : 'block',
          ...sxClasses.mousePositionText,
        }}
      >
        {positions[positionMode]}
      </Box>
    ),
    [expanded, positions, positionMode, sxClasses.mousePositionText]
  );

  return (
    <Button
      type="text"
      onClick={switchPositionMode}
      sx={sxClasses.mousePosition}
      tooltip={t('mapnav.coordinates') as string}
      tooltipPlacement="top"
      disableRipple
    >
      <Box sx={sxClasses.mousePositionTextContainer}>
        {expandedContent}
        {collapsedContent}
      </Box>
    </Button>
  );
});
