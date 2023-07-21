/* eslint-disable react/require-default-props */
import { useState } from 'react';
import { Popover as MaterialPopover } from '@mui/material';
import Box from '@mui/material/Box';
import { IconButton, GitHubIcon } from '..';

/**
 * Type of Popover position properties
 */
type PopoverPositionType = {
  vertical: 'top' | 'center' | 'bottom';
  horizontal: 'left' | 'center' | 'right';
};

/**
 * Properties for the Popover element
 */
interface PopoverProps {
  content: JSX.Element;
  className?: string | undefined;
  anchorOrigin?: PopoverPositionType;
  transformOrigin?: PopoverPositionType;
}

/**
 * Create a customized Material UI Popover
 *
 * @param {PopoverProps} props the properties passed to the Popover element
 * @returns {JSX.Element} the created Popover element
 */
export function Popover(props: PopoverProps): JSX.Element {
  const {
    content,
    anchorOrigin = { vertical: 'top', horizontal: 'right' },
    transformOrigin = { vertical: 'bottom', horizontal: 'left' },
    className = '',
  } = props;

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const sxClasses = {
    p: 7,
    m: 7,
    justifyContent: 'center',
    textAlign: 'center',
  };

  return (
    <>
      <IconButton
        aria-describedby={id}
        id="version-button"
        tooltip="appbar.version"
        tooltipPlacement="bottom-end"
        onClick={handleClick}
        className={`${className} ${open ? 'active' : ''}`}
      >
        <GitHubIcon />
      </IconButton>
      <MaterialPopover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
      >
        <Box sx={sxClasses}>{content}</Box>
      </MaterialPopover>
    </>
  );
}
