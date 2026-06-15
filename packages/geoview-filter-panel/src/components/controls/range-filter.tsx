import { useCallback, useMemo } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import type { SxStyles } from 'geoview-core/ui/style/types';
import type { TypeFilterAttribute, TypeFilterValue, TypeRangeValue } from '../../types';

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
  /** Style classes. */
  sxClasses: SxStyles;
}

/**
 * Creates a numeric range filter control with min/max inputs.
 *
 * @param props - Properties defined in RangeFilterProps interface
 * @returns The range filter component
 */
export function RangeFilter(props: RangeFilterProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-filter-panel/components/range-filter');

  const { attribute, value, onChange, sxClasses } = props;

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box } = ui.elements;

  /**
   * Memoized range value to prevent dependency changes on every render.
   */
  const memoRangeValue = useMemo((): TypeRangeValue => {
    return (value as TypeRangeValue) || { min: null, max: null };
  }, [value]);

  /**
   * Handles when the range min value changes.
   */
  const handleRangeMinChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      onChange({
        ...memoRangeValue,
        min: event.target.value ? parseFloat(event.target.value) : null,
      });
    },
    [memoRangeValue, onChange]
  );

  /**
   * Handles when the range max value changes.
   */
  const handleRangeMaxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      onChange({
        ...memoRangeValue,
        max: event.target.value ? parseFloat(event.target.value) : null,
      });
    },
    [memoRangeValue, onChange]
  );

  return (
    <Box sx={sxClasses.filterControl}>
      <label style={sxClasses.filterLabel as React.CSSProperties}>{attribute.displayLabel}</label>
      <Box sx={sxClasses.filterRange}>
        <input
          type="number"
          style={{ ...(sxClasses.filterInput as React.CSSProperties), ...(sxClasses.filterInputSmall as React.CSSProperties) }}
          placeholder="Min"
          value={memoRangeValue.min ?? ''}
          onChange={handleRangeMinChange}
        />
        <span style={sxClasses.filterRangeSeparator as React.CSSProperties}>to</span>
        <input
          type="number"
          style={{ ...(sxClasses.filterInput as React.CSSProperties), ...(sxClasses.filterInputSmall as React.CSSProperties) }}
          placeholder="Max"
          value={memoRangeValue.max ?? ''}
          onChange={handleRangeMaxChange}
        />
      </Box>
    </Box>
  );
}
