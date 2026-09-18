import { memo, useCallback, useMemo, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme, type SxProps, type Theme } from '@mui/material/styles';

import type { SxStyles } from '@/ui/style/types';

import { Box } from '@/ui';
import { getSxClasses } from './map-info-style';
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
   * Computes the style classes for the map info bar.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('MAP-INFO - memoSxClasses');
    return getSxClasses(theme);
  }, [theme]);

  /**
   * Computes the container sx for the map info bar based on interaction mode and expanded state.
   */
  const memoContainerSx = useMemo((): SxProps<Theme> => {
    logger.logTraceUseMemo('MAP-INFO - memoContainerSx', interaction, expanded, memoSxClasses);
    return interaction === 'dynamic'
      ? { ...memoSxClasses.container, height: expanded ? MAP_INFO_HEIGHT_EXPANDED : MAP_INFO_HEIGHT_COLLAPSED }
      : memoSxClasses.staticContainer;
  }, [interaction, expanded, memoSxClasses]);

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
    <Box component="section" aria-label={t('map.info')} id={`${mapId}-mapInfo`} sx={memoContainerSx} onClick={onScrollShellIntoView}>
      {interaction === 'dynamic' && <MapInfoExpandButton onExpand={handleExpand} expanded={expanded} />}
      <Attribution />
      {interaction === 'dynamic' ? (
        <Box sx={memoSxClasses.mouseScaleControlsContainer}>
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
