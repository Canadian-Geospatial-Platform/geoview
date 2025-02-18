import { useState, useEffect, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';
import { Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';

import { getSxClasses } from './checkbox-list-style';
import { logger } from '@/core/utils/logger';

/**
 * CheckboxList main Props
 */
export interface CheckboxListProps {
  listItems: Array<CheckboxListItem>;
  checkedValues: string[];
  multiselect: boolean;
  onChecked?: (value: string, checked: boolean, allChecked: Array<string>) => void;
}

/**
 * A CheckboxList item
 */
export type CheckboxListItem = {
  display: string;
  value: string;
  contentRight: JSX.Element;
};

/**
 * Main Component
 * @param props Main props for the component
 * @returns JSX.Element The Component
 */
export function CheckboxList(props: CheckboxListProps): JSX.Element {
  const { listItems, checkedValues, multiselect, onChecked = null } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [checked, setChecked] = useState(checkedValues);

  const handleToggle = (value: string): void => {
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

    // Set state
    setChecked(newCheckedValues);

    // Callback
    onChecked?.(value, newCheckedValues.indexOf(value) >= 0, newCheckedValues);
  };

  /**
   * Helper function to stop propagation on click of the right-side content
   * @param e React.MouseEvent<HTMLElement> The mouse click event
   */
  const handleClickContent = useCallback((event: React.MouseEvent<HTMLElement>): void => {
    // Log
    logger.logTraceUseCallback('CHECKBOX-LIST - handleClickContent');

    // Stop propagation
    event.stopPropagation();
  }, []);

  // Effect triggered when the checked values changes
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('CHECKBOX-LIST - checkedValues', checkedValues);

    if (checkedValues) setChecked(checkedValues);
  }, [checkedValues]);

  return (
    <List sx={sxClasses.list}>
      {listItems.map((item: CheckboxListItem, idx: number) => {
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
                aria-hidden="true"
              />
            </ListItemIcon>
            <Typography sx={sxClasses.typography} variant="body2" noWrap component="ul">
              {item.display}
            </Typography>
            <Box sx={sxClasses.boxcontent} className="Checkbox-content-root" onClick={handleClickContent}>
              {item.contentRight}
            </Box>
          </ListItem>
        );
      })}
    </List>
  );
}
