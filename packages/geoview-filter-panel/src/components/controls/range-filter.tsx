import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import { useTranslation } from 'geoview-core/core/translation/i18n';

import type { TypeFilterAttribute, TypeFilterValue, TypeRangeValue } from '../../types';
import { getSxClasses } from './control-styles';

/**
 * Props for RangeFilter component.
 */
interface RangeFilterProps {
  /** Attribute configuration. */
  attribute: TypeFilterAttribute;
  /** Current filter value. */
  value: TypeFilterValue;
  /** Callback when value changes. */
  onChange: (value: TypeFilterValue) => void;
  /** Unique numeric values from the layer features. */
  uniqueValues: number[];
  /** Whether the filter is loading. */
  loading: boolean;
}

/**
 * Creates a numeric range filter control with a dual-handle slider.
 *
 * @param props - Properties defined in RangeFilterProps interface
 * @returns The range filter component
 */
export function RangeFilter(props: RangeFilterProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-filter-panel/components/range-filter');

  const { attribute, value, onChange, uniqueValues, loading } = props;

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { useMemo, useCallback } = cgpv.reactUtilities.react;
  const { ui } = cgpv;
  const { Box, Slider, Typography } = ui.elements;

  const theme = ui.useTheme();
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();

  /**
   * Memoized range value to prevent dependency changes on every render.
   */
  const memoRangeValue = useMemo((): TypeRangeValue => {
    return (value as TypeRangeValue) || { min: null, max: null };
  }, [value]);

  /**
   * Compute the min and max bounds from unique numeric values.
   */
  const memoBounds = useMemo((): { min: number; max: number } => {
    // Log
    logger.logTraceUseMemo('RANGE-FILTER - memoBounds', uniqueValues.length);

    if (!uniqueValues.length) {
      return { min: 0, max: 100 }; // Default bounds when no data
    }

    const numericValues = uniqueValues.filter((v) => typeof v === 'number' && !Number.isNaN(v));

    if (!numericValues.length) {
      return { min: 0, max: 100 }; // Default bounds when no numeric values
    }

    return {
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
    };
  }, [uniqueValues]);

  /**
   * Compute the current slider value (array with two elements).
   */
  const memoSliderValue = useMemo((): [number, number] => {
    // Log
    logger.logTraceUseMemo('RANGE-FILTER - memoSliderValue', memoRangeValue);

    return [memoRangeValue.min ?? memoBounds.min, memoRangeValue.max ?? memoBounds.max];
  }, [memoRangeValue, memoBounds]);

  /**
   * Handles when the slider value changes.
   */
  const handleSliderChange = useCallback(
    (newValue: number | number[]): void => {
      // Assert that newValue is number[] since this is a range slider with two handles
      const [minValue, maxValue] = newValue as number[];
      onChange({
        min: minValue,
        max: maxValue,
      });
    },

    [onChange]
  );

  /**
   * Formats the slider value for display.
   */
  const formatValue = useCallback((val: number): string => {
    // Format with appropriate precision
    return Number.isInteger(val) ? val.toString() : val.toFixed(2);
  }, []);

  if (loading) {
    return (
      <Box sx={memoSxClasses.filterControl}>
        <Typography variant="body2" sx={memoSxClasses.filterLabel}>
          {attribute.displayLabel}
        </Typography>
        <Typography variant="body2" sx={memoSxClasses.filterLoading}>
          {t('FilterPanel.loadingValues')}
        </Typography>
      </Box>
    );
  }

  if (uniqueValues.length === 0) {
    return (
      <Box sx={memoSxClasses.filterControl}>
        <Typography variant="body2" sx={memoSxClasses.filterLabel}>
          {attribute.displayLabel}
        </Typography>
        <Typography variant="body2" sx={memoSxClasses.filterLoading}>
          {t('FilterPanel.noNumericValuesAvailable')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={memoSxClasses.filterControl}>
      <Typography variant="body2" sx={memoSxClasses.filterLabel}>
        {attribute.displayLabel}
      </Typography>

      <Box sx={memoSxClasses.filterSliderContainer}>
        <Slider
          value={memoSliderValue}
          onChange={handleSliderChange}
          valueLabelDisplay={'off'}
          valueLabelFormat={formatValue}
          min={memoBounds.min}
          max={memoBounds.max}
        />
      </Box>

      <Box sx={memoSxClasses.filterRangeValues}>
        <span>{formatValue(memoSliderValue[0])}</span>
        <span>{formatValue(memoSliderValue[1])}</span>
      </Box>
    </Box>
  );
}
