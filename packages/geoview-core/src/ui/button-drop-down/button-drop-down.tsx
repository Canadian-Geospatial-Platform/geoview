import { useRef, useState } from 'react';
import { ButtonGroupProps, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Button } from '@/ui/button/button';
import { ButtonGroup } from '@/ui/button-group/button-group';
import { getSxClasses } from './button-drop-down-style';
import { ArrowDownIcon } from '@/ui/icons';

/**
 * The ButtonDropDown props
 */
export type ButtonDropDownProps = ButtonGroupProps & {
  options: string[];
  onButtonClick?: (index: number, text: string) => void;
};

/**
 * Create a customized Material UI Button Drop Down.
 * Reference: https://mui.com/material-ui/react-button-group/ {Split button}
 *
 * @param {ButtonDropDownProps} props the properties passed to the Button Drop Down element
 * @returns {JSX.Element} the created Button Drop Down element
 */
export function ButtonDropDown(props: ButtonDropDownProps): JSX.Element {
  // #region PROPS ****************************************************************************************************

  const { options, onButtonClick = null, ...otherProps } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // #endregion

  // #region USE STATE SECTION ****************************************************************************************

  const [open, setOpen] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const anchorRef = useRef<HTMLDivElement>(null);

  // #endregion

  // #region EVENT HANDLERS SECTION ***********************************************************************************

  /**
   * Handles a click on the button itself
   */
  const handleClick = (): void => {
    // Callback
    onButtonClick?.(selectedIndex, `${options[selectedIndex]}`);
  };

  /**
   * Toggles the open state of the drop down
   */
  const handleToggle = (): void => {
    // Toggle the open state
    setOpen(!open);
  };

  /**
   * Handles a click in an item in the drop down menu
   */
  const handleMenuItemClick = (event: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number): void => {
    setSelectedIndex(index);
    setOpen(false);
  };

  /**
   * Handles a when the user clicks away of the drop down
   */
  const handleClickAway = (event: Event): void => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };

  // #endregion

  // #region RENDER SECTION *******************************************************************************************

  // Renders
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
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
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
                  {options.map((option, index) => (
                    <MenuItem key={option} selected={index === selectedIndex} onClick={(event) => handleMenuItemClick(event, index)}>
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );

  // #endregion
}
