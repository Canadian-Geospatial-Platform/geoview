// GV: THIS UI COMPONENT IS NOT USE
import { useState, useEffect, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';

// TODO: reuse our own ui component
import { Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';

import { getSxClasses } from '@/ui/list/checkbox-list/checkbox-list-style';
import { logger } from '@/core/utils/logger';

/**
 * Configuration properties for the CheckboxList component.
 *
 * Defines structure for checkbox list with single or multi-select support and
 * optional callback when selections change.
 */
export interface CheckboxListProps {
  listItems: Array<CheckboxListItem>;
  checkedValues: string[];
  multiselect: boolean;
  onChecked?: (value: string, checked: boolean, allChecked: Array<string>) => void;
}

/**
 * Individual checkbox list item structure.
 */
export type CheckboxListItem = {
  display: string;
  value: string;
  contentRight: JSX.Element;
};

/**
 * CheckboxList component for multi/single select checkbox collections.
 *
 * Provides a customizable list of checkboxes with single or multi-select modes.
 * Manages internal state of checked items and notifies parent via onChecked callback
 * when selections change. Designed for presenting multiple selectable options with
 * optional content on the right side of each item.
 *
 * @deprecated This component is not currently used. Consider using Material-UI's
 * FormGroup or FormControlLabel components directly for new implementations.
 *
 * @param props - CheckboxList configuration (see CheckboxListProps interface)
 * @returns CheckboxList component with selectable checkbox items
 */
function CheckboxListUI(props: CheckboxListProps): JSX.Element {
  const { listItems, checkedValues, multiselect, onChecked = null } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [checked, setChecked] = useState(checkedValues);

  // #region Handlers

  /**
   * Handles when the user toggles a checkbox item
   */
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
   * Handles clicks on the right-side content to prevent event propagation
   */
  const handleClickContent = useCallback((event: React.MouseEvent<HTMLElement>): void => {
    logger.logTraceUseCallback('CHECKBOX-LIST - handleClickContent');

    event.stopPropagation();
  }, []);

  // #endregion

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

export const CheckboxList = CheckboxListUI;
