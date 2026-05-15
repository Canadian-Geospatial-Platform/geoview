import type { ReactNode } from 'react';
import { createElement, useCallback, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useStoreMapRotation,
  useStoreMapFixNorth,
  useStoreMapNorthArrow,
  useStoreMapCurrentProjectionEPSG,
} from '@/core/stores/states/map-state';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import { Box, Slider, Switch, Typography } from '@/ui';
import { ThreeSixtyIcon } from '@/ui/icons';
import { Projection } from '@/geo/utils/projection';
import { useManageArrow } from '@/core/components/north-arrow/hooks/useManageArrow';
import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { Button } from '@/ui/button/button';
import { useMapController } from '@/core/controllers/use-controllers';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';

/**
 * Creates a map rotation button to open the rotation control panel.
 *
 * @returns The map rotation button
 */
export default function MapRotation(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/map-rotation');

  const { t } = useTranslation<string>();
  const mapId = useStoreGeoViewMapId();

  // Get values from store
  const mapRotation = useStoreMapRotation();
  const isFixNorth = useStoreMapFixNorth();
  const isNorthEnable = useStoreMapNorthArrow();
  const mapProjectionEPSG = useStoreMapCurrentProjectionEPSG();
  const { rotationAngle } = useManageArrow();
  const mapController = useMapController();

  const isLCCProjection = mapProjectionEPSG === Projection.PROJECTION_NAMES.LCC;
  const showFixNorthSwitch = isLCCProjection && isNorthEnable;

  // Convert radians to degrees (normalize to -180 to 180 range)
  let rotationDegrees = (mapRotation * 180) / Math.PI;
  // Normalize to -180 to 180 range
  rotationDegrees = ((rotationDegrees + 180) % 360) - 180;
  rotationDegrees = Math.round(rotationDegrees);

  // Keeps the slider value responsive while the store catches up to map updates.
  const [sliderRotationDegrees, setSliderRotationDegrees] = useState<number>(rotationDegrees);

  // Indicates whether the user is actively dragging the slider.
  const [isSliderDragging, setIsSliderDragging] = useState<boolean>(false);

  // Add ref for slider
  const sliderInputRef = useRef<HTMLInputElement>(null);

  // The rotation value currently displayed in the UI.
  const displayedRotationDegrees = isSliderDragging ? sliderRotationDegrees : rotationDegrees;

  // Calculate projection rotation
  const totalRotation = Math.round(rotationAngle.angle);
  const projectionRotation = totalRotation - displayedRotationDegrees;

  // Build label text
  const rotationLabel =
    projectionRotation !== 0
      ? `${t('mapctrl.rotation.rotation')}: ${displayedRotationDegrees}° (${t('mapctrl.rotation.projection')}: ${projectionRotation}°)`
      : `${t('mapctrl.rotation.rotation')}: ${displayedRotationDegrees}°`;

  /**
   * Syncs the slider display with the store whenever the user is not dragging it.
   */
  useEffect((): void => {
    logger.logTraceUseEffect('MAP ROTATION - sliderRotationDegrees sync', rotationDegrees, isSliderDragging);

    if (!isSliderDragging) {
      setSliderRotationDegrees(rotationDegrees);
    }
  }, [rotationDegrees, isSliderDragging]);

  // #region Handlers

  /**
   * Handles rotation slider change.
   *
   * @param value - The new slider value
   */
  const handleSliderChange = useCallback(
    (value: number | number[]): void => {
      const degrees = Array.isArray(value) ? value[0] : value;
      const radians = (degrees * Math.PI) / 180;

      setIsSliderDragging(true);
      setSliderRotationDegrees(degrees);
      mapController.rotate(radians, false);
    },
    [mapController]
  );

  /**
   * Handles when the user finishes moving the rotation slider.
   *
   * @param value - The final slider value after the user releases it
   */
  const handleSliderChangeCommitted = useCallback((value: number | number[]): void => {
    const degrees = Array.isArray(value) ? value[0] : value;

    setSliderRotationDegrees(degrees);
    setIsSliderDragging(false);
  }, []);

  /**
   * Handles fix north toggle.
   */
  const handleFixNorth = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const isChecked = event.target.checked;
      mapController.setFixNorth(isChecked);

      if (!isChecked) {
        mapController.rotate(0);
        setSliderRotationDegrees(0);
      }
    },
    [mapController]
  );

  /**
   * Handles when the user clicks the reset button.
   */
  const handleReset = useCallback((): void => {
    setSliderRotationDegrees(0);
    setIsSliderDragging(false);
    mapController.rotate(0);

    // Move focus to slider after reset
    requestAnimationFrame(() => {
      sliderInputRef.current?.focus();
    });
  }, [mapController]);

  // #endregion Handlers

  /**
   * Renders the rotation control panel content.
   *
   * @returns The rotation control panel
   */
  const renderRotationControl = (): ReactNode => {
    return (
      <Box sx={{ width: '300px', padding: '0 20px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', paddingTop: '10px' }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 'bold' }}
            role="status"
            aria-live={isSliderDragging ? 'off' : 'polite'}
            aria-atomic="true"
          >
            {rotationLabel}
          </Typography>
        </Box>
        <Slider
          value={sliderRotationDegrees}
          onChange={handleSliderChange}
          onChangeCommitted={handleSliderChangeCommitted}
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
          slotProps={{
            input: {
              ref: sliderInputRef,
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              type="text"
              id={`${mapId}-rotation-reset`}
              size="small"
              onClick={handleReset}
              disabled={displayedRotationDegrees === 0 || isFixNorth}
            >
              {t('mapnav.rotation.reset')}
            </Button>
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
