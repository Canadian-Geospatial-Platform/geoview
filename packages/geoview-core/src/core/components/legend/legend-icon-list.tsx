import React from 'react';

import Box from '@mui/material/Box';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '../../../ui';

const sxClasses = {
  listIconLabel: {
    color: 'text.primary',
    fontSize: 14,
    noWrap: true,
    marginLeft: 5,
  },
  listItem: {
    margin: 0,
    padding: 0,
  },
  iconImg: {
    padding: 3,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    background: '#fff',
  },
};

export interface TypeLegendIconListProps {
  iconImages: string[];
  iconLabels: string[];
}
/**
 * List of Icons to show in expanded Legend Item
 *
 * @returns {JSX.Element} the list of icons
 */
export function LegendIconList(props: TypeLegendIconListProps): JSX.Element {
  const { iconImages, iconLabels } = props;

  return (
    <List>
      {iconImages.map((icon, index) => {
        return (
          <Box key={iconLabels[index]}>
            <ListItem sx={sxClasses.listItem}>
              <ListItemButton>
                <ListItemIcon>
                  <img alt={iconLabels[index]} src={icon} style={sxClasses.iconImg} />
                </ListItemIcon>
                <Tooltip title={iconLabels[index]} placement="top" enterDelay={1000}>
                  <ListItemText
                    sx={sxClasses.listIconLabel}
                    primaryTypographyProps={{ fontSize: 14, noWrap: true }}
                    primary={iconLabels[index]}
                  />
                </Tooltip>
              </ListItemButton>
            </ListItem>
          </Box>
        );
      })}
    </List>
  );
}
