import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { Box, Tooltip } from '@/ui';
import { NorthArrowIcon } from '@/core/components/north-arrow/north-arrow-icon';
import { getSxClasses } from './map-info-rotation-button-style';

import { useStoreMapRotation } from '@/core/stores/states/map-state';
import { useManageArrow } from '@/core/components/north-arrow/hooks/useManageArrow';
import { logger } from '@/core/utils/logger';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';

/**
 * Creates the map information rotation indicator component.
 *
 * @returns The rotation indicator
 */
export function MapInfoRotationButton(): JSX.Element {
  logger.logTraceRender('components/map-info/map-info-rotation-button');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  /**
   * Builds the map info rotation button styles.
   */
  const memoSxClasses = useMemo((): ReturnType<typeof getSxClasses> => {
    logger.logTraceUseMemo('MAP-INFO-ROTATION-BUTTON - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // Store
  const mapId = useStoreGeoViewMapId();
  const mapRotation = useStoreMapRotation();
  const { rotationAngle } = useManageArrow();

  // Convert radians to degrees for tooltip
  const rotationDegrees = Math.round((mapRotation * 180) / Math.PI);

  // The rotationAngle.angle includes both map rotation and projection-based rotation (e.g., LCC)
  const totalRotation = Math.round(rotationAngle);

  // Calculate the projection-specific rotation component
  const projectionRotation = totalRotation - rotationDegrees;

  // Build tooltip text
  const tooltipText =
    projectionRotation !== 0
      ? `${t('mapctrl.rotation.rotation')}: ${rotationDegrees}° (${t('mapctrl.rotation.projection')}: ${projectionRotation}°)`
      : `${t('mapctrl.rotation.rotation')}: ${rotationDegrees}°`;

  return (
    <Tooltip title={tooltipText} placement="top">
      <Box sx={memoSxClasses.container} tabIndex={0} role="note" aria-label={tooltipText}>
        <Box className={`map-info-rotation-${mapId}`} sx={[memoSxClasses.arrow, { transform: `rotate(${rotationAngle}deg)` }]}>
          <NorthArrowIcon width={30} height={30} />
        </Box>
      </Box>
    </Tooltip>
  );
}
