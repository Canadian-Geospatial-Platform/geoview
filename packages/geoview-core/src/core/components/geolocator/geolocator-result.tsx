import React, { useEffect, useMemo, useState } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { sxClasses } from './geolocator-style';
import { Box, Divider, FilterAltOffIcon, IconButton, Paper, Select, TypeMenuItemProps, Typography } from '@/ui';
import { GeoListItem } from './geolocator';
import GeoList from './geo-list';
import { useMapSize, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

interface GeolocatorFiltersType {
  geoLocationData: GeoListItem[];
  searchValue: string;
  error: Error | undefined;
}

/**
 * Component to display filters and geo location result.
 * @param {GeoListItem[]} geoLocationData data to be displayed in result
 * @param {string} searchValue search value entered by the user.
 * @param {Error} error error thrown api call.
 * @returns JSX.Element
 */
export function GeolocatorResult({ geoLocationData, searchValue, error }: GeolocatorFiltersType) {
  const { t } = useTranslation();
  const [province, setProvince] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [data, setData] = useState<GeoListItem[]>(geoLocationData);

  // get store values
  const mapSize = useMapSize();
  const { zoomToGeoLocatorLocation } = useMapStoreActions();

  /**
   * Clear all filters.
   */
  const handleClearFilters = () => {
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
    const provincesList = geoLocationData
      .reduce((acc, curr) => {
        if (curr.province && !acc.includes(curr.province)) {
          acc.push(curr.province);
        }
        return acc;
      }, [] as string[])
      .sort();

    return [...new Set(provincesList)].map((typeItem: string) => {
      return { type: 'item', item: { value: typeItem, children: typeItem } };
    });
  }, [geoLocationData]);

  /**
   * Reduce categories from api response data i.e. geoLocationData
   */
  const categories: TypeMenuItemProps[] = useMemo(() => {
    const locationData = geoLocationData
      .reduce((acc, curr) => {
        if (curr.category) {
          acc.push(curr.category);
        }
        return acc;
      }, [] as string[])
      .sort();

    return [...new Set(locationData)].map((typeItem: string) => {
      return { type: 'item', item: { value: typeItem, children: typeItem } };
    });
  }, [geoLocationData]);

  useEffect(() => {
    setData(geoLocationData);
  }, [geoLocationData]);

  useEffect(() => {
    // update result list after setting the province and type.
    if (province || category) {
      const filterData = geoLocationData.filter((item) => {
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
      setData(filterData);
    }
  }, [geoLocationData, province, category, categories, provinces]);

  useEffect(() => {
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
          <Box sx={{ flexGrow: 2, paddingRight: '8px' }}>
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
            />
          </Box>
          <Box sx={{ flexGrow: 2, paddingRight: '8px' }}>
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
            />
          </Box>
          <Box>
            <IconButton size="small" edge="end" color="inherit" tooltip="geolocator.clearFilters" onClick={handleClearFilters}>
              <FilterAltOffIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
      <Divider />
      <Box sx={{ maxHeight: mapSize![1] - 130, overflowY: 'auto' }}>
        {!!data.length && <GeoList geoListItems={data} zoomToLocation={zoomToGeoLocatorLocation} />}
        {(!data.length || error) && (
          <Typography component="p" sx={{ fontSize: 14, p: 10 }}>
            {t('geolocator.errorMessage')} {searchValue} {province} {category}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
