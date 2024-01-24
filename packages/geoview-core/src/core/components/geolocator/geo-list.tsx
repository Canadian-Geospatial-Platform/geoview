import { ListItem } from '@mui/material'; // TODO because of forward ref problem we can't use it inside the tooltip if provided by UI
import { ListItemButton, Grid, Tooltip, Typography } from '@/ui';
import { GeoListItem } from './geolocator';
import { sxClassesList } from './geolocator-style';

type GeoListProps = {
  geoListItems: GeoListItem[];
  zoomToLocation: (coords: [number, number], bbox: [number, number, number, number]) => void;
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
 * Create list of items to display under search.
 * @param {geoListItems} - items to display
 * @param {zoomToLocation} - callback fn to be fired when clicked on geo list item
 * @returns {JSX} - React JSX element
 */
export default function GeoList({ geoListItems, zoomToLocation }: GeoListProps) {
  return (
    <>
      {geoListItems.map((geoListItem, index) => (
        <Tooltip
          title={getTooltipTitle(geoListItem)}
          placement="top"
          enterDelay={500}
          // sometime when we search by `bay`, response have name and lat same, thats why index is used to distinguish
          // eslint-disable-next-line react/no-array-index-key
          key={`${geoListItem.name}-${geoListItem.lat}-${index}`}
        >
          <ListItem component="div" disablePadding>
            <ListItemButton onClick={() => zoomToLocation([geoListItem.lng, geoListItem.lat], geoListItem.bbox)}>
              <Grid container>
                <Grid item xs={12} sm={8}>
                  <Typography component="p" sx={sxClassesList.main}>
                    <Typography component="span">{geoListItem.name}</Typography>
                    {!!geoListItem.province && geoListItem.province !== 'null' && (
                      <Typography component="span">{`, ${geoListItem.province}`}</Typography>
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
    </>
  );
}
