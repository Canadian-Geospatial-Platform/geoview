import { useCallback, useMemo } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import type { SxStyles } from 'geoview-core/ui/style/types';
import type { TypeFilterAttribute, TypeFilterValue, TypeDateRangeValue } from '../../types';

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
  /** Style classes. */
  sxClasses: SxStyles;
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

  const { attribute, value, onChange, sxClasses } = props;

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box } = ui.elements;

  /**
   * Memoized date value to prevent dependency changes on every render.
   */
  const memoDateValue = useMemo((): TypeDateRangeValue => {
    return (value as TypeDateRangeValue) || { start: null, end: null };
  }, [value]);

  /**
   * Handles when the date range start value changes.
   */
  const handleDateStartChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      onChange({
        ...memoDateValue,
        start: event.target.value || null,
      });
    },
    [memoDateValue, onChange]
  );

  /**
   * Handles when the date range end value changes.
   */
  const handleDateEndChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      onChange({
        ...memoDateValue,
        end: event.target.value || null,
      });
    },
    [memoDateValue, onChange]
  );

  return (
    <Box sx={sxClasses.filterControl}>
      <label style={sxClasses.filterLabel as React.CSSProperties}>{attribute.displayLabel}</label>
      <Box sx={sxClasses.filterRange}>
        <input
          type="date"
          style={{ ...(sxClasses.filterInput as React.CSSProperties), ...(sxClasses.filterInputSmall as React.CSSProperties) }}
          value={memoDateValue.start || ''}
          onChange={handleDateStartChange}
        />
        <span style={sxClasses.filterRangeSeparator as React.CSSProperties}>to</span>
        <input
          type="date"
          style={{ ...(sxClasses.filterInput as React.CSSProperties), ...(sxClasses.filterInputSmall as React.CSSProperties) }}
          value={memoDateValue.end || ''}
          onChange={handleDateEndChange}
        />
      </Box>
    </Box>
  );
}
