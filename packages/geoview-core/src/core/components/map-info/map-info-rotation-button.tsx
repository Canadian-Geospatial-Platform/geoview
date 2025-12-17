import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, Tooltip } from '@/ui';
import { NorthArrowIcon } from '@/core/components/north-arrow/north-arrow-icon';

import { useMapRotation } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useManageArrow } from '@/core/components/north-arrow/hooks/useManageArrow';
import { logger } from '@/core/utils/logger';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

/**
 * Map Information Rotation Indicator component
 * Displays the current map rotation angle
 *
 * @returns {JSX.Element} the rotation indicator
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const MapInfoRotationButton = memo(function MapInfoRotationButton(): JSX.Element {
  logger.logTraceRender('components/map-info/map-info-rotation-button');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  // Store
  const mapId = useGeoViewMapId();
  const mapRotation = useMapRotation();
  const { rotationAngle } = useManageArrow();

  // Convert radians to degrees for tooltip
  const rotationDegrees = Math.round((mapRotation * 180) / Math.PI);

  // The rotationAngle.angle includes both map rotation and projection-based rotation (e.g., LCC)
  const totalRotation = Math.round(rotationAngle.angle);

  // Calculate the projection-specific rotation component
  const projectionRotation = totalRotation - rotationDegrees;

  // Build tooltip text
  const tooltipText =
    projectionRotation !== 0
      ? `${t('mapctrl.rotation.rotation')}: ${rotationDegrees}° (${t('mapctrl.rotation.projection')}: ${projectionRotation}°)`
      : `${t('mapctrl.rotation.rotation')}: ${rotationDegrees}°`;

  const containerStyles = {
    width: '40px',
    height: '40px',
    my: '1rem',
    color: theme.palette.geoViewColor.bgColor.light[800],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <Tooltip title={tooltipText} placement="top">
      <Box sx={containerStyles}>
        <Box
          className={`map-info-rotation-${mapId}`}
          sx={{
            transform: `rotate(${rotationAngle.angle}deg)`,
            transition: 'transform 0.3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <NorthArrowIcon width={30} height={30} />
        </Box>
      </Box>
    </Tooltip>
  );
});
