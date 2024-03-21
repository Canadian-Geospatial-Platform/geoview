import { ListItem } from '@mui/material'; // TODO because of forward ref problem we can't use it inside the tooltip if provided by UI
import { Box, ListItemButton, Grid, Tooltip, Typography } from '@/ui';
import { GeoListItem } from './geolocator';
import { sxClassesList } from './geolocator-style';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { HtmlToReact } from '@/core/types/cgpv-types';

type GeoListProps = {
  geoListItems: GeoListItem[];
  searchValue: string;
};

type tooltipProp = Pick<GeoListItem, 'name' | 'province' | 'category'>;

/**
 * Get the title for tooltip
 * @param {name} - name of the geo item
 * @param {province} - province of the geo item
 * @param {category} - category of the geo item
 * @returns {string} - tooltip title
 */
const getTooltipTitle = ({ name, province, category }: tooltipProp): string => {
  let title = name;
  if (category && category !== 'null') {
    title += `, ${category}`;
  }

  if (province && province !== 'null') {
    title += `, ${province}`;
  }

  return title;
};

/**
 * Transform the search value in search result with bold css.
 * @param {string} title list title in search result
 * @param {string} searchValue value with user did the search
 * @param {string} province province of the list title in search result
 * @returns string
 */
const transformListTitle = (_title: string, _searchValue: string, province: string) => {
  const title = _title.toUpperCase();
  const searchValue = _searchValue.toUpperCase();
  const idx = title.indexOf(searchValue);
  if (!searchValue || idx === -1) {
    return (
      <Box className="list-title">
        <Box>{_title}</Box>
      </Box>
    );
  }

  const len = searchValue.length;
  return (
    <HtmlToReact
      className="list-title"
      htmlContent={`${_title.slice(0, idx)}<b>${_title.slice(idx, idx + len)}</b>${_title.slice(idx + len)}${province}`}
    />
  );
};

/**
 * Create list of items to display under search.
 * @param {GeoListItem[]} geoListItems - items to display
 * @param {string} searchValue - search text
 * @returns {JSX} - React JSX element
 */
export default function GeoList({ geoListItems, searchValue }: GeoListProps) {
  const { zoomToGeoLocatorLocation } = useMapStoreActions();

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
            <ListItemButton onClick={() => zoomToGeoLocatorLocation([geoListItem.lng, geoListItem.lat], geoListItem.bbox)}>
              <Grid container>
                <Grid item xs={12} sm={8}>
                  <Typography component="div" sx={sxClassesList.listStyle}>
                    {transformListTitle(
                      geoListItem.name,
                      searchValue,
                      !!geoListItem.province && geoListItem.province !== 'null' ? `, ${geoListItem.province}` : ''
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
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
