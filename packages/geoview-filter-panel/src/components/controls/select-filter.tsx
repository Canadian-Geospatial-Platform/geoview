import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import type { TypeFilterAttribute, TypeFilterValue } from '../../types';
import { getSxClasses } from './control-styles';

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

  const { attribute, value, onChange, uniqueValues, loading } = props;

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { useCallback, useMemo } = cgpv.reactUtilities.react;
  const { ui } = cgpv;
  const { Box, Select, Typography } = ui.elements;

  const theme = ui.useTheme();
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);

  /**
   * Memoized menu items for the select dropdown.
   */
  const memoMenuItems = useMemo(() => {
    const items = [
      {
        type: 'item' as const,
        item: {
          value: '',
          children: <em>All</em>,
        },
      },
    ];

    uniqueValues.forEach((val) => {
      items.push({
        type: 'item' as const,
        item: {
          value: val as string,
          children: <span>{val !== null ? String(val) : '(null)'}</span>,
        },
      });
    });

    return items;
  }, [uniqueValues]);

  /**
   * Handles when the select value changes.
   */
  const handleSelectChange = useCallback(
    (event: { target: { value: unknown } }): void => {
      const newValue = event.target.value as string | number;
      onChange(newValue !== '' ? newValue : null);
    },
    [onChange]
  );

  if (loading) {
    return (
      <Box sx={memoSxClasses.filterControl}>
        <Typography variant="body2" sx={memoSxClasses.filterLabel}>
          {attribute.displayLabel}
        </Typography>
        <Typography variant="body2" sx={memoSxClasses.filterLoading}>
          Loading options...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={memoSxClasses.filterControl}>
      <Typography variant="body2" sx={memoSxClasses.filterLabel}>
        {attribute.displayLabel}
      </Typography>
      <Select
        fullWidth
        value={value || ''}
        onChange={handleSelectChange}
        label=""
        inputLabel={{ shrink: true }}
        menuItems={memoMenuItems}
        disabled={loading || uniqueValues.length === 0}
      />
    </Box>
  );
}
