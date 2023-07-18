/* eslint-disable react/require-default-props */
import { useState } from 'react';
import { Popover as MaterialPopover } from '@mui/material';
import Box from '@mui/material/Box';
import { IconButton, GitHubIcon } from '..';

/**
 * Properties for the Popover element
 */
interface PopoverProps {
  content: JSX.Element;
  className?: string | undefined;
}

/**
 * Create a customized Material UI Popover
 *
 * @param {PopoverProps} props the properties passed to the Popover element
 * @returns {JSX.Element} the created Popover element
 */
export function Popover(props: PopoverProps): JSX.Element {
  const { content, className = '' } = props;

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  // TODO This file needs more modicaiton to make dynamic anchorOrigin and transformOrigin

  return (
    <>
      <IconButton
        aria-describedby={id}
        id="version-button"
        tooltip="appbar.version"
        tooltipPlacement="bottom-end"
        onClick={handleClick}
        className={className}
      >
        <GitHubIcon />
      </IconButton>
      <MaterialPopover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 7, m: 7 }}>{content}</Box>
      </MaterialPopover>
    </>
  );
}
