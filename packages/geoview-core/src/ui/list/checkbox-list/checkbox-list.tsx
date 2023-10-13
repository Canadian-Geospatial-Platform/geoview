import { useState } from 'react';

import { Checkbox, List, ListItem, ListItemIcon, Typography } from '@mui/material';

import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles((theme) =>
  createStyles({
    list: {
      padding: 0,
    },
    typography: {
      padding: 0,
    },
    listItem: {
      height: '28px',
      padding: 0,
      color: theme.palette.secondary.contrastText,
      '&:hover': {
        backgroundColor: '#dddddd',
        color: theme.palette.primary.dark,
      },
    },
    listItemIcon: {
      minWidth: '0px',
    },
  })
);

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
  const classes = useStyles();
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
    <List className={classes.list}>
      {listOfItems.map((value, index) => {
        const labelId = `checkbox-list-label-${index}`;

        return (
          <ListItem className={classes.listItem} title={value} key={keyValue++} dense onClick={handleToggle(index)}>
            <ListItemIcon className={classes.listItemIcon}>
              <Checkbox
                edge="start"
                checked={checked.indexOf(index) !== -1}
                tabIndex={-1}
                disableRipple
                inputProps={{ 'aria-labelledby': labelId }}
              />
            </ListItemIcon>
            <Typography className={classes.typography} variant="body2" noWrap component="ul">
              {value}
            </Typography>
          </ListItem>
        );
      })}
    </List>
  );
}
