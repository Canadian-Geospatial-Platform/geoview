import { memo } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useFilterPanelController } from 'geoview-core/core/controllers/use-controllers';

import type { SxStyles } from 'geoview-core/ui/style/types';

import type { TypeFilterAttribute, TypeFilterValue } from '../../types';
import { getSxClasses } from './control-styles';

/**
 * Props for FilterCheckboxItem component.
 */
interface FilterCheckboxItemProps {
  /** The value for this checkbox item. */
  value: string | number;
  /** Whether this item is currently selected. */
  isSelected: boolean;
  /** The display label for this item. */
  displayLabel: string;
  /** Callback when the checkbox state changes. */
  onCheckboxChange: (val: string | number, checked: boolean) => void;
  /** The sx classes object. */
  sxClasses: SxStyles;
}

/**
 * Event details for multiselect filter changes.
 */
interface MultiselectFilterChangeEvent {
  /** The value that was toggled. */
  value: string | number;
  /** Whether the value was checked (true) or unchecked (false). */
  checked: boolean;
  /** The complete array of currently selected values after the change. */
  currentValues: TypeFilterValue;
}

/**
 * Props for MultiselectFilter component.
 */
interface MultiselectFilterProps {
  /** Attribute configuration. */
  attribute: TypeFilterAttribute;
  /** Current filter value. */
  value: TypeFilterValue;
  /** Callback when value changes. */
  onChange: (event: MultiselectFilterChangeEvent) => void;
  /** Unique values available for selection. */
  uniqueValues: (string | number)[];
  /** Whether data is loading. */
  loading: boolean;
}

/**
 * Renders a single filter checkbox item with label.
 *
 * Memoized to avoid re-rendering all items when only one checkbox changes.
 *
 * @param props - Properties defined in FilterCheckboxItemProps interface
 * @returns The filter checkbox item element
 */
const FilterCheckboxItem = memo(
  ({ value, isSelected, displayLabel, onCheckboxChange, sxClasses }: FilterCheckboxItemProps): JSX.Element => {
    const { cgpv } = window as TypeWindow;
    const { useCallback } = cgpv.reactUtilities.react;
    const { ui } = cgpv;
    const { Checkbox, FormControlLabel } = ui.elements;

    /**
     * Handles when this checkbox's state changes.
     */
    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>): void => {
        onCheckboxChange(value, event.target.checked);
      },
      [value, onCheckboxChange]
    );

    return (
      <FormControlLabel
        control={<Checkbox checked={isSelected} onChange={handleChange} size="small" />}
        label={displayLabel}
        sx={sxClasses.filterCheckboxItem}
      />
    );
  }
);

/**
 * Creates a multi-selection checkbox filter control.
 *
 * @param props - Properties defined in MultiselectFilterProps interface
 * @returns The multiselect filter component
 */
export function MultiselectFilter(props: MultiselectFilterProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-filter-panel/components/multiselect-filter');

  const { attribute, value, onChange, uniqueValues, loading } = props;

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { useCallback, useMemo } = cgpv.reactUtilities.react;
  const { ui } = cgpv;
  const { Box, Typography } = ui.elements;

  const theme = ui.useTheme();
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();
  const controller = useFilterPanelController();

  /**
   * Handles when a checkbox value changes.
   */
  const handleCheckboxChange = useCallback(
    (val: string | number, checked: boolean): void => {
      const currentValues = Array.isArray(value) ? [...value] : [];
      let newValues: TypeFilterValue;

      if (checked) {
        newValues = [...currentValues, val];
      } else {
        newValues = currentValues.filter((v) => v !== val);
      }

      onChange({
        value: val,
        checked,
        currentValues: newValues,
      });
    },
    [value, onChange]
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

  if (uniqueValues.length === 0) {
    return (
      <Box sx={memoSxClasses.filterControl}>
        <Typography variant="body2" sx={memoSxClasses.filterLabel}>
          {attribute.displayLabel}
        </Typography>
        <Typography variant="body2" sx={memoSxClasses.filterLoading}>
          {t('FilterPanel.noValues')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={memoSxClasses.filterControl}>
      <Typography variant="body2" sx={memoSxClasses.filterLabel}>
        {attribute.displayLabel}
      </Typography>
      <Box sx={memoSxClasses.filterMultiselectContainer}>
        {uniqueValues.map((val) => {
          const isSelected = Array.isArray(value) && value.includes(val);
          const displayLabel = val !== null ? controller.getDisplayLabel(attribute, val) : t('FilterPanel.nullValue');

          return (
            <FilterCheckboxItem
              key={String(val)}
              value={val}
              isSelected={isSelected}
              displayLabel={displayLabel}
              onCheckboxChange={handleCheckboxChange}
              sxClasses={memoSxClasses}
            />
          );
        })}
      </Box>
    </Box>
  );
}
