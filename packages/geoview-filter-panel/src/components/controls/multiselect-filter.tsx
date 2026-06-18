import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useFilterPanelController } from 'geoview-core/core/controllers/use-controllers';

import type { TypeFilterAttribute, TypeFilterValue } from '../../types';
import { getSxClasses } from './control-styles';

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

  const { attribute, value, onChange, uniqueValues, loading } = props;

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { useCallback, useMemo } = cgpv.reactUtilities.react;
  const { ui } = cgpv;
  const { Box, Checkbox, FormControlLabel, Typography } = ui.elements;

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
      if (checked) {
        onChange([...currentValues, val]);
      } else {
        onChange(currentValues.filter((v) => v !== val));
      }
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
          return (
            <FormControlLabel
              key={String(val)}
              control={<Checkbox checked={isSelected} onChange={(e) => handleCheckboxChange(val, e.target.checked)} size="small" />}
              label={val !== null ? controller.getDisplayLabel(attribute, val) : t('FilterPanel.nullValue')}
              sx={memoSxClasses.filterCheckboxItem}
            />
          );
        })}
      </Box>
    </Box>
  );
}
