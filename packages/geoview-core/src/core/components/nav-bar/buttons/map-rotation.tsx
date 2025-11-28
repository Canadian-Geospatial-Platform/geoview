import type { ReactNode } from 'react';
import { createElement, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useMapRotation,
  useMapStoreActions,
  useMapFixNorth,
  useMapNorthArrow,
  useMapProjection,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import { Box, Slider, Switch, Typography } from '@/ui';
import { ThreeSixtyIcon } from '@/ui/icons';
import { Projection } from '@/geo/utils/projection';
import { useManageArrow } from '@/core/components/north-arrow/hooks/useManageArrow';
import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { IconButton } from '@/ui/icon-button/icon-button';

/**
 * Create a map rotation button to open the rotation control panel
 * @returns {JSX.Element} the created map rotation button
 */
export default function MapRotation(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/map-rotation');

  const { t } = useTranslation<string>();

  // Get values from store
  const { setRotation, setFixNorth } = useMapStoreActions();
  const mapRotation = useMapRotation();
  const isFixNorth = useMapFixNorth();
  const isNorthEnable = useMapNorthArrow();
  const mapProjection = useMapProjection();
  const { rotationAngle } = useManageArrow();

  const isLCCProjection = `EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.LCC;
  const showFixNorthSwitch = isLCCProjection && isNorthEnable;

  // Convert radians to degrees (normalize to -180 to 180 range)
  let rotationDegrees = (mapRotation * 180) / Math.PI;
  // Normalize to -180 to 180 range
  rotationDegrees = ((rotationDegrees + 180) % 360) - 180;
  rotationDegrees = Math.round(rotationDegrees);

  // Calculate projection rotation
  const totalRotation = Math.round(rotationAngle.angle);
  const projectionRotation = totalRotation - rotationDegrees;

  // Build label text
  const rotationLabel =
    projectionRotation !== 0
      ? `${t('mapctrl.rotation.rotation')}: ${rotationDegrees}° (${t('mapctrl.rotation.projection')}: ${projectionRotation}°)`
      : `${t('mapctrl.rotation.rotation')}: ${rotationDegrees}°`;

  /**
   * Handles rotation slider change
   */
  const handleSliderChange = useCallback(
    (value: number | number[]): void => {
      // Log
      logger.logTraceUseCallback('MAP-ROTATION, handleSliderChange', value);

      const degrees = Array.isArray(value) ? value[0] : value;
      const radians = (degrees * Math.PI) / 180;
      setRotation(radians);
    },
    [setRotation]
  );

  /**
   * Handles fix north toggle
   */
  const handleFixNorth = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      // Log
      logger.logTraceUseCallback('MAP-ROTATION, handleFixNorth', event.target.checked);

      const isChecked = event.target.checked;
      setFixNorth(isChecked);

      if (!isChecked) {
        setRotation(0);
      }
    },
    [setFixNorth, setRotation]
  );

  /**
   * Handles reset button click
   */
  const handleReset = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('MAP-ROTATION, handleReset');

    setRotation(0);
  }, [setRotation]);

  /**
   * Render rotation control panel content
   * @returns ReactNode
   */
  const renderRotationControl = (): ReactNode => {
    return (
      <Box sx={{ width: '300px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', paddingTop: '10px' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {rotationLabel}
          </Typography>
        </Box>
        <Slider
          value={rotationDegrees}
          onChange={handleSliderChange}
          min={-180}
          max={180}
          step={1}
          marks={[
            { value: -180, label: '-180°' },
            { value: -90, label: '-90°' },
            { value: 0, label: '0°' },
            { value: 90, label: '90°' },
            { value: 180, label: '180°' },
          ]}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}°`}
          disabled={isFixNorth}
          track={false}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton
              id="rotation-reset"
              aria-label={t('mapnav.rotation.reset')}
              tooltipPlacement="right"
              size="small"
              onClick={handleReset}
              disabled={rotationDegrees === 0}
            >
              {t('mapnav.rotation.reset')}
            </IconButton>
            {showFixNorthSwitch && (
              <Switch size="small" onChange={handleFixNorth} label={t('mapctrl.rotation.fixedNorth') || ''} checked={isFixNorth} />
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  // Set up props for nav bar panel button
  const button: IconButtonPropsExtend = {
    'aria-label': t('mapnav.rotation.title'),
    children: createElement(Box, {
      sx: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `rotate(${mapRotation}rad)`,
        transition: 'transform 0.3s ease-in-out',
        color: '#000000',
      },
      children: createElement(ThreeSixtyIcon),
    }),
    tooltipPlacement: 'left',
  };

  const panel: TypePanelProps = {
    title: 'mapnav.rotation.title',
    icon: createElement(ThreeSixtyIcon),
    content: renderRotationControl(),
    width: 'flex',
  };

  return <NavbarPanelButton buttonPanel={{ buttonPanelId: 'mapRotation', button, panel }} />;
}
