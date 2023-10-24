import { useState } from 'react';

import { Checkbox, List, ListItem, ListItemIcon, Typography, useTheme } from '@mui/material';
import { getSxClasses } from './checkbox-list-style';

/**
 * interface for CheckboxList basic properties
 */
interface CheckboxListType {
  listItems: string[];
  checkedItems: number[];
  multiselect: boolean;
  setApiCheckedItems: (checkedItems: number[]) => void;
}

export function CheckboxList({ listItems, multiselect, checkedItems, setApiCheckedItems }: CheckboxListType): JSX.Element {
  const sxtheme = useTheme();
  const classes = getSxClasses(sxtheme);

  const [listOfItems] = useState(listItems);
  const [checked, setChecked] = useState(checkedItems);
  let keyValue = 0;

  const handleToggle = (value: number) => () => {
    let newCheckedItems: number[];
    if (multiselect) {
      const currentIndex = checked.indexOf(value);
      newCheckedItems = [...checked];

      if (currentIndex === -1) {
        newCheckedItems.push(value);
      } else {
        newCheckedItems.splice(currentIndex, 1);
      }
    } else {
      newCheckedItems = [value];
    }

    setChecked(newCheckedItems);
    setApiCheckedItems(newCheckedItems);
  };

  return (
    <List sx={classes.list}>
      {listOfItems.map((value, index) => {
        const labelId = `checkbox-list-label-${index}`;

        return (
          <ListItem sx={classes.listItem} title={value} key={keyValue++} dense onClick={handleToggle(index)}>
            <ListItemIcon sx={classes.listItemIcon}>
              <Checkbox
                edge="start"
                checked={checked.indexOf(index) !== -1}
                tabIndex={-1}
                disableRipple
                inputProps={{ 'aria-labelledby': labelId }}
              />
            </ListItemIcon>
            <Typography sx={classes.typography} variant="body2" noWrap component="ul">
              {value}
            </Typography>
          </ListItem>
        );
      })}
    </List>
  );
}
