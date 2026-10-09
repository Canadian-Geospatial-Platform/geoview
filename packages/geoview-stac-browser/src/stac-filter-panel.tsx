import type { TypeWindow } from 'geoview-core/core/types/global-types';

import { Box, Button, Checkbox, FormControlLabel, TextField, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStacBrowserController } from 'geoview-core/core/controllers/use-controllers';

import type { StacBrowserConfig, StacCollection, StacFilterPanelState, StacFilterValues, StacQueryableField } from './stac-browser-types';
import type { StacApiService } from './stac-api-service';
import { buildStacCql2Filter, getStacPropertyFilterFields } from './stac-config-utils';
import { getSxClasses } from './stac-browser-style';

/** Props for the StacFilterPanel component. */
interface StacFilterPanelProps {
  /** Plugin configuration. */
  config: StacBrowserConfig;
  /** Collections the user is allowed to search. */
  collections: StacCollection[];
  /** STAC service used to load queryables for the active collection selection. */
  apiService: StacApiService;
  /** Whether the server supports free-text search. */
  isFreeTextSupported: boolean;
  /** Whether the server supports CQL2 JSON property filters. */
  isPropertyFilterSupported: boolean;
  /** Whether the server supports search sorting. */
  isSortSupported: boolean;
  /** Current values shown in the filter form. */
  filterState: StacFilterPanelState;
  /** Updates the current filter form values. */
  setFilterState: React.Dispatch<React.SetStateAction<StacFilterPanelState>>;
  /** Callback to reset filters to configured defaults. */
  onClearFilters: () => void;
  /** Callback when search is submitted. */
  onSearch: (params: StacFilterValues) => void;
}

/**
 * Creates the STAC filter panel component.
 *
 * @param props - Properties defined in StacFilterPanelProps interface
 * @returns The filter panel component
 */
