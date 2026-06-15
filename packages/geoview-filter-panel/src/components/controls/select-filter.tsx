import { useCallback } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import type { SxStyles } from 'geoview-core/ui/style/types';
import type { TypeFilterAttribute, TypeFilterValue } from '../../types';

/**
 * Props for SelectFilter component.
 */
interface SelectFilterProps {
  /** Attribute configuration. */
  attribute: TypeFilterAttribute;
  /** Current filter value. */
  value: TypeFilterValue;
  /** Callback when value changes. */
  onChange: (value: TypeFilterValue) => void;
  /** Unique values available for selection. */
  uniqueValues: (string | number)[];
  /** Whether data is loading. */
  loading: boolean;
  /** Style classes. */
  sxClasses: SxStyles;
}

/**
 * Creates a single-selection dropdown filter control.
 *
 * @param props - Properties defined in SelectFilterProps interface
 * @returns The select filter component
 */
export function SelectFilter(props: SelectFilterProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-filter-panel/components/select-filter');

  const { attribute, value, onChange, uniqueValues, loading, sxClasses } = props;

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box } = ui.elements;

  /**
   * Handles when the select value changes.
   */
  const handleSelectChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      onChange(event.target.value || null);
    },
    [onChange]
  );

  return (
    <Box sx={sxClasses.filterControl}>
      <label style={sxClasses.filterLabel as React.CSSProperties}>{attribute.displayLabel}</label>
      <select
        style={sxClasses.filterSelect as React.CSSProperties}
        value={(value as string | number) || ''}
        onChange={handleSelectChange}
        disabled={loading}
      >
        <option value="">All</option>
        {uniqueValues.map((val) => (
          <option key={String(val)} value={val}>
            {val !== null ? String(val) : '(null)'}
          </option>
        ))}
      </select>
    </Box>
  );
}
