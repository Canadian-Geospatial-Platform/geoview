import { ListItem } from '@mui/material'; // TODO because of forward ref problem we can't use it inside the tooltip if provided by UI
import { ListItemButton, Grid, Tooltip, Typography } from '@/ui';
import { GeoListItem } from './geolocator';

type GeoListProps = {
  geoListItems: GeoListItem[];
  zoomToLocation: (coords: [number, number], bbox: [number, number, number, number]) => void;
};

const sxClasses = {
  main: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '& span': {
      fontSize: '0.75rem',
      ':first-of-type': {
        fontWeight: 'bold',
        fontSize: '0.875rem',
      },
    },
  },
};

type tooltipProp = Pick<GeoListItem, 'name' | 'tag' | 'province'>;

/**
 * Get the title for tooltip
 * @param {name} - name of the geo item
 * @param {tag} - tags associated with geo item
 * @param {province} - province of the geo item
 * @returns {string} - tooltip title
 */
const getTooltipTitle = ({ name, tag, province }: tooltipProp): string => {
  let title = name;
  if (tag && tag.length && !!tag[0]) {
    title += `, ${tag[0]}`;
  }

  if (tag && tag.length > 1 && !!tag[1]) {
    title += `, ${tag[1]}`;
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
                  <Typography component="p" sx={sxClasses.main}>
                    <Typography component="span">{geoListItem.name}</Typography>
                    {!!geoListItem.tag && geoListItem.tag.length && !!geoListItem.tag[0] && (
                      <Typography component="span">{`, ${geoListItem.tag[0]}`}</Typography>
                    )}
                    {!!geoListItem.province && geoListItem.province !== 'null' && (
                      <Typography component="span">{`, ${geoListItem.province}`}</Typography>
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                  {!!geoListItem.tag && geoListItem.tag.length > 1 && !!geoListItem.tag[1] && (
                    <Typography component="p" sx={sxClasses.main}>
                      <Typography component="span"> {geoListItem.tag[1]}</Typography>
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
