import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useFilterPanelController } from 'geoview-core/core/controllers/use-controllers';

import type { TypeFilterAttribute, TypeFilterValue } from '../../types';
import type { TypeMenuItemProps } from 'geoview-core/ui/select/select';
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
  const memoSxClasses = useMemo((): ReturnType<typeof getSxClasses> => {
    logger.logTraceUseMemo('SELECT-FILTER - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);
  const { t } = useTranslation<string>();
  const controller = useFilterPanelController();
  /**
   * Memoized menu items for the select dropdown.
   */
  const memoMenuItems = useMemo((): TypeMenuItemProps[] => {
    logger.logTraceUseMemo('SELECT-FILTER - memoMenuItems', attribute, controller, t, uniqueValues);
    const items = [
      {
        type: 'item' as const,
        item: {
          value: '',
          children: <em>{t('FilterPanel.all')}</em>,
        },
      },
    ];

    uniqueValues.forEach((val) => {
      items.push({
        type: 'item' as const,
        item: {
          value: val as string,
          children: <span>{val !== null ? controller.getDisplayLabel(attribute, val) : t('FilterPanel.nullValue')}</span>,
        },
      });
    });

    return items;
  }, [attribute, controller, t, uniqueValues]);

  // #region Handlers

  /**
   * Handles when the select value changes.
   */
  const handleSelectChange = useCallback(
    (event: { target: { value: unknown } }): void => {
      const newValue = event.target.value as string | number;
      onChange(newValue);
    },
    [onChange]
  );

  // #endregion Handlers

  if (loading) {
    return (
      <Box sx={memoSxClasses.filterControl}>
        <Typography variant="h4" sx={memoSxClasses.filterLabel}>
          {attribute.displayLabel}
        </Typography>
        <Typography variant="body2" sx={memoSxClasses.filterLoading}>
          {t('FilterPanel.loading')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={memoSxClasses.filterControl}>
      <Typography variant="h4" sx={memoSxClasses.filterLabel}>
        {attribute.displayLabel}
      </Typography>
      <Select
        fullWidth
        value={value || ''}
        onChange={handleSelectChange}
        menuItems={memoMenuItems}
        disabled={loading || uniqueValues.length === 0}
        displayEmpty
        renderValue={(selected: unknown) => {
          if (!selected || selected === '') {
            return (
              <Box component="em" sx={memoSxClasses.selectPlaceholder}>
                {t('FilterPanel.all')}
              </Box>
            );
          }
          return selected as string | number;
        }}
        aria-label={attribute.displayLabel}
      />
    </Box>
  );
}
