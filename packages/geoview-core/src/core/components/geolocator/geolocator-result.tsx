import React, { useEffect, useMemo, useState } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { sxClasses } from './geolocator-style';
import { Box, Divider, FilterAltOffIcon, IconButton, Paper, Select, TypeMenuItemProps, Typography } from '@/ui';
import { PROVINCES } from '@/app';
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
  const [province, setProvince] = useState<string | number>('');
  const [type, setType] = useState<string | number>('');
  const [data, setData] = useState<GeoListItem[]>(geoLocationData);

  // get store values
  const mapSize = useMapSize();
  const { zoomToGeoLocatorLocation } = useMapStoreActions();

  /**
   * Clear all filters.
   */
  const handleClearFilters = () => {
    if (province || type) {
      setProvince('');
      setType('');
      setData(geoLocationData);
    }
  };

  /**
   * Map constants PROVINCES into menu item of Select Component.
   */
  const provinces: TypeMenuItemProps[] = useMemo(() => {
    return PROVINCES.map((provinceItem: string, index: number) => {
      return { type: 'item', item: { value: index + 1, children: provinceItem } };
    });
  }, []);

  /**
   * Reduce types from api response data i.e. geoLocationData
   */
  const types: TypeMenuItemProps[] = useMemo(() => {
    const locationData = geoLocationData.reduce((acc, curr) => {
      if (curr.tag && curr.tag[1]) {
        acc.push(curr.tag[1]);
      }
      return acc;
    }, [] as string[]);

    return [...new Set(locationData)].map((typeItem: string, index: number) => {
      return { type: 'item', item: { value: index + 1, children: typeItem } };
    });
  }, [geoLocationData]);

  useEffect(() => {
    setData(geoLocationData);
  }, [geoLocationData]);

  useEffect(() => {
    // update result list after setting the province and type.
    if (province || type) {
      const filterData = geoLocationData.filter((item) => {
        if (province && !type) {
          return item.province.toLowerCase() === PROVINCES[(province as number) - 1].toLowerCase();
        }
        if (province && type) {
          return (
            item.province.toLowerCase() === PROVINCES[(province as number) - 1].toLowerCase() &&
            item.tag &&
            item.tag[1] &&
            item.tag[1].toLowerCase() === (types[(type as number) - 1].item?.children?.toString().toLowerCase() ?? '')
          );
        }
        if (!province && type) {
          return (
            item.tag &&
            item.tag[1] &&
            item.tag[1].toLowerCase() === (types[(type as number) - 1].item?.children?.toString().toLowerCase() ?? '')
          );
        }
        return true;
      });
      setData(filterData);
    }
  }, [geoLocationData, province, type, types]);

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
              labelId="typeGeolocatorFiltersLabel"
              id="typeGeolocatorFilters"
              formControlProps={{ variant: 'standard', size: 'small' }}
              value={types.length ? type : ''}
              fullWidth
              onChange={(e: SelectChangeEvent<unknown>) => setType(e.target.value as string)}
              label={t('geolocator.type')}
              inputLabel={{ id: 'geolocation-types-filter' }}
              menuItems={types}
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
      <Box sx={{ maxHeight: mapSize![1] - 120, overflowY: 'auto' }}>
        {!!data.length && <GeoList geoListItems={data} zoomToLocation={zoomToGeoLocatorLocation} />}
        {(!data.length || error) && (
          <Typography component="p" sx={{ fontSize: 14, p: 10 }}>
            {t('geolocator.errorMessage')} {searchValue} {(province as number) ? PROVINCES[(province as number) - 1] : ''}{' '}
            {(type as number) ? types[(type as number) - 1]?.item?.children : ''}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
