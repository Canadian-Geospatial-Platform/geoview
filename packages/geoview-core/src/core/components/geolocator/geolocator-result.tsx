import { useMemo, useState } from 'react';
import { SelectChangeEvent, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Divider,
  FilterAltOffIcon,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Select,
  TypeMenuItemProps,
  Typography,
} from '@/ui';
import { GeoListItem } from '@/core/components/geolocator/geolocator';
import { GeoList } from '@/core/components/geolocator/geo-list';
import { createMenuItems } from '@/core/components/geolocator/utilities';
import { getSxClasses } from '@/core/components/geolocator/geolocator-style';
import { useMapSize } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

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

  return (
    <Paper component="div" elevation={4} square sx={{ width: 350 }}>
      {!error && (
        <Box sx={sxClasses.filter}>
          <Box sx={{ flexGrow: 2, paddingRight: '8px', maxWidth: 150 }}>
            <Select
              labelId="provinceGeolocatorFiltersLabel"
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
            />
          </Box>
          <Box sx={{ flexGrow: 2, paddingRight: '8px', maxWidth: 150 }}>
            <Select
              labelId="categoryGeolocatorFiltersLabel"
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
            />
          </Box>
          <Box>
            <IconButton
              size="small"
              edge="end"
              color="inherit"
              tooltip={t('geolocator.clearFilters') as string}
              onClick={handleClearFilters}
              disabled={!geoLocationData.length}
            >
              <FilterAltOffIcon fontSize={theme.palette.geoViewFontSize.sm} />
            </IconButton>
          </Box>
        </Box>
      )}
      <Divider />
      <Box sx={{ maxHeight: mapSize![1] - 240, overflowY: 'auto' }}>
        {error && (
          <Typography component="p" sx={{ p: 10, fontSize: theme.palette.geoViewFontSize.md }}>
            {t('error.geolocator.noService')}
          </Typography>
        )}
        {!!memoFilteredData.length && <GeoList geoListItems={memoFilteredData} searchValue={searchValue} />}
        {!memoFilteredData.length && searchValue.length >= 3 && (
          <Box sx={{ p: 10 }}>
            <Typography component="p" sx={{ fontSize: theme.palette.geoViewFontSize.md }}>
              {t('geolocator.noResult')} <b>{searchValue}</b>
            </Typography>
            {!!(province.length || category.length) && (
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
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
