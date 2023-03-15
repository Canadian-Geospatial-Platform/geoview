/* eslint-disable no-plusplus */
import { useEffect, useState } from "react";

import { Typography } from "@mui/material";
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Checkbox from "@mui/material/Checkbox";

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
  })
);

/**
 * interface for CheckboxList basic properties
 */
export interface CheckboxListType {
  listItems: Array<CheckboxListItem>;
  checkedValues: string[];
  multiselect: boolean;
  checkedCallback: (value: string, checked: boolean, allChecked: Array<string>) => void;
}

export type CheckboxListItem = {
  display: string;
  value: string;
}

export function CheckboxListAlex(props: CheckboxListType): JSX.Element {
  const { listItems, checkedValues, multiselect, checkedCallback } = props;

  const classes = useStyles();

  const [checked, _setChecked] = useState(checkedValues || []);

  let keyValue = 0;

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

  const handleClickContent = (e) => {
    e.stopPropagation();
  }

  return (
    <List className={classes.list}>
      {listItems.map((item: CheckboxListItem, idx: number) => {
        const labelId = `checkbox-list-label-${idx}`;

        return (
          <ListItem
            className={classes.listItem}
            title={item.display}
            key={keyValue++}
            onClick={(e) => handleToggle(item.value)}
          >
            <ListItemIcon className={classes.listItemIcon}>
              <Checkbox
                edge="start"
                checked={checked.includes(item.value)}
                tabIndex={-1}
                disableRipple
                inputProps={{ "aria-labelledby": labelId }}
              />
            </ListItemIcon>
            <Typography
              className={classes.typography}
              variant="body2"
              noWrap
              component="ul"
            >
              {item.display}
            </Typography>
            <Typography
              onClick={(e) => handleClickContent(e)}
            >
              {typeof item.content === 'string' ? <HtmlToReact htmlContent={item.content} /> : item.content}
            </Typography>
          </ListItem>
        );
      })}
    </List>
  );
}
