/* eslint-disable no-plusplus */
import { useState, useEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import { Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';

import { getSxClasses } from './checkbox-list-style';

/**
 * interface for CheckboxList basic properties
 */
export interface CheckboxListEnhancedType {
  listItems: Array<CheckboxListEnhancedItem>;
  checkedValues: string[];
  multiselect: boolean;
  checkedCallback: (value: string, checked: boolean, allChecked: Array<string>) => void;
}

export type CheckboxListEnhancedItem = {
  display: string;
  value: string;
  contentRight: JSX.Element;
};

export function CheckboxListEnhanced(props: CheckboxListEnhancedType): JSX.Element {
  const { listItems, checkedValues, multiselect, checkedCallback } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [checked, _setChecked] = useState([...checkedValues]);

  const handleToggle = (value: string) => {
    let newCheckedValues: string[];
    if (multiselect) {
      const currentIndex = checked.indexOf(value);
      newCheckedValues = [...checked];

      if (currentIndex === -1) {
        newCheckedValues.push(value);
      } else {
        newCheckedValues.splice(currentIndex, 1);
      }
    } else {
      newCheckedValues = [value];
    }

    _setChecked(newCheckedValues);
    checkedCallback(value, newCheckedValues.indexOf(value) >= 0, newCheckedValues);
  };

  const handleClickContent = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
  };

  useEffect(() => {
    if (checkedValues && checked !== checkedValues) _setChecked(checkedValues);
  }, [checked, checkedValues]);

  return (
    <List sx={sxClasses.list}>
      {listItems.map((item: CheckboxListEnhancedItem, idx: number) => {
        const labelId = `checkbox-list-label-${idx}`;

        return (
          <ListItem sx={sxClasses.listItem} title={item.display} key={item.value} dense onClick={() => handleToggle(item.value)}>
            <ListItemIcon sx={sxClasses.listItemIcon}>
              <Checkbox
                edge="start"
                checked={checked.includes(item.value)}
                tabIndex={-1}
                disableRipple
                inputProps={{ 'aria-labelledby': labelId }}
              />
            </ListItemIcon>
            <Typography sx={sxClasses.typography} variant="body2" noWrap component="ul">
              {item.display}
            </Typography>
            <Box sx={sxClasses.boxcontent} className="Checkbox-content-root" onClick={(e) => handleClickContent(e)}>
              {item.contentRight}
            </Box>
          </ListItem>
        );
      })}
    </List>
  );
}
