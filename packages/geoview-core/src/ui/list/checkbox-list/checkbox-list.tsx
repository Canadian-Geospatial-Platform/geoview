// GV: THIS UI COMPONENT IS NOT USE
import { useState, useEffect, useCallback, useId } from 'react';

import { useTheme } from '@mui/material/styles';

// TODO: reuse our own ui component
import { Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';

import { ListItemButton } from '@/ui';
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
 * Each row exposes the checkbox name and checked state; its visual checkbox is
 * hidden from assistive technology to avoid nested interactive semantics.
 *
 * @deprecated This component is not currently used. Consider using Material-UI's
 * FormGroup or FormControlLabel components directly for new implementations.
 *
 * @param props - CheckboxList configuration (see CheckboxListProps interface)
 * @returns CheckboxList component with selectable checkbox items
 */
function CheckboxListUI(props: CheckboxListProps): JSX.Element {
  // Log
  logger.logTraceRenderDetailed('ui/list/checkbox-list/checkbox-list');

  const { listItems, checkedValues, multiselect, onChecked = null } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const listId = useId();

  // internal state
  const [checked, setChecked] = useState(checkedValues);

  // #region Handlers

  /**
   * Handles when the user toggles a checkbox item
   */
  const handleToggle = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      const value = event.currentTarget.dataset.value ?? '';
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
    },
    [checked, multiselect, onChecked]
  );

  // #endregion

  /**
   * Syncs the internal checked state when the checked values prop changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('CHECKBOX-LIST - checkedValues', checkedValues);

    if (checkedValues) setChecked(checkedValues);
  }, [checkedValues]);

  return (
    <List sx={sxClasses.list}>
      {listItems.map((item: CheckboxListItem, idx: number) => {
        const labelId = `${listId}-checkbox-list-label-${idx}`;

        return (
          <ListItem
            sx={sxClasses.listItem}
            title={item.display}
            key={item.value}
            disablePadding
            secondaryAction={
              <Box sx={sxClasses.boxcontent} className="Checkbox-content-root">
                {item.contentRight}
              </Box>
            }
          >
            <ListItemButton
              sx={sxClasses.listItemButton}
              data-value={item.value}
              role="checkbox"
              aria-checked={checked.includes(item.value)}
              aria-labelledby={labelId}
              dense
              onClick={handleToggle}
            >
              <ListItemIcon sx={sxClasses.listItemIcon} aria-hidden="true">
                <Checkbox edge="start" checked={checked.includes(item.value)} tabIndex={-1} disableRipple />
              </ListItemIcon>
              <Typography id={labelId} sx={sxClasses.typography} variant="body2" noWrap component="span">
                {item.display}
              </Typography>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

export const CheckboxList = CheckboxListUI;
