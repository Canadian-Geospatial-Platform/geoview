import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, Tooltip } from '@/ui';
import { NorthArrowIcon } from '@/core/components/north-arrow/north-arrow-icon';

import { useStoreMapRotation } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useManageArrow } from '@/core/components/north-arrow/hooks/useManageArrow';
import { logger } from '@/core/utils/logger';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';

/**
 * Creates the map information rotation indicator component.
 *
 * Memoized to prevent re-renders since this component has no props.
 *
 * @returns The rotation indicator
 */
export const MapInfoRotationButton = memo(function MapInfoRotationButton(): JSX.Element {
  logger.logTraceRender('components/map-info/map-info-rotation-button');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  // Store
  const mapId = useStoreGeoViewMapId();
  const mapRotation = useStoreMapRotation();
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
    '&:focus-visible': {
      outlineColor: theme.palette.geoViewColor.primary.main,
    },
  };

  return (
    <Tooltip title={tooltipText} placement="top">
      <Box sx={containerStyles} tabIndex={0} role="note">
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
