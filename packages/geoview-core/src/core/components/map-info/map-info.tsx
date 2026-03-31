import { memo, useCallback, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box } from '@/ui';

import { Attribution } from '@/core/components/attribution/attribution';
import { MousePosition } from '@/core/components/mouse-position/mouse-position';
import { Scale } from '@/core/components/scale/scale';
import { MapInfoExpandButton } from './map-info-expand-button';
import { MapInfoRotationButton } from './map-info-rotation-button';
import { useMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

/** Base styles for the map info bar container. */
const MAP_INFO_BASE_STYLES = {
  display: 'flex',
  alignItems: 'center',
  position: 'absolute',
  bottom: 0,
  left: '50px',
  right: 0,
  px: '1rem',
} as const;

/** Flex spacer style for distributing map info items. */
const FLEX_STYLE = { flexGrow: 1, height: '100%' };

/** Props for the MapInfo component. */
interface MapInfoProps {
  /** Callback to scroll the shell into view when the info bar is clicked. */
  onScrollShellIntoView: () => void;
}

/**
 * Creates the map information bar containing attribution, mouse position, and scale.
 *
 * Memoized to prevent re-renders when parent updates but the onScrollShellIntoView callback has not changed.
 *
 * @returns The map information bar
 */
export const MapInfo = memo(function MapInfo({ onScrollShellIntoView }: MapInfoProps): JSX.Element {
  logger.logTraceRender('components/map-info/map-info');

  // Hooks
  const theme = useTheme();

  // Store
  const interaction = useMapInteraction(); // Static map, do not display mouse position or rotation controls
  const mapId = useGeoViewMapId(); // Element id for panel height (expanded)

  // State
  const [expanded, setExpanded] = useState(false);

  /**
   * Computes the dynamic container styles for the map info bar.
   */
  const memoContainerStyles = useMemo(
    () => ({
      ...MAP_INFO_BASE_STYLES,
      height: expanded ? '80px' : '40px',
      borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[650]}`,
      color: theme.palette.geoViewColor.bgColor.dark[650],
      backgroundColor: theme.palette.geoViewColor.bgColor.dark[50],
      width: 'calc(100% - 50px)',
      zIndex: theme.zIndex.appBar + 100, // Above app-bar panels
      boxShadow: `0 0 5px ${theme.palette.geoViewColor.bgColor.dark[200]}`,
    }),
    [expanded, theme.palette.geoViewColor.bgColor, theme.zIndex.appBar]
  );

  /**
   * Computes the static map container styles.
   */
  const memoStaticContainerStyles = useMemo(
    () => ({
      ...MAP_INFO_BASE_STYLES,
      height: '50px',
      background: theme.palette.geoViewColor.grey.lighten(0.8, 0.8),
      width: 'fit-content',
      borderRadius: '70px',
    }),
    [theme.palette.geoViewColor.grey]
  );

  /**
   * Handles toggling the expanded state.
   */
  const handleExpand = useCallback((value: boolean): void => {
    setExpanded(value);
  }, []);

  return (
    <Box
      id={`${mapId}-mapInfo`}
      sx={interaction === 'dynamic' ? memoContainerStyles : memoStaticContainerStyles}
      onClick={onScrollShellIntoView}
    >
      {interaction === 'dynamic' && <MapInfoExpandButton onExpand={handleExpand} expanded={expanded} />}
      <Attribution />
      {interaction === 'dynamic' && (
        <>
          <div className={`${mapId}-mapInfo-flex`} style={FLEX_STYLE} />
          <MousePosition expanded={expanded} />
        </>
      )}
      <Scale expanded={expanded} />
      <div className={`${mapId}-mapInfo-flex`} style={FLEX_STYLE} />
      {interaction === 'dynamic' && <MapInfoRotationButton />}
    </Box>
  );
});
