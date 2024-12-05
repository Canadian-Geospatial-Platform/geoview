import { useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { Box, ListItemButton, Grid, Tooltip, Typography, ListItem } from '@/ui';
import { GeoListItem } from './geolocator';
import { getSxClassesList } from './geolocator-style';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { HtmlToReact } from '@/core/containers/html-to-react';
import { logger } from '@/core/utils/logger';

type GeoListProps = {
  geoListItems: GeoListItem[];
  searchValue: string;
};

type tooltipProp = Pick<GeoListItem, 'name' | 'province' | 'category'>;

/**
 * Create list of items to display under search.
 * @param {GeoListItem[]} geoListItems - items to display
 * @param {string} searchValue - search text
 * @returns {JSX.Element} React JSX element
 */
export default function GeoList({ geoListItems, searchValue }: GeoListProps): JSX.Element {
  const { zoomToGeoLocatorLocation } = useMapStoreActions();
  const theme = useTheme();
  const sxClassesList = useMemo(() => getSxClassesList(theme), [theme]);

  /**
   * Get the title for tooltip
   * @param {name} - name of the geo item
   * @param {province} - province of the geo item
   * @param {category} - category of the geo item
   * @returns {string} - tooltip title
   */
  const getTooltipTitle = useCallback(({ name, province, category }: tooltipProp): string => {
    // Log
    // NOTE: Commenting out because it fires too often and leads console pollution.
    // logger.logTraceUseCallback('GEOLOCATOR - geolist - getTooltipTitle', name, province, category);

    let title = name;
    if (category && category !== 'null') {
      title += `, ${category}`;
    }

    if (province && province !== 'null') {
      title += `, ${province}`;
    }

    return title;
  }, []);

  /**
   * Transform the search value in search result with bold css.
   * @param {string} title list title in search result
   * @param {string} searchValue value that user search
   * @param {string} province province of the list title in search result
   * @returns {JSX.Element}
   */
  const transformListTitle = useCallback((_title: string, _searchValue: string, province: string): JSX.Element | string => {
    // Log
    // NOTE: Commenting out because it fires too often and leads console pollution.
    // logger.logTraceUseCallback('GEOLOCATOR - geolist - transformListTitle', _title, _searchValue, province);

    const searchPattern = `${_searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`.replace(/\s+/g, '[ ,]*');
    const regex = new RegExp(searchPattern, 'i');

    let title = _title;
    if (regex.test(_title)) {
      // make matched substring bold.
      title = _title.replace(regex, '<strong>$&</strong>');
    }

    return <HtmlToReact extraOptions={{ component: 'span' }} itemOptions={{ component: 'span' }} htmlContent={`${title} ${province}`} />;
  }, []);

  const handleZoomToGeoLocator = (latLng: [number, number], bbox: [number, number, number, number]): void => {
    // Zoom to location
    zoomToGeoLocatorLocation(latLng, bbox).catch((error) => {
      // Log
      logger.logPromiseFailed('Failed to triggerGetAllFeatureInfo in data-panel.GeoList.handleZoomToGeoLocator', error);
    });
  };

  return (
    <Box>
      {geoListItems.map((geoListItem, index) => (
        <Tooltip
          title={getTooltipTitle(geoListItem)}
          placement="right"
          // sometime when we search by `bay`, response have name and lat same, thats why index is used to distinguish
          key={`${geoListItem.name}-${geoListItem.lat}-${index.toString()}`}
        >
          <ListItem component="div" disablePadding>
            <ListItemButton onClick={() => handleZoomToGeoLocator([geoListItem.lng, geoListItem.lat], geoListItem.bbox)}>
              <Grid container sx={{ width: '100%' }}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Typography sx={sxClassesList.listStyle}>
                    {transformListTitle(
                      geoListItem.name,
                      searchValue,
                      !!geoListItem.province && geoListItem.province !== 'null' ? `, ${geoListItem.province}` : ''
                    )}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: 'right' }}>
                  {!!geoListItem.category && geoListItem.category !== 'null' && (
                    <Typography component="p" sx={sxClassesList.main}>
                      <Typography component="span"> {geoListItem.category}</Typography>
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </ListItemButton>
          </ListItem>
        </Tooltip>
      ))}
    </Box>
  );
}
