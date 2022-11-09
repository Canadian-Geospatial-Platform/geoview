import React from 'react';

import Box from '@mui/material/Box';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '../../../ui';

const sxClasses = {
  listIconLabel: {
    color: 'text.primary',
    fontSize: 14,
    noWrap: true,
  },
  listItem: {
    margin: 0,
    padding: 0,
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
                  <img alt={iconLabels[index]} src={icon} />
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
