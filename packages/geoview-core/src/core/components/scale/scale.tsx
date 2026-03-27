import { memo, useState, useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { CheckIcon, Tooltip, Box, Button } from '@/ui';
import { getSxClasses } from './scale-style';
import { useMapInteraction, useMapScale } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

/** The properties for the scale component. */
interface ScaleProps {
  /** Whether the scale is in expanded mode. */
  expanded: boolean;
}

/** Represents a single scale display option. */
interface TypeScale {
  /** The unique identifier for the scale option. */
  scaleId: string;
  /** The display label text. */
  label: string;
  /** Whether to show a border bottom line. */
  borderBottom: boolean;
}

/** Scale mode index constants. */
const SCALE_MODES = {
  METRIC: 0,
  IMPERIAL: 1,
  NUMERIC: 2,
} as const;

/** Minimum width style for the scale container box. */
const BOX_STYLES = { minWidth: 120 } as const;

/**
 * Creates a scale component.
 *
 * Memoized to avoid re-rendering when parent updates but scale props remain unchanged.
 *
 * @param props - The scale properties
 * @returns The scale component
 */
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

  /**
   * Builds the list of scale display options.
   */
  const memoScaleValues: TypeScale[] = useMemo(
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

  /**
   * Returns the line width for the given scale mode.
   *
   * @param mode - The scale mode index
   * @returns The line width string or 'none'
   */
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
  /**
   * Handles when the user clicks the scale button to cycle through modes.
   */
  const switchScale = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    setScaleMode((prev) => (prev + 1) % 3);
  }, []);

  /**
   * Builds the expanded scale content showing all three scale options.
   */
  const memoExpandedContent = useMemo(
    () => (
      <Box sx={sxClasses.scaleExpandedContainer}>
        {memoScaleValues.map((value, index) => (
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
    [memoScaleValues, scaleMode, sxClasses, theme.palette.geoViewFontSize.lg, getScaleWidth]
  );

  /**
   * Builds the collapsed scale content showing only the active scale option.
   */
  const memoCollapsedContent = useMemo(
    () => (
      <Box
        component="span"
        className={`interaction-${interaction} ${memoScaleValues[scaleMode].borderBottom ? 'hasScaleLine' : ''}`}
        sx={{
          ...sxClasses.scaleText,
          borderBottom: memoScaleValues[scaleMode].borderBottom ? '1px solid' : 'none',
          width: memoScaleValues[scaleMode].borderBottom ? getScaleWidth(scaleMode) : 'none',
        }}
      >
        {memoScaleValues[scaleMode].label}
      </Box>
    ),
    [interaction, memoScaleValues, scaleMode, sxClasses.scaleText, getScaleWidth]
  );
  // TODO: WCAG Issue #2390 - Ensure that scale button updates are announced by screen readers
  // TODO: WCAG Issue #2390 - Rethink this to use mutliple buttons or select element for better accessibility?
  return (
    <Tooltip title={t('mapnav.scale')} placement="top">
      <Box sx={BOX_STYLES}>
        <Box id={`${mapId}-scaleControlBarMetric`} sx={sxClasses.scaleControl} />
        <Box id={`${mapId}-scaleControlBarImperial`} sx={sxClasses.scaleControl} />
        <Button onClick={switchScale} type="text" sx={sxClasses.scaleContainer} disableRipple className={`interaction-${interaction}`}>
          {expanded ? memoExpandedContent : memoCollapsedContent}
        </Button>
      </Box>
    </Tooltip>
  );
});
