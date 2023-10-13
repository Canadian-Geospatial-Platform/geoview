/* eslint-disable no-plusplus */
import { useState, useEffect } from 'react';

import { Typography } from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';

import { HtmlToReact } from '../../../core/containers/html-to-react';

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
    boxcontent: {
      padding: 0,
    },
  })
);

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
  content: JSX.Element;
};

export function CheckboxListEnhanced(props: CheckboxListEnhancedType): JSX.Element {
  const { listItems, checkedValues, multiselect, checkedCallback } = props;

  const classes = useStyles();

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
    <List className={classes.list}>
      {listItems.map((item: CheckboxListEnhancedItem, idx: number) => {
        const labelId = `checkbox-list-label-${idx}`;

        return (
          <ListItem className={classes.listItem} title={item.display} key={item.value} dense onClick={() => handleToggle(item.value)}>
            <ListItemIcon className={classes.listItemIcon}>
              <Checkbox
                edge="start"
                checked={checked.includes(item.value)}
                tabIndex={-1}
                disableRipple
                inputProps={{ 'aria-labelledby': labelId }}
              />
            </ListItemIcon>
            <Typography className={classes.typography} variant="body2" noWrap component="ul">
              {item.display}
            </Typography>
            <Box className={`Checkbox-content-root ${classes.boxcontent}`} onClick={(e) => handleClickContent(e)}>
              {typeof item.content === 'string' ? <HtmlToReact htmlContent={item.content} /> : item.content}
            </Box>
          </ListItem>
        );
      })}
    </List>
  );
}