export function StacFilterPanel(props: StacFilterPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-stac-browser/stac-filter-panel');

  const {
    config,
    collections,
    apiService,
    isFreeTextSupported,
    isPropertyFilterSupported,
    isSortSupported,
    filterState,
    setFilterState,
    onClearFilters,
    onSearch,
  } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useEffect, useMemo, useState } = cgpv.reactUtilities.react;
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const stacController = useStacBrowserController();

  const [queryables, setQueryables] = useState<Record<string, StacQueryableField>>({});
  const [queryablesLoading, setQueryablesLoading] = useState(false);

  const showKeyword = config.filters?.keyword !== false && isFreeTextSupported;
  const showCollections = config.filters?.collections !== false && collections.length > 1;
  const showPropertyFilters = config.filters?.properties !== undefined && config.filters.properties !== false && isPropertyFilterSupported;
  const showSort = config.filters?.sort !== false && isSortSupported;

  /**
   * Resolves selected collection IDs used to request queryables.
   */
  const memoSelectedQueryableCollections = useMemo((): string[] | undefined => {
    logger.logTraceUseMemo('STAC-FILTER-PANEL - memoSelectedQueryableCollections', filterState.selectedCollections, collections.length);
    if (filterState.selectedCollections.length) return filterState.selectedCollections;
    if (collections.length === 1) return [collections[0].id];
    return undefined;
  }, [filterState.selectedCollections, collections]);
  const selectedQueryableCollectionKey = memoSelectedQueryableCollections?.join(',') ?? '';

  /**
   * Loads queryable fields for the selected collections.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-FILTER-PANEL - Load queryables', selectedQueryableCollectionKey);

    if (!showPropertyFilters && !showSort) {
      setQueryables({});
      return undefined;
    }

    let cancelled = false;
    setQueryablesLoading(true);
    setQueryables({});
    apiService
      .fetchQueryables(memoSelectedQueryableCollections)
      .then((result) => {
        if (!cancelled) setQueryables(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        logger.logWarning('STAC-FILTER-PANEL - Could not load queryable properties', error);
        stacController.showError('stacBrowser.errorQueryables');
        setQueryables({});
      })
      .finally(() => {
        if (!cancelled) setQueryablesLoading(false);
      });

    return (): void => {
      cancelled = true;
    };
  }, [apiService, memoSelectedQueryableCollections, selectedQueryableCollectionKey, showPropertyFilters, showSort, stacController]);

  /**
   * Builds the queryable property fields allowed by the package configuration.
   */
  const memoPropertyFields = useMemo((): [string, StacQueryableField][] => {
    logger.logTraceUseMemo('STAC-FILTER-PANEL - memoPropertyFields', queryables, config.filters?.properties);
    return getStacPropertyFilterFields(queryables, config.filters?.properties);
  }, [queryables, config.filters?.properties]);

  /**
   * Builds sortable fields from the available queryables.
   */
  const memoSortFields = useMemo((): string[] => {
    logger.logTraceUseMemo('STAC-FILTER-PANEL - memoSortFields', queryables);
    const fields = new Set(['datetime', 'id', ...Object.keys(queryables)]);
    return Array.from(fields).filter((field) => {
      const queryable = queryables[field];
      return !queryable || (queryable.type !== 'geometry' && queryable.format !== 'geometry-any');
    });
  }, [queryables]);

  // #region Handlers

  /**
   * Handles the use map extent checkbox change.
   */
  const handleUseMapExtentChange = useCallback((): void => {
    setFilterState((previous) => ({ ...previous, useMapExtent: !previous.useMapExtent }));
  }, [setFilterState]);

  /**
   * Handles the contained in extent checkbox change.
   */
  const handleContainedInExtentChange = useCallback((): void => {
    setFilterState((previous) => ({ ...previous, containedInExtent: !previous.containedInExtent }));
  }, [setFilterState]);

  /**
   * Handles start date input change.
   */
  const handleStartDateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setFilterState((previous) => ({ ...previous, startDate: event.target.value }));
    },
    [setFilterState]
  );

  /**
   * Handles end date input change.
   */
  const handleEndDateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setFilterState((previous) => ({ ...previous, endDate: event.target.value }));
    },
    [setFilterState]
  );

  /**
   * Handles keyword input change.
   */
  const handleKeywordChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setFilterState((previous) => ({ ...previous, keyword: event.target.value }));
    },
    [setFilterState]
  );

  /**
   * Handles toggling a collection in the collection filter.
   */
  const handleCollectionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const { name, checked } = event.target;
      setFilterState((previous) => ({
        ...previous,
        selectedCollections: checked ? [...previous.selectedCollections, name] : previous.selectedCollections.filter((id) => id !== name),
      }));
    },
    [setFilterState]
  );

  /**
   * Handles changes to a queryable property value.
   */
  const handlePropertyFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      const field = event.currentTarget.dataset.propertyField;
      if (!field) return;
      const { value } = event.currentTarget;
      setFilterState((previous) => ({
        ...previous,
        propertyFilters: {
          ...previous.propertyFilters,
          [field]: { operator: previous.propertyFilters[field]?.operator ?? '=', value },
        },
      }));
    },
    [setFilterState]
  );

  /**
   * Handles changes to a queryable property operator.
   */
  const handlePropertyOperatorChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      const field = event.currentTarget.dataset.propertyField;
      if (!field) return;
      const { value } = event.currentTarget;
      setFilterState((previous) => ({
        ...previous,
        propertyFilters: {
          ...previous.propertyFilters,
          [field]: { operator: value, value: previous.propertyFilters[field]?.value ?? '' },
        },
      }));
    },
    [setFilterState]
  );

  /**
   * Handles changes to the sort field or direction.
   */
  const handleSortChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      const { name, value } = event.currentTarget;
      if (name === 'stac-sort-field') setFilterState((previous) => ({ ...previous, sortField: value }));
      else setFilterState((previous) => ({ ...previous, sortDirection: value === 'asc' ? 'asc' : 'desc' }));
    },
    [setFilterState]
  );

  /**
   * Handles search button click.
   */
  const handleSearchClick = useCallback((): void => {
    const params: StacFilterValues = {};

    if (showCollections && filterState.selectedCollections.length) {
      params.collections = filterState.selectedCollections;
    }

    if (filterState.useMapExtent) {
      params.bbox = stacController.getMapExtentAsLonLatBbox();
      if (filterState.containedInExtent) {
        params.containedInExtent = true;
      }
    } else if (config.defaults?.bbox) {
      params.bbox = config.defaults.bbox;
    }

    if (filterState.startDate || filterState.endDate) {
      const start = filterState.startDate ? `${filterState.startDate}T00:00:00Z` : '..';
      const end = filterState.endDate ? `${filterState.endDate}T23:59:59Z` : '..';
      params.datetime = `${start}/${end}`;
    }

    if (showKeyword && filterState.keyword.trim()) {
      params.q = filterState.keyword.trim();
    }

    const filter = buildStacCql2Filter(filterState.propertyFilters, queryables);
    if (filter) params.filter = filter;
    if (showSort && filterState.sortField) {
      params.sortBy = [{ field: filterState.sortField, direction: filterState.sortDirection }];
    }

    onSearch(params);
  }, [showCollections, filterState, queryables, config.defaults?.bbox, showKeyword, showSort, onSearch, stacController]);

  // #endregion

  return (
    <Box sx={memoSxClasses.filterPanel}>
      {/* Text search */}
      {showKeyword && (
        <Box sx={memoSxClasses.filterRow}>
          <Typography sx={memoSxClasses.filterLabel}>{t('stacBrowser.textSearch')}</Typography>
          <TextField
            size="small"
            placeholder={t('stacBrowser.keywords')}
            value={filterState.keyword}
            onChange={handleKeywordChange}
            fullWidth
          />
        </Box>
      )}

      {/* Collection filter */}
      {showCollections && (
        <Box sx={memoSxClasses.filterRow}>
          <Typography sx={memoSxClasses.filterLabel}>{t('stacBrowser.collections')}</Typography>
          <Box sx={memoSxClasses.collectionsListBox}>
            {collections.map((collection) => (
              <FormControlLabel
                key={collection.id}
                control={
                  <Checkbox
                    name={collection.id}
                    checked={filterState.selectedCollections.includes(collection.id)}
                    onChange={handleCollectionChange}
                    size="small"
                  />
                }
                label={collection.title ?? collection.id}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Temporal filter */}
      {config.filters?.temporal !== false && (
        <Box sx={memoSxClasses.filterRow}>
          <Typography sx={memoSxClasses.filterLabel}>{t('stacBrowser.temporal')}</Typography>
          <Box sx={memoSxClasses.dateInputRow}>
            <input type="date" aria-label={t('stacBrowser.startDate')} value={filterState.startDate} onChange={handleStartDateChange} />
            <Typography>—</Typography>
            <input type="date" aria-label={t('stacBrowser.endDate')} value={filterState.endDate} onChange={handleEndDateChange} />
          </Box>
        </Box>
      )}

      {showPropertyFilters && (
        <Box sx={memoSxClasses.filterRow}>
          <Typography sx={memoSxClasses.filterLabel}>{t('stacBrowser.propertyFilters')}</Typography>
          {queryablesLoading && <Typography sx={memoSxClasses.resultMeta}>{t('stacBrowser.loading')}</Typography>}
          {!queryablesLoading &&
            memoPropertyFields.map(([field, queryable]) => {
              const isNumeric = queryable.type === 'integer' || queryable.type === 'number';
              const isBoolean = queryable.type === 'boolean';
              const isDate = queryable.format === 'date' || queryable.format === 'date-time';
              const operators = isNumeric || isDate ? ['=', '<>', '<', '<=', '>', '>='] : ['=', '<>', 'like'];
              const currentFilter = {
                operator: filterState.propertyFilters[field]?.operator ?? '=',
                value: filterState.propertyFilters[field]?.value ?? '',
              };
              let valueInputType: 'text' | 'number' | 'date' = 'text';
              if (isNumeric) valueInputType = 'number';
              else if (isDate) valueInputType = 'date';
              const label = queryable.title ?? field;

              return (
                <Box key={field} sx={memoSxClasses.propertyFilterRow}>
                  <Typography sx={memoSxClasses.resultMeta}>{label}</Typography>
                  <select
                    aria-label={t('stacBrowser.propertyOperator', { field: label })}
                    data-property-field={field}
                    value={currentFilter.operator}
                    onChange={handlePropertyOperatorChange}
                  >
                    {operators.map((operator) => (
                      <option key={operator} value={operator}>
                        {operator}
                      </option>
                    ))}
                  </select>
                  {isBoolean || queryable.enum ? (
                    <select
                      aria-label={t('stacBrowser.propertyValue', { field: label })}
                      data-property-field={field}
                      value={currentFilter.value}
                      onChange={handlePropertyFilterChange}
                    >
                      <option value="">{t('stacBrowser.anyValue')}</option>
                      {(queryable.enum ?? ['true', 'false']).map((value) => (
                        <option key={String(value)} value={String(value)}>
                          {String(value)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      aria-label={t('stacBrowser.propertyValue', { field: label })}
                      data-property-field={field}
                      type={valueInputType}
                      value={currentFilter.value}
                      onChange={handlePropertyFilterChange}
                    />
                  )}
                </Box>
              );
            })}
          {!queryablesLoading && memoPropertyFields.length === 0 && (
            <Typography sx={memoSxClasses.resultMeta}>{t('stacBrowser.noQueryableProperties')}</Typography>
          )}
        </Box>
      )}

      {showSort && (
        <Box sx={memoSxClasses.filterRow}>
          <Typography sx={memoSxClasses.filterLabel}>{t('stacBrowser.sort')}</Typography>
          <Box sx={memoSxClasses.dateInputRow}>
            <select
              aria-label={t('stacBrowser.sortField')}
              name="stac-sort-field"
              value={filterState.sortField}
              onChange={handleSortChange}
            >
              {memoSortFields.map((field) => (
                <option key={field} value={field}>
                  {queryables[field]?.title ?? field}
                </option>
              ))}
            </select>
            <select
              aria-label={t('stacBrowser.sortDirection')}
              name="stac-sort-direction"
              value={filterState.sortDirection}
              onChange={handleSortChange}
            >
              <option value="asc">{t('stacBrowser.ascending')}</option>
              <option value="desc">{t('stacBrowser.descending')}</option>
            </select>
          </Box>
        </Box>
      )}

      {/* Spatial filter */}
      {config.filters?.spatial !== false && (
        <Box sx={memoSxClasses.filterRow}>
          <FormControlLabel
            control={<Checkbox checked={filterState.useMapExtent} onChange={handleUseMapExtentChange} size="small" />}
            label={t('stacBrowser.useMapExtent')}
          />
          {filterState.useMapExtent && (
            <FormControlLabel
              control={<Checkbox checked={filterState.containedInExtent} onChange={handleContainedInExtentChange} size="small" />}
              label={t('stacBrowser.containedInExtent')}
              sx={memoSxClasses.containedInExtentCheckbox}
            />
          )}
        </Box>
      )}

      {/* Search button */}
      <Box sx={memoSxClasses.filterActions}>
        <Button type="text" variant="outlined" onClick={onClearFilters}>
          {t('stacBrowser.clearFilters')}
        </Button>
        <Button type="text" variant="contained" onClick={handleSearchClick}>
          {t('stacBrowser.search')}
        </Button>
      </Box>
    </Box>
  );
}
