import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import { useFilterPanelController } from 'geoview-core/core/controllers/use-controllers';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import type { TypeFilterAttribute, TypeFilterValue, TypeDateRangeValue } from '../../types';
import { getSxClasses } from './control-styles';

/**
 * Props for DateFilter component.
 */
interface DateFilterProps {
  /** Attribute configuration. */
  attribute: TypeFilterAttribute;
  /** Current filter value. */
  value: TypeFilterValue;
  /** Callback when value changes. */
  onChange: (value: TypeFilterValue) => void;
  /** Unique date values from the layer features. */
  uniqueValues: (string | number)[];
  /** Whether the filter is loading. */
  loading: boolean;
}

/**
 * Creates a date range filter control with start/end date inputs.
 *
 * @param props - Properties defined in DateFilterProps interface
 * @returns The date filter component
 */
export function DateFilter(props: DateFilterProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-filter-panel/components/date-filter');

  const { attribute, value, onChange, uniqueValues, loading } = props;

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { useMemo, useCallback, useRef } = cgpv.reactUtilities.react;
  const { ui } = cgpv;
  const { Box, Slider, Typography } = ui.elements;

  const theme = ui.useTheme();
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();

  const controller = useFilterPanelController();

  // Track which thumb (0 = start, 1 = end) was last interacted with
  const activeThumbRef = useRef<number>(1);

  /**
   * Memoized date value to prevent dependency changes on every render.
   */
  const memoDateValue = useMemo((): TypeDateRangeValue => {
    return (value as TypeDateRangeValue) || { start: null, end: null };
  }, [value]);

  /**
   * Compute the min and max date bounds as timestamps using the controller.
   */
  const memoBounds = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATE-FILTER - memoBounds', uniqueValues.length);

    return controller.getDateBounds(uniqueValues);
  }, [controller, uniqueValues]);

  /**
   * Compute the current slider value (array with two timestamp elements).
   */
  const memoSliderValue = useMemo((): [number, number] => {
    // Log
    logger.logTraceUseMemo('DATE-FILTER - memoSliderValue', memoDateValue);

    if (!memoBounds) return [0, 0];

    // Convert date strings to timestamps using the controller
    let startTimestamp = memoBounds.min;
    let endTimestamp = memoBounds.max;

    if (memoDateValue.start) {
      try {
        // Parse the date string back to timestamp
        const parsedStart = new Date(memoDateValue.start).getTime();
        if (!Number.isNaN(parsedStart)) {
          startTimestamp = parsedStart;
        }
      } catch (err) {
        logger.logWarning('Failed to parse start date:', err);
      }
    }

    if (memoDateValue.end) {
      try {
        const parsedEnd = new Date(memoDateValue.end).getTime();
        if (!Number.isNaN(parsedEnd)) {
          endTimestamp = parsedEnd;
        }
      } catch (err) {
        logger.logWarning('Failed to parse end date:', err);
      }
    }

    return [startTimestamp, endTimestamp];
  }, [memoDateValue, memoBounds]);

  /**
   * Handles when the slider value changes.
   */
  const handleSliderChange = useCallback(
    (newValue: number | number[], activeThumb: number): void => {
      // Track which thumb is being moved
      activeThumbRef.current = activeThumb;

      // Assert that newValue is number[] since this is a range slider
      const [start, end] = newValue as number[];

      // Convert timestamps to YYYY-MM-DD strings using the controller
      onChange({
        start: controller.formatDateForFilter(start),
        end: controller.formatDateForFilter(end),
      });
    },
    [controller, onChange]
  );

  /**
   * Handles keyboard navigation with calendar-aware stepping.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      if (!memoBounds) return;

      const isLeftArrow = event.key === 'ArrowLeft';
      const isRightArrow = event.key === 'ArrowRight';

      if (!isLeftArrow && !isRightArrow) return;

      event.preventDefault(); // Prevent default slider behavior

      const [currentStart, currentEnd] = memoSliderValue;
      const direction = isRightArrow ? 1 : -1;
      const dateStep = attribute.dateStep ?? 'day';
      const activeThumb = activeThumbRef.current;

      // Apply date step to the active thumb (0 = start, 1 = end)
      if (activeThumb === 0) {
        // Modify start date
        const newStartTimestamp = controller.applyDateStep(currentStart, dateStep, direction);
        const clampedStart = Math.min(Math.max(newStartTimestamp, memoBounds.min), memoBounds.max);

        onChange({
          start: controller.formatDateForFilter(clampedStart),
          end: controller.formatDateForFilter(currentEnd),
        });
      } else {
        // Modify end date
        const newEndTimestamp = controller.applyDateStep(currentEnd, dateStep, direction);
        const clampedEnd = Math.min(Math.max(newEndTimestamp, memoBounds.min), memoBounds.max);

        onChange({
          start: controller.formatDateForFilter(currentStart),
          end: controller.formatDateForFilter(clampedEnd),
        });
      }
    },
    [memoBounds, memoSliderValue, attribute.dateStep, controller, onChange]
  );

  /**
   * Formats the slider timestamp value for display in the tooltip.
   */
  const formatValue = useCallback(
    (timestamp: number): string => {
      return controller.formatDateForDisplay(timestamp);
    },
    [controller]
  );

  if (loading) {
    return (
      <Box sx={memoSxClasses.filterControl}>
        <Typography variant="body2" sx={memoSxClasses.filterLabel}>
          {attribute.displayLabel}
        </Typography>
        <Typography variant="body2" sx={memoSxClasses.filterLoading}>
          {t('FilterPanel.loading')}
        </Typography>
      </Box>
    );
  }

  if (!memoBounds) {
    return (
      <Box sx={memoSxClasses.filterControl}>
        <Typography variant="body2" sx={memoSxClasses.filterLabel}>
          {attribute.displayLabel}
        </Typography>
        <Typography variant="body2" sx={memoSxClasses.filterLoading}>
          {t('FilterPanel.noDateValues')}
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
          onKeyDown={handleKeyDown}
          valueLabelDisplay={'off'}
          valueLabelFormat={formatValue}
          min={memoBounds.min}
          max={memoBounds.max}
          step={1}
        />
      </Box>

      <Box sx={memoSxClasses.filterRangeValues}>
        <span>{formatValue(memoSliderValue[0])}</span>
        <span>{formatValue(memoSliderValue[1])}</span>
      </Box>

      <Typography variant="caption" sx={memoSxClasses.filterDateInfo}>
        {t('FilterPanel.available')}: {memoBounds.minDate} {t('FilterPanel.to')} {memoBounds.maxDate}
      </Typography>
    </Box>
  );
}
