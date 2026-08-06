import { memo, useCallback, useMemo, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import type { SxProps } from '@mui/material';

import { Box } from '@/ui';
import { Attribution } from '@/core/components/attribution/attribution';
import { MousePosition } from '@/core/components/mouse-position/mouse-position';
import { Scale } from '@/core/components/scale/scale';
import { MapInfoExpandButton } from './map-info-expand-button';
import { MapInfoRotationButton } from './map-info-rotation-button';
import { useStoreMapInteraction } from '@/core/stores/states/map-state';
import { useMapController } from '@/core/controllers/use-controllers';
import { logger } from '@/core/utils/logger';
import { MAP_INFO_HEIGHT_COLLAPSED, MAP_INFO_HEIGHT_EXPANDED } from '@/core/utils/constant';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreUIMapInfoExpanded } from '@/core/stores/states/ui-state';

/** Base styles for the map info bar container. */
const MAP_INFO_BASE_STYLES = {
  display: 'flex',
  gap: '6px',
  alignItems: 'center',
  position: 'absolute',
  bottom: 0,
  left: '48px',
  right: 0,
  px: '1rem',
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollbarWidth: 'thin',
} as const;

/** Props for the MapInfo component. */
interface MapInfoProps {
  /** Callback to scroll the shell into view when the info bar is clicked. */
  onScrollShellIntoView: () => void;
}

/**
 * Creates the map information bar containing attribution, mouse position, and scale.
 *
 * Memoized to prevent re-renders when parent shell updates but the `onScrollShellIntoView`
 * callback reference has not changed. Since the callback is typically stable (wrapped in
 * useCallback in the parent), memo effectively shields MapInfo from unrelated parent re-renders.
 *
 * @param props - Properties defined in MapInfoProps interface
 * @returns The map information bar
 */
export const MapInfo = memo(({ onScrollShellIntoView }: MapInfoProps): JSX.Element => {
  logger.logTraceRender('components/map-info/map-info');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();

  // Store
  const mapId = useStoreGeoViewMapId();
  const interaction = useStoreMapInteraction(); // Static map, do not display mouse position or rotation controls
  const expanded = useStoreUIMapInfoExpanded();
  const uiController = useUIController();
  const mapController = useMapController();

  /**
   * Updates the OL View padding when the map-info bar height changes.
   */
  useEffect(() => {
    logger.logTraceUseEffect('MAP-INFO - updateViewPadding', expanded);
    // Defer to next frame so the DOM has updated its height before we read it
    const frame = requestAnimationFrame(() => {
      mapController.updateViewPadding();
    });
    return (): void => {
      cancelAnimationFrame(frame);
    };
  }, [expanded, mapController]);

  /**
   * Computes the dynamic container styles for the map info bar.
   */
  const memoContainerStyles = useMemo((): SxProps => {
    logger.logTraceUseMemo('MAP-INFO - memoContainerStyles', expanded);
    return {
      ...MAP_INFO_BASE_STYLES,
      scrollbarColor: `${theme.palette.geoViewColor?.primary.main ?? theme.palette.primary.main} transparent`,
      height: expanded ? MAP_INFO_HEIGHT_EXPANDED : MAP_INFO_HEIGHT_COLLAPSED,
      borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[650] ?? theme.palette.divider}`,
      color: theme.palette.geoViewColor?.bgColor.dark[650] ?? theme.palette.text.primary,
      backgroundColor: theme.palette.geoViewColor?.bgColor.dark[50] ?? theme.palette.background.paper,
      width: 'calc(100% - 48px)',
      zIndex: theme.zIndex.appBar + 100, // Above app-bar panels
      boxShadow: `0 0 5px ${theme.palette.geoViewColor?.bgColor.dark[200] ?? theme.palette.grey[300]}`,
    };
  }, [expanded, theme]);

  /**
   * Computes the static map container styles.
   */
  const memoStaticContainerStyles = useMemo((): SxProps => {
    logger.logTraceUseMemo('MAP-INFO - memoStaticContainerStyles');
    return {
      ...MAP_INFO_BASE_STYLES,
      height: '50px',
      background: theme.palette.geoViewColor?.grey.lighten(0.8, 0.8),
      width: 'fit-content',
      borderRadius: '70px',
    };
  }, [theme]);

  // #region Handlers

  /**
   * Handles toggling the expanded state.
   */
  const handleExpand = useCallback(
    (value: boolean): void => {
      uiController.setMapInfoExpanded(value);
    },
    [uiController]
  );

  // #endregion Handlers

  return (
    <Box
      component="section"
      aria-label={t('map.info')}
      id={`${mapId}-mapInfo`}
      sx={interaction === 'dynamic' ? memoContainerStyles : memoStaticContainerStyles}
      onClick={onScrollShellIntoView}
    >
      {interaction === 'dynamic' && <MapInfoExpandButton onExpand={handleExpand} expanded={expanded} />}
      <Attribution />
      {interaction === 'dynamic' ? (
        <Box sx={{ marginLeft: 'auto', marginRight: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <MousePosition expanded={expanded} />
          <Scale expanded={expanded} />
        </Box>
      ) : (
        <Scale expanded={expanded} />
      )}
      {interaction === 'dynamic' && <MapInfoRotationButton />}
    </Box>
  );
});
MapInfo.displayName = 'MapInfo';
