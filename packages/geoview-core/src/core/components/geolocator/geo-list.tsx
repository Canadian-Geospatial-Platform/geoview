import { useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { Box, ListItemButton, Grid, Tooltip, Typography, ListItem } from '@/ui';
import { GeoListItem } from '@/core/components/geolocator/geolocator';
import { getSxClassesList } from '@/core/components/geolocator/geolocator-style';
import { getBoldListTitle, getTooltipTitle } from '@/core/components/geolocator/utilities';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { logger } from '@/core/utils/logger';

type GeoListProps = {
  geoListItems: GeoListItem[];
  searchValue: string;
};

/**
 * Create list of items to display under search.
 * @param {GeoListItem[]} geoListItems - The items to display
 * @param {string} searchValue - The search text
 * @returns {JSX.Element} React JSX element
 */
export function GeoList({ geoListItems, searchValue }: GeoListProps): JSX.Element {
  // Log
  logger.logTraceRender('components/geolocator/geo-list');

  // Hooks
  const theme = useTheme();
  const sxClassesList = useMemo(() => getSxClassesList(theme), [theme]);

  // Store
  const { zoomToGeoLocatorLocation } = useMapStoreActions();

  // Handle the zoom to geolocation
  const handleZoomToGeoLocator = useCallback(
    (latLng: [number, number], bbox: [number, number, number, number]): void => {
      zoomToGeoLocatorLocation(latLng, bbox).catch((error: unknown) => {
        logger.logPromiseFailed('Failed to zoomToGeoLocatorLocation in GeoList', error);
      });
    },
    [zoomToGeoLocatorLocation]
  );

  /**
   * Transforms a title string into a JSX element with bold highlighting for search matches
   * @param {string} title - The original title text to transform
   * @param {string} searchTerm - The search term to highlight in the title
   * @param {string} province - The province to append to the title
   * @returns {JSX.Element} A span element containing the formatted title with bold highlights and province
   *
   * @note It's a render-related transformation function who takes direct parameters.
   */
  const transformListTitle = (title: string, searchTerm: string, province: string): JSX.Element => {
    const newTitle = getBoldListTitle(title, searchTerm);
    return (
      <UseHtmlToReact extraOptions={{ component: 'span' }} itemOptions={{ component: 'span' }} htmlContent={`${newTitle} ${province}`} />
    );
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
