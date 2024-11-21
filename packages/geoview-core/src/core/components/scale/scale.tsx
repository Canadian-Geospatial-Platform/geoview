import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { CheckIcon, Tooltip, Box, Button } from '@/ui';
import { getSxClasses } from './scale-style';
import { useMapInteraction, useMapScale } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useUIMapInfoExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

interface TypeScale {
  scaleId: string;
  label: string;
  borderBottom: boolean;
}

/**
 * Create an element that displays the scale
 *
 * @returns {JSX.Element} created scale element
 */
export function Scale(): JSX.Element {
  // Log
  logger.logTraceRender('components/scale/scale');

  const mapId = useGeoViewMapId();

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal component state
  const [scaleMode, setScaleMode] = useState<number>(0);

  // get the values from store
  const expanded = useUIMapInfoExpanded();
  const scale = useMapScale();
  const interaction = useMapInteraction();

  /**
   * Switch the scale mode
   */
  const switchScale = (): void => {
    setScaleMode((scaleMode + 1) % 3);
  };

  // set the scales values array
  const scaleValues: TypeScale[] = [
    {
      scaleId: '0',
      label: scale.labelGraphicMetric,
      borderBottom: true,
    },
    {
      scaleId: '1',
      label: scale.labelGraphicImperial,
      borderBottom: true,
    },
    {
      scaleId: '2',
      label: scale.labelNumeric,
      borderBottom: false,
    },
  ];

  const getScaleWidth = (mode: number): string => {
    if (mode === 0) return scale.lineWidthMetric;
    if (mode === 1) return scale.lineWidthImperial;
    return 'none';
  };

  return (
    <Tooltip title={t('mapnav.scale')!} placement="top">
      <Box sx={{ minWidth: 120 }}>
        <Box id={`${mapId}-scaleControlBarMetric`} sx={sxClasses.scaleControl} />
        <Box id={`${mapId}-scaleControlBarImperial`} sx={sxClasses.scaleControl} />
        <Button
          onClick={() => switchScale()}
          type="text"
          sx={sxClasses.scaleContainer}
          disableRipple
          className={`interaction-${interaction}`}
        >
          {expanded ? (
            <Box sx={sxClasses.scaleExpandedContainer}>
              {scaleValues.map((value, index) => {
                return (
                  <Box sx={sxClasses.scaleExpandedCheckmarkText} key={value.scaleId}>
                    <CheckIcon
                      sx={{ ...sxClasses.scaleCheckmark, fontSize: theme.palette.geoViewFontSize.lg, opacity: scaleMode === index ? 1 : 0 }}
                    />
                    <Box
                      component="span"
                      className={`${index === 2 ? '' : 'hasScaleLine'}`}
                      sx={{
                        ...sxClasses.scaleText,
                        borderBottom: value.borderBottom ? '1px solid' : 'none',
                        width: value.borderBottom ? getScaleWidth(index) : 'none',
                      }}
                    >
                      {value.label}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box
              component="span"
              className={`interaction-${interaction} ${scaleValues[scaleMode].borderBottom ? 'hasScaleLine' : ''}`}
              sx={{
                ...sxClasses.scaleText,
                borderBottom: scaleValues[scaleMode].borderBottom ? '1px solid' : 'none',
                // eslint-disable-next-line no-nested-ternary
                width: scaleValues[scaleMode].borderBottom ? getScaleWidth(scaleMode) : 'none',
              }}
            >
              {scaleValues[scaleMode].label}
            </Box>
          )}
        </Button>
      </Box>
    </Tooltip>
  );
}
