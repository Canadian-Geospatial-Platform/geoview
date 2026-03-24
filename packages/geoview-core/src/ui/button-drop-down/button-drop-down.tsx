// GV: THIS UI COMPONENT IS NOT USED
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ButtonGroupProps } from '@mui/material';
import { ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Button } from '@/ui/button/button';
import { ButtonGroup } from '@/ui/button-group/button-group';
import { getSxClasses } from '@/ui/button-drop-down/button-drop-down-style';
import { ArrowDownIcon } from '@/ui/icons';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the ButtonDropDown component extending Material-UI's ButtonGroupProps
 */
export interface ButtonDropDownPropsExtend extends ButtonGroupProps {
  /** Array of option strings displayed as buttons in the dropdown menu */
  options: string[];
  /** Callback fired when a button or menu item is selected with (index, text) */
  onButtonClick?: (index: number, text: string) => void;
}

// Static style outside of component
const POPPER_STYLES = { zIndex: 1 } as const;

/**
 * Split button dropdown component for selecting from multiple options.
 *
 * Combines a main action button with a dropdown menu to provide quick access
 * to the current selection while allowing users to switch between alternatives.
 * Uses Material-UI's ButtonGroup, Popper, and MenuItem components. Manages
 * dropdown open/close state and notifies parent of selection changes via callback.
 *
 * @param props - ButtonDropDown configuration (see ButtonDropDownPropsExtend interface)
 * @returns Split button with dropdown menu that appears below on toggle
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ButtonDropDown
 *   options={['Option 1', 'Option 2', 'Option 3']}
 *   onButtonClick={(index, text) => console.log(text)}
 * />
 *
 * // With custom styling
 * <ButtonDropDown
 *   options={['Small', 'Medium', 'Large']}
 *   sx={{
 *     backgroundColor: 'primary.light'
 *   }}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-button-group/}
 */
function ButtonDropDownUI(props: ButtonDropDownPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/button-drop-down/button-drop-down');

  // Get constant from props
  const { options, onButtonClick = null, ...otherProps } = props;

  // Hook
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [open, setOpen] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const anchorRef = useRef<HTMLDivElement>(null);

  // #region Handlers

  /**
   * Handles a click on the button itself
   */
  const handleClick = useCallback((): void => {
    // Callback
    onButtonClick?.(selectedIndex, `${options[selectedIndex]}`);
  }, [onButtonClick, options, selectedIndex]);

  /**
   * Toggles the open state of the drop down
   */
  const handleToggle = useCallback((): void => {
    // Toggle the open state
    setOpen(!open);
  }, [open]);

  /**
   * Handles a click in an item in the drop down menu
   */
  const handleMenuItemClick = useCallback((event: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number): void => {
    setSelectedIndex(index);
    setOpen(false);
  }, []);

  /**
   * Handles a when the user clicks away of the drop down
   */
  const handleClickAway = useCallback((event: Event): void => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  }, []);

  // #endregion

  const memoMenuItems = useMemo(
    () =>
      options.map((option, index) => (
        <MenuItem key={option} selected={index === selectedIndex} onClick={(event) => handleMenuItemClick(event, index)}>
          {option}
        </MenuItem>
      )),
    [options, selectedIndex, handleMenuItemClick]
  );

  return (
    <>
      <ButtonGroup {...otherProps} sx={sxClasses.buttonDropDown} ref={anchorRef}>
        <Button sx={sxClasses.buttonText} type="text" onClick={handleClick}>
          {options[selectedIndex]}
        </Button>
        <Button sx={sxClasses.buttonArrow} type="icon" size="small" onClick={handleToggle}>
          <ArrowDownIcon />
        </Button>
      </ButtonGroup>
      <Popper sx={POPPER_STYLES} open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClickAway}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {memoMenuItems}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}

export const ButtonDropDown = ButtonDropDownUI;
