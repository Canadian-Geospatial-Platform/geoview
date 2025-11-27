import { memo, useState, useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { CheckIcon, Tooltip, Box, Button } from '@/ui';
import { getSxClasses } from './scale-style';
import { useMapInteraction, useMapScale } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

interface ScaleProps {
  expanded: boolean;
}

interface TypeScale {
  scaleId: string;
  label: string;
  borderBottom: boolean;
}

// Constants outside component to prevent recreating every render
const SCALE_MODES = {
  METRIC: 0,
  IMPERIAL: 1,
  NUMERIC: 2,
} as const;

const BOX_STYLES = { minWidth: 120 } as const;

/**
 * Create a scale component
 *
 * @returns {JSX.Element} created scale element
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const Scale = memo(function Scale({ expanded }: ScaleProps): JSX.Element {
  logger.logTraceRender('components/scale/scale');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [scaleMode, setScaleMode] = useState<number>(SCALE_MODES.METRIC);

  // Store
  const mapId = useGeoViewMapId();
  const scale = useMapScale();
  const interaction = useMapInteraction();

  // Memoize values
  const scaleValues: TypeScale[] = useMemo(
    () => [
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
    ],
    [scale.labelGraphicMetric, scale.labelGraphicImperial, scale.labelNumeric]
  );

  // Callback
  const getScaleWidth = useCallback(
    (mode: number): string => {
      switch (mode) {
        case SCALE_MODES.METRIC:
          return scale.lineWidthMetric;
        case SCALE_MODES.IMPERIAL:
          return scale.lineWidthImperial;
        default:
          return 'none';
      }
    },
    [scale.lineWidthMetric, scale.lineWidthImperial]
  );
  const switchScale = useCallback((): void => {
    setScaleMode((prev) => (prev + 1) % 3);
  }, []);

  // Memoize UI - expanded content
  const expandedContent = useMemo(
    () => (
      <Box sx={sxClasses.scaleExpandedContainer}>
        {scaleValues.map((value, index) => (
          <Box sx={sxClasses.scaleExpandedCheckmarkText} key={value.scaleId}>
            <CheckIcon
              sx={{
                ...sxClasses.scaleCheckmark,
                fontSize: theme.palette.geoViewFontSize.lg,
                opacity: scaleMode === index ? 1 : 0,
              }}
            />
            <Box
              component="span"
              className={index === SCALE_MODES.NUMERIC ? '' : 'hasScaleLine'}
              sx={{
                ...sxClasses.scaleText,
                borderBottom: value.borderBottom ? '1px solid' : 'none',
                width: value.borderBottom ? getScaleWidth(index) : 'none',
              }}
            >
              {value.label}
            </Box>
          </Box>
        ))}
      </Box>
    ),
    [scaleValues, scaleMode, sxClasses, theme.palette.geoViewFontSize.lg, getScaleWidth]
  );

  // Memoize UI - collapsed content
  const collapsedContent = useMemo(
    () => (
      <Box
        component="span"
        className={`interaction-${interaction} ${scaleValues[scaleMode].borderBottom ? 'hasScaleLine' : ''}`}
        sx={{
          ...sxClasses.scaleText,
          borderBottom: scaleValues[scaleMode].borderBottom ? '1px solid' : 'none',
          width: scaleValues[scaleMode].borderBottom ? getScaleWidth(scaleMode) : 'none',
        }}
      >
        {scaleValues[scaleMode].label}
      </Box>
    ),
    [interaction, scaleValues, scaleMode, sxClasses.scaleText, getScaleWidth]
  );
  // TODO: WCAG Issue #2390 - Ensure that scale button updates are announced by screen readers
  // TODO: WCAG Issue #2390 - Rethink this to use mutliple buttons or select element for better accessibility?
  return (
    <Tooltip title={t('mapnav.scale')} placement="top">
      <Box sx={BOX_STYLES}>
        <Box id={`${mapId}-scaleControlBarMetric`} sx={sxClasses.scaleControl} />
        <Box id={`${mapId}-scaleControlBarImperial`} sx={sxClasses.scaleControl} />
        <Button onClick={switchScale} type="text" sx={sxClasses.scaleContainer} disableRipple className={`interaction-${interaction}`}>
          {expanded ? expandedContent : collapsedContent}
        </Button>
      </Box>
    </Tooltip>
  );
});
