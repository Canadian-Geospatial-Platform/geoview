import { useCallback, useMemo, useState } from 'react';
import type { SelectChangeEvent, SxProps } from '@mui/material';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { TypeMenuItemProps } from '@/ui';
import { Box, ClearFiltersIcon, IconButton, List, ListItem, ListItemText, Paper, Select, Typography } from '@/ui';
import type { GeoListItem } from '@/core/components/geolocator/geolocator';
import { GeoList } from '@/core/components/geolocator/geo-list';
import { createMenuItems } from '@/core/components/geolocator/utilities';
import { getSxClasses } from '@/core/components/geolocator/geolocator-style';
import { useStoreMapSize } from '@/core/stores/states/map-state';
import { logger } from '@/core/utils/logger';
import { useStoreAppShellContainer } from '@/core/stores/states/app-state';

/** Props for the GeolocatorResult component. */
interface GeolocatorFiltersType {
  /** The geolocation data to display. */
  geoLocationData: GeoListItem[];
  /** The search value entered by the user. */
  searchValue: string;
  /** Whether an error occurred during the API call. */
  error: boolean;
}

/**
 * Creates the component to display filters and geolocation results.
 *
 * @param props - Properties defined in GeolocatorFiltersType interface
 * @returns The geolocation result component
 */
export function GeolocatorResult({ geoLocationData, searchValue, error }: GeolocatorFiltersType): JSX.Element {
  // Log
  logger.logTraceRender('components/geolocator/geolocator-result');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const memoSxClasses = useMemo((): ReturnType<typeof getSxClasses> => {
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // Store
  const shellContainer = useStoreAppShellContainer();

  // State
  const [province, setProvince] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  /**
   * Checks whether any filter is active.
   */
  const memoHasActiveFilters = useMemo((): boolean => {
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - memoHasActiveFilters', province, category);
    return !!(province.length || category.length);
  }, [province, category]);

  // Store
  // TODO: style - we should not base length on map size value, parent should adjust
  const mapSize = useStoreMapSize();

  // #region Handlers

  /**
   * Handles when the user clicks the clear filters button.
   */
  const handleClearFilters = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    // Prevent action when button is disabled
    if (!memoHasActiveFilters) {
      return;
    }
    setProvince('');
    setCategory('');
  };

  /**
   * Handles province filter changes.
   */
  const handleProvinceChange = useCallback((event: SelectChangeEvent<unknown>): void => {
    setProvince(event.target.value as string);
  }, []);

  /**
   * Handles category filter changes.
   */
  const handleCategoryChange = useCallback((event: SelectChangeEvent<unknown>): void => {
    setCategory(event.target.value as string);
  }, []);

  // #endregion

  /**
   * Reduces provinces from the API response data.
   */
  const memoProvinces = useMemo((): TypeMenuItemProps[] => {
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - provinces', geoLocationData, t);
    return createMenuItems(geoLocationData, 'province', t('geolocator.noFilter'));
  }, [geoLocationData, t]);

  /**
   * Reduces categories from the API response data.
   */
  const memoCategories = useMemo((): TypeMenuItemProps[] => {
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - categories', geoLocationData, t);
    return createMenuItems(geoLocationData, 'category', t('geolocator.noFilter'));
  }, [geoLocationData, t]);

  /**
   * Filters geolocation data by selected province and category.
   */
  // Filter data with memo
  const memoFilteredData = useMemo((): GeoListItem[] => {
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - filtering data', geoLocationData, province, category);

    return geoLocationData.filter((item) => {
      const matchProvince = !province || item.province === province;
      const matchCategory = !category || item.category === category;
      return matchProvince && matchCategory;
    });
  }, [geoLocationData, province, category]);

  /**
   * Builds the active filters display for screen readers.
   */
  const memoActiveFiltersDisplay = useMemo((): JSX.Element | null => {
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - memoActiveFiltersDisplay', province, category, t, memoSxClasses.filterListError);
    if (!(province.length || category.length)) return null;

    return (
      <List sx={memoSxClasses.filterListError}>
        {!!province.length && (
          <ListItem>
            <ListItemText primary={`${t('geolocator.province')}: ${province}`} />
          </ListItem>
        )}
        {!!category.length && (
          <ListItem>
            <ListItemText primary={`${t('geolocator.category')}: ${category}`} />
          </ListItem>
        )}
      </List>
    );
  }, [province, category, t, memoSxClasses.filterListError]);

  return (
    <Paper component="div" elevation={4} square>
      {!error && (
        <Box sx={memoSxClasses.filter} className="geolocator-filters" role="group" aria-label={t('geolocator.filtersGroupTitle')}>
          <Box sx={memoSxClasses.filterBox}>
            <Select
              formControlProps={{ variant: 'standard', size: 'small' }}
              fullWidth
              value={province ?? ''}
              onChange={handleProvinceChange}
              menuItems={memoProvinces}
              disabled={!geoLocationData.length}
              variant="standard"
              MenuProps={{ container: shellContainer }}
              label={t('geolocator.province')}
            />
          </Box>
          <Box sx={memoSxClasses.filterBox}>
            <Select
              formControlProps={{ variant: 'standard', size: 'small' }}
              value={category ?? ''}
              fullWidth
              onChange={handleCategoryChange}
              menuItems={memoCategories}
              disabled={!geoLocationData.length}
              variant="standard"
              MenuProps={{ container: shellContainer }}
              label={t('geolocator.category')}
            />
          </Box>
          <Box>
            <IconButton
              size="small"
              edge="end"
              color="inherit"
              className="buttonOutline"
              aria-label={t('geolocator.clearFilters')}
              onClick={handleClearFilters}
              aria-disabled={!memoHasActiveFilters}
            >
              <ClearFiltersIcon sx={memoSxClasses.clearFiltersIcon} />
            </IconButton>
          </Box>
        </Box>
      )}
      <Box
        sx={[memoSxClasses.resultsRegion, { maxHeight: mapSize[1] - 240 }] as SxProps}
        className="geolocator-results-region"
        role="region"
        aria-label={t('geolocator.searchResults')}
      >
        {error && (
          <Typography role="status" aria-live="polite" aria-atomic="true" component="p" sx={memoSxClasses.resultMessage}>
            {t('error.geolocator.noService')}
          </Typography>
        )}
        {!!memoFilteredData.length && (
          <>
            {/* An announcement for screen readers about the number of results found */}
            <Box className="geolocatorResultsStatus" sx={memoSxClasses.geolocatorResultsStatus}>
              <Typography role="status" aria-live="polite" aria-atomic="true" component="p">
                {t('geolocator.resultsFound', { count: memoFilteredData.length, searchTerm: searchValue })}
              </Typography>
              {memoActiveFiltersDisplay}
            </Box>
            <GeoList geoListItems={memoFilteredData} searchValue={searchValue} />
          </>
        )}
        {!memoFilteredData.length && searchValue.length >= 3 && (
          <Box sx={memoSxClasses.resultMessage}>
            <Typography role="status" aria-live="polite" aria-atomic="true" component="p">
              {t('geolocator.noResult')} <b>{searchValue}</b>
            </Typography>
            {memoActiveFiltersDisplay}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
