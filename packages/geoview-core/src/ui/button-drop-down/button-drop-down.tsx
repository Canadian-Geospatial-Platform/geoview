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
  /** Array of options to display in the dropdown */
  options: string[];
  /** Callback fired when a button is clicked */
  onButtonClick?: (index: number, text: string) => void;
}

// Static style outside of component
const POPPER_STYLES = { zIndex: 1 } as const;

/**
 * A customized Material-UI Button Drop Down component.
 *
 * @component
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
 * @param {ButtonDropDownPropsExtend} props - The properties for the ButtonDropDown component
 * @returns {JSX.Element} A rendered ButtonDropDown component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
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
    logger.logTraceUseCallback('UI.BUTTON DROP DOWN - click', options[selectedIndex]);

    // Callback
    onButtonClick?.(selectedIndex, `${options[selectedIndex]}`);
  }, [onButtonClick, options, selectedIndex]);

  /**
   * Toggles the open state of the drop down
   */
  const handleToggle = useCallback((): void => {
    logger.logTraceUseCallback('UI.BUTTON DROP DOWN - toggle');

    // Toggle the open state
    setOpen(!open);
  }, [open]);

  /**
   * Handles a click in an item in the drop down menu
   */
  const handleMenuItemClick = useCallback((event: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number): void => {
    logger.logTraceUseCallback('UI.BUTTON DROP DOWN - menu item click', index);

    setSelectedIndex(index);
    setOpen(false);
  }, []);

  /**
   * Handles a when the user clicks away of the drop down
   */
  const handleClickAway = useCallback((event: Event): void => {
    logger.logTraceUseCallback('UI.BUTTON DROP DOWN - click away');

    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  }, []);

  // #endregion

  const menuItems = useMemo(
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
                  {menuItems}
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
