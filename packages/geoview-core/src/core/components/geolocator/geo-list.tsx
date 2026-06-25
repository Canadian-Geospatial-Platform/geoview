import { useCallback, useMemo } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { List, ListItem, ListItemButton, Grid, Tooltip, Typography } from '@/ui';
import type { GeoListItem } from '@/core/components/geolocator/geolocator';
import { getSxClassesList } from '@/core/components/geolocator/geolocator-style';
import { getBoldListTitle, getTooltipTitle } from '@/core/components/geolocator/utilities';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { logger } from '@/core/utils/logger';
import { useMapController } from '@/core/controllers/use-controllers';
import type { SxStyles } from '@/ui/style/types';

/** Props for the GeoList component. */
type GeoListProps = {
  /** The geolocation items to display. */
  geoListItems: GeoListItem[];
  /** The current search text. */
  searchValue: string;
};

/**
 * Creates the list of geolocation results to display under search.
 *
 * @returns The geolocation result list
 */
export function GeoList({ geoListItems, searchValue }: GeoListProps): JSX.Element {
  // Log
  logger.logTraceRender('components/geolocator/geo-list');

  // Hooks
  const theme = useTheme();
  const memoSxClassesList = useMemo((): SxStyles => {
    return getSxClassesList(theme);
  }, [theme]);
  const mapController = useMapController();
  const isAboveSmBreakpoint = useMediaQuery(theme.breakpoints.up('sm'));

  /**
   * Handles zooming to a geolocation result.
   */
  const handleZoomToGeoLocator = useCallback(
    (geoListItem: GeoListItem): void => {
      mapController
        .zoomToGeoLocatorLocation(
          `${geoListItem.name}, ${geoListItem.province}, ${geoListItem.category}`,
          [geoListItem.lng, geoListItem.lat],
          true,
          geoListItem.bbox
        )
        .catch((error: unknown) => {
          logger.logPromiseFailed('Failed to zoomToGeoLocatorLocation in GeoList', error);
        });
    },
    [mapController]
  );

  /**
   * Transforms a title string into a JSX element with bold highlighting for search matches.
   *
   * NOTE: It's a render-related transformation functions who takes direct parameters.
   *
   * @param title - The original title text to transform
   * @param searchTerm - The search term to highlight in the title
   * @param province - The province to append to the title
   * @returns A span element containing the formatted title with bold highlights and province
   */
  const transformListTitle = (title: string, searchTerm: string, province: string): JSX.Element => {
    const newTitle = getBoldListTitle(title, searchTerm);
    return (
      <UseHtmlToReact extraOptions={{ component: 'span' }} itemOptions={{ component: 'span' }} htmlContent={`${newTitle}${province}`} />
    );
  };

  return (
    <List>
      {geoListItems.map((geoListItem, index) => (
        // tooltip is here for when the name is too long to be shown in full in the list
        <Tooltip
          title={getTooltipTitle(geoListItem)}
          placement="top"
          // sometimes when we search by `bay`, response can have name and lat same, that's why index is used to distinguish
          key={`${geoListItem.name}-${geoListItem.lat}-${index.toString()}`}
          describeChild
          // prevent tooltip from showing on small screens because the full text is already shown
          // in the list at smaller breakpoints
          disableFocusListener={!isAboveSmBreakpoint}
          disableTouchListener={!isAboveSmBreakpoint}
          disableHoverListener={!isAboveSmBreakpoint}
        >
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleZoomToGeoLocator(geoListItem)} aria-label={getTooltipTitle(geoListItem)}>
              <Grid container spacing={6} sx={memoSxClassesList.geoListItemGrid}>
                {/* Location name + province (truncates when > 66% of row width) */}
                <Grid size={{ xs: 12, sm: 8 }} sx={memoSxClassesList.geoListLocationCell}>
                  <Typography component="div" noWrap={isAboveSmBreakpoint}>
                    {transformListTitle(
                      geoListItem.name,
                      searchValue,
                      !!geoListItem.province && geoListItem.province !== 'null' ? `, ${geoListItem.province}` : ''
                    )}
                  </Typography>
                </Grid>

                {/* Category (truncates when > 33% of row width) */}
                <Grid size={{ xs: 12, sm: 4 }} sx={memoSxClassesList.geoListCategoryCell}>
                  {!!geoListItem.category && geoListItem.category !== 'null' && (
                    <Typography component="div" noWrap={isAboveSmBreakpoint}>
                      {geoListItem.category}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </ListItemButton>
          </ListItem>
        </Tooltip>
      ))}
    </List>
  );
}
