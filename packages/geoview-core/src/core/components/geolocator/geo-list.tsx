import * as React from 'react';
import { ListItem, ListItemButton, Grid, Typography, Tooltip } from '@mui/material';
import { GeoListItem } from './types';

type GeoListProps = {
  geoListItems: GeoListItem[];
  zoomToLocation: (coords: [number, number]) => void;
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

const getTooltipTitle = ({ name, tag, province }: tooltipProp): string => {
  let title = name;
  if (tag && tag.length && !!tag[0]) {
    title += `, ${tag[0]}`;
  }
  if (province && province !== 'null') {
    title += `, ${province}`;
  }
  return title;
};

export default function GeoList({ geoListItems, zoomToLocation }: GeoListProps) {
  return (
    <>
      {geoListItems.map((geoListItem, index) => (
        // sometime when we search by `bay`,response have name and lat same, thats why index is used to distinguish
        // eslint-disable-next-line react/no-array-index-key
        <ListItem key={`${geoListItem.name}-${geoListItem.lat}-${index}`} component="div" disablePadding>
          <ListItemButton onClick={() => zoomToLocation([geoListItem.lng, geoListItem.lat])}>
            <Grid container>
              <Grid item xs={12} sm={8}>
                <Tooltip title={getTooltipTitle(geoListItem)} placement="top" enterDelay={500}>
                  <Typography component="p" sx={sxClasses.main}>
                    <Typography component="span">{geoListItem.name}</Typography>
                    {!!geoListItem.tag && geoListItem.tag.length && !!geoListItem.tag[0] && (
                      <Typography component="span">{`, ${geoListItem.tag[0]}`}</Typography>
                    )}
                    {!!geoListItem.province && geoListItem.province !== 'null' && (
                      <Typography component="span">{`, ${geoListItem.province}`}</Typography>
                    )}
                  </Typography>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                {!!geoListItem.tag && geoListItem.tag.length > 1 && !!geoListItem.tag[1] && (
                  <Tooltip title={geoListItem.tag[1]} placement="right" enterDelay={500}>
                    <Typography component="p" sx={sxClasses.main}>
                      <Typography component="span"> {geoListItem.tag[1]}</Typography>
                    </Typography>
                  </Tooltip>
                )}
              </Grid>
            </Grid>
          </ListItemButton>
        </ListItem>
      ))}
    </>
  );
}
