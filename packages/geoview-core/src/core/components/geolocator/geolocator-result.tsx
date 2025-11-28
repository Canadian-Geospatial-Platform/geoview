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

interface GeolocatorFiltersType {
  geoLocationData: GeoListItem[];
  searchValue: string;
  error: boolean;
}

/**
 * Component to display filters and geo location result.
 * @param {GeoListItem[]} geoLocationData - The data to be displayed in result
 * @param {string} searchValue - The search value entered by the user.
 * @param {boolean} error - If there is an error thrown api call.
 * @returns {JSX.Element}
 */
export function GeolocatorResult({ geoLocationData, searchValue, error }: GeolocatorFiltersType): JSX.Element {
  // Log
  logger.logTraceRender('components/geolocator/geolocator-result');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const shellContainer = useAppShellContainer();

  // State
  const [province, setProvince] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  // Store
  // TODO: style - we should not base length on map size value, parent should adjust
  const mapSize = useMapSize();

  /**
   * Clear all filters.
   */
  const handleClearFilters = (): void => {
    setProvince('');
    setCategory('');
  };

  /**
   * Reduce provinces from api response data i.e. geoLocationData
   */
  const memoProvinces: TypeMenuItemProps[] = useMemo(() => {
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - provinces', geoLocationData);
    return createMenuItems(geoLocationData, 'province', t('geolocator.noFilter'));
  }, [geoLocationData, t]);

  /**
   * Reduce categories from api response data i.e. geoLocationData
   */
  const memoCategories: TypeMenuItemProps[] = useMemo(() => {
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - categories', geoLocationData);
    return createMenuItems(geoLocationData, 'category', t('geolocator.noFilter'));
  }, [geoLocationData, t]);

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

  // List active filters in the results
  const activeFiltersDisplay = useMemo(() => {
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
        <Box sx={sxClasses.filter} className="geolocator-filters" role="group">
          <Box sx={{ flexGrow: 2, paddingRight: '8px', maxWidth: 150 }}>
            <Select
              labelId="geolocationProvinceFilter"
              formControlProps={{ variant: 'standard', size: 'small' }}
              id="provinceGeolocatorFilters"
              fullWidth
              value={province ?? ''}
              onChange={(event: SelectChangeEvent<unknown>) => setProvince(event.target.value as string)}
              label={t('geolocator.province')}
              inputLabel={{ id: 'geolocationProvinceFilter' }}
              menuItems={memoProvinces}
              disabled={!geoLocationData.length}
              variant="standard"
              MenuProps={{ container: shellContainer }}
            />
          </Box>
          <Box sx={{ flexGrow: 2, paddingRight: '8px', maxWidth: 150 }}>
            <Select
              labelId="geolocationCategoryFilter"
              id="typeGeolocatorFilters"
              formControlProps={{ variant: 'standard', size: 'small' }}
              value={category ?? ''}
              fullWidth
              onChange={(event: SelectChangeEvent<unknown>) => setCategory(event.target.value as string)}
              label={t('geolocator.category')}
              inputLabel={{ id: 'geolocationCategoryFilter' }}
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
              aria-label={t('geolocator.clearFilters')}
              onClick={handleClearFilters}
              disabled={!geoLocationData.length}
            >
              <ClearFiltersIcon sx={{ fontSize: theme.palette.geoViewFontSize.md }} />
            </IconButton>
          </Box>
        </Box>
      )}
      <Box
        sx={{ maxHeight: mapSize[1] - 240, overflowY: 'auto' }}
        id="geolocator-results-region"
        role="region"
        aria-label={t('geolocator.searchResults')!}
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions removals"
      >
        {error && (
          <Typography component="p" sx={{ p: 10, fontSize: theme.palette.geoViewFontSize.md }}>
            {t('error.geolocator.noService')}
          </Typography>
        )}
        {!!memoFilteredData.length && (
          <>
            {/* An announcement for screen readers about the number of results found */}
            <Box className="geolocatorResultsStatus" role="status" sx={sxClasses.geolocatorResultsStatus}>
              <Typography component="p">
                {t('geolocator.resultsFound', { count: memoFilteredData.length, searchTerm: searchValue })}
              </Typography>
              {activeFiltersDisplay}
            </Box>
            <GeoList geoListItems={memoFilteredData} searchValue={searchValue} />
          </>
        )}
        {!memoFilteredData.length && searchValue.length >= 3 && (
          <Box sx={{ p: 10 }} role="status">
            <Typography component="p" sx={{ fontSize: theme.palette.geoViewFontSize.md }}>
              {t('geolocator.noResult')} <b>{searchValue}</b>
            </Typography>
            {activeFiltersDisplay}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
