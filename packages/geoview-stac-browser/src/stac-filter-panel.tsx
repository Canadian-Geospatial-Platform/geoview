import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { SxStyles } from 'geoview-core/ui/style/types';

import { Box, Button, Checkbox, CircularProgressBase, FormControlLabel, Select, TextField, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStacBrowserController } from 'geoview-core/core/controllers/use-controllers';

import type { StacBrowserConfig, StacCollection, StacFilterPanelState, StacFilterValues, StacQueryableField } from './stac-browser-types';
import type { StacApiService } from './stac-api-service';
import { StacConfigUtils } from './stac-config-utils';
import { StacFieldUtils } from './stac-field-utils';
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
  /** Whether a search request is pending. */
  isSearching: boolean;
  /** Whether the last completed search returned no items. */
  hasNoResults: boolean;
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
    isSearching,
    hasNoResults,
    filterState,
    setFilterState,
    onClearFilters,
    onSearch,
  } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useEffect, useId, useMemo, useState } = cgpv.reactUtilities.react;
  const memoSxClasses = useMemo((): SxStyles => getSxClasses(theme), [theme]);
  const baseId = useId();

  const stacController = useStacBrowserController();

  const [queryables, setQueryables] = useState<Record<string, StacQueryableField>>({});
  const [queryablesLoading, setQueryablesLoading] = useState(false);
  /** Server sortables of the selected collections, undefined when the server does not publish them. */
  const [sortables, setSortables] = useState<Record<string, StacQueryableField> | undefined>(undefined);

  const showKeyword = config.filters?.keyword !== false && isFreeTextSupported;
  const showCollections = config.filters?.collections !== false && collections.length > 1;
  const showPropertyFilters = config.filters?.properties !== undefined && config.filters.properties !== false && isPropertyFilterSupported;
  const showSort = config.filters?.sort !== false && isSortSupported;

  /**
   * Resolves the collection IDs used to request queryables. An empty selection means all available collections.
   */
  const memoSelectedQueryableCollections = useMemo((): string[] => {
    logger.logTraceUseMemo('STAC-FILTER-PANEL - memoSelectedQueryableCollections', filterState.selectedCollections, collections.length);
    if (filterState.selectedCollections.length) return filterState.selectedCollections;
    return collections.map((collection) => collection.id);
  }, [filterState.selectedCollections, collections]);
  const selectedQueryableCollectionKey = memoSelectedQueryableCollections.join(',');

  /**
   * Builds the collection checkbox labels, adding the collection id when titles are duplicated.
   */
  const memoCollectionLabels = useMemo((): Record<string, string> => {
    logger.logTraceUseMemo('STAC-FILTER-PANEL - memoCollectionLabels', collections.length);
    const titles = collections.map((collection) => StacFieldUtils.getCollectionTitle(collection));
    return Object.fromEntries(
      collections.map((collection, index) => {
        const title = titles[index];
        const isDuplicate = titles.indexOf(title) !== titles.lastIndexOf(title);
        return [collection.id, isDuplicate ? `${title} (${collection.id})` : title];
      })
    );
  }, [collections]);

  /**
   * Loads queryable fields for the selected collections.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-FILTER-PANEL - Load queryables', selectedQueryableCollectionKey);

    if ((!showPropertyFilters && !showSort) || memoSelectedQueryableCollections.length === 0) {
      setQueryables({});
      setQueryablesLoading(false);
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
   * Loads the sortable fields of the selected collections.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-FILTER-PANEL - Load sortables', selectedQueryableCollectionKey);

    if (!showSort || memoSelectedQueryableCollections.length === 0) {
      setSortables(undefined);
      return undefined;
    }

    let cancelled = false;
    apiService
      .fetchSortables(memoSelectedQueryableCollections)
      .then((result) => {
        if (!cancelled) setSortables(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Best effort: without sortables the sort list falls back to the queryables
        logger.logWarning('STAC-FILTER-PANEL - Could not load sortable properties', error);
        setSortables(undefined);
      });

    return (): void => {
      cancelled = true;
    };
  }, [apiService, memoSelectedQueryableCollections, selectedQueryableCollectionKey, showSort]);

  /**
   * Builds the queryable property fields allowed by the package configuration.
   */
  const memoPropertyFields = useMemo((): [string, StacQueryableField][] => {
    logger.logTraceUseMemo('STAC-FILTER-PANEL - memoPropertyFields', queryables, config.filters?.properties);
    return StacConfigUtils.getPropertyFilterFields(queryables, config.filters?.properties);
  }, [queryables, config.filters?.properties]);

  /**
   * Builds the sort fields from the server sortables, or from the queryables when the server does not publish sortables.
   */
  const memoSortFields = useMemo((): string[] => {
    logger.logTraceUseMemo('STAC-FILTER-PANEL - memoSortFields', sortables, queryables);
    const definitions = sortables ?? queryables;
    const fields = sortables ? Object.keys(sortables) : Array.from(new Set(['datetime', 'id', ...Object.keys(queryables)]));
    return fields.filter((field) => {
      const definition = definitions[field];
      return !definition || (definition.type !== 'geometry' && definition.format !== 'geometry-any');
    });
  }, [sortables, queryables]);

  const showSortControls = showSort && memoSortFields.length > 0;

  /**
   * Moves the selected sort field to an available one when the selection no longer allows it.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-FILTER-PANEL - Keep the sort field valid', memoSortFields, filterState.sortField);

    if (!showSortControls || memoSortFields.includes(filterState.sortField)) return;
    setFilterState((previous) => ({ ...previous, sortField: memoSortFields[0] }));
  }, [showSortControls, memoSortFields, filterState.sortField, setFilterState]);

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
   * Handles changes to a queryable property value; the field is the input name.
   */
  const handlePropertyFilterChange = useCallback(
    (event: { target: { name?: string; value: unknown } }): void => {
      const field = event.target.name;
      if (!field) return;
      const value = String(event.target.value);
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
   * Handles changes to a queryable property operator; the field is the input name.
   */
  const handlePropertyOperatorChange = useCallback(
    (event: { target: { name?: string; value: unknown } }): void => {
      const field = event.target.name;
      if (!field) return;
      const value = String(event.target.value);
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
    (event: { target: { name?: string; value: unknown } }): void => {
      const value = String(event.target.value);
      if (event.target.name === 'stac-sort-field') setFilterState((previous) => ({ ...previous, sortField: value }));
      else setFilterState((previous) => ({ ...previous, sortDirection: value === 'asc' ? 'asc' : 'desc' }));
    },
    [setFilterState]
  );

  /**
   * Handles the clear filters button, ignored while a search is pending.
   */
  const handleClearClick = useCallback((): void => {
    if (isSearching) return;
    onClearFilters();
  }, [isSearching, onClearFilters]);

  /**
   * Handles search button click, ignored while a search is pending.
   */
  const handleSearchClick = useCallback((): void => {
    if (isSearching) return;
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

    const filter = StacConfigUtils.buildCql2Filter(filterState.propertyFilters, queryables);
    if (filter) params.filter = filter;
    if (showSortControls && memoSortFields.includes(filterState.sortField)) {
      params.sortBy = [{ field: filterState.sortField, direction: filterState.sortDirection }];
    }

    onSearch(params);
  }, [
    isSearching,
    showCollections,
    filterState,
    queryables,
    config.defaults?.bbox,
    showKeyword,
    showSortControls,
    memoSortFields,
    onSearch,
    stacController,
  ]);

  // #endregion

  return (
    <Box sx={memoSxClasses.filterPanel}>
      <Typography component="h3" tabIndex={-1} data-stac-view-focus sx={memoSxClasses.visuallyHidden}>
        {t('stacBrowser.search')}
      </Typography>
      {config.searchDescription && (
        <Typography component="p" sx={memoSxClasses.detailDescription}>
          {config.searchDescription}
        </Typography>
      )}

      {/* Text search */}
      {showKeyword && (
        <Box sx={memoSxClasses.filterRow}>
          <Typography sx={memoSxClasses.filterLabel}>{t('stacBrowser.textSearch')}</Typography>
          <TextField
            size="small"
            aria-label={t('stacBrowser.textSearch')}
            placeholder={t('stacBrowser.keywords')}
            value={filterState.keyword}
            onChange={handleKeywordChange}
            fullWidth
          />
        </Box>
      )}

      {/* Collection filter */}
      {showCollections && (
        <Box sx={memoSxClasses.filterRow} role="group" aria-labelledby={`${baseId}-collections`}>
          <Typography id={`${baseId}-collections`} sx={memoSxClasses.filterLabel}>
            {t('stacBrowser.collections')}
          </Typography>
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
                label={memoCollectionLabels[collection.id]}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Temporal filter */}
      {config.filters?.temporal !== false && (
        <Box sx={memoSxClasses.filterRow} role="group" aria-labelledby={`${baseId}-temporal`}>
          <Typography id={`${baseId}-temporal`} sx={memoSxClasses.filterLabel}>
            {t('stacBrowser.temporal')}
          </Typography>
          <Box sx={memoSxClasses.dateInputRow}>
            <input type="date" aria-label={t('stacBrowser.startDate')} value={filterState.startDate} onChange={handleStartDateChange} />
            <Typography aria-hidden="true">—</Typography>
            <input type="date" aria-label={t('stacBrowser.endDate')} value={filterState.endDate} onChange={handleEndDateChange} />
          </Box>
        </Box>
      )}

      {showPropertyFilters && (
        <Box sx={memoSxClasses.filterRow} role="group" aria-labelledby={`${baseId}-properties`}>
          <Typography id={`${baseId}-properties`} sx={memoSxClasses.filterLabel}>
            {t('stacBrowser.propertyFilters')}
          </Typography>
          <Box role="status">{queryablesLoading && <Typography sx={memoSxClasses.resultMeta}>{t('stacBrowser.loading')}</Typography>}</Box>
          {!queryablesLoading &&
            memoPropertyFields.map(([field, queryable]) => {
              const isNumeric = queryable.type === 'integer' || queryable.type === 'number';
              const isBoolean = queryable.type === 'boolean';
              const isDate = queryable.format === 'date' || queryable.format === 'date-time';
              let operators: string[];
              if (isNumeric || isDate) operators = ['=', '<>', '<', '<=', '>', '>='];
              else if (isBoolean || queryable.enum) operators = ['=', '<>'];
              else operators = ['=', '<>', 'like'];
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
                  <Select
                    aria-label={t('stacBrowser.propertyOperator', { field: label })}
                    inputProps={{ name: field }}
                    value={currentFilter.operator}
                    onChange={handlePropertyOperatorChange}
                    menuItems={operators.map((operator) => ({ item: { value: operator, children: operator } }))}
                  />
                  {isBoolean || queryable.enum ? (
                    <Select
                      aria-label={t('stacBrowser.propertyValue', { field: label })}
                      inputProps={{ name: field }}
                      value={currentFilter.value}
                      onChange={handlePropertyFilterChange}
                      displayEmpty
                      menuItems={[
                        { item: { value: '', children: t('stacBrowser.anyValue') } },
                        ...(queryable.enum ?? ['true', 'false']).map((value) => ({
                          item: { value: String(value), children: String(value) },
                        })),
                      ]}
                    />
                  ) : (
                    <input
                      aria-label={t('stacBrowser.propertyValue', { field: label })}
                      name={field}
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

      {showSortControls && (
        <Box sx={memoSxClasses.filterRow} role="group" aria-labelledby={`${baseId}-sort`}>
          <Typography id={`${baseId}-sort`} sx={memoSxClasses.filterLabel}>
            {t('stacBrowser.sort')}
          </Typography>
          <Box sx={memoSxClasses.dateInputRow}>
            <Select
              aria-label={t('stacBrowser.sortField')}
              inputProps={{ name: 'stac-sort-field' }}
              value={filterState.sortField}
              onChange={handleSortChange}
              fullWidth
              menuItems={memoSortFields.map((field) => ({
                item: { value: field, children: (sortables ?? queryables)[field]?.title ?? field },
              }))}
            />
            <Select
              aria-label={t('stacBrowser.sortDirection')}
              inputProps={{ name: 'stac-sort-direction' }}
              value={filterState.sortDirection}
              onChange={handleSortChange}
              fullWidth
              menuItems={[
                { item: { value: 'asc', children: t('stacBrowser.ascending') } },
                { item: { value: 'desc', children: t('stacBrowser.descending') } },
              ]}
            />
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
      <Box role="status" aria-live="polite">
        {isSearching && (
          <Box sx={memoSxClasses.loading}>
            <CircularProgressBase aria-label={t('stacBrowser.loading')} />
          </Box>
        )}
        {!isSearching && hasNoResults && (
          <Box sx={memoSxClasses.noResults}>
            <Typography>{t('stacBrowser.noResults')}</Typography>
          </Box>
        )}
      </Box>
      <Box sx={memoSxClasses.filterActions}>
        <Button type="text" variant="outlined" onClick={handleClearClick} aria-disabled={isSearching}>
          {t('stacBrowser.clearFilters')}
        </Button>
        <Button type="text" variant="contained" onClick={handleSearchClick} aria-disabled={isSearching}>
          {t('stacBrowser.search')}
        </Button>
      </Box>
    </Box>
  );
}
