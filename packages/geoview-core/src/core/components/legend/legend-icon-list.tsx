import React, { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  VisibilityOffIcon,
  VisibilityIcon,
} from '../../../ui';

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
  // eslint-disable-next-line react/require-default-props
  isParentVisible?: boolean;
  // eslint-disable-next-line react/require-default-props
  toggleParentVisible?: () => void;
}
/**
 * List of Icons to show in expanded Legend Item
 *
 * @returns {JSX.Element} the list of icons
 */
export function LegendIconList(props: TypeLegendIconListProps): JSX.Element {
  const { iconImages, iconLabels, isParentVisible, toggleParentVisible } = props;
  const allChecked = iconImages.map(() => true);
  const allUnChecked = iconImages.map(() => false);
  const [isChecked, setChecked] = useState<boolean[]>(isParentVisible === true ? allChecked : allUnChecked);
  const [checkedCount, setCheckCount] = useState<number>(isParentVisible === true ? iconImages.length : 0);
  const [initPV, setInitPV] = useState(isParentVisible);
  /**
   * Handle view/hide layers.
   */
  const handleToggleLayer = (index: number) => {
    const checklist = isChecked.map((checked, i) => (i === index ? !checked : checked));
    const count = checklist.filter((f) => f === true).length;
    setChecked(checklist);
    setCheckCount(count);
    if (isParentVisible !== undefined && toggleParentVisible !== undefined) {
      if ((count === 0 && isParentVisible === true) || (count > 0 && isParentVisible === false)) {
        if (isParentVisible === false) {
          setInitPV(true);
        }
        toggleParentVisible();
      }
    }
  };

  useEffect(() => {
    if (isParentVisible !== initPV) {
      setChecked(isParentVisible === true ? allChecked : allUnChecked);
      setCheckCount(isParentVisible === true ? allChecked.length : 0);
      setInitPV(isParentVisible);
    }
  }, [isParentVisible, allChecked, allUnChecked, checkedCount, initPV]);

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
                <ListItemIcon>
                  <IconButton color="primary" onClick={() => handleToggleLayer(index)}>
                    {isChecked[index] === true ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  </IconButton>
                </ListItemIcon>
              </ListItemButton>
            </ListItem>
          </Box>
        );
      })}
    </List>
  );
}
