import { useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { TypeMenuItemProps } from '@/ui';
import { Box, ClearFiltersIcon, IconButton, List, ListItem, ListItemText, Paper, Select, Typography } from '@/ui';
import type { GeoListItem } from '@/core/components/geolocator/geolocator';
import { GeoList } from '@/core/components/geolocator/geo-list';
import { createMenuItems } from '@/core/components/geolocator/utilities';
import { getSxClasses } from '@/core/components/geolocator/geolocator-style';
import { useMapSize } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useAppShellContainer } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

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
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const mapId = useGeoViewMapId();

  // Store
  const shellContainer = useAppShellContainer();

  // State
  const [province, setProvince] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  /**
   * Checks whether any filter is active.
   */
  const memoHasActiveFilters = useMemo(() => {
    return !!(province.length || category.length);
  }, [province, category]);

  // Store
  // TODO: style - we should not base length on map size value, parent should adjust
  const mapSize = useMapSize();

  /**
   * Clears all filters.
   */
  const handleClearFilters = (): void => {
    // Prevent action when button is disabled
    if (!memoHasActiveFilters) {
      return;
    }
    setProvince('');
    setCategory('');
  };

  /**
   * Reduces provinces from the API response data.
   */
  const memoProvinces: TypeMenuItemProps[] = useMemo(() => {
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - provinces', geoLocationData);
    return createMenuItems(geoLocationData, 'province', t('geolocator.noFilter'));
  }, [geoLocationData, t]);

  /**
   * Reduces categories from the API response data.
   */
  const memoCategories: TypeMenuItemProps[] = useMemo(() => {
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - categories', geoLocationData);
    return createMenuItems(geoLocationData, 'category', t('geolocator.noFilter'));
  }, [geoLocationData, t]);

  /**
   * Filters geolocation data by selected province and category.
   */
  // Filter data with memo
  const memoFilteredData = useMemo(() => {
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - filtering data', {
      total: geoLocationData.length,
      province,
      category,
    });

    return geoLocationData.filter((item) => {
      const matchProvince = !province || item.province === province;
      const matchCategory = !category || item.category === category;
      return matchProvince && matchCategory;
    });
  }, [geoLocationData, province, category]);

  /**
   * Builds the active filters display for screen readers.
   */
  const memoActiveFiltersDisplay = useMemo(() => {
    if (!(province.length || category.length)) return null;

    return (
      <List sx={sxClasses.filterListError}>
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
  }, [province, category, t, sxClasses.filterListError]);

  return (
    <Paper component="div" elevation={4} square sx={{ width: 350 }}>
      {!error && (
        <Box sx={sxClasses.filter} className="geolocator-filters" role="group" aria-label={t('geolocator.filtersGroupTitle')!}>
          <Box sx={{ flexGrow: 2, paddingRight: '8px', maxWidth: 150 }}>
            <Select
              labelId={`${mapId}-geolocator-province-filter-label`}
              formControlProps={{ variant: 'standard', size: 'small' }}
              id={`${mapId}-geolocator-province-filter`}
              fullWidth
              value={province ?? ''}
              onChange={(event: SelectChangeEvent<unknown>) => setProvince(event.target.value as string)}
              label={t('geolocator.province')}
              inputLabel={{ id: `${mapId}-geolocator-province-filter-label` }}
              menuItems={memoProvinces}
              disabled={!geoLocationData.length}
              variant="standard"
              MenuProps={{ container: shellContainer }}
            />
          </Box>
          <Box sx={{ flexGrow: 2, paddingRight: '8px', maxWidth: 150 }}>
            <Select
              labelId={`${mapId}-geolocator-category-filter-label`}
              id={`${mapId}-geolocator-category-filter`}
              formControlProps={{ variant: 'standard', size: 'small' }}
              value={category ?? ''}
              fullWidth
              onChange={(event: SelectChangeEvent<unknown>) => setCategory(event.target.value as string)}
              label={t('geolocator.category')}
              inputLabel={{ id: `${mapId}-geolocator-category-filter-label` }}
              menuItems={memoCategories}
              disabled={!geoLocationData.length}
              variant="standard"
              MenuProps={{ container: shellContainer }}
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
              <ClearFiltersIcon sx={{ fontSize: theme.palette.geoViewFontSize.md }} />
            </IconButton>
          </Box>
        </Box>
      )}
      <Box
        sx={{ maxHeight: mapSize[1] - 240, overflowY: 'auto' }}
        className="geolocator-results-region"
        role="region"
        aria-label={t('geolocator.searchResults')!}
      >
        {error && (
          <Typography
            role="status"
            aria-live="polite"
            aria-atomic="true"
            component="p"
            sx={{ p: 10, fontSize: theme.palette.geoViewFontSize.md }}
          >
            {t('error.geolocator.noService')}
          </Typography>
        )}
        {!!memoFilteredData.length && (
          <>
            {/* An announcement for screen readers about the number of results found */}
            <Box className="geolocatorResultsStatus" sx={sxClasses.geolocatorResultsStatus}>
              <Typography role="status" aria-live="polite" aria-atomic="true" component="p">
                {t('geolocator.resultsFound', { count: memoFilteredData.length, searchTerm: searchValue })}
              </Typography>
              {memoActiveFiltersDisplay}
            </Box>
            <GeoList geoListItems={memoFilteredData} searchValue={searchValue} />
          </>
        )}
        {!memoFilteredData.length && searchValue.length >= 3 && (
          <Box sx={{ p: 10 }}>
            <Typography
              role="status"
              aria-live="polite"
              aria-atomic="true"
              component="p"
              sx={{ fontSize: theme.palette.geoViewFontSize.md }}
            >
              {t('geolocator.noResult')} <b>{searchValue}</b>
            </Typography>
            {memoActiveFiltersDisplay}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
