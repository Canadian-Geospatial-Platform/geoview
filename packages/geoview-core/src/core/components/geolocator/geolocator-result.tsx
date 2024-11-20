import React, { useEffect, useMemo, useState } from 'react';
import { SelectChangeEvent, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { sxClasses } from './geolocator-style';
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
import { GeoListItem } from './geolocator';
import GeoList from './geo-list';
import { useMapSize } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

interface GeolocatorFiltersType {
  geoLocationData: GeoListItem[];
  searchValue: string;
  error: Error | null;
}

/**
 * Component to display filters and geo location result.
 * @param {GeoListItem[]} geoLocationData data to be displayed in result
 * @param {string} searchValue search value entered by the user.
 * @param {Error} error error thrown api call.
 * @returns {JSX.Element}
 */
export function GeolocatorResult({ geoLocationData, searchValue, error }: GeolocatorFiltersType): JSX.Element {
  const { t } = useTranslation();
  const [province, setProvince] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [data, setData] = useState<GeoListItem[]>(geoLocationData);

  // get store values
  const mapSize = useMapSize();

  const theme = useTheme();

  /**
   * Clear all filters.
   */
  const handleClearFilters = (): void => {
    if (province || category) {
      setProvince('');
      setCategory('');
      setData(geoLocationData);
    }
  };

  /**
   * Reduce provinces from api response data i.e. geoLocationData and return transform into MenuItem
   */
  const provinces: TypeMenuItemProps[] = useMemo(() => {
    // Log
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - provinces', geoLocationData);

    const provincesList = geoLocationData
      .reduce((acc, curr) => {
        if (curr.province && !acc.includes(curr.province)) {
          acc.push(curr.province);
        }
        return acc;
      }, [] as string[])
      .sort();
    // added empty string for resetting the filter
    return ['', ...new Set(provincesList)].map((typeItem: string) => {
      return {
        type: 'item',
        item: { value: !typeItem.length ? '' : typeItem, children: !typeItem.length ? t('geolocator.noFilter') : typeItem },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoLocationData]);

  /**
   * Reduce categories from api response data i.e. geoLocationData
   */
  const categories: TypeMenuItemProps[] = useMemo(() => {
    // Log
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - categories', geoLocationData);

    const locationData = geoLocationData
      .reduce((acc, curr) => {
        if (curr.category) {
          acc.push(curr.category);
        }
        return acc;
      }, [] as string[])
      .sort();
    // added empty string for resetting the filter
    return ['', ...new Set(locationData)].map((typeItem: string) => {
      return {
        type: 'item',
        item: { value: !typeItem.length ? '' : typeItem, children: !typeItem.length ? t('geolocator.noFilter') : typeItem },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoLocationData]);

  // Cache the filter data
  const memoFilterData = useMemo(() => {
    // Log
    logger.logTraceUseMemo('GEOLOCATOR-RESULT - memoFilterData', geoLocationData, province, category);

    return geoLocationData.filter((item) => {
      let result = true;
      if (province.length && !category.length) {
        result = item.province.toLowerCase() === province.toLowerCase();
      } else if (province.length && category.length) {
        result = item.province.toLowerCase() === province.toLowerCase() && item.category.toLowerCase() === category.toLowerCase();
      } else if (!province.length && category.length) {
        result = item.category.toLowerCase() === category.toLowerCase();
      }
      return result;
    });
  }, [category, geoLocationData, province]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOLOCATOR-RESULT - geoLocationData', geoLocationData);

    setData(geoLocationData);
  }, [geoLocationData]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOLOCATOR-RESULT - geoLocationData province category', memoFilterData);

    // update result list after setting the province and type.
    setData(memoFilterData);
  }, [memoFilterData]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOLOCATOR-RESULT - geoLocationData reset', geoLocationData);

    // Reset the filters when no result found.
    if (!geoLocationData.length) {
      setProvince('');
      setCategory('');
    }
  }, [geoLocationData]);

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
              onChange={(e: SelectChangeEvent<unknown>) => setProvince(e.target.value as string)}
              label={t('geolocator.province')}
              inputLabel={{ id: 'geolocationProvinceFilter' }}
              menuItems={provinces}
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
              onChange={(e: SelectChangeEvent<unknown>) => setCategory(e.target.value as string)}
              label={t('geolocator.category')}
              inputLabel={{ id: 'geolocationCategoryFilter' }}
              menuItems={categories}
              disabled={!geoLocationData.length}
              variant="standard"
            />
          </Box>
          <Box>
            <IconButton
              size="small"
              edge="end"
              color="inherit"
              tooltip="geolocator.clearFilters"
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
        {!!data.length && <GeoList geoListItems={data} searchValue={searchValue} />}
        {(!data.length || error) && (
          <Box sx={{ p: 10 }}>
            <Typography component="p" sx={{ fontSize: theme.palette.geoViewFontSize.md }}>
              {t('geolocator.errorMessage')} <b>{searchValue}</b>
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
