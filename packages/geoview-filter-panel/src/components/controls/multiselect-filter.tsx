import { useCallback } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import type { SxStyles } from 'geoview-core/ui/style/types';
import type { TypeFilterAttribute, TypeFilterValue } from '../../types';

/**
 * Props for MultiselectFilter component.
 */
interface MultiselectFilterProps {
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
 * Creates a multi-selection checkbox filter control.
 *
 * @param props - Properties defined in MultiselectFilterProps interface
 * @returns The multiselect filter component
 */
export function MultiselectFilter(props: MultiselectFilterProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-filter-panel/components/multiselect-filter');

  const { attribute, value, onChange, uniqueValues, loading, sxClasses } = props;

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box } = ui.elements;

  /**
   * Handles when a checkbox value changes.
   */
  const handleCheckboxChange = useCallback(
    (val: string | number, checked: boolean): void => {
      const currentValues = Array.isArray(value) ? [...value] : [];
      if (checked) {
        onChange([...currentValues, val]);
      } else {
        onChange(currentValues.filter((v) => v !== val));
      }
    },
    [value, onChange]
  );

  return (
    <Box sx={sxClasses.filterControl}>
      <label style={sxClasses.filterLabel as React.CSSProperties}>{attribute.displayLabel}</label>
      <Box sx={sxClasses.filterMultiselect}>
        {loading ? (
          <Box sx={sxClasses.filterLoading}>Loading options...</Box>
        ) : (
          <Box sx={sxClasses.filterCheckboxList}>
            {uniqueValues.length === 0 ? (
              <Box sx={sxClasses.filterEmpty}>No values available</Box>
            ) : (
              uniqueValues.map((val) => {
                const isSelected = Array.isArray(value) && value.includes(val);
                return (
                  <label key={String(val)} style={sxClasses.filterCheckboxItem as React.CSSProperties}>
                    <input
                      type="checkbox"
                      style={sxClasses.filterCheckboxInput as React.CSSProperties}
                      checked={isSelected}
                      onChange={(e) => handleCheckboxChange(val, e.target.checked)}
                    />
                    <span style={sxClasses.filterCheckboxLabel as React.CSSProperties}>{val !== null ? String(val) : '(null)'}</span>
                  </label>
                );
              })
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
